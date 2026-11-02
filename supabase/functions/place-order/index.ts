import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { pushToAdmins } from '../_shared/fcm.ts';

const Body = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  street: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  postal: z.string().trim().max(20).optional().default(''),
  notes: z.string().trim().max(500).optional().default(''),
  address_id: z.string().uuid().nullable().optional(),
  save_address: z.boolean().optional().default(false),
  items: z.array(z.object({
    id: z.string().min(1).max(80),
    size: z.enum(['small', 'large']),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(50),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const b = parsed.data;
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let userId: string | null = null;
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    // Recompute prices from the catalog — never trust client prices.
    const ids = [...new Set(b.items.map((i) => i.id))];
    const { data: prods, error: pErr } = await admin.from('products').select('id,name_ar,name_en,price_small,price_large,is_available').in('id', ids);
    if (pErr) throw pErr;
    const map = new Map((prods ?? []).map((p) => [p.id, p]));
    const lines = [];
    for (const it of b.items) {
      const p = map.get(it.id);
      if (!p) return json({ error: `Unknown product ${it.id}` }, 400);
      if (!p.is_available) return json({ error: `${p.name_ar} غير متوفر` }, 400);
      const price = Number(it.size === 'large' && Number(p.price_large) ? p.price_large : p.price_small);
      lines.push({ product_id: p.id, product_name: p.name_en || p.name_ar, name_ar: p.name_ar, size: it.size, quantity: it.quantity, price });
    }
    const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const addressText = `${b.street}, ${b.city}${b.postal ? ` (${b.postal})` : ''}`;

    let addressId: string | null = null;
    if (userId) {
      if (b.address_id) {
        const { data: a } = await admin.from('addresses').select('id').eq('id', b.address_id).eq('user_id', userId).maybeSingle();
        addressId = a?.id ?? null;
      } else if (b.save_address) {
        const { data: a } = await admin.from('addresses').insert({ user_id: userId, label: 'Delivery', street: b.street, city: b.city, postal_code: b.postal || null, phone: b.phone }).select('id').single();
        addressId = a?.id ?? null;
      }
    }

    const { data: order, error: oErr } = await admin.from('orders').insert({
      user_id: userId, address_id: addressId, total_amount: total, status: 'new',
      notes: b.notes || null, customer_name: b.name, customer_phone: b.phone, delivery_address: addressText,
    }).select('id, tracking_code, order_number').single();
    if (oErr) throw oErr;
    const { error: iErr } = await admin.from('order_items').insert(lines.map(({ name_ar: _n, ...l }) => ({ ...l, order_id: order.id })));
    if (iErr) throw iErr;

    let pushed = 0;
    try {
      pushed = await pushToAdmins(admin, `طلب جديد #${order.order_number ?? order.id.slice(0, 6)} – ₪${total}`, `${b.name} · ${lines.map((l) => `${l.name_ar}×${l.quantity}`).join('، ')}`);
    } catch (e) { console.error('push failed', e); }

    return json({ id: order.id, tracking_code: order.tracking_code, order_number: order.order_number, total, pushed });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
