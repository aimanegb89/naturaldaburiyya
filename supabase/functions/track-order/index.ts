import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const Body = z.object({
  code: z.string().trim().min(3).max(20).optional(),
  codes: z.array(z.string().trim().min(3).max(20)).max(30).optional(),
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
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    // Auto-complete orders the manager forgot to mark done
    const { data: st } = await admin.from('store_settings').select('auto_done_minutes').eq('id', 1).maybeSingle();
    const mins = st?.auto_done_minutes ?? 60;
    await admin.from('orders').update({ status: 'done' }).in('status', ['new', 'preparing'])
      .lt('created_at', new Date(Date.now() - mins * 60000).toISOString());
    const sel = 'tracking_code, order_number, status, total_amount, created_at, updated_at, customer_phone, order_items(product_id, product_name, size, quantity, price)';
    if (parsed.data.codes) {
      const codes = parsed.data.codes.map((c) => c.toUpperCase());
      const { data } = await admin.from('orders').select(sel).in('tracking_code', codes);
      return json({ orders: (data ?? []).map(({ customer_phone: _p, ...r }: any) => r) });
    }
    if (!parsed.data.code) return json({ error: 'invalid' }, 400);
    const code = parsed.data.code.replace(/^#/, '').toUpperCase();
    let o: any = null;
    if (/^\d{3}$/.test(code)) {
      const { data: list } = await admin.from('orders').select(sel).eq('order_number', Number(code)).order('created_at', { ascending: false }).limit(20);
      const rows = list ?? [];
      o = parsed.data.phone
        ? rows.find((x: any) => x.customer_phone && digits(x.customer_phone) === digits(parsed.data.phone!)) ?? null
        : rows.find((x: any) => x.status !== 'done' && x.status !== 'completed') ?? rows[0] ?? null;
    } else {
      const { data } = await admin.from('orders').select(sel).eq('tracking_code', code).maybeSingle();
      o = data;
    }
    if (!o) return json({ error: 'not_found' });
    if (parsed.data.phone && o.customer_phone && digits(parsed.data.phone) !== digits(o.customer_phone)) {
      return json({ error: 'not_found' });
    }
    const { customer_phone: _p, ...safe } = o;
    return json(safe);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
