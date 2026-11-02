import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ShimmerImage from '@/components/ShimmerImage';
import StarRating from '@/components/StarRating';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useRatingSummary } from '@/hooks/useReviews';
import { getProductName, getProductDescription } from '@/lib/product-utils';
import { hasSizes, type CatalogProduct } from '@/lib/catalog';
import { useTx } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: CatalogProduct;
  onQuickView?: (p: CatalogProduct) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, className }) => {
  const { language, t } = useLanguage();
  const tx = useTx();
  const { has, toggle } = useWishlist();
  const add = useAddToCart();
  const { data: ratings } = useRatingSummary();
  const rating = ratings?.[product.id];
  const name = getProductName(product, language);
  const liked = has(product.id);

  const onHeart = async (e: React.MouseEvent) => {
    e.preventDefault();
    const now = await toggle(product.id);
    toast(now ? t('addedToFavorites') : t('removedFromFavorites'));
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-surface-container-low rounded-[18px] overflow-hidden border border-outline-variant/50 shadow-soft transition-all duration-300 hover:-translate-y-[3px] hover:shadow-lift',
        className
      )}
    >
      <Link to={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-surface-container">
        <ShimmerImage
          src={product.img}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          wrapperClassName="w-full h-full"
        />
        <div className="absolute top-[8px] start-[8px] flex flex-col gap-[4px]">
          {product.meta.isNew && (
            <span className="px-[8px] py-[2px] rounded-full bg-gold text-primary-foreground text-[10px] font-bold">
              {tx({ ar: 'جديد', he: 'חדש', en: 'New' })}
            </span>
          )}
          {product.isPopular && (
            <span className="px-[8px] py-[2px] rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold">
              {tx({ ar: 'الأكثر طلبًا', he: 'הכי נמכר', en: 'Best seller' })}
            </span>
          )}
          <span className="px-[8px] py-[2px] rounded-full bg-surface-container-lowest/90 text-primary text-[10px] font-semibold w-fit">
            🌿 {tx({ ar: 'طبيعي', he: 'טבעי', en: 'Natural' })}
          </span>
        </div>
      </Link>

      <button
        onClick={onHeart}
        aria-label="wishlist"
        className="absolute top-[8px] end-[8px] w-[34px] h-[34px] rounded-full bg-surface-container-lowest/90 backdrop-blur flex items-center justify-center shadow-soft transition-transform active:scale-90"
      >
        <Heart className={cn('w-[16px] h-[16px]', liked ? 'fill-secondary text-secondary' : 'text-foreground/70')} />
      </button>


      <div className="flex flex-col flex-1 p-[12px] gap-[4px]">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-[14px] font-bold text-foreground leading-snug line-clamp-1">{name}</h3>
        </Link>
        <p className="text-[12px] text-muted-foreground line-clamp-1">{getProductDescription(product, language)}</p>
        <div className="flex items-center justify-between mt-[2px]">
          {rating ? (
            <StarRating value={rating.avg} count={rating.count} size={11} />
          ) : (
            <span className="text-[11px] text-muted-foreground">{tx({ ar: 'لا تقييمات بعد', he: 'אין דירוגים', en: 'No reviews yet' })}</span>
          )}
        </div>
        <div className="flex items-center gap-[6px] text-[11px] text-primary font-medium">
          <span className="w-[6px] h-[6px] rounded-full bg-primary" />
          {tx({ ar: 'متوفر الآن', he: 'במלאי', en: 'In stock' })}
        </div>
        <div className="mt-auto pt-[8px] flex items-center justify-between gap-[6px]">
          <div className="leading-none">
            {hasSizes(product) && <span className="text-[10px] text-muted-foreground block mb-[2px]">{tx({ ar: 'من', he: 'החל מ', en: 'From' })}</span>}
            <span className="text-[17px] font-extrabold text-foreground">{t('currency')}{product.priceSmall}</span>
          </div>
          <div className="flex gap-[6px]">
            {onQuickView && (
              <button
                onClick={() => onQuickView(product)}
                aria-label={tx({ ar: 'عرض سريع', he: 'צפייה מהירה', en: 'Quick view' })}
                className="w-[36px] h-[36px] rounded-full border border-outline-variant flex items-center justify-center text-foreground/80 hover:bg-surface-container transition-colors"
              >
                <Eye className="w-[16px] h-[16px]" />
              </button>
            )}
            <button
              onClick={() => add(product)}
              aria-label={t('addToCart')}
              className="w-[36px] h-[36px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft transition-all hover:bg-primary/90 active:scale-90"
            >
              <Plus className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
