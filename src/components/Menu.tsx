import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { products, Product } from '@/data/products';
import { getProductName, getProductDescription } from '@/lib/product-utils';
import ProductCard from './ProductCard';
import SearchBar from './SearchBar';
import ProductDetailModal from './ProductDetailModal';
import { SearchX } from 'lucide-react';

type Category = 'all' | 'juices' | 'smoothies' | 'supplements' | 'bubbles' | 'yogurt' | 'proteins';

const categoryIcons: Record<Category, string> = {
  all: '🍽️',
  juices: '🥤',
  smoothies: '🥛',
  supplements: '💊',
  bubbles: '🧋',
  yogurt: '🍦',
  proteins: '💪',
};

const Menu: React.FC = () => {
  const { t, dir, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: t('allProducts') },
    { key: 'juices', label: t('freshJuices') },
    { key: 'smoothies', label: t('smoothies') },
    { key: 'yogurt', label: t('yogurt') },
    { key: 'bubbles', label: t('bubbleTea') },
    { key: 'supplements', label: t('supplements') },
    { key: 'proteins', label: t('proteins') },
  ];

  const categoryKeys = categories.filter(c => c.key !== 'all').map(c => c.key);

  const getFilteredProducts = (category: Category) => {
    let filtered = category === 'all'
      ? products
      : products.filter(p => p.category === category);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const name = getProductName(p, language);
        const desc = getProductDescription(p, language);
        return name.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
      });
    }
    return filtered;
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const renderCategorySection = (categoryKey: Category, categoryLabel: string) => {
    const categoryProducts = getFilteredProducts(categoryKey);
    if (categoryProducts.length === 0) return null;

    return (
      <div key={categoryKey} className="mb-4">
        <h3 className="text-xs font-semibold text-foreground mb-1.5 px-1">{categoryLabel}</h3>
        <div
          className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categoryProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="cursor-pointer snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const currentProducts = useMemo(
    () => getFilteredProducts(activeCategory),
    [activeCategory, searchQuery, language]
  );

  return (
    <section id="menu" className="pt-4 pb-6 bg-surface-dim" dir={dir}>
      <div className="px-4">
        {/* Section header */}
        <div className="text-center mb-3">
          <h2 className="text-base font-semibold text-primary mb-0.5">
            {t('menu')}
          </h2>
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Category circular icons — horizontal scroll */}
        <div className="flex gap-3 mb-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {categories.map(category => (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none"
            >
              <div
                className={`w-[46px] h-[46px] rounded-full flex items-center justify-center text-xl transition-all duration-200 ${
                  activeCategory === category.key
                    ? 'bg-primary shadow-elevation-2'
                    : 'bg-surface-container-high'
                }`}
              >
                {categoryIcons[category.key]}
              </div>
              <span
                className={`text-[9px] font-medium text-center leading-tight max-w-[46px] transition-colors duration-200 ${
                  activeCategory === category.key
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {category.label}
              </span>
            </button>
          ))}
        </div>

        {/* Search bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Products — vertical list for all views */}
        {activeCategory === 'all' ? (
          <div>
            {categoryKeys.map(categoryKey => {
              const category = categories.find(c => c.key === categoryKey);
              return renderCategorySection(categoryKey, category?.label || '');
            })}
          </div>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x snap-mandatory flex-wrap"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {currentProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="cursor-pointer snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {currentProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center">
              <SearchX className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm font-medium">{t('noProducts')}</p>
            <p className="text-xs opacity-60">Try a different search</p>
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default Menu;
