import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, Send, Download, Share, Check, ChevronDown } from 'lucide-react';
import { useInstallPrompt } from '@/lib/installPrompt';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { enableAdminPush } from '@/lib/push';
import { Button } from '@/components/ui/button';
import QrDialog from '@/components/admin/QrDialog';
import ProductsManager from './ProductsManager';
import ThemeToggle from '@/components/ThemeToggle';
import { Switch } from '@/components/ui/switch';
import { CHIMES, playChime } from '@/lib/chimes';
import { Play } from 'lucide-react';
import StoreAvailability from './StoreAvailability';
import BroadcastPush from './BroadcastPush';

const pushMsg: Record<string, string> = {
  registered: 'تم تفعيل الإشعارات على هذا الجهاز',
  'not-configured': 'إعداد إشعارات الويب في Firebase غير مكتمل بعد',
  unsupported: 'هذا المتصفح لا يدعم الإشعارات (على iPhone أضف التطبيق إلى الشاشة الرئيسية أولاً)',
  'open-in-new-tab': 'افتح صفحة الإدارة في نافذة مستقلة ثم أعد المحاولة',
  denied: 'الإشعارات محظورة — فعّلها من إعدادات الموقع في المتصفح',
  failed: 'هذا الجهاز مسجّل لحساب مدير آخر — سجّل خروجه أولاً ثم أعد المحاولة',
};

