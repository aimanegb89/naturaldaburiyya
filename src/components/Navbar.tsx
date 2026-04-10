import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Leaf } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar: React.FC = () => {
  const { dir } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-container/95 backdrop-blur-md shadow-elevation-1" dir={dir}>
      <div className="px-4">
        <div className="flex items-center justify-between h-[48px]">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-[6px]">
            <div className="w-[28px] h-[28px] bg-primary rounded-full flex items-center justify-center">
              <Leaf className="w-[14px] h-[14px] text-primary-foreground" />
            </div>
            <span className="text-base font-medium text-primary">Natural</span>
          </a>

          {/* Language switcher only */}
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
