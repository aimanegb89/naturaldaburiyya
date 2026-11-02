import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { allow, clientIp } from '../_shared/fcm.ts';

// Lookups only by unguessable tracking codes (links or codes saved on this device).
// Order-number lookups were removed so nobody can see another customer's order.
const Code = z.string().trim().regex(/^[A-Za-z0-9]{6,20}$/);
const Body = z.object({
  code: Code.optional(),
  codes: z.array(Code).max(30).optional(),
});

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'invalid' }, 400);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!(await allow(admin, `track:ip:${clientIp(req)}`, 400))) return json({ error: 'rate_limited' }, 429);
    const sel = 'tracking_code, order_number, status, total_amount, created_at, updated_at, order_items(product_id, product_name, size, quantity, price)';
    if (parsed.data.codes) {
      const codes = parsed.data.codes.map((c) => c.toUpperCase());
      const { data } = await admin.from('orders').select(sel).in('tracking_code', codes);
      return json({ orders: data ?? [] });
    }
    if (!parsed.data.code) return json({ error: 'invalid' }, 400);
    const { data } = await admin.from('orders').select(sel).eq('tracking_code', parsed.data.code.toUpperCase()).maybeSingle();
    if (!data) return json({ error: 'not_found' });
    return json(data);
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
