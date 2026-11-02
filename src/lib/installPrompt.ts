import { useEffect, useState } from 'react';

export type BIPEvent = Event & { prompt: () => Promise<void> };

// Captured globally at startup: the browser fires this once, often before pages mount.
let deferred: BIPEvent | null = null;
const listeners = new Set<(e: BIPEvent | null) => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    listeners.forEach((l) => l(deferred));
  });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((l) => l(null)); });
}

/** Points the page at the manager app definition while on manager pages. */
export function useAdminManifest() {
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    const title = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    link?.setAttribute('href', '/manifest-admin.webmanifest');
    title?.setAttribute('content', 'Natural Admin');
    return () => {
      link?.setAttribute('href', '/manifest.webmanifest');
      title?.setAttribute('content', 'Natural');
    };
  }, []);
}

export function useInstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(deferred);
  useEffect(() => { listeners.add(setEvt); return () => { listeners.delete(setEvt); }; }, []);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    !!(navigator as unknown as { standalone?: boolean }).standalone;
  const install = async () => { if (!evt) return; await evt.prompt(); deferred = null; setEvt(null); };
  return { canPrompt: !!evt, install, isIOS, standalone };
}
