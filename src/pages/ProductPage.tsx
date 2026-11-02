import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Heart, Minus, Plus, ShoppingBag, ZoomIn, Leaf, Truck } from 'lucide-react';
import { toast } from 'sonner';
import AppShell from '@/components/AppShell';
import ShimmerImage from '@/components/ShimmerImage';
import StarRating from '@/components/StarRating';
import ProductCard from '@/components/ProductCard';
import ReviewsSection from '@/components/product/ReviewsSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useRatingSummary } from '@/hooks/useReviews';
import { catalog, getCatalogProduct, hasSizes } from '@/lib/catalog';
import { getProductName, getProductDescription } from '@/lib/product-utils';
import { HEALTH_GOALS } from '@/data/product-meta';
import { useTx, pick } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import NotFound from './NotFound';

const ProductPage: React.FC = () => {
  const { id = '' } = useParams();
  const p = getCatalogProduct(id);
  const { language, t } = useLanguage();
  const tx = useTx();
  const add = useAddToCart();
  const { has, toggle } = useWishlist();
  const { data: ratings } = useRatingSummary();
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [size, setSize] = useState<'small' | 'large'>('small');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!p) return <NotFound />;
  const name = getProductName(p, language);
  const price = hasSizes(p) && size === 'large' ? p.priceLarge : p.priceSmall;
  const rating = ratings?.[p.id];
  const related = catalog.filter((x) => x.id !== p.id && (x.category === p.category || x.meta.goals.some((g) => p.meta.goals.includes(g)))).slice(0, 8);

  const onAdd = () => {
    add(p, size, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <AppShell>
      <div key={p.id} className="max-w-[1200px] mx-auto px-[16px] md:px-[24px] py-[16px] md:py-[40px]">
        <nav className="text-[13px] text-muted-foreground mb-[16px] flex gap-[6px]">
          <Link to="/" className="hover:text-primary">{t('home')}</Link>/
          <Link to="/shop" className="hover:text-primary">{tx({ ar: 'المتجر', he: 'חנות', en: 'Shop' })}</Link>/
          <span className="text-foreground line-clamp-1">{name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-[24px] md:gap-[48px]">
          {/* Gallery */}
          <div className="flex flex-col gap-[12px]">
            <button onClick={() => setZoom(true)} className="relative aspect-square rounded-[24px] overflow-hidden bg-surface-container shadow-soft group">
              <ShimmerImage src={p.gallery[img]} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" wrapperClassName="w-full h-full" />
              <span className="absolute bottom-[12px] end-[12px] w-[40px] h-[40px] rounded-full bg-surface-container-lowest/90 flex items-center justify-center shadow-soft"><ZoomIn className="w-[18px] h-[18px]" /></span>
            </button>
            <div className="flex gap-[10px]">
              {p.gallery.map((g, i) => (
                <button key={i} onClick={() => setImg(i)} className={cn('w-[72px] h-[72px] rounded-[14px] overflow-hidden border-2 transition-all', i === img ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100')}>
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex flex-wrap gap-[6px] mb-[10px]">
              <span className="px-[10px] h-[26px] flex items-center rounded-full bg-primary/10 text-primary text-[12px] font-bold">🌿 {tx({ ar: 'طبيعي 100%', he: '100% טבעי', en: '100% Natural' })}</span>
              {p.meta.isNew && <span className="px-[10px] h-[26px] flex items-center rounded-full bg-gold text-primary-foreground text-[12px] font-bold">{tx({ ar: 'جديد', he: 'חדש', en: 'New' })}</span>}
              {p.isPopular && <span className="px-[10px] h-[26px] flex items-center rounded-full bg-secondary text-secondary-foreground text-[12px] font-bold">{tx({ ar: 'الأكثر طلبًا', he: 'הכי נמכר', en: 'Best seller' })}</span>}
            </div>
            <h1 className="font-display text-[28px] md:text-[38px] leading-tight mb-[8px]">{name}</h1>
            <div className="flex items-center gap-[10px] mb-[14px]">
              {rating ? <StarRating value={rating.avg} count={rating.count} size={15} /> : <span className="text-[13px] text-muted-foreground">{tx({ ar: 'لا تقييمات بعد', he: 'אין דירוגים', en: 'No reviews yet' })}</span>}
              <span className="flex items-center gap-[6px] text-[13px] text-primary font-semibold"><span className="w-[7px] h-[7px] rounded-full bg-primary" />{tx({ ar: 'متوفر', he: 'במלאי', en: 'In stock' })}</span>
            </div>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-[16px]">{getProductDescription(p, language)}</p>
            <div className="flex flex-wrap gap-[6px] mb-[20px]">
              {p.meta.goals.map((g) => {
                const goal = HEALTH_GOALS.find((x) => x.key === g)!;
                return <Link key={g} to={`/shop?goal=${g}`} className="px-[10px] h-[28px] flex items-center rounded-full bg-surface-container text-[12px] font-semibold hover:bg-surface-container-high">{goal.icon} {pick(goal.label, language)}</Link>;
              })}
            </div>

            <p className="text-[32px] font-extrabold mb-[20px]">{t('currency')}{price}</p>

            {hasSizes(p) && (
              <div className="mb-[18px]">
                <p className="text-[13px] font-bold mb-[8px]">{tx({ ar: 'الحجم', he: 'גודל', en: 'Size' })}</p>
                <div className="flex gap-[8px]">
                  {(['small', 'large'] as const).map((s) => (
                    <button key={s} onClick={() => setSize(s)} className={cn('h-[48px] px-[20px] rounded-[14px] border-2 text-[14px] font-bold transition-all', size === s ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant hover:border-primary/50')}>
                      {t(s)} · {t('currency')}{s === 'small' ? p.priceSmall : p.priceLarge}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-[10px] mb-[16px]">
              <div className="flex items-center h-[52px] rounded-full border border-outline-variant bg-surface-container-lowest">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-[48px] h-full flex items-center justify-center" aria-label="-"><Minus className="w-[16px] h-[16px]" /></button>
                <span className="w-[28px] text-center text-[16px] font-bold">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="w-[48px] h-full flex items-center justify-center" aria-label="+"><Plus className="w-[16px] h-[16px]" /></button>
              </div>
              <button
                onClick={onAdd}
                className={cn('flex-1 h-[52px] rounded-full flex items-center justify-center gap-[8px] text-[16px] font-bold shadow-lift transition-all active:scale-[0.97]', added ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:brightness-110')}
              >
                {added ? <Check className="w-[20px] h-[20px] animate-scale-in" /> : <ShoppingBag className="w-[20px] h-[20px]" />}
                {added ? tx({ ar: 'تمت الإضافة', he: 'נוסף!', en: 'Added!' }) : t('addToCart')}
              </button>
              <button
                onClick={async () => { const now = await toggle(p.id); toast(now ? t('addedToFavorites') : t('removedFromFavorites')); }}
                className="w-[52px] h-[52px] rounded-full border border-outline-variant flex items-center justify-center"
                aria-label="wishlist"
              >
                <Heart className={cn('w-[20px] h-[20px]', has(p.id) ? 'fill-secondary text-secondary' : '')} />
              </button>
            </div>
            <div className="flex flex-col gap-[6px] text-[13px] text-muted-foreground mb-[16px]">
              <span className="flex items-center gap-[8px]"><Truck className="w-[16px] h-[16px] text-primary" />{tx({ ar: 'توصيل محلي سريع في دبورية والمنطقة', he: 'משלוח מקומי מהיר בדבוריה והסביבה', en: 'Fast local delivery around Daburiyya' })}</span>
              <span className="flex items-center gap-[8px]"><Leaf className="w-[16px] h-[16px] text-primary" />{tx({ ar: 'يُحضَّر طازجًا عند الطلب', he: 'מוכן טרי בהזמנה', en: 'Prepared fresh to order' })}</span>
            </div>

            <Accordion type="single" collapsible defaultValue="ingredients" className="border-t border-outline-variant/60">
              <AccordionItem value="ingredients">
                <AccordionTrigger className="text-[15px] font-bold">{tx({ ar: 'المكونات', he: 'רכיבים', en: 'Ingredients' })}</AccordionTrigger>
                <AccordionContent className="text-[14px] text-muted-foreground">{pick(p.meta.ingredients, language)}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="usage">
                <AccordionTrigger className="text-[15px] font-bold">{tx({ ar: 'طريقة الاستخدام', he: 'אופן השימוש', en: 'How to enjoy' })}</AccordionTrigger>
                <AccordionContent className="text-[14px] text-muted-foreground">{pick(p.meta.usage, language)}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="reviews">
                <AccordionTrigger className="text-[15px] font-bold">
                  {tx({ ar: 'آراء الزبائن', he: 'ביקורות', en: 'Customer reviews' })}{rating ? ` (${rating.count})` : ''}
                </AccordionTrigger>
                <AccordionContent><ReviewsSection productId={p.id} /></AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-[56px]">
            <h2 className="font-display text-[24px] md:text-[30px] mb-[16px]">{tx({ ar: 'قد يعجبك أيضًا', he: 'אולי תאהבו גם', en: 'You may also like' })}</h2>
            <div className="flex gap-[12px] md:gap-[20px] overflow-x-auto scrollbar-hide snap-x pb-[8px] -mx-[16px] px-[16px]">
              {related.map((r) => <ProductCard key={r.id} product={r} className="w-[180px] md:w-[240px] flex-shrink-0 snap-start" />)}
            </div>
          </section>
        )}
      </div>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-[min(92vw,900px)] p-0 overflow-hidden bg-background rounded-[20px]">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <img src={p.gallery[img]} alt={name} className="w-full max-h-[85vh] object-contain" />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default ProductPage;
