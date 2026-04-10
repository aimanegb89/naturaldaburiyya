import React from 'react';
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
  const { t, language } = useLanguage();
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-surface-container rounded-2xl shadow-elevation-3">
        <DialogHeader>
          <DialogTitle className="md-headline-small text-foreground">{name}</DialogTitle>
        </DialogHeader>
        
        {/* Large Product Image */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-container-high">
          <img
            src={product.image}
            alt={name}
            className="w-full h-full object-cover"
          />
          {product.isPopular && (
            <span className="absolute top-3 right-3 bg-secondary text-secondary-foreground md-label-small px-3 py-1 rounded-full shadow-elevation-1">
              ⭐ {t('popular') || 'Popular'}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="md-body-large text-muted-foreground">{description}</p>

        {/* Nutrition Info */}
        <div className="bg-surface-container-high rounded-xl p-4">
          <h4 className="md-label-medium text-muted-foreground mb-3">
            {t('nutritionInfo')}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(nutrition).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center bg-surface-container-low rounded-lg px-3 py-2">
                <span className="md-body-small text-muted-foreground capitalize">{t(key as TranslationKey) || key}</span>
                <span className="md-label-large">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Size Selection - Material Segmented Button */}
        {!hasNoSize && (
          <div className="flex gap-2 p-1 bg-surface-container-high rounded-full">
            <button
              onClick={() => setSelectedSize('small')}
              className={`flex-1 py-2.5 px-4 rounded-full md-label-large transition-all duration-200 ${
                selectedSize === 'small'
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'text-foreground hover:bg-surface-container-highest'
              }`}
            >
              {t('small')} - ₪{product.priceSmall}
            </button>
            <button
              onClick={() => setSelectedSize('large')}
              className={`flex-1 py-2.5 px-4 rounded-full md-label-large transition-all duration-200 ${
                selectedSize === 'large'
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'text-foreground hover:bg-surface-container-highest'
              }`}
            >
              {t('large')} - ₪{product.priceLarge}
            </button>
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-2">
          <div className="md-headline-medium text-primary font-medium">
            ₪{currentPrice}
          </div>
          <Button onClick={handleAddToCart} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            {t('addToCart')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
