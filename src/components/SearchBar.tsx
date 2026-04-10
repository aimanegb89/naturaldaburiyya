import React from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  const { t, dir } = useLanguage();

  return (
    <div className="relative w-full mb-5" dir={dir}>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('searchProducts')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 ps-10 pe-10 rounded-full border border-outline-variant bg-surface-container-low text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:border-2 focus:outline-none transition-all duration-200 shadow-elevation-1"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute end-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
