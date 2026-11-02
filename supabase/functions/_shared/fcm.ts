// deno-lint-ignore-file no-explicit-any
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/firebase_messaging';

/** Sends a push to every registered manager device; removes stale tokens. */
export async function pushToAdmins(admin: any, title: string, body: string, link = '/admin') {
  const { data: tokens } = await admin.from('admin_push_tokens').select('token');
  if (!tokens?.length) return 0;
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const FCM_KEY = Deno.env.get('FIREBASE_MESSAGING_API_KEY');
  if (!LOVABLE_API_KEY || !FCM_KEY) throw new Error('Push credentials not configured');
  let sent = 0;
  for (const { token } of tokens) {
    const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'X-Connection-Api-Key': FCM_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { token, notification: { title, body }, webpush: { fcm_options: { link } } } }),
    });
    if (res.ok) { sent++; continue; }
    const err = await res.text();
    console.error(`FCM send failed [${res.status}]: ${err}`);
    if (res.status === 404 || (res.status === 400 && err.includes('INVALID_ARGUMENT'))) {
      await admin.from('admin_push_tokens').delete().eq('token', token);
    }
  }
  return sent;
}
