import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTx } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { devicePushOn, enableDevicePush, syncDevicePush } from '@/lib/push';
import { toast } from 'sonner';

const SNOOZE = 'natural-notif-snooze';
const VISITS = 'natural-visits';
const WEEK = 7 * 24 * 3600 * 1000;

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Asks customers once (after install or on the 2nd visit) to allow offer + order notifications. */
export default function NotificationPrompt() {
  const tx = useTx();
  const { language } = useLanguage();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const iosBrowser = isIOS() && !isStandalone();

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(VISITS)) {
        sessionStorage.setItem(VISITS, '1');
        localStorage.setItem(VISITS, String(Number(localStorage.getItem(VISITS) || 0) + 1));
      }
      if (devicePushOn()) { syncDevicePush(language); return; }
      if (localStorage.getItem('natural-device-push-off')) return;
      if (window.top !== window.self) return;
      if (!iosBrowser && (!('Notification' in window) || Notification.permission === 'denied')) return;
      if (Date.now() - Number(localStorage.getItem(SNOOZE) || 0) < WEEK) return;
      if (!isStandalone() && Number(localStorage.getItem(VISITS) || 0) < 2) return;
      const id = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(id);
    } catch { /* ignore */ }
  }, [language, iosBrowser]);

  if (!show) return null;
  const later = () => { try { localStorage.setItem(SNOOZE, String(Date.now())); } catch { /* ignore */ } setShow(false); };
  const allow = async () => {
    setBusy(true);
    const r = await enableDevicePush(language);
    setBusy(false);
    if (r === 'registered') { toast.success(tx({ ar: 'تم تفعيل الإشعارات', he: 'ההתראות הופעלו', en: 'Notifications are on' })); setShow(false); }
    else if (r === 'denied') { toast.error(tx({ ar: 'الإشعارات محظورة في إعدادات المتصفح', he: 'ההתראות חסומות בהגדרות הדפדפן', en: 'Notifications are blocked in your browser settings' })); later(); }
    else { toast.error(tx({ ar: 'تعذّر تفعيل الإشعارات على هذا الجهاز', he: 'לא ניתן להפעיל התראות במכשיר הזה', en: "Couldn't turn on notifications on this device" })); later(); }
  };

  return (
    <div className="fixed inset-x-[12px] bottom-[84px] md:bottom-[20px] md:inset-x-auto md:end-[20px] md:w-[360px] z-50 bg-card border border-outline-variant rounded-[16px] shadow-soft p-[14px] page-enter">
      <button onClick={later} className="absolute top-[8px] end-[8px] w-[28px] h-[28px] flex items-center justify-center rounded-full text-muted-foreground" aria-label="close"><X className="w-[16px] h-[16px]" /></button>
      <div className="flex gap-[10px] items-start pe-[24px]">
        <div className="w-[40px] h-[40px] rounded-full bg-primary/12 text-primary flex items-center justify-center shrink-0"><Bell className="w-[20px] h-[20px]" /></div>
        <div className="space-y-[4px]">
          <p className="font-bold text-[15px]">{tx({ ar: 'وصلك كل جديد', he: 'הישארו מעודכנים', en: 'Stay in the loop' })}</p>
          <p className="text-[13px] text-muted-foreground">
            {iosBrowser
              ? tx({ ar: 'على الآيفون: أضف التطبيق إلى الشاشة الرئيسية (مشاركة ← إضافة إلى الشاشة الرئيسية) ثم افتحه لتفعيل الإشعارات.', he: 'באייפון: הוסיפו את האפליקציה למסך הבית (שיתוף ← הוספה למסך הבית) ופתחו אותה כדי להפעיל התראות.', en: 'On iPhone: add the app to your Home Screen (Share → Add to Home Screen), then open it to turn on notifications.' })
              : tx({ ar: 'احصل على إشعارات بالعروض الجديدة وبجاهزية طلبك.', he: 'קבלו התראות על מבצעים ועל מוכנות ההזמנה.', en: 'Get notified about new offers and when your order is ready.' })}
          </p>
        </div>
      </div>
      {!iosBrowser && (
        <div className="flex gap-[8px] mt-[12px]">
          <Button className="flex-1 h-[40px]" disabled={busy} onClick={allow}>{busy ? '...' : tx({ ar: 'السماح', he: 'אישור', en: 'Allow' })}</Button>
          <Button variant="outline" className="flex-1 h-[40px]" onClick={later}>{tx({ ar: 'لاحقًا', he: 'אחר כך', en: 'Later' })}</Button>
        </div>
      )}
    </div>
  );
}
