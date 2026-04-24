import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import ShimmerImage from '@/components/ShimmerImage';
import { WHATSAPP_NUMBER } from '@/lib/constants';

import heroBg from '@/assets/hero-bg.jpg';
import logo from '@/assets/logo.png';

const Hero: React.FC = () => {
  const { t, dir } = useLanguage();
  
  return (
    <section id="home" className="relative min-h-[52vh] flex items-center justify-center overflow-hidden" dir={dir}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <ShimmerImage
          src={heroBg}
          alt="Fresh fruits and smoothies"
          className="w-full h-full object-cover"
          wrapperClassName="w-full h-full"
          loading="eager"
        />
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

          {/* Logo */}
          <div className="mb-4 animate-fade-in flex justify-center" style={{ animationDelay: '0.1s' }}>
            <ShimmerImage
              src={logo}
              alt="Natural - Healthy Drinks & Supplements"
              className="w-[180px] h-[180px] object-contain"
              wrapperClassName="w-[180px] h-[180px] rounded-full"
              shimmerClassName="rounded-full"
              loading="eager"
            />
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
              <a href="#menu">{t('viewMenu')}</a>
            </Button>
            <Button variant="outline" size="default" asChild>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                {t('contactWhatsApp')}
              </a>
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
