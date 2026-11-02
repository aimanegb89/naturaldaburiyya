import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { pushToAdmins } from '../_shared/fcm.ts';

const TZ = 'Asia/Jerusalem';

function zonedParts(d: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { y: g('year'), m: g('month'), d: g('day'), h: g('hour') % 24, mi: g('minute'), s: g('second') };
}

/** Jerusalem offset (ms) at a given instant, from Intl — handles DST. */
function offsetMs(at: Date) {
  const p = zonedParts(at);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(at.getTime() / 1000) * 1000;
}

export function startOfTodayJerusalem(now = new Date()) {
  const p = zonedParts(now);
  const guess = Date.UTC(p.y, p.m - 1, p.d);
  return new Date(guess - offsetMs(new Date(guess)));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const body = await req.json().catch(() => ({}));
    const test = body?.test === true;
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const now = zonedParts(new Date());
    const today = `${now.y}-${String(now.m).padStart(2, '0')}-${String(now.d).padStart(2, '0')}`;

    if (test) {
      const auth = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
      const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!);
      const { data: c } = await anon.auth.getClaims(auth);
      const uid = c?.claims?.sub;
      if (!uid || c?.claims?.role !== 'authenticated') return json({ error: 'unauthorized' }, 401);
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: uid, _role: 'admin' });
      if (!isAdmin) return json({ error: 'forbidden' }, 403);
    } else {
      const key = req.headers.get('x-cron-key') ?? '';
      const { data: k } = await admin.from('internal_keys').select('value').eq('name', 'cron').maybeSingle();
      if (!k?.value || key !== k.value) return json({ error: 'unauthorized' }, 401);
      // Fires at 13:50 and 14:50 UTC; only act at 16:xx Jerusalem (DST-safe), once per day.
      if (now.h !== 16) return json({ skipped: 'not reminder hour' });
      const { data: st } = await admin.from('store_settings').select('last_reminder_date').eq('id', 1).maybeSingle();
      if (st?.last_reminder_date === today) return json({ skipped: 'already sent today' });
    }

    let q = admin.from('products').select('name_ar').eq('is_available', false);
    if (!test) q = q.lt('unavailable_since', startOfTodayJerusalem().toISOString());
    const { data: items, error } = await q;
    if (error) throw error;
    if (!test) await admin.from('store_settings').update({ last_reminder_date: today }).eq('id', 1);
    if (!items?.length && !test) return json({ sent: 0, reason: 'nothing unavailable' });

    const names = (items ?? []).map((i) => i.name_ar).join('، ');
    const text = items?.length
      ? `ما زالت هذه المنتجات غير متوفرة: ${names}. حدّثها إذا عادت متوفرة قبل الافتتاح.`
      : 'إشعار تجريبي — كل المنتجات متوفرة.';
    const sent = await pushToAdmins(admin, 'تذكير: تحديث التوفر', text);
    if (!sent) return json({ sent: 0, reason: 'no devices' });
    return json({ sent, products: items?.length ?? 0 });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error', message: e instanceof Error ? e.message : 'unknown' }, 500);
  }
});
