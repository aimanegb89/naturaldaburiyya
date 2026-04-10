import type { Product } from '@/data/products';

type Language = 'ar' | 'he' | 'en';

export function getProductName(product: Product, language: Language): string {
  switch (language) {
    case 'ar': return product.nameAr;
    case 'he': return product.nameHe;
    default: return product.nameEn;
  }
}

export function getProductDescription(product: Product, language: Language): string {
  switch (language) {
    case 'ar': return product.descriptionAr;
    case 'he': return product.descriptionHe;
    default: return product.descriptionEn;
  }
}
