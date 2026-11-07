import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import ScrollToTop from './ScrollToTop';
import InstallBanner from './InstallBanner';
import NotificationPrompt from './NotificationPrompt';
import { useLanguage } from '@/contexts/LanguageContext';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dir } = useLanguage();
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-background pb-[72px] md:pb-0" dir={dir}>
      <Header />
      <main key={pathname} className="page-enter">{children}</main>
      <ScrollToTop />
      <BottomNav />
      <InstallBanner />
      <NotificationPrompt />
    </div>
  );
};

export default AppShell;
