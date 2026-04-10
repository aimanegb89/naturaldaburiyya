import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Hero: React.FC = () => {
  const { t, dir } = useLanguage();
  
  return (
    <section id="home" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" dir={dir}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="Fresh fruits and smoothies" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/90 via-surface/70 to-surface" />
      </div>

      {/* Content */}
      <div className="px-5 pt-14 relative z-10 w-full">
        <div className="max-w-sm mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container shadow-elevation-1 mb-5 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Daburiyya, Israel</span>
          </div>

          {/* Logo Title */}
          <div className="mb-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="flex flex-col items-center gap-1">
              <span className="text-3xl font-medium text-primary tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                Natural
              </span>
              <div className="flex items-center gap-2">
                <span className="w-6 h-px bg-gradient-to-r from-transparent to-primary/50 rounded-full" />
                <span className="text-base">🍃</span>
                <span className="w-6 h-px bg-gradient-to-l from-transparent to-primary/50 rounded-full" />
              </div>
              <span className="text-lg text-foreground/90">
                {t('heroTitle').split('\n').pop()}
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-sm font-medium text-foreground/80 mb-1.5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t('heroSubtitle')}
          </p>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-6 max-w-xs mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {t('heroDescription')}
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-2.5 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button variant="default" size="default" asChild>
              <a href="#menu">{t('orderNow')}</a>
            </Button>
            <Button variant="outline" size="default" asChild>
              <a href="#menu">{t('viewMenu')}</a>
            </Button>
          </div>
        </div>

      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-4 w-28 h-28 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-4 w-32 h-32 rounded-full bg-secondary/10 blur-3xl animate-float-delayed" />
    </section>
  );
};

export default Hero;
