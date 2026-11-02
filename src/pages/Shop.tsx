import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, SearchX, X } from 'lucide-react';
import AppShell from '@/components/AppShell';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { catalog, searchCatalog, type CatalogProduct } from '@/lib/catalog';
import { HEALTH_GOALS } from '@/data/product-meta';
import { useTx, pick, type Tri } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const SHOP_CATEGORIES: { key: string; label: Tri }[] = [
  { key: 'juices', label: { ar: 'عصائر طازجة', he: 'מיצים טריים', en: 'Fresh juices' } },
  { key: 'smoothies', label: { ar: 'سموذي وكوكتيل', he: 'שייקים', en: 'Smoothies' } },
  { key: 'bubbles', label: { ar: 'بابلز', he: 'באבלס', en: 'Bubble tea' } },
  { key: 'yogurt', label: { ar: 'يوجورت', he: 'יוגורט', en: 'Yogurt' } },
  { key: 'supplements', label: { ar: 'مكملات', he: 'תוספים', en: 'Supplements' } },
  { key: 'proteins', label: { ar: 'بروتينات', he: 'חלבונים', en: 'Proteins' } },
];

type Sort = 'best' | 'new' | 'price-asc' | 'price-desc';

export function filterAndSort(list: CatalogProduct[], cats: string[], goals: string[], sort: Sort) {
  let out = list.filter((p) => (cats.length ? cats.includes(p.category) : true) && (goals.length ? p.meta.goals.some((g) => goals.includes(g)) : true));
  out = [...out].sort((a, b) => {
    if (sort === 'price-asc') return a.priceSmall - b.priceSmall;
    if (sort === 'price-desc') return b.priceSmall - a.priceSmall;
    if (sort === 'new') return b.meta.addedOrder - a.meta.addedOrder;
    return b.meta.popularity - a.meta.popularity;
  });
  return out;
}

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      'h-[36px] px-[14px] rounded-full text-[13px] font-semibold border transition-all whitespace-nowrap',
      active ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface-container-lowest border-outline-variant text-foreground hover:border-primary'
    )}
  >
    {children}
  </button>
);

