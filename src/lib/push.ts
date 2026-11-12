import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { supabase } from '@/integrations/supabase/client';

async function loadConfig() {
  let apiKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined;
  let projectId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined;
  let appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
  let vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;
  if (!apiKey || !projectId || !appId || !vapidKey) {
    const { data } = await supabase.functions.invoke('push-config');
    if (data) ({ apiKey, projectId, appId, vapidKey } = data);
  }
  return {
    firebaseConfig: { apiKey: apiKey ?? '', projectId: projectId ?? '', appId: appId ?? '', messagingSenderId: appId?.split(':')[1] ?? '' },
    vapidKey: vapidKey ?? '',
  };
}

export type PushStatus = 'registered' | 'not-configured' | 'unsupported' | 'open-in-new-tab' | 'denied' | 'failed';
const TOKEN_KEY = 'natural-admin-push-token';

async function deviceToken(): Promise<{ status: PushStatus; token?: string }> {
  const { firebaseConfig, vapidKey } = await loadConfig();
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId || !vapidKey || !firebaseConfig.messagingSenderId) return { status: 'not-configured' };
  if (!('Notification' in window) || !(await isSupported())) return { status: 'unsupported' };
  if (window.top !== window.self) return { status: 'open-in-new-tab' };
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return { status: 'denied' };
  const query = new URLSearchParams(firebaseConfig).toString();
  const reg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: reg });
  return token ? { status: 'registered', token } : { status: 'denied' };
}

const DEVICE_KEY = 'natural-device-push-token';
const DEVICE_OFF = 'natural-device-push-off';
export const devicePushOn = () => { try { return !!localStorage.getItem(DEVICE_KEY) && !localStorage.getItem(DEVICE_OFF); } catch { return false; } };

/** Customer: allow general notifications on this device (offers + orders). Call from a click handler. */
export async function enableDevicePush(locale: string): Promise<PushStatus> {
  try {
    const r = await deviceToken();
    if (!r.token) return r.status;
    const { data, error } = await supabase.functions.invoke('register-device', { body: { token: r.token, locale, enabled: true } });
    if (error || !data?.ok) return 'failed';
    try { localStorage.setItem(DEVICE_KEY, r.token); localStorage.removeItem(DEVICE_OFF); } catch { /* ignore */ }
    return 'registered';
  } catch (e) { console.error(e); return 'failed'; }
}

export async function disableDevicePush() {
  let token: string | null = null;
  try { token = localStorage.getItem(DEVICE_KEY); localStorage.setItem(DEVICE_OFF, '1'); } catch { /* ignore */ }
  if (token) await supabase.functions.invoke('register-device', { body: { token, enabled: false } });
}

/** Refreshes language / account link for an already-allowed device (no prompts). */
export async function syncDevicePush(locale: string) {
  let token: string | null = null;
  try { token = localStorage.getItem(DEVICE_KEY); } catch { /* ignore */ }
  if (!token || !devicePushOn() || !('Notification' in window) || Notification.permission !== 'granted') return;
  await supabase.functions.invoke('register-device', { body: { token, locale, enabled: true } });
}

/** If this device already allows notifications, links it to a new order silently. */
export async function autoOrderPush(trackingCode: string): Promise<boolean> {
  let token: string | null = null;
  try { token = localStorage.getItem(DEVICE_KEY); } catch { /* ignore */ }
  if (!token || !devicePushOn()) return false;
  const { data, error } = await supabase.functions.invoke('register-order-push', { body: { tracking_code: trackingCode, token } });
  if (error || !data?.ok) return false;
  try { localStorage.setItem(`natural-order-push-${trackingCode}`, '1'); } catch { /* ignore */ }
  return true;
}

/** Customer: get notified about one order (works for guests). Call from a click handler. */
export async function enableOrderPush(trackingCode: string): Promise<PushStatus> {
  try {
    const r = await deviceToken();
    if (!r.token) return r.status;
    const { data, error } = await supabase.functions.invoke('register-order-push', { body: { tracking_code: trackingCode, token: r.token } });
    if (error || !data?.ok) return 'failed';
    try { localStorage.setItem(`natural-order-push-${trackingCode}`, '1'); } catch { /* ignore */ }
    return 'registered';
  } catch (e) { console.error(e); return 'failed'; }
}
export const orderPushEnabled = (code: string) => { try { return localStorage.getItem(`natural-order-push-${code}`) === '1'; } catch { return false; } };

async function saveAdminToken(userId: string, token: string): Promise<boolean> {
  const { error } = await supabase.from('admin_push_tokens').upsert({ token, user_id: userId });
  if (error) { console.error('push token save failed', error); return false; }
  try {
    const old = localStorage.getItem(TOKEN_KEY);
    if (old && old !== token) await supabase.from('admin_push_tokens').delete().eq('token', old);
    localStorage.setItem(TOKEN_KEY, token);
  } catch { /* ignore */ }
  return true;
}

/** Manager: turn on order notifications on this device. Call from a click handler. */
export async function enableAdminPush(userId: string): Promise<PushStatus> {
  try {
    const r = await deviceToken();
    if (!r.token) return r.status;
    return (await saveAdminToken(userId, r.token)) ? 'registered' : 'failed';
  } catch (e) { console.error(e); return 'failed'; }
}

/** Manager: silently re-registers (fresh token) on every app open when permission is already granted. */
export async function syncAdminPush(userId: string): Promise<boolean> {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted' || window.top !== window.self) return false;
    const r = await deviceToken();
    return !!r.token && (await saveAdminToken(userId, r.token));
  } catch (e) { console.error(e); return false; }
}

/** Shows a system notification (uses the phone's own notification sound). */
export async function systemNotify(title: string, body: string) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.getRegistration('/');
    const opts = { body, icon: '/icon-192.png', tag: `order-${Date.now()}`, requireInteraction: true, vibrate: [200, 100, 200] } as NotificationOptions;
    if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
  } catch (e) { console.error(e); }
}

/** Removes this device's push token (call before signing out). */
export async function unregisterPush() {
  let token: string | null = null;
  try { token = localStorage.getItem(TOKEN_KEY); } catch { /* ignore */ }
  if (!token) return;
  await supabase.from('admin_push_tokens').delete().eq('token', token);
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}
