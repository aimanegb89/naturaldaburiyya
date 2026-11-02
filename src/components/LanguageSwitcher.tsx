import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const languages = [
  { code: 'ar', label: 'العربية' },
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
] as const;

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center bg-surface-container rounded-full p-[3px] gap-[2px]" role="radiogroup" aria-label="Language">
      {languages.map((lang) => (
        <button
          key={lang.code}
          role="radio"
          aria-checked={language === lang.code}
          lang={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`h-[30px] px-[12px] rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
            language === lang.code
              ? 'bg-primary text-primary-foreground shadow-soft'
              : 'text-foreground/75 hover:text-foreground'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
