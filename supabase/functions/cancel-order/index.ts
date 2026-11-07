import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { pushToTokens } from '../_shared/fcm.ts';

const Body = z.object({
  order_id: z.string().uuid(),
  reason: z.enum(['out_of_stock', 'closing', 'customer', 'other']),
  note: z.string().trim().max(200).optional().default(''),
});

const REASONS: Record<string, Record<string, string>> = {
  out_of_stock: { ar: 'نفاد المنتج', he: 'המוצר אזל', en: 'Out of stock' },
  closing: { ar: 'المحل يغلق', he: 'החנות נסגרת', en: 'Store closing' },
  customer: { ar: 'بطلب من الزبون', he: 'לבקשת הלקוח', en: 'Customer request' },
  other: { ar: 'سبب آخر', he: 'סיבה אחרת', en: 'Other' },
};
const TITLE: Record<string, string> = { ar: 'تم إلغاء الطلب', he: 'ההזמנה בוטלה', en: 'Order cancelled' };
const BODY: Record<string, (n: string, r: string) => string> = {
  ar: (n, r) => `تم إلغاء طلبك #${n} من قبل المحل (${r})`,
  he: (n, r) => `ההזמנה שלך #${n} בוטלה על ידי החנות (${r})`,
  en: (n, r) => `Your order #${n} has been cancelled by the store (${r})`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return json({ error: 'unauthorized' }, 401);
    const { data: u } = await admin.auth.getUser(token);
    const uid = u?.user?.id;
    if (!uid) return json({ error: 'unauthorized' }, 401);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: uid, _role: 'admin' });
    if (!isAdmin) return json({ error: 'forbidden' }, 403);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'validation' }, 400);
    const { order_id, reason, note } = parsed.data;
    const reasonText = reason === 'other' && note ? note : reason;

    // Atomic: only active orders flip, so a second tap or a done order is a no-op.
    const { data: rows, error } = await admin.from('orders')
      .update({ status: 'cancelled', cancel_reason: reasonText, cancelled_at: new Date().toISOString(), cancelled_by: uid })
      .eq('id', order_id).in('status', ['new', 'preparing', 'pending']).is('cancelled_at', null)
      .select('id, order_number, tracking_code, locale');
    if (error) { console.error(error); return json({ error: 'server_error' }, 500); }
    const order = rows?.[0];
    if (!order) return json({ error: 'not_cancellable' }, 409);

    await admin.from('store_audit_log').insert({ actor: uid, action: 'order_cancel', details: { order_id, order_number: order.order_number, reason: reasonText } });

    let pushed = 0;
    try {
      const lang = ['ar', 'he', 'en'].includes(order.locale) ? order.locale : 'ar';
      const r = REASONS[reason]?.[lang] && !(reason === 'other' && note) ? REASONS[reason][lang] : note;
      const { data: toks } = await admin.from('order_push_tokens').select('token').eq('order_id', order_id);
      const origin = Deno.env.get('SHOP_ORIGIN') ?? 'https://naturaldaburiyya.com';
      pushed = await pushToTokens(admin, 'order_push_tokens', (toks ?? []).map((t: { token: string }) => t.token),
        TITLE[lang], BODY[lang](String(order.order_number ?? ''), r), `${origin}/track/${order.tracking_code}`);
    } catch (e) { console.error('cancel push failed', e); }

    return json({ ok: true, pushed });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
