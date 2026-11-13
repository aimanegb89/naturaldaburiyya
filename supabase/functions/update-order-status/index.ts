import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { pushToTokens } from '../_shared/fcm.ts';

const Body = z.object({ order_id: z.string().uuid(), status: z.enum(['new', 'preparing', 'done']) });

const MSG: Record<string, Record<string, [string, string]>> = {
  preparing: {
    ar: ['طلبك #N قيد التحضير الآن 👨‍🍳', 'بدأنا بتحضير طلبك وسنخبرك فور جاهزيته للاستلام.'],
    he: ['ההזמנה שלך #N בהכנה 👨‍🍳', 'התחלנו להכין את ההזמנה ונעדכן כשתהיה מוכנה לאיסוף.'],
    en: ['Your order #N is being prepared 👨‍🍳', "We started preparing your order and will tell you when it's ready."],
  },
  done: {
    ar: ['طلبك #N جاهز للاستلام! 🌿', 'طلبك بانتظارك في المحل، يمكنك الحضور لاستلامه الآن.'],
    he: ['ההזמנה שלך #N מוכנה לאיסוף! 🌿', 'ההזמנה מחכה לך בחנות, אפשר להגיע לאסוף עכשיו.'],
    en: ['Your order #N is ready for pickup! 🌿', 'Your order is waiting at the shop — come pick it up.'],
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return json({ error: 'unauthorized' }, 401);
    const { data: u } = await admin.auth.getUser(jwt);
    const uid = u?.user?.id;
    if (!uid) return json({ error: 'unauthorized' }, 401);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: uid, _role: 'admin' });
    if (!isAdmin) return json({ error: 'forbidden' }, 403);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'validation' }, 400);
    const { order_id, status } = parsed.data;

    const { data: rows, error } = await admin.from('orders').update({ status })
      .eq('id', order_id).neq('status', status).is('cancelled_at', null)
      .select('id, order_number, tracking_code, locale');
    if (error) { console.error(error); return json({ error: 'server_error' }, 500); }
    const order = rows?.[0];
    if (!order) return json({ ok: true, pushed: 0 });

    let pushed = 0;
    const m = MSG[status];
    if (m) {
      try {
        const lang = ['ar', 'he', 'en'].includes(order.locale) ? order.locale : 'ar';
        const [t, b] = m[lang];
        const { data: toks } = await admin.from('order_push_tokens').select('token').eq('order_id', order_id);
        const origin = Deno.env.get('SHOP_ORIGIN') ?? 'https://naturaldaburiyya.com';
        pushed = await pushToTokens(admin, 'order_push_tokens', (toks ?? []).map((x: { token: string }) => x.token),
          t.replace('N', String(order.order_number ?? '')), b, `${origin}/track/${order.tracking_code}`);
      } catch (e) { console.error('status push failed', e); }
    }
    return json({ ok: true, pushed });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
