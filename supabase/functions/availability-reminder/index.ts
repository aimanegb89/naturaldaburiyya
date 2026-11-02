import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/firebase_messaging';

function jerusalemNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: Number(g('hour')) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const body = await req.json().catch(() => ({}));
    const test = body?.test === true;
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (test) {
      // Test sends must come from a signed-in admin.
      const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
      const { data: u } = await admin.auth.getUser(auth ?? '');
      if (!u?.user) return json({ error: 'unauthorized' }, 401);
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: u.user.id, _role: 'admin' });
      if (!isAdmin) return json({ error: 'forbidden' }, 403);
    } else {
      // Scheduled run fires at 13:50 and 14:50 UTC; only act at 16:xx Jerusalem (DST-safe).
      if (jerusalemNow().hour !== 16) return json({ skipped: 'not reminder hour' });
    }

    const startOfTodayIL = new Date(`${jerusalemNow().date}T00:00:00+02:00`);
    let q = admin.from('products').select('name_ar, name_en').eq('is_available', false);
    if (!test) q = q.lt('unavailable_since', startOfTodayIL.toISOString());
    const { data: items, error } = await q;
    if (error) throw error;
    if (!items?.length && !test) return json({ sent: 0, reason: 'nothing unavailable' });

    const { data: tokens } = await admin.from('admin_push_tokens').select('token');
    if (!tokens?.length) return json({ sent: 0, reason: 'no devices' });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const FCM_KEY = Deno.env.get('FIREBASE_MESSAGING_API_KEY');
    if (!LOVABLE_API_KEY || !FCM_KEY) throw new Error('Push credentials not configured');

    const names = (items ?? []).map((i) => i.name_ar).join('، ');
    const title = 'تذكير: تحديث التوفر';
    const text = items?.length
      ? `ما زالت هذه المنتجات غير متوفرة: ${names}. حدّثها إذا عادت متوفرة قبل الافتتاح.`
      : 'إشعار تجريبي — كل المنتجات متوفرة.';

    let sent = 0;
    for (const { token } of tokens) {
      const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'X-Connection-Api-Key': FCM_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { token, notification: { title, body: text }, webpush: { fcm_options: { link: '/admin' } } } }),
      });
      if (res.ok) { sent++; continue; }
      const err = await res.text();
      console.error(`FCM send failed [${res.status}]: ${err}`);
      if (res.status === 404 || (res.status === 400 && err.includes('INVALID_ARGUMENT'))) {
        await admin.from('admin_push_tokens').delete().eq('token', token);
      }
    }
    return json({ sent, products: items?.length ?? 0 });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
