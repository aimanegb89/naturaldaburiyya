import React, { useState, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { products, Product } from '@/data/products';
import { getProductName, getProductDescription } from '@/lib/product-utils';
import ProductCard from './ProductCard';
import SearchBar from './SearchBar';
import ProductDetailModal from './ProductDetailModal';

type Category = 'all' | 'juices' | 'smoothies' | 'supplements' | 'bubbles' | 'yogurt' | 'proteins';

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

  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const renderCategorySection = (categoryKey: Category, categoryLabel: string) => {
    const categoryProducts = getFilteredProducts(categoryKey);
    if (categoryProducts.length === 0) return null;

    return (
      <div key={categoryKey} className="mb-6">
        <h3 className="text-base font-semibold text-foreground mb-3 px-1">{categoryLabel}</h3>
        <div className="relative">
          <div 
            ref={el => scrollRefs.current[categoryKey] = el}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categoryProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="cursor-pointer flex-shrink-0 w-[160px] snap-start"
              >
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const currentProducts = useMemo(
    () => getFilteredProducts(activeCategory),
    [activeCategory, searchQuery, language]
  );

  return (
    <section id="menu" className="py-8 bg-surface-dim" dir={dir}>
      <div className="px-4">
        {/* Section header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-primary mb-1.5">
            {t('menu')}
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-5">
          {categories.map(category => (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeCategory === category.key
                  ? 'bg-primary text-primary-foreground shadow-elevation-1'
                  : 'bg-surface-container text-foreground border border-outline-variant'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Products display */}
        {activeCategory === 'all' ? (
          <div className="space-y-2">
            {categoryKeys.map(categoryKey => {
              const category = categories.find(c => c.key === categoryKey);
              return renderCategorySection(categoryKey, category?.label || '');
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {currentProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="cursor-pointer"
              >
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        )}

        {currentProducts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">{t('noProducts')}</p>
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
