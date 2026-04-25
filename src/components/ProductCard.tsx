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
  const { addItem, items } = useCart();
  const cartCount = items
    .filter(i => i.id === product.id)
    .reduce((sum, i) => sum + i.quantity, 0);
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
    <div className="w-[145px] flex-shrink-0 bg-surface-container-low rounded-xl overflow-hidden shadow-elevation-1">
      {/* Image */}
      <div className="relative h-[95px] overflow-hidden">
        <ShimmerImage
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          wrapperClassName="w-full h-full"
        />
        {product.isPopular && (
          <span className="absolute top-1.5 start-1.5 px-1.5 py-[2px] bg-secondary text-secondary-foreground text-[9px] font-medium rounded-full shadow-elevation-1 flex items-center gap-[2px]">
            ⭐ {t('popular')}
          </span>
        )}
        {cartCount > 0 && (
          <span className="absolute top-1.5 end-1.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center px-[3px] shadow-elevation-1">
            {cartCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        <h3 className="text-[11px] font-semibold text-foreground line-clamp-1 leading-tight">{name}</h3>
        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-[2px]">{description}</p>

        {/* Size selector */}
        {!hasNoSizeOption && (
          <div className="flex gap-[2px] mt-1.5 p-[2px] bg-surface-container-high rounded-full">
            <button
              onClick={(e) => handleSizeClick(e, 'small')}
              className={`flex-1 py-[3px] rounded-full text-[9px] font-medium transition-all duration-200 ${
                selectedSize === 'small'
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'text-foreground'
              }`}
            >
              {t('small')}
            </button>
            <button
              onClick={(e) => handleSizeClick(e, 'large')}
              className={`flex-1 py-[3px] rounded-full text-[9px] font-medium transition-all duration-200 ${
                selectedSize === 'large'
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'text-foreground'
              }`}
            >
              {t('large')}
            </button>
          </div>
        )}

        {/* Price */}
        <span className="text-xs font-bold text-primary mt-1.5 block">
          {t('currency')}{currentPrice}
        </span>

        {/* Add button */}
        <Button
          variant={isAdded ? 'secondary' : 'default'}
          onClick={handleAddToCart}
          className="w-full h-[28px] text-[10px] gap-1 mt-1.5"
        >
          {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isAdded ? t('added') : t('addToCart')}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
