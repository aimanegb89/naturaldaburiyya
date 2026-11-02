import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { supabase } from '@/integrations/supabase/client';

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string) ?? '',
  projectId: (import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string) ?? '',
  appId: appId ?? '',
  messagingSenderId: appId?.split(':')[1] ?? '',
};

export type PushStatus = 'registered' | 'not-configured' | 'unsupported' | 'open-in-new-tab' | 'denied';

// Call from a click handler.
export async function enableAdminPush(userId: string): Promise<PushStatus> {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !appId || !vapidKey || !firebaseConfig.messagingSenderId) return 'not-configured';
  if (!('Notification' in window) || !(await isSupported())) return 'unsupported';
  if (window.top !== window.self) return 'open-in-new-tab';
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';
  const query = new URLSearchParams(firebaseConfig).toString();
  const reg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: reg });
  if (!token) return 'denied';
  await supabase.from('admin_push_tokens').upsert({ token, user_id: userId });
  return 'registered';
}