const Shop: React.FC = () => {
  const { language } = useLanguage();
  const tx = useTx();
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const [quick, setQuick] = useState<CatalogProduct | null>(null);

  const cats = params.getAll('category');
  const goals = params.getAll('goal');
  const sort = (params.get('sort') as Sort) || 'best';
  const q = params.get('q') || '';

  const toggle = (key: 'category' | 'goal', val: string) => {
    const next = new URLSearchParams(params);
    const cur = next.getAll(key);
    next.delete(key);
    (cur.includes(val) ? cur.filter((c) => c !== val) : [...cur, val]).forEach((v) => next.append(key, v));
    setParams(next, { replace: true });
  };
  const setSort = (s: Sort) => { const n = new URLSearchParams(params); n.set('sort', s); setParams(n, { replace: true }); };
  const clear = () => setParams(new URLSearchParams(sort !== 'best' ? { sort } : {}), { replace: true });

  const list = useMemo(() => filterAndSort(q ? searchCatalog(q, language) : catalog, cats, goals, sort), [q, language, cats.join(), goals.join(), sort]);
  const activeCount = cats.length + goals.length + (q ? 1 : 0);

  const Filters = (
    <div className="flex flex-col gap-[24px]">
      <div>
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground mb-[10px]">{tx({ ar: 'القسم', he: 'קטגוריה', en: 'Category' })}</h3>
        <div className="flex flex-wrap gap-[8px]">
          {SHOP_CATEGORIES.map((c) => <Chip key={c.key} active={cats.includes(c.key)} onClick={() => toggle('category', c.key)}>{pick(c.label, language)}</Chip>)}
        </div>
      </div>
      <div>
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground mb-[10px]">{tx({ ar: 'الهدف الصحي', he: 'מטרה בריאותית', en: 'Health goal' })}</h3>
        <div className="flex flex-wrap gap-[8px]">
          {HEALTH_GOALS.map((g) => <Chip key={g.key} active={goals.includes(g.key)} onClick={() => toggle('goal', g.key)}>{g.icon} {pick(g.label, language)}</Chip>)}
        </div>
      </div>
      {activeCount > 0 && (
        <button onClick={clear} className="text-[14px] font-bold text-secondary hover:underline self-start">{tx({ ar: 'مسح الفلاتر', he: 'נקה סינון', en: 'Clear filters' })}</button>
      )}
    </div>
  );

  const sortOptions: { k: Sort; l: Tri }[] = [
    { k: 'best', l: { ar: 'الأكثر مبيعًا', he: 'הנמכרים ביותר', en: 'Best selling' } },
    { k: 'new', l: { ar: 'الأحدث', he: 'החדשים', en: 'Newest' } },
    { k: 'price-asc', l: { ar: 'السعر: من الأقل', he: 'מחיר: מהנמוך', en: 'Price: low to high' } },
    { k: 'price-desc', l: { ar: 'السعر: من الأعلى', he: 'מחיר: מהגבוה', en: 'Price: high to low' } },
  ];

  return (
    <AppShell>
      <div className="max-w-[1200px] mx-auto px-[16px] md:px-[24px] py-[24px] md:py-[40px]">
        <div className="mb-[20px]">
          <h1 className="font-display text-[30px] md:text-[40px] leading-tight">{tx({ ar: 'المتجر', he: 'החנות', en: 'Shop' })}</h1>
          <p className="text-[14px] text-muted-foreground">{list.length} {tx({ ar: 'منتج', he: 'מוצרים', en: 'products' })}</p>
        </div>

        <div className="flex items-center gap-[8px] mb-[20px] flex-wrap">
          <button onClick={() => setSheet(true)} className="md:hidden h-[40px] px-[14px] rounded-full border border-outline-variant bg-surface-container-lowest flex items-center gap-[8px] text-[14px] font-semibold">
            <SlidersHorizontal className="w-[16px] h-[16px]" /> {tx({ ar: 'فلترة', he: 'סינון', en: 'Filter' })}
            {activeCount > 0 && <span className="w-[20px] h-[20px] rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center">{activeCount}</span>}
          </button>
          {q && (
            <span className="h-[36px] px-[12px] rounded-full bg-surface-container flex items-center gap-[6px] text-[13px]">
              “{q}”
              <button onClick={() => { const n = new URLSearchParams(params); n.delete('q'); setParams(n); }} aria-label="clear"><X className="w-[14px] h-[14px]" /></button>
            </span>
          )}
          <label className="ms-auto flex items-center gap-[8px] text-[13px] text-muted-foreground">
            <span className="hidden sm:inline">{tx({ ar: 'ترتيب حسب', he: 'מיון לפי', en: 'Sort by' })}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-[40px] px-[12px] rounded-full border border-outline-variant bg-surface-container-lowest text-[14px] font-semibold text-foreground outline-none focus:border-primary">
              {sortOptions.map((o) => <option key={o.k} value={o.k}>{pick(o.l, language)}</option>)}
            </select>
          </label>
        </div>

        <div className="flex gap-[32px]">
          <aside className="hidden md:block w-[250px] flex-shrink-0">
            <div className="sticky top-[88px] bg-surface-container-low rounded-[20px] border border-outline-variant/50 p-[20px]">{Filters}</div>
          </aside>
          <div className="flex-1 min-w-0">
            {list.length ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-[12px] md:gap-[20px]">
                {list.map((p) => <ProductCard key={p.id} product={p} onQuickView={setQuick} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-[64px] text-muted-foreground">
                <SearchX className="w-[40px] h-[40px] mb-[12px] opacity-50" />
                <p className="text-[15px] font-semibold">{tx({ ar: 'لا توجد منتجات مطابقة', he: 'לא נמצאו מוצרים', en: 'No matching products' })}</p>
                <button onClick={clear} className="mt-[12px] text-[14px] font-bold text-primary">{tx({ ar: 'مسح الفلاتر', he: 'נקה סינון', en: 'Clear filters' })}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent side="bottom" className="rounded-t-[24px] bg-background max-h-[80vh] overflow-y-auto">
          <SheetHeader className="mb-[16px]"><SheetTitle className="text-start">{tx({ ar: 'فلترة المنتجات', he: 'סינון מוצרים', en: 'Filter products' })}</SheetTitle></SheetHeader>
          {Filters}
          <button onClick={() => setSheet(false)} className="mt-[24px] w-full h-[48px] rounded-full bg-primary text-primary-foreground font-bold text-[15px]">
            {tx({ ar: `عرض ${list.length} منتج`, he: `הצג ${list.length} מוצרים`, en: `Show ${list.length} products` })}
          </button>
        </SheetContent>
      </Sheet>
      <ProductDetailModal product={quick} isOpen={!!quick} onClose={() => setQuick(null)} />
    </AppShell>
  );
};

export default Shop;
