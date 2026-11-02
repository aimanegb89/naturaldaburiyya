import { MapPin, Phone, Clock, Instagram, Facebook, MessageCircle } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTx } from '@/lib/i18n';
import { WHATSAPP_NUMBER } from '@/lib/constants';

const Contact = () => {
  const { t } = useLanguage();
  const tx = useTx();
  const rows = [
    { icon: MapPin, title: t('location'), value: t('address') },
    { icon: Phone, title: t('phone'), value: '+972-54-543-4621', ltr: true, href: 'tel:+972545434621' },
    { icon: Clock, title: t('openHours'), value: t('openDaily') },
  ];

  return (
    <AppShell>
      <div className="max-w-[640px] mx-auto px-[16px] py-[24px] space-y-[16px] text-start">
        <div>
          <h1 className="text-[24px] font-bold text-foreground">{tx({ ar: 'تواصل معنا', he: 'צור קשר', en: 'Contact us' })}</h1>
          <p className="text-[14px] text-muted-foreground mt-[4px]">{t('heroDescription')}</p>
        </div>

        <section className="bg-card rounded-[16px] border border-outline-variant divide-y divide-outline-variant">
          {rows.map(({ icon: Icon, title, value, ltr, href }) => {
            const body = (
              <div className="flex items-center gap-[12px] p-[14px]">
                <span className="w-[40px] h-[40px] rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-foreground">{title}</p>
                  <p className="text-[13px] text-muted-foreground" dir={ltr ? 'ltr' : undefined}>{value}</p>
                </div>
              </div>
            );
            return href ? <a key={title} href={href} className="block">{body}</a> : <div key={title}>{body}</div>;
          })}
        </section>

        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-[8px] h-[48px] rounded-[14px] bg-primary text-primary-foreground font-bold text-[15px]">
          <MessageCircle className="w-[18px] h-[18px]" /> {t('contactWhatsApp')}
        </a>

        <section className="bg-card rounded-[16px] border border-outline-variant p-[14px]">
          <h2 className="text-[15px] font-bold mb-[10px]">{t('followUs')}</h2>
          <div className="flex gap-[10px]">
            <a href="https://instagram.com/natural.daburiyya" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="w-[42px] h-[42px] rounded-full bg-primary/10 text-primary flex items-center justify-center"><Instagram className="w-[18px] h-[18px]" /></a>
            <a href="https://facebook.com/natural.daburiyya" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
              className="w-[42px] h-[42px] rounded-full bg-primary/10 text-primary flex items-center justify-center"><Facebook className="w-[18px] h-[18px]" /></a>
          </div>
        </section>

        <p className="text-center text-[12px] text-muted-foreground pt-[8px]">© {new Date().getFullYear()} Natural. {t('allRights')}</p>
      </div>
    </AppShell>
  );
};

export default Contact;
