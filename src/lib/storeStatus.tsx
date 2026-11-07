import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type StoreStatus = {
  is_open: boolean;
  mode: 'auto' | 'open' | 'closed';
  auto_open: boolean;
  open_until: string | null;
  next_open: string | null;
  today: [string, string][];
};

let cache: StoreStatus | null = null;
const subs = new Set<(s: StoreStatus) => void>();
let started = false;

export async function refreshStoreStatus() {
  const { data } = await supabase.rpc('store_status' as never);
  if (data) { cache = data as unknown as StoreStatus; subs.forEach((f) => f(cache!)); }
  return cache;
}

function start() {
  if (started) return;
  started = true;
  refreshStoreStatus();
  supabase.channel('store-status')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => refreshStoreStatus())
    .subscribe();
  // Scheduled open/close times pass without a DB change, so recheck every minute and on focus.
  setInterval(refreshStoreStatus, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshStoreStatus(); });
}

/** Live effective store status (single source: store_settings + store_status()). */
export function useStoreStatus() {
  const [s, setS] = useState<StoreStatus | null>(cache);
  useEffect(() => { start(); subs.add(setS); return () => { subs.delete(setS); }; }, []);
  return s;
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });
/** e.g. "08:00" today, or "Sun 08:00" for another day. */
export function fmtWhen(iso: string, locale: string) {
  const d = new Date(iso);
  const day = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  if (day(d) === day(new Date())) return fmtTime(iso);
  const wd = d.toLocaleDateString(locale === 'he' ? 'he' : locale === 'en' ? 'en' : 'ar', { weekday: 'short', timeZone: 'Asia/Jerusalem' });
  return `${wd} ${fmtTime(iso)}`;
}

export function StatusPill({ s, tx, lang, onClick }: { s: StoreStatus | null; tx: (m: { ar: string; he: string; en: string }) => string; lang: string; onClick?: () => void }) {
  if (!s) return null;
  const extra = s.is_open
    ? (s.open_until ? tx({ ar: `حتى ${fmtWhen(s.open_until, lang)}`, he: `עד ${fmtWhen(s.open_until, lang)}`, en: `until ${fmtWhen(s.open_until, lang)}` }) : '')
    : (s.next_open && s.mode !== 'closed' ? tx({ ar: `يفتح ${fmtWhen(s.next_open, lang)}`, he: `נפתח ${fmtWhen(s.next_open, lang)}`, en: `opens ${fmtWhen(s.next_open, lang)}` }) : '');
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag onClick={onClick} aria-live="polite"
      className={`inline-flex items-center gap-[6px] h-[28px] px-[10px] rounded-full text-[12px] font-bold whitespace-nowrap ${s.is_open ? 'bg-primary/12 text-primary' : 'bg-destructive/12 text-destructive'}`}>
      <span className={`w-[8px] h-[8px] rounded-full ${s.is_open ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
      {s.is_open ? tx({ ar: 'مفتوح', he: 'פתוח', en: 'Open' }) : tx({ ar: 'مغلق', he: 'סגור', en: 'Closed' })}
      {extra && <span className="font-semibold opacity-80 hidden sm:inline">· {extra}</span>}
    </Tag>
  );
}
