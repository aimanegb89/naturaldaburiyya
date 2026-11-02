import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Leaf, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ShimmerImage from '@/components/ShimmerImage';
import { useTx } from '@/lib/i18n';
import heroBg from '@/assets/hero-bg.jpg';
import logo from '@/assets/logo.png';

const Hero: React.FC = () => {
  const { dir } = useLanguage();
  const tx = useTx();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section id="home" className="px-[12px] md:px-[24px] pt-[12px]">
      <div className="relative max-w-[1200px] mx-auto rounded-[28px] overflow-hidden min-h-[480px] md:min-h-[540px] flex items-end md:items-center">
        <ShimmerImage src={heroBg} alt="" loading="eager" className="w-full h-full object-cover" wrapperClassName="absolute inset-0" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent md:hidden" />

        <div className="relative z-10 w-full p-[24px] md:p-[56px] max-w-[620px] text-primary-foreground">
          <img src={logo} alt="Natural" className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full mb-[20px] shadow-lift animate-fade-in" />
          <span className="inline-flex items-center gap-[6px] px-[12px] h-[30px] rounded-full bg-primary-foreground/15 backdrop-blur text-[12px] font-semibold mb-[16px] animate-fade-in">
            <Leaf className="w-[14px] h-[14px]" /> {tx({ ar: '100% طبيعي • بدون مواد حافظة', he: '100% טבעי • ללא חומרים משמרים', en: '100% natural • No preservatives' })}
          </span>
          <h1 className="font-display text-[34px] md:text-[54px] leading-[1.1] mb-[14px] animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {tx({ ar: 'صحتك تبدأ من الطبيعة', he: 'הבריאות שלך מתחילה בטבע', en: 'Wellness, pressed fresh from nature' })}
          </h1>
          <p className="text-[15px] md:text-[17px] leading-relaxed text-primary-foreground/85 mb-[24px] max-w-[480px] animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {tx({
              ar: 'عصائر معصورة يوميًا، سموذي ومكملات طبيعية — تُحضَّر بحب في دبورية وتصلك طازجة.',
              he: 'מיצים סחוטים יומית, שייקים ותוספים טבעיים — מוכנים באהבה בדבוריה ומגיעים טריים.',
              en: 'Daily cold-pressed juices, smoothies and natural supplements — made with care in Daburiyya, delivered fresh.',
            })}
          </p>
          <div className="flex flex-wrap items-center gap-[12px] animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link
              to="/shop"
              className="group inline-flex items-center gap-[8px] h-[52px] px-[28px] rounded-full bg-secondary text-secondary-foreground text-[16px] font-bold shadow-lift transition-all hover:brightness-110 hover:-translate-y-[2px] active:translate-y-0"
            >
              {tx({ ar: 'تسوق الآن', he: 'לקנייה', en: 'Shop Now' })}
              <Arrow className="w-[18px] h-[18px] transition-transform group-hover:translate-x-[3px] rtl:group-hover:-translate-x-[3px]" />
            </Link>
            <div className="flex items-center gap-[6px] text-[13px] text-primary-foreground/90">
              <Star className="w-[16px] h-[16px] fill-gold text-gold" />
              {tx({ ar: 'مفضّل أهل المنطقة منذ سنوات', he: 'האהוב על תושבי האזור', en: 'A local favourite for years' })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
