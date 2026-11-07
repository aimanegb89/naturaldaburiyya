import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { allow, clientIp } from '../_shared/fcm.ts';

// Saves (or turns off) a customer device for general notifications. Works for guests.
const Body = z.object({
  token: z.string().min(20).max(4096),
  locale: z.enum(['ar', 'he', 'en']).default('ar'),
  enabled: z.boolean().default(true),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'validation' }, 400);
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!(await allow(admin, `dev:ip:${clientIp(req)}`, 60))) return json({ error: 'rate_limited' }, 429);
    let userId: string | null = null;
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (auth) {
      const { data } = await admin.auth.getUser(auth);
      userId = data.user?.id ?? null;
    }
    const row: Record<string, unknown> = { token: parsed.data.token, locale: parsed.data.locale, enabled: parsed.data.enabled, last_seen: new Date().toISOString() };
    if (userId) row.user_id = userId;
    const { error } = await admin.from('customer_push_devices').upsert(row);
    if (error) { console.error(error); return json({ error: 'server_error' }, 500); }
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
