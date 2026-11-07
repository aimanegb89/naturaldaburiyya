import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTx } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { devicePushOn, disableDevicePush, enableDevicePush } from '@/lib/push';
import { toast } from 'sonner';

/** Side-menu switch: offer + order notifications on this device. */
export default function NotificationToggle() {
  const tx = useTx();
  const { language } = useLanguage();
  const [on, setOn] = useState(devicePushOn);
  const [busy, setBusy] = useState(false);
  const change = async (v: boolean) => {
    setBusy(true);
    if (v) {
      const r = await enableDevicePush(language);
      if (r === 'registered') setOn(true);
      else toast.error(r === 'denied'
        ? tx({ ar: 'الإشعارات محظورة في إعدادات المتصفح', he: 'ההתראות חסומות בהגדרות הדפדפן', en: 'Notifications are blocked in your browser settings' })
        : r === 'open-in-new-tab'
          ? tx({ ar: 'افتح التطبيق في نافذة مستقلة', he: 'פתחו את האפליקציה בכרטיסייה נפרדת', en: 'Open the app in its own tab' })
          : tx({ ar: 'تعذّر تفعيل الإشعارات على هذا الجهاز', he: 'לא ניתן להפעיל התראות במכשיר הזה', en: "Couldn't turn on notifications on this device" }));
    } else { await disableDevicePush(); setOn(false); }
    setBusy(false);
  };
  return (
    <label className="flex items-center justify-between gap-[8px]">
      <span className="flex items-center gap-[6px] text-[13px] font-semibold"><Bell className="w-[14px] h-[14px] text-primary" />{tx({ ar: 'الإشعارات', he: 'התראות', en: 'Notifications' })}</span>
      <Switch checked={on} disabled={busy} onCheckedChange={change} />
    </label>
  );
}