function Section({ title, children, id, open }: { title: string; children: React.ReactNode; id?: string; open?: boolean }) {
  return (
    <details id={id} open={open} className="group bg-card rounded-[14px] shadow-soft text-start scroll-mt-[120px]">
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none flex items-center gap-[8px] p-[14px] font-bold text-[16px]">
        <span className="flex-1">{title}</span>
        <ChevronDown className="w-[18px] h-[18px] text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-[14px] pb-[14px] space-y-[10px]">{children}</div>
    </details>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const inst = useInstallPrompt();
  const [channel, setChannel] = useState<'push' | 'whatsapp' | null>(null);

  useEffect(() => {
    supabase.from('store_settings').select('order_channel').eq('id', 1).maybeSingle()
      .then(({ data }) => setChannel((data?.order_channel as 'push' | 'whatsapp') ?? 'push'));
    supabase.from('store_settings').select('auto_done_minutes').eq('id', 1).maybeSingle()
      .then(({ data }) => setAutoMins(String(data?.auto_done_minutes ?? 60)));
  }, []);
  const [autoMins, setAutoMins] = useState('60');
  const [chimeOn, setChimeOn] = useState(true);
  const [warnMin, setWarnMin] = useState('15');
  const [prep, setPrep] = useState('10–15');
  useEffect(() => {
    supabase.from('store_settings').select('chime_enabled,stale_warn_minutes,prep_time_text').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data) { setChimeOn(data.chime_enabled); setWarnMin(String(data.stale_warn_minutes)); setPrep(data.prep_time_text); } });
  }, []);
  const [sound, setSound] = useState('classic');
  const [volume, setVolume] = useState('normal');
  useEffect(() => {
    supabase.from('store_settings').select('chime_sound,chime_volume').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data) { setSound(data.chime_sound); setVolume(data.chime_volume); } });
  }, []);
  const saveSound = async (patch: { chime_sound?: string; chime_volume?: string }) => {
    const { error } = await supabase.from('store_settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) toast.error('فشل الحفظ');
  };
  const saveAlerts = async (patch: { chime_enabled?: boolean } = {}) => {
    const n = Math.round(Number(warnMin));
    if (!(n >= 1 && n <= 240)) { toast.error('مدة التنبيه بين 1 و 240 دقيقة'); return; }
    const p = prep.trim();
    if (!p || p.length > 20) { toast.error('أدخل مدة التحضير (حتى 20 حرفًا)'); return; }
    const { error } = await supabase.from('store_settings').update({ chime_enabled: chimeOn, stale_warn_minutes: n, prep_time_text: p, ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) toast.error('فشل الحفظ'); else toast.success('تم الحفظ');
  };
  const saveAuto = async () => {
    const n = Math.round(Number(autoMins));
    if (!(n >= 10 && n <= 1440)) { toast.error('أدخل رقمًا بين 10 و 1440 دقيقة'); return; }
    const { error } = await supabase.from('store_settings').update({ auto_done_minutes: n, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) toast.error('فشل الحفظ'); else toast.success('تم الحفظ');
  };

  const saveChannel = async (v: 'push' | 'whatsapp') => {
    const prev = channel; setChannel(v);
    const { error } = await supabase.from('store_settings').update({ order_channel: v, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) { setChannel(prev); toast.error('فشل الحفظ'); } else toast.success('تم الحفظ');
  };

  const opt = (v: 'push' | 'whatsapp', label: string, desc: string) => (
    <button onClick={() => saveChannel(v)}
      className={`flex-1 rounded-[12px] border p-[10px] text-start transition-colors ${channel === v ? 'border-primary bg-primary/10' : 'border-outline-variant'}`}>
      <div className="font-bold text-[14px]">{label}</div>
      <div className="text-[12px] text-muted-foreground">{desc}</div>
    </button>
  );

  return (
    <div className="space-y-[14px]">
      <Section title="حالة المحل وساعات العمل" id="store-availability-section" open><StoreAvailability /></Section>
      <Section title="إرسال إشعار للزبائن"><BroadcastPush /></Section>
      <Section title="تثبيت تطبيق الإدارة">
        {inst.standalone ? (
          <p className="text-[13px] text-primary font-bold flex items-center gap-[6px]"><Check className="w-[16px] h-[16px]" /> التطبيق مثبّت على هذا الجهاز</p>
        ) : inst.canPrompt ? (
          <Button onClick={inst.install} className="w-full h-[42px]"><Download className="w-[16px] h-[16px]" /> تثبيت التطبيق</Button>
        ) : inst.isIOS ? (
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            في Safari اضغط <Share className="inline w-[14px] h-[14px]" /> ثم «إضافة إلى الشاشة الرئيسية». سيظهر التطبيق باسم Natural Admin ويفتح على صفحة الطلبات.
          </p>
        ) : (
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            افتح هذه الصفحة في Chrome أو Edge على الرابط المنشور ثم اضغط زر التثبيت، أو من قائمة المتصفح اختر «تثبيت التطبيق».
          </p>
        )}
      </Section>

      <Section title="استلام الطلبات">
        <div className="flex gap-[8px]">
          {opt('push', 'إشعار للتطبيق', 'الطلب يصل إلى صفحة الطلبات مع إشعار')}
          {opt('whatsapp', 'رسالة واتساب', 'يُحفظ الطلب ويُفتح واتساب للزبون أيضًا')}
        </div>
      </Section>

      <Section title="إنهاء الطلبات تلقائيًا">
        <p className="text-[12px] text-muted-foreground mb-[8px]">الطلب الذي لم يُحدَّث يصبح «جاهز» تلقائيًا بعد هذه المدة من استلامه.</p>
        <div className="flex items-center gap-[8px]">
          <input type="number" min={10} max={1440} value={autoMins} onChange={(e) => setAutoMins(e.target.value)} dir="ltr"
            className="w-[90px] h-[38px] rounded-[10px] border border-input bg-background px-[10px] text-[14px]" />
          <span className="text-[13px]">دقيقة</span>
          <button onClick={saveAuto} className="ms-auto h-[38px] px-[14px] rounded-[10px] bg-primary text-primary-foreground text-[13px] font-bold">حفظ</button>
        </div>
      </Section>

      <Section title="تنبيهات الطلبات ووقت التحضير">
        <div className="flex items-center gap-[8px]">
          <span className="text-[14px] font-semibold flex-1">صوت عند وصول طلب جديد</span>
          <Switch checked={chimeOn} onCheckedChange={(v) => { setChimeOn(v); saveAlerts({ chime_enabled: v }); }} aria-label="صوت الطلب الجديد" />
        </div>
        <div className="grid grid-cols-2 gap-[8px]">
          {CHIMES.map((c) => (
            <button key={c.id} type="button" onClick={() => { setSound(c.id); playChime(c.id, volume); saveSound({ chime_sound: c.id }); }}
              className={`flex items-center gap-[8px] rounded-[12px] border p-[10px] text-start text-[13px] transition-colors ${sound === c.id ? 'border-primary bg-primary/10 font-bold' : 'border-outline-variant'}`}>
              <Play className="w-[14px] h-[14px] shrink-0 text-primary" />
              <span className="flex-1">{c.label}</span>
              {sound === c.id && <Check className="w-[14px] h-[14px] text-primary" />}
            </button>
          ))}
        </div>
        <div className="flex gap-[8px]">
          {([['normal', 'صوت عادي'], ['loud', 'صوت عالٍ']] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => { setVolume(v); playChime(sound, v); saveSound({ chime_volume: v }); }}
              className={`flex-1 h-[38px] rounded-[10px] border text-[13px] ${volume === v ? 'border-primary bg-primary/10 font-bold' : 'border-outline-variant'}`}>{l}</button>
          ))}
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground mb-[6px]">يظهر الطلب بإطار أحمر إذا انتظر أكثر من:</p>
          <div className="flex items-center gap-[8px]">
            <input type="number" min={1} max={240} value={warnMin} onChange={(e) => setWarnMin(e.target.value)} dir="ltr" className="w-[90px] h-[38px] rounded-[10px] border border-input bg-background px-[10px] text-[14px]" />
            <span className="text-[13px]">دقيقة</span>
          </div>
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground mb-[6px]">وقت التحضير المتوقّع الذي يراه الزبون (مثال: 10–15)</p>
          <div className="flex items-center gap-[8px]">
            <input value={prep} maxLength={20} onChange={(e) => setPrep(e.target.value)} dir="ltr" className="w-[90px] h-[38px] rounded-[10px] border border-input bg-background px-[10px] text-[14px]" />
            <span className="text-[13px]">دقيقة</span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-[6px]">سيظهر للزبون: «نحضّر طلبك الآن — عادةً خلال {prep || '…'} دقيقة»</p>
        </div>
        <button onClick={() => saveAlerts()} className="w-full h-[38px] rounded-[10px] bg-primary text-primary-foreground text-[13px] font-bold">حفظ</button>
      </Section>

      <Section title="الإشعارات على هذا الجهاز">
        <div className="flex gap-[8px] flex-wrap">
          <Button size="sm" variant="outline" onClick={async () => user && toast(pushMsg[await enableAdminPush(user.id)])}>
            <Bell className="w-[16px] h-[16px]" /> تفعيل الإشعارات
          </Button>
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const { data, error } = await supabase.functions.invoke('availability-reminder', { body: { test: true } });
              toast(error ? 'فشل الإرسال — سجّل الدخول كمدير' : data?.sent ? 'تم إرسال إشعار تجريبي' : 'لا توجد أجهزة مفعّلة');
            } catch { toast('فشل الإرسال'); }
          }}><Send className="w-[16px] h-[16px]" /> إرسال تجربة</Button>
          <QrDialog />
        </div>
      </Section>

      <Section title="المظهر">
        <ThemeToggle withLabels />
      </Section>
      <Section title="إدارة القائمة">
        <ProductsManager />
      </Section>
    </div>
  );
}
