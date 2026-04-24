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
    <div className="flex items-center bg-surface-container rounded-full p-[3px] gap-[2px]">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
            language === lang.code
              ? 'bg-primary text-primary-foreground shadow-elevation-1'
              : 'text-foreground hover:bg-surface-container-high'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
