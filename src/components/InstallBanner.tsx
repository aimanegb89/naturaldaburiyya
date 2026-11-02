import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTx } from '@/lib/i18n';
import { useInstallPrompt } from '@/lib/installPrompt';

const KEY = 'install-banner-dismissed';

const InstallBanner = () => {
  const tx = useTx();
  const { canPrompt, install, isIOS, standalone } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(!!localStorage.getItem(KEY) || standalone || window.self !== window.top);
  }, [standalone]);

  if (dismissed || !(canPrompt || isIOS)) return null;
  const close = () => { localStorage.setItem(KEY, '1'); setDismissed(true); };

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
      {canPrompt && (
        <Button size="sm" onClick={async () => { await install(); close(); }}>
          <Download className="w-[16px] h-[16px]" /> {tx({ ar: 'تثبيت', he: 'התקנה', en: 'Install' })}
        </Button>
      )}
      <button onClick={close} aria-label="close" className="p-[4px] text-muted-foreground"><X className="w-[18px] h-[18px]" /></button>
    </div>
  );
};

export default InstallBanner;
