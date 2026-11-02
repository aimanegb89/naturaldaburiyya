import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { searchCatalog, useCatalog } from '@/lib/catalog';
import { getProductName } from '@/lib/product-utils';
import { HEALTH_GOALS } from '@/data/product-meta';
import { useTx, pick } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const SearchCommand: React.FC<{ className?: string; autoFocus?: boolean; onDone?: () => void }> = ({ className, autoFocus, onDone }) => {
  const { language, t } = useLanguage();
  const tx = useTx();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useCatalog();
  const results = searchCatalog(q, language).slice(0, 6);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const go = (path: string) => { setOpen(false); setQ(''); onDone?.(); navigate(path); };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <form
        onSubmit={(e) => { e.preventDefault(); go(`/shop?q=${encodeURIComponent(q)}`); }}
        className="flex items-center h-[42px] rounded-full bg-surface-container border border-outline-variant/60 px-[14px] gap-[8px] focus-within:border-primary focus-within:bg-surface-container-lowest transition-colors"
      >
        <Search className="w-[16px] h-[16px] text-muted-foreground flex-shrink-0" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={tx({ ar: 'ابحث عن منتج، مكوّن أو هدف صحي…', he: 'חפשו מוצר, רכיב או מטרה…', en: 'Search products, ingredients, goals…' })}
          className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground min-w-0"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="clear"><X className="w-[14px] h-[14px] text-muted-foreground" /></button>
        )}
      </form>

      {open && (
        <div className="absolute top-[48px] inset-x-0 z-50 bg-surface-container-lowest rounded-[16px] border border-outline-variant/60 shadow-lift p-[8px] animate-fade-in">
          {q.trim() ? (
            results.length ? (
              results.map((p) => (
                <button key={p.id} onClick={() => go(`/product/${p.id}`)} className="w-full flex items-center gap-[10px] p-[6px] rounded-[10px] hover:bg-surface-container text-start">
                  <img src={p.img} alt="" className="w-[40px] h-[40px] rounded-[8px] object-cover" />
                  <span className="flex-1 text-[13px] font-semibold line-clamp-1">{getProductName(p, language)}</span>
                  <span className="text-[13px] font-bold text-primary">{t('currency')}{p.priceSmall}</span>
                </button>
              ))
            ) : (
              <p className="text-[13px] text-muted-foreground p-[8px]">{tx({ ar: 'لا توجد نتائج', he: 'אין תוצאות', en: 'No results' })}</p>
            )
          ) : (
            <div className="p-[6px]">
              <p className="text-[12px] font-semibold text-muted-foreground mb-[8px] uppercase tracking-wide">{tx({ ar: 'تسوق حسب الهدف', he: 'קנו לפי מטרה', en: 'Shop by goal' })}</p>
              <div className="flex flex-wrap gap-[6px]">
                {HEALTH_GOALS.map((g) => (
                  <button key={g.key} onClick={() => go(`/shop?goal=${g.key}`)} className="px-[12px] h-[32px] rounded-full bg-surface-container text-[12px] font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                    {g.icon} {pick(g.label, language)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchCommand;
