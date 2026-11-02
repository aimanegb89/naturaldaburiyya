// deno-lint-ignore-file no-explicit-any
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/firebase_messaging';

/** True only when FCM says the token itself is dead (never on a generic 400). */
export function isDeadToken(status: number, body: string) {
  if (status === 404 || body.includes('UNREGISTERED')) return true;
  if (status === 400 && body.includes('INVALID_ARGUMENT')) {
    try {
      const j = JSON.parse(body);
      const details = JSON.stringify(j?.error?.details ?? []);
      return /message\.token|registration[ _-]?token/i.test(details) || /registration token/i.test(j?.error?.message ?? '');
    } catch { return false; }
  }
  return false;
}

/** Sends a push to every registered manager device in parallel; removes dead tokens. */
export async function pushToAdmins(admin: any, title: string, body: string, link = '/admin') {
  const { data: tokens } = await admin.from('admin_push_tokens').select('token');
  if (!tokens?.length) return 0;
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const FCM_KEY = Deno.env.get('FIREBASE_MESSAGING_API_KEY');
  if (!LOVABLE_API_KEY || !FCM_KEY) throw new Error('Push credentials not configured');
  const results = await Promise.allSettled(tokens.map(async ({ token }: { token: string }) => {
    const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'X-Connection-Api-Key': FCM_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { token, notification: { title, body }, webpush: { fcm_options: { link } } } }),
    });
    if (res.ok) return true;
    const err = await res.text();
    console.error(`FCM send failed [${res.status}]: ${err}`);
    if (isDeadToken(res.status, err)) await admin.from('admin_push_tokens').delete().eq('token', token);
    return false;
  }));
  return results.filter((r) => r.status === 'fulfilled' && r.value).length;
}

export function clientIp(req: Request) {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('cf-connecting-ip') || 'unknown').trim();
}

/** Returns true when the call is allowed (hourly counter). */
export async function allow(admin: any, key: string, limit: number) {
  const { data, error } = await admin.rpc('hit_rate_limit', { p_key: key, p_limit: limit });
  if (error) { console.error('rate limit error', error); return true; }
  return data === true;
}
