import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const languages = [
  { code: 'ar', label: 'AR' },
  { code: 'he', label: 'HE' },
  { code: 'en', label: 'EN' },
] as const;

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-surface-container rounded-full p-[2px] gap-[1px]">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-200 ${
            language === lang.code
              ? 'bg-primary text-primary-foreground shadow-elevation-1'
              : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
