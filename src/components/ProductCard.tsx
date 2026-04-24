import React, { useState } from 'react';
import ShimmerImage from '@/components/ShimmerImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { NO_SIZE_CATEGORIES } from '@/lib/constants';
import { getProductName, getProductDescription } from '@/lib/product-utils';
import smoothieOrange from '@/assets/smoothie-orange.jpg';
import smoothieGreen from '@/assets/smoothie-green.jpg';
import smoothieBerry from '@/assets/smoothie-berry.jpg';

interface ProductCardProps {
  product: Product;
}

const categoryImages: Record<string, string> = {
  juices: smoothieOrange,
  smoothies: smoothieGreen,
  supplements: smoothieBerry,
  bubbles: smoothieOrange,
  yogurt: smoothieBerry,
  proteins: smoothieBerry,
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<'small' | 'large'>('small');
  const [isAdded, setIsAdded] = useState(false);

  const hasNoSizeOption = NO_SIZE_CATEGORIES.includes(product.category as typeof NO_SIZE_CATEGORIES[number]);
  const name = getProductName(product, language);
  const description = getProductDescription(product, language);
  const currentPrice = hasNoSizeOption
    ? product.priceSmall
    : selectedSize === 'small'
    ? product.priceSmall
    : product.priceLarge;
  const image = product.image || categoryImages[product.category] || smoothieOrange;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      nameAr: product.nameAr,
      nameHe: product.nameHe,
      nameEn: product.nameEn,
      size: hasNoSizeOption ? 'small' : selectedSize,
      price: currentPrice,
      image,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleSizeClick = (e: React.MouseEvent, size: 'small' | 'large') => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  return (
    <div className="flex gap-3 items-center bg-surface-container-low rounded-xl p-3 shadow-elevation-1">
      {/* Image — first in HTML so it appears on the RIGHT in RTL, LEFT in LTR */}
      <div className="relative w-[90px] h-[90px] flex-shrink-0 rounded-xl overflow-hidden bg-surface-container-high">
        <ShimmerImage
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          wrapperClassName="w-full h-full"
        />
        {product.isPopular && (
          <span className="absolute top-1 start-1 px-1.5 py-[2px] bg-secondary text-secondary-foreground text-[9px] font-medium rounded-full shadow-elevation-1">
            ⭐
          </span>
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{name}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{description}</p>

        {/* Size selector */}
        {!hasNoSizeOption && (
          <div className="flex gap-[2px] mt-2 p-[2px] bg-surface-container-high rounded-full w-fit">
            <button
              onClick={(e) => handleSizeClick(e, 'small')}
              className={`py-[3px] px-2.5 rounded-full text-[10px] font-medium transition-all duration-200 ${
                selectedSize === 'small'
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'text-foreground'
              }`}
            >
              {t('small')}
            </button>
            <button
              onClick={(e) => handleSizeClick(e, 'large')}
              className={`py-[3px] px-2.5 rounded-full text-[10px] font-medium transition-all duration-200 ${
                selectedSize === 'large'
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'text-foreground'
              }`}
            >
              {t('large')}
            </button>
          </div>
        )}

        {/* Price + round add button */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-primary">{t('currency')}{currentPrice}</span>
          <Button
            variant={isAdded ? 'secondary' : 'default'}
            onClick={handleAddToCart}
            className="h-7 w-7 p-0 rounded-full flex-shrink-0"
          >
            {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
