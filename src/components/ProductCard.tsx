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
  compact?: boolean;
}

const categoryImages: Record<string, string> = {
  juices: smoothieOrange,
  smoothies: smoothieGreen,
  supplements: smoothieBerry,
  bubbles: smoothieOrange,
  yogurt: smoothieBerry,
  proteins: smoothieBerry
};

const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<'small' | 'large'>('small');
  const [isAdded, setIsAdded] = useState(false);

  const hasNoSizeOption = NO_SIZE_CATEGORIES.includes(product.category as typeof NO_SIZE_CATEGORIES[number]);
  const name = getProductName(product, language);
  const description = getProductDescription(product, language);

  const currentPrice = hasNoSizeOption ? product.priceSmall : (selectedSize === 'small' ? product.priceSmall : product.priceLarge);
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
      image
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleSizeClick = (e: React.MouseEvent, size: 'small' | 'large') => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-elevation-1 h-full">
      {/* Image */}
      <div className="relative h-[100px] overflow-hidden">
        <ShimmerImage
          src={image} 
          alt={name} 
          className="w-full h-full object-cover"
          wrapperClassName="w-full h-full"
        />
        {product.isPopular && (
          <span className="absolute top-[6px] left-[6px] px-[6px] py-[2px] bg-secondary text-secondary-foreground text-[10px] font-medium rounded-full shadow-elevation-1">
            ⭐
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-[10px]">
        <h3 className="text-xs font-semibold text-foreground mb-[2px] line-clamp-1">{name}</h3>
        <p className="text-[10px] text-muted-foreground mb-[6px] line-clamp-1">{description}</p>

        {/* Size selector */}
        {!hasNoSizeOption && (
          <div className="flex gap-[2px] mb-[6px] p-[2px] bg-surface-container-high rounded-full">
            <button
              onClick={(e) => handleSizeClick(e, 'small')}
              className={`flex-1 py-[4px] px-[6px] rounded-full text-[10px] font-medium transition-all duration-200 ${
                selectedSize === 'small'
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'text-foreground'
              }`}
            >
              {t('small')}
            </button>
            <button
              onClick={(e) => handleSizeClick(e, 'large')}
              className={`flex-1 py-[4px] px-[6px] rounded-full text-[10px] font-medium transition-all duration-200 ${
                selectedSize === 'large'
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'text-foreground'
              }`}
            >
              {t('large')}
            </button>
          </div>
        )}

        {/* Price and Add button */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            {t('currency')}{currentPrice}
          </span>
          <Button
            variant={isAdded ? 'secondary' : 'default'}
            onClick={handleAddToCart}
            className="!h-[28px] !w-[28px] min-w-0 !p-0"
          >
            {isAdded ? <Check className="w-[14px] h-[14px]" /> : <Plus className="w-[14px] h-[14px]" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
