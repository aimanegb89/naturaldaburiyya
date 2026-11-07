import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useStoreStatus, fmtWhen, refreshStoreStatus } from '@/lib/storeStatus';

type Slot = [string, string];
type Week = Record<string, Slot[]>;
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const inputCls = 'h-[36px] rounded-[10px] border border-input bg-background px-[8px] text-[14px]';

function Slots({ slots, onChange }: { slots: Slot[]; onChange: (s: Slot[]) => void }) {
  return (
    <div className="space-y-[8px] w-full min-w-0">
      {slots.map((sl, i) => (
        <div key={i} className="flex items-end gap-[8px] w-full">
          <label className="flex-1 min-w-0 flex flex-col gap-[2px]">
            <span className="text-[11px] font-semibold text-muted-foreground">من</span>
            <input type="time" dir="ltr" value={sl[0]} onChange={(e) => onChange(slots.map((x, k) => (k === i ? [e.target.value, x[1]] : x)))} className={`${inputCls} w-full`} />
          </label>
          <label className="flex-1 min-w-0 flex flex-col gap-[2px]">
            <span className="text-[11px] font-semibold text-muted-foreground">إلى {sl[1] === '00:00' && <span className="font-normal">(منتصف الليل)</span>}</span>
            <input type="time" dir="ltr" value={sl[1]} onChange={(e) => onChange(slots.map((x, k) => (k === i ? [x[0], e.target.value] : x)))} className={`${inputCls} w-full`} />
          </label>
          <button type="button" onClick={() => onChange(slots.filter((_, k) => k !== i))} className="shrink-0 w-[36px] h-[36px] rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10" aria-label="حذف الفترة"><Trash2 className="w-[16px] h-[16px]" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...slots, ['17:00', '22:00']])} className="text-[12px] font-bold text-primary inline-flex items-center gap-[4px]"><Plus className="w-[14px] h-[14px]" />فترة</button>
    </div>
  );
}

