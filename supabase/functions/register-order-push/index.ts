import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { allow, clientIp } from '../_shared/fcm.ts';

// Ties a device's push token to an order (works for guests: knowing the tracking code proves ownership).
const Body = z.object({
  tracking_code: z.string().trim().regex(/^[A-Za-z0-9]{6,20}$/),
  token: z.string().min(20).max(4096),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'validation' }, 400);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!(await allow(admin, `opush:ip:${clientIp(req)}`, 60))) return json({ error: 'rate_limited' }, 429);
    const { data: o } = await admin.from('orders').select('id').eq('tracking_code', parsed.data.tracking_code.toUpperCase()).maybeSingle();
    if (!o) return json({ error: 'not_found' });
    const { error } = await admin.from('order_push_tokens').upsert({ order_id: o.id, token: parsed.data.token });
    if (error) { console.error(error); return json({ error: 'server_error' }, 500); }
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
