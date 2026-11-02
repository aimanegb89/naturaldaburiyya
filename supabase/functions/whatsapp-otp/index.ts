import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/whatsapp';
const TEMPLATE = 'login_code';
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('send'), phone: z.string().min(9).max(20) }),
  z.object({ action: z.literal('verify'), phone: z.string().min(9).max(20), code: z.string().regex(/^\d{6}$/), name: z.string().trim().max(100).optional() }),
]);

/** Israeli local numbers (05x…) become 9725x…; returns digits only. */
function normalize(p: string) {
  let d = p.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '972' + d.slice(1);
  return d;
}
async function sha(s: string) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s + (Deno.env.get('SUPABASE_URL') ?? '')));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'invalid_input' }, 400);
    const b = parsed.data;
    const phone = normalize(b.phone);
    if (phone.length < 11 || phone.length > 15) return json({ error: 'invalid_phone' }, 400);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (b.action === 'send') {
      const { data: prev } = await admin.from('phone_otps').select('sent_at').eq('phone', phone).maybeSingle();
      if (prev && Date.now() - new Date(prev.sent_at).getTime() < 60_000) return json({ error: 'wait' }, 429);
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      const WA = Deno.env.get('WHATSAPP_API_KEY');
      if (!LOVABLE_API_KEY || !WA) return json({ error: 'whatsapp_not_connected' }, 503);
      const res = await fetch(`${GATEWAY_URL}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'X-Connection-Api-Key': WA, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp', to: phone, type: 'template',
          template: { name: TEMPLATE, language: { code: 'ar' }, components: [
            { type: 'body', parameters: [{ type: 'text', text: code }] },
            { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
          ] },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error(`WhatsApp send failed [${res.status}]: ${t}`);
        return json({ error: 'send_failed', status: res.status, details: t }, 502);
      }
      await admin.from('phone_otps').upsert({ phone, code_hash: await sha(phone + code), expires_at: new Date(Date.now() + 5 * 60_000).toISOString(), attempts: 0, sent_at: new Date().toISOString() });
      return json({ ok: true });
    }

    // verify
    const { data: row } = await admin.from('phone_otps').select('*').eq('phone', phone).maybeSingle();
    if (!row || new Date(row.expires_at).getTime() < Date.now()) return json({ error: 'expired' }, 400);
    if (row.attempts >= 5) return json({ error: 'too_many' }, 429);
    if (row.code_hash !== (await sha(phone + b.code))) {
      await admin.from('phone_otps').update({ attempts: row.attempts + 1 }).eq('phone', phone);
      return json({ error: 'wrong_code' }, 400);
    }
    await admin.from('phone_otps').delete().eq('phone', phone);

    const email = `${phone}@phone.natural.local`;
    const { data: link, error: lErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    let tokenHash = link?.properties?.hashed_token;
    if (lErr || !tokenHash) {
      // First sign-in for this phone: create the account, then mint the link.
      const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: b.name ?? '', phone: '+' + phone } });
      if (cErr) throw cErr;
      await admin.from('profiles').update({ phone: '0' + phone.slice(3), full_name: b.name || null }).eq('id', created.user.id);
      const again = await admin.auth.admin.generateLink({ type: 'magiclink', email });
      if (again.error) throw again.error;
      tokenHash = again.data.properties.hashed_token;
    }
    return json({ token_hash: tokenHash });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