/** Manager: live status, manual override, weekly hours and special dates. */
export default function StoreAvailability() {
  const s = useStoreStatus();
  const [week, setWeek] = useState<Week | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Slot[]>>({});
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('store_settings').select('weekly_hours,date_overrides').eq('id', 1).maybeSingle().then(({ data }) => {
      setWeek((data?.weekly_hours as Week) ?? {});
      setOverrides((data?.date_overrides as Record<string, Slot[]>) ?? {});
    });
  }, []);

  const setMode = async (mode: 'auto' | 'open' | 'closed') => {
    const { error } = await supabase.from('store_settings').update({ manual_mode: mode, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) toast.error('فشل الحفظ'); else { toast.success('تم تحديث حالة المحل'); refreshStoreStatus(); }
  };

  const save = async () => {
    if (!week) return;
    const all = [...Object.values(week), ...Object.values(overrides)].flat();
    if (all.some(([a, b]) => !TIME.test(a) || !TIME.test(b) || a === b)) { toast.error('تحقق من الأوقات (وقت البداية والنهاية مختلفان)'); return; }
    setSaving(true);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
    const kept = Object.fromEntries(Object.entries(overrides).filter(([d]) => d >= today));
    const { error } = await supabase.from('store_settings').update({ weekly_hours: week, date_overrides: kept, updated_at: new Date().toISOString() }).eq('id', 1);
    setSaving(false);
    if (error) toast.error('فشل الحفظ'); else { setOverrides(kept); toast.success('تم حفظ ساعات العمل'); refreshStoreStatus(); }
  };

  const modeBtn = (m: 'auto' | 'open' | 'closed', label: string) => (
    <button onClick={() => setMode(m)}
      className={`flex-1 h-[44px] rounded-[12px] border text-[13px] font-bold transition-colors ${s?.mode === m ? (m === 'closed' ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-primary text-primary-foreground border-primary') : 'border-outline-variant'}`}>{label}</button>
  );

  return (
    <section id="store-availability" className="bg-card rounded-[14px] p-[14px] shadow-soft space-y-[14px] text-start scroll-mt-[120px]">
      <h2 className="font-bold text-[16px] flex items-center gap-[6px]"><Store className="w-[18px] h-[18px] text-primary" />حالة المحل وساعات العمل</h2>

      {s && (
        <div className={`rounded-[12px] p-[12px] ${s.is_open ? 'bg-primary/10' : 'bg-destructive/10'}`}>
          <p className={`text-[18px] font-bold ${s.is_open ? 'text-primary' : 'text-destructive'}`}>{s.is_open ? 'المحل مفتوح الآن' : 'المحل مغلق الآن'}</p>
          <p className="text-[13px] text-muted-foreground mt-[2px]">
            الوضع: {s.mode === 'auto' ? 'تلقائي حسب ساعات العمل' : s.mode === 'open' ? 'مفتوح يدويًا' : 'مغلق يدويًا'}
          </p>
          <p className="text-[13px] mt-[4px]">ساعات اليوم: <bdi dir="ltr">{s.today?.length ? s.today.map((x) => `${x[0]}–${x[1] === '00:00' ? '24:00' : x[1]}`).join(', ') : 'مغلق'}</bdi></p>
          {s.open_until && <p className="text-[13px]">يغلق تلقائيًا: <bdi dir="ltr">{fmtWhen(s.open_until, 'ar')}</bdi></p>}
          {!s.is_open && s.next_open && <p className="text-[13px]">الفتح القادم حسب الساعات: <bdi dir="ltr">{fmtWhen(s.next_open, 'ar')}</bdi></p>}
        </div>
      )}

      <div>
        <p className="text-[12px] text-muted-foreground mb-[6px]">التحكم اليدوي يتجاوز ساعات العمل حتى تعود إلى «تلقائي».</p>
        <div className="flex gap-[6px]">
          {modeBtn('auto', 'تلقائي')}
          {modeBtn('open', 'فتح الآن')}
          {modeBtn('closed', 'إغلاق الآن')}
        </div>
      </div>

      {week && (
        <div className="space-y-[10px]">
          <h3 className="font-bold text-[14px]">ساعات العمل الأسبوعية</h3>
          <p className="text-[12px] text-muted-foreground">بتوقيت القدس. فترة تنتهي بعد منتصف الليل (مثل 20:00–02:00) مسموحة.</p>
          {DAYS.map((name, d) => {
            const slots = week[String(d)] ?? [];
            const open = slots.length > 0;
            return (
              <div key={d} className="flex flex-col sm:flex-row sm:items-start gap-[8px] sm:gap-[10px] border-t border-outline-variant/60 pt-[10px]">
                <div className="sm:w-[80px] shrink-0 flex sm:flex-col items-center sm:items-start justify-between gap-[6px]">
                  <span className="text-[14px] font-semibold">{name}</span>
                  <Switch checked={open} aria-label={`${name} مفتوح`} onCheckedChange={(v) => setWeek({ ...week, [d]: v ? [['09:00', '22:00']] : [] })} />
                </div>
                {open ? <div className="flex-1 min-w-0"><Slots slots={slots} onChange={(x) => setWeek({ ...week, [d]: x })} /></div> : <span className="text-[13px] text-muted-foreground pt-[2px]">مغلق</span>}
              </div>
            );
          })}

          <h3 className="font-bold text-[14px] pt-[6px]">أيام خاصة (عطلة أو ساعات مختلفة)</h3>
          {Object.entries(overrides).sort().map(([date, slots]) => (
            <div key={date} className="flex flex-col sm:flex-row sm:items-start gap-[8px] sm:gap-[10px] border-t border-outline-variant/60 pt-[10px]">
              <div className="sm:w-[110px] shrink-0 flex sm:flex-col items-center sm:items-start justify-between gap-[6px]">
                <bdi dir="ltr" className="text-[14px] font-semibold">{date}</bdi>
                <button type="button" onClick={() => { const o = { ...overrides }; delete o[date]; setOverrides(o); }} className="text-[12px] text-destructive font-bold text-start">إزالة</button>
              </div>
              <div className="space-y-[4px] flex-1 min-w-0">
                {slots.length === 0 && <span className="text-[13px] text-destructive font-semibold block">مغلق طوال اليوم</span>}
                <Slots slots={slots} onChange={(x) => setOverrides({ ...overrides, [date]: x })} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-[6px]">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputCls} dir="ltr" aria-label="التاريخ" />
            <Button size="sm" variant="outline" disabled={!newDate || !!overrides[newDate]} onClick={() => { setOverrides({ ...overrides, [newDate]: [] }); setNewDate(''); }}>إضافة يوم</Button>
          </div>

          <Button className="w-full h-[42px]" disabled={saving} onClick={save}>{saving ? '...' : 'حفظ ساعات العمل'}</Button>
        </div>
      )}
    </section>
  );
}
