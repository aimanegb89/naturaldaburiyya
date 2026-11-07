import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { pushToTokens } from '../_shared/fcm.ts';

// Manager sends a notification to every customer device that allowed notifications.
const Txt = z.object({ ar: z.string().trim().max(200), he: z.string().trim().max(200), en: z.string().trim().max(200) });
const Body = z.object({
  title: Txt,
  body: Txt,
  link: z.string().regex(/^\/[A-Za-z0-9/_\-?=&#.%]*$/).max(300).default('/'),
  dry_run: z.boolean().default(false),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return json({ error: 'unauthorized' }, 401);
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u.user) return json({ error: 'unauthorized' }, 401);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: u.user.id, _role: 'admin' });
    if (!isAdmin) return json({ error: 'forbidden' }, 403);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'validation' }, 400);
    const { title, body, link, dry_run } = parsed.data;
    if (!title.ar && !title.he && !title.en) return json({ error: 'validation' }, 400);

    const { data: devices } = await admin.from('customer_push_devices').select('token,locale').eq('enabled', true);
    const list = devices ?? [];
    if (dry_run) return json({ ok: true, targeted: list.length });

    const pick = (m: Record<string, string>, l: string) => m[l] || m.ar || m.he || m.en;
    let delivered = 0;
    for (const loc of ['ar', 'he', 'en']) {
      const tokens = list.filter((d) => (d.locale || 'ar') === loc).map((d) => d.token);
      for (let i = 0; i < tokens.length; i += 200) {
        delivered += await pushToTokens(admin, 'customer_push_devices', tokens.slice(i, i + 200), pick(title, loc), pick(body, loc), link);
      }
    }
    await admin.from('push_broadcasts').insert({ sent_by: u.user.id, title, body, link, targeted: list.length, delivered });
    return json({ ok: true, targeted: list.length, delivered });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error', details: String(e) }, 500);
  }
});
