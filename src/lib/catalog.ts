import { products, type Product } from '@/data/products';
import { getProductMeta, type ProductMeta } from '@/data/product-meta';
import smoothieOrange from '@/assets/smoothie-orange.jpg';
import smoothieGreen from '@/assets/smoothie-green.jpg';
import smoothieBerry from '@/assets/smoothie-berry.jpg';
import { NO_SIZE_CATEGORIES } from '@/lib/constants';
import type { Language } from '@/contexts/LanguageContext';

export type CatalogProduct = Product & { meta: ProductMeta; img: string; gallery: string[] };

const fallback: Record<string, string> = {
  juices: smoothieOrange, smoothies: smoothieGreen, supplements: smoothieBerry,
  bubbles: smoothieOrange, yogurt: smoothieBerry, proteins: smoothieBerry,
};
const lifestyle = [smoothieGreen, smoothieOrange, smoothieBerry];

export const catalog: CatalogProduct[] = products.map((p, i) => {
  const img = p.image || fallback[p.category] || smoothieOrange;
  const extra = lifestyle.filter((l) => l !== img).slice(0, 2);
  return { ...p, meta: getProductMeta(p, i), img, gallery: [img, ...extra] };
});

export const getCatalogProduct = (id: string) => catalog.find((p) => p.id === id);

export const hasSizes = (p: Product) =>
  !NO_SIZE_CATEGORIES.includes(p.category as (typeof NO_SIZE_CATEGORIES)[number]);

export function searchCatalog(query: string, lang: Language) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return catalog.filter((p) => {
    const hay = [p.nameAr, p.nameHe, p.nameEn, p.descriptionAr, p.descriptionHe, p.descriptionEn,
      p.meta.ingredients.ar, p.meta.ingredients.he, p.meta.ingredients.en, p.category, ...p.meta.goals]
      .join(' ').toLowerCase();
    return hay.includes(q);
  });
}

export const FREE_DELIVERY_THRESHOLD = 100;
