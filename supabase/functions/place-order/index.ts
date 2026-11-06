import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { allow, clientIp, pushToAdmins } from '../_shared/fcm.ts';

const Body = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  street: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().max(100).optional().default(''),
  postal: z.string().trim().max(20).optional().default(''),
  notes: z.string().trim().max(500).optional().default(''),
  payment_method: z.enum(['cash', 'card']).optional().default('cash'),
  address_id: z.string().uuid().nullable().optional(),
  save_address: z.boolean().optional().default(false),
  idempotency_key: z.string().uuid().optional(),
  items: z.array(z.object({
    id: z.string().min(1).max(80),
    size: z.enum(['small', 'large']),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(50),
});

const digits = (s: string) => s.replace(/\D/g, '').slice(-9);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'validation', fields: Object.keys(parsed.error.flatten().fieldErrors) }, 400);
    const b = parsed.data;
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const sel = 'id, tracking_code, order_number, total_amount';
    if (b.idempotency_key) {
      const { data: prev } = await admin.from('orders').select(sel).eq('idempotency_key', b.idempotency_key).maybeSingle();
      if (prev) return json({ id: prev.id, tracking_code: prev.tracking_code, order_number: prev.order_number, total: Number(prev.total_amount), pushed: 0, duplicate: true });
    }

    if (!(await allow(admin, `order:ip:${clientIp(req)}`, 15)) || !(await allow(admin, `order:phone:${digits(b.phone)}`, 5))) {
      return json({ error: 'rate_limited' }, 429);
    }

    let userId: string | null = null;
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    // Recompute prices from the catalog — never trust client prices.
    const ids = [...new Set(b.items.map((i) => i.id))];
    const { data: prods, error: pErr } = await admin.from('products').select('id,name_ar,name_he,name_en,price_small,price_large,is_available').in('id', ids);
    if (pErr) throw pErr;
    const map = new Map((prods ?? []).map((p) => [p.id, p]));
    const lines = [];
    for (const it of b.items) {
      const p = map.get(it.id);
      if (!p) return json({ error: 'unknown_product', product_id: it.id }, 400);
      if (!p.is_available) return json({ error: 'product_unavailable', product_id: p.id, name: { ar: p.name_ar, he: p.name_he, en: p.name_en } }, 409);
      const large = Number(p.price_large);
      const size = it.size === 'large' && large > 0 ? 'large' : 'small';
      const price = size === 'large' ? large : Number(p.price_small);
      lines.push({ product_id: p.id, product_name: p.name_en || p.name_ar, name_ar: p.name_ar, size, quantity: it.quantity, price });
    }
    const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    // Store is pickup only; street/city kept optional for old clients.
    const addressText = b.street && b.city ? `${b.street}, ${b.city}${b.postal ? ` (${b.postal})` : ''}` : 'pickup';

    let addressId: string | null = null;
    if (userId) {
      if (b.address_id) {
        const { data: a } = await admin.from('addresses').select('id').eq('id', b.address_id).eq('user_id', userId).maybeSingle();
        addressId = a?.id ?? null;
      } else if (b.save_address && b.street && b.city) {
        const { data: a } = await admin.from('addresses').insert({ user_id: userId, label: 'Delivery', street: b.street, city: b.city, postal_code: b.postal || null, phone: b.phone }).select('id').single();
        addressId = a?.id ?? null;
      }
    }

    const { data: rows, error: oErr } = await admin.rpc('create_order_with_items', {
      p_order: { user_id: userId, address_id: addressId, total_amount: total, notes: b.notes, customer_name: b.name, customer_phone: b.phone, delivery_address: addressText, idempotency_key: b.idempotency_key ?? null, payment_method: b.payment_method },
      p_items: lines.map(({ name_ar: _n, ...l }) => l),
    });
    if (oErr) {
      if (oErr.code === '23505' && b.idempotency_key) {
        const { data: prev } = await admin.from('orders').select(sel).eq('idempotency_key', b.idempotency_key).maybeSingle();
        if (prev) return json({ id: prev.id, tracking_code: prev.tracking_code, order_number: prev.order_number, total: Number(prev.total_amount), pushed: 0, duplicate: true });
      }
      console.error('create order failed', oErr);
      return json({ error: 'server_error' }, 500);
    }
    const order = (rows as any[])[0];

    let pushed = 0;
    try {
      pushed = await pushToAdmins(admin, `طلب جديد #${order.order_number ?? order.id.slice(0, 6)} – ₪${total}`, `${b.name} · ${b.payment_method === 'card' ? '💳 بطاقة' : '💵 نقدًا'} · ${lines.map((l) => `${l.name_ar}×${l.quantity}`).join('، ')}`);
    } catch (e) { console.error('push failed', e); }

    return json({ id: order.id, tracking_code: order.tracking_code, order_number: order.order_number, total, pushed });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
