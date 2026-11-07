import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTx } from '@/lib/i18n';
import { StatusPill, StoreStatus, fmtWhen, useStoreStatus } from '@/lib/storeStatus';

const TZ = 'Asia/Jerusalem';
const loc = (l: string) => (l === 'he' ? 'he' : l === 'en' ? 'en' : 'ar');
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
// Noon UTC keeps the calendar date stable in Jerusalem.
const dateAt = (ymd: string) => new Date(`${ymd}T12:00:00Z`);
const addDays = (ymd: string, n: number) => { const d = dateAt(ymd); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const slotsText = (slots: [string, string][] | undefined, closed: string) =>
  slots?.length ? slots.map(([a, b]) => `${a}–${b === '00:00' ? '24:00' : b}`).join(' · ') : closed;

function useClosedLabel() {
  const tx = useTx();
  return tx({ ar: 'مغلق', he: 'סגור', en: 'Closed' });
}

/** Full week (starting today) + special dates in the next 14 days. */
export function WeeklyHoursList({ s }: { s: StoreStatus }) {
  const { language } = useLanguage();
  const tx = useTx();
  const closed = useClosedLabel();
  const today = todayStr();
  const week = s.weekly_hours ?? {};
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const special = Object.entries(s.date_overrides ?? {})
    .filter(([d]) => d >= today && d <= addDays(today, 14)).sort(([a], [b]) => a.localeCompare(b));
  const dayName = (ymd: string) => dateAt(ymd).toLocaleDateString(loc(language), { weekday: 'long', timeZone: 'UTC' });

  return (
    <div className="space-y-[10px] text-start">
      <ul className="space-y-[2px]">
        {days.map((d) => {
          const isToday = d === today;
          const slots = week[String(dateAt(d).getUTCDay())];
          return (
            <li key={d} className={`flex justify-between gap-[12px] px-[8px] py-[4px] rounded-[8px] text-[13px] ${isToday ? 'bg-primary/10 text-primary font-bold' : 'text-foreground'}`}>
              <span>{dayName(d)}{isToday && ` · ${tx({ ar: 'اليوم', he: 'היום', en: 'Today' })}`}</span>
              <bdi dir="ltr" className={!slots?.length ? 'text-muted-foreground' : ''}>{slotsText(slots, closed)}</bdi>
            </li>
          );
        })}
      </ul>
      {special.length > 0 && (
        <div>
          <p className="text-[12px] font-bold text-muted-foreground mb-[4px]">{tx({ ar: 'أيام خاصة', he: 'ימים מיוחדים', en: 'Special dates' })}</p>
          <ul className="space-y-[2px]">
            {special.map(([d, slots]) => (
              <li key={d} className="flex justify-between gap-[12px] px-[8px] py-[4px] text-[13px]">
                <span>{dateAt(d).toLocaleDateString(loc(language), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}</span>
                <bdi dir="ltr" className={!slots.length ? 'text-destructive font-semibold' : ''}>{slotsText(slots, closed)}</bdi>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StatusLine({ s }: { s: StoreStatus }) {
  const { language } = useLanguage();
  const tx = useTx();
  let text: string;
  if (s.mode === 'closed') text = tx({ ar: 'مغلق مؤقتًا', he: 'סגור זמנית', en: 'Temporarily closed' });
  else if (s.is_open) text = s.open_until
    ? tx({ ar: `مفتوح حتى ${fmtWhen(s.open_until, language)}`, he: `פתוח עד ${fmtWhen(s.open_until, language)}`, en: `Open until ${fmtWhen(s.open_until, language)}` })
    : tx({ ar: 'مفتوح الآن', he: 'פתוח עכשיו', en: 'Open now' });
  else text = s.next_open
    ? tx({ ar: `مغلق، يفتح ${fmtWhen(s.next_open, language)}`, he: `סגור, נפתח ${fmtWhen(s.next_open, language)}`, en: `Closed, opens ${fmtWhen(s.next_open, language)}` })
    : tx({ ar: 'مغلق الآن', he: 'סגור עכשיו', en: 'Closed now' });
  return <p className={`text-[15px] font-bold ${s.is_open ? 'text-primary' : 'text-destructive'}`}>{text}</p>;
}

/** Header pill that opens the weekly hours card. */
export function StoreHoursPopover({ s }: { s: StoreStatus | null }) {
  const { language, dir } = useLanguage();
  const tx = useTx();
  if (!s) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span role="button" tabIndex={0} aria-label={tx({ ar: 'ساعات العمل', he: 'שעות פתיחה', en: 'Opening hours' })} className="cursor-pointer">
          <StatusPill s={s} tx={tx} lang={language} />
        </span>
      </PopoverTrigger>
      <PopoverContent dir={dir} align="start" className="w-[290px] p-[14px] space-y-[10px]">
        <StatusLine s={s} />
        <p className="text-[12px] font-bold text-muted-foreground">{tx({ ar: 'ساعات العمل', he: 'שעות פתיחה', en: 'Opening hours' })}</p>
        <WeeklyHoursList s={s} />
      </PopoverContent>
    </Popover>
  );
}

/** Home page line: today's hours + open/closed now. */
export function TodayHours() {
  const s = useStoreStatus();
  const tx = useTx();
  const closed = useClosedLabel();
  if (!s) return <span>…</span>;
  return (
    <span>
      {tx({ ar: 'اليوم', he: 'היום', en: 'Today' })} <bdi dir="ltr">{slotsText(s.today, closed)}</bdi>
      {' · '}
      <span className={`font-bold ${s.is_open ? 'text-primary' : 'text-destructive'}`}>
        {s.mode === 'closed' ? tx({ ar: 'مغلق مؤقتًا', he: 'סגור זמנית', en: 'Temporarily closed' }) : s.is_open ? tx({ ar: 'مفتوح الآن', he: 'פתוח עכשיו', en: 'Open now' }) : tx({ ar: 'مغلق الآن', he: 'סגור עכשיו', en: 'Closed now' })}
      </span>
    </span>
  );
}
