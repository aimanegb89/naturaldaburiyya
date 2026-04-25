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
    <div className="relative w-full mb-3" dir={dir}>
      <div className="relative">
        <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('searchProducts')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-6 ps-7 pe-7 rounded-full border border-outline-variant bg-surface-container-low text-[10px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-all duration-200"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-muted-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
