import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTx } from '@/lib/i18n';

type BIPEvent = Event & { prompt: () => Promise<void> };
const KEY = 'install-banner-dismissed';

const InstallBanner = () => {
  const tx = useTx();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone;

  useEffect(() => {
    if (standalone || localStorage.getItem(KEY) || window.self !== window.top) return;
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); setShow(true); };
    window.addEventListener('beforeinstallprompt', h);
    if (isIOS) setShow(true);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  if (!show) return null;
  const close = () => { localStorage.setItem(KEY, '1'); setShow(false); };

  return (
    <div className="fixed inset-x-[12px] bottom-[84px] md:bottom-[24px] md:max-w-[420px] md:start-auto md:end-[24px] z-50 rounded-2xl bg-card border border-outline-variant shadow-lift p-[14px] flex items-center gap-[12px]">
      <img src="/icon-192.png" alt="" className="w-[44px] h-[44px] rounded-xl" />
      <div className="flex-1 min-w-0 text-[13px] leading-snug">
        <p className="font-bold text-[14px]">{tx({ ar: 'ثبّت تطبيق Natural', he: 'התקינו את Natural', en: 'Install the Natural app' })}</p>
        {isIOS ? (
          <p className="text-muted-foreground">
            {tx({ ar: 'اضغط', he: 'לחצו על', en: 'Tap' })} <Share className="inline w-[14px] h-[14px]" />{' '}
            {tx({ ar: 'ثم "إضافة إلى الشاشة الرئيسية"', he: 'ואז "הוסף למסך הבית"', en: 'then "Add to Home Screen"' })}
          </p>
        ) : (
          <p className="text-muted-foreground">{tx({ ar: 'اطلب بسرعة من شاشتك الرئيسية', he: 'הזמנה מהירה ממסך הבית', en: 'Order faster from your home screen' })}</p>
        )}
      </div>
      {evt && (
        <Button size="sm" onClick={async () => { await evt.prompt(); close(); }}>
          <Download className="w-[16px] h-[16px]" /> {tx({ ar: 'تثبيت', he: 'התקנה', en: 'Install' })}
        </Button>
      )}
      <button onClick={close} aria-label="close" className="p-[4px] text-muted-foreground"><X className="w-[18px] h-[18px]" /></button>
    </div>
  );
};

export default InstallBanner;
