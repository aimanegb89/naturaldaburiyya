import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const Body = z.object({
  code: z.string().trim().min(4).max(20),
  phone: z.string().trim().max(20).optional(),
});

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const digits = (s: string) => s.replace(/\D/g, '').slice(-9);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'invalid' }, 400);
    const code = parsed.data.code.replace(/^#/, '').toUpperCase();
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: o } = await admin
      .from('orders')
      .select('tracking_code, status, total_amount, created_at, updated_at, customer_phone, order_items(product_name, size, quantity, price)')
      .eq('tracking_code', code)
      .maybeSingle();
    if (!o) return json({ error: 'not_found' }, 404);
    if (parsed.data.phone && o.customer_phone && digits(parsed.data.phone) !== digits(o.customer_phone)) {
      return json({ error: 'not_found' }, 404);
    }
    const { customer_phone: _p, ...safe } = o;
    return json(safe);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
