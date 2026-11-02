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

// Call from a click handler.
export async function enableAdminPush(userId: string): Promise<PushStatus> {
  const { firebaseConfig, vapidKey } = await loadConfig();
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId || !vapidKey || !firebaseConfig.messagingSenderId) return 'not-configured';
  if (!('Notification' in window) || !(await isSupported())) return 'unsupported';
  if (window.top !== window.self) return 'open-in-new-tab';
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';
  const query = new URLSearchParams(firebaseConfig).toString();
  const reg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: reg });
  if (!token) return 'denied';
  const { error } = await supabase.from('admin_push_tokens').upsert({ token, user_id: userId });
  // Fails when this device's token is still registered to another manager account.
  if (error) { console.error('push token save failed', error); return 'failed'; }
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
  return 'registered';
}

/** Removes this device's push token (call before signing out). */
export async function unregisterPush() {
  let token: string | null = null;
  try { token = localStorage.getItem(TOKEN_KEY); } catch { /* ignore */ }
  if (!token) return;
  await supabase.from('admin_push_tokens').delete().eq('token', token);
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}
