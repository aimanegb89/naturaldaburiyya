import React from 'react';
import ShimmerImage from '@/components/ShimmerImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage, TranslationKey } from '@/contexts/LanguageContext';
import { Product } from '@/data/products';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { Plus } from 'lucide-react';
import { NO_SIZE_CATEGORIES } from '@/lib/constants';
import { getProductName, getProductDescription } from '@/lib/product-utils';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose }) => {
  const { t, language, dir } = useLanguage();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = React.useState<'small' | 'large'>('small');

  if (!product) return null;

  const name = getProductName(product, language);
  const description = getProductDescription(product, language);
  const hasNoSize = NO_SIZE_CATEGORIES.includes(product.category as typeof NO_SIZE_CATEGORIES[number]);
  const currentPrice = hasNoSize ? product.priceSmall : (selectedSize === 'small' ? product.priceSmall : product.priceLarge);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      nameAr: product.nameAr,
      nameHe: product.nameHe,
      nameEn: product.nameEn,
      size: hasNoSize ? 'small' : selectedSize,
      price: currentPrice,
      image: product.image,
    });
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
        {/* Image — compact fixed height */}
        <div className="relative w-full h-[140px] overflow-hidden rounded-t-2xl bg-surface-container-high flex-shrink-0">
          <ShimmerImage
            src={product.image}
            alt={name}
            className="w-full h-full object-cover"
            wrapperClassName="w-full h-full"
          />
          {product.isPopular && (
            <span className="absolute top-2 start-2 bg-secondary text-secondary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full shadow-elevation-1 flex items-center gap-1">
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
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              {t('nutritionInfo')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(nutrition).map(([key, value]) => (
                <span key={key} className="inline-flex items-center gap-1 bg-surface-container-high rounded-full px-2.5 py-1 text-[10px]">
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
            <span className="text-base font-bold text-primary">₪{currentPrice}</span>
            <Button onClick={handleAddToCart} size="sm" className="gap-1.5 px-5">
              <Plus className="w-[14px] h-[14px]" />
              {t('addToCart')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
