import React from 'react';
import ShimmerImage from '@/components/ShimmerImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage, TranslationKey } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { hasSizes, isAvailable, unitPrice, type CatalogProduct } from '@/lib/catalog';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useTx } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { getProductName, getProductDescription } from '@/lib/product-utils';

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose }) => {
  const { t, language, dir } = useLanguage();
  const add = useAddToCart();
  const tx = useTx();
  const [selectedSize, setSelectedSize] = React.useState<'small' | 'large'>('small');
  React.useEffect(() => { setSelectedSize('small'); }, [product?.id]);

  if (!product) return null;

  const name = getProductName(product, language);
  const description = getProductDescription(product, language);
  const hasNoSize = !hasSizes(product);
  const available = isAvailable(product);
  const currentPrice = unitPrice(product, hasNoSize ? 'small' : selectedSize);

  const handleAddToCart = () => {
    if (!available) return;
    add(product, hasNoSize ? 'small' : selectedSize);
    onClose();
  };

  const getNutritionInfo = () => {
    switch (product.category) {
      case 'juices':
        return { calories: '45-60', sugar: '8-12g', fiber: '1-2g', vitamins: 'A, C, K' };
      case 'smoothies':
        return { calories: '120-180', protein: '3-5g', sugar: '18-25g', fiber: '3-5g' };
      case 'yogurt':
        return { calories: '150-200', protein: '8-12g', sugar: '12-18g', calcium: '20%' };
      case 'bubbles':
        return { calories: '100-150', sugar: '15-22g', carbs: '25-35g' };
      case 'supplements':
        return { servingSize: '1-2', dailyValue: '100-500%', type: t('supplements') };
      case 'proteins':
        return { protein: '24-30g', calories: '120-180', bcaa: '5-7g', servings: '30-60' };
      default:
        return {};
    }
  };

  const nutrition = getNutritionInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={dir} className="sm:max-w-[400px] max-h-[88vh] overflow-y-auto bg-surface-container rounded-2xl shadow-elevation-3 p-0 gap-0">
        {/* Image — takes ~50% of the modal height, fully visible */}
        <div className="relative w-full h-[45vh] overflow-hidden rounded-t-2xl bg-surface-container-high flex-shrink-0">
          <ShimmerImage
            src={product.img}
            alt={name}
            className={cn('w-full h-full object-contain', !available && 'grayscale opacity-70')}
            wrapperClassName="w-full h-full"
          />
          {product.isPopular && (
            <span className="absolute top-2 start-2 bg-secondary text-secondary-foreground text-[12px] font-medium px-2 py-0.5 rounded-full shadow-elevation-1 flex items-center gap-1">
              ⭐ {t('popular') || 'Popular'}
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="text-sm font-semibold text-foreground leading-tight">{name}</DialogTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </DialogHeader>

          {/* Nutrition — compact inline pills */}
          <div>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              {t('nutritionInfo')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(nutrition).map(([key, value]) => (
                <span key={key} className="inline-flex items-center gap-1 bg-surface-container-high rounded-full px-2.5 py-1 text-[12px]">
                  <span className="text-muted-foreground capitalize">{t(key as TranslationKey) || key}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Size selector */}
          {!hasNoSize && (
            <div className="flex gap-1.5 p-1 bg-surface-container-high rounded-full">
              <button
                onClick={() => setSelectedSize('small')}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedSize === 'small'
                    ? 'bg-primary text-primary-foreground shadow-elevation-1'
                    : 'text-foreground'
                }`}
              >
                {t('small')} — ₪{product.priceSmall}
              </button>
              <button
                onClick={() => setSelectedSize('large')}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedSize === 'large'
                    ? 'bg-primary text-primary-foreground shadow-elevation-1'
                    : 'text-foreground'
                }`}
              >
                {t('large')} — ₪{product.priceLarge}
              </button>
            </div>
          )}

          {/* Price + Add */}
          <div className="flex items-center justify-between pt-1">
            <bdi dir="ltr" className="text-base font-bold text-primary">₪{currentPrice}</bdi>
            <Button onClick={handleAddToCart} disabled={!available} className="gap-1.5 px-5 h-[44px]">
              {available && <Plus className="w-[14px] h-[14px]" />}
              {available ? t('addToCart') : tx({ ar: 'غير متوفر', he: 'אזל מהמלאי', en: 'Out of stock' })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
