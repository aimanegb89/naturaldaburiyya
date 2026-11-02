import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const Body = z.object({
  code: z.string().trim().min(3).max(20),
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
    const sel = 'tracking_code, order_number, status, total_amount, created_at, updated_at, customer_phone, order_items(product_id, product_name, size, quantity, price)';
    let o: any = null;
    if (/^\d{3}$/.test(code)) {
      if (!parsed.data.phone) return json({ error: 'not_found' }, 404);
      const { data: list } = await admin.from('orders').select(sel).eq('order_number', Number(code)).order('created_at', { ascending: false }).limit(20);
      o = (list ?? []).find((x: any) => x.customer_phone && digits(x.customer_phone) === digits(parsed.data.phone!)) ?? null;
    } else {
      const { data } = await admin.from('orders').select(sel).eq('tracking_code', code).maybeSingle();
      o = data;
    }
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
