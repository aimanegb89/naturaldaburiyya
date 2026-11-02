import { products, type Product } from '@/data/products';
import { getProductMeta, type ProductMeta } from '@/data/product-meta';
import smoothieOrange from '@/assets/smoothie-orange.jpg';
import smoothieGreen from '@/assets/smoothie-green.jpg';
import smoothieBerry from '@/assets/smoothie-berry.jpg';
import { NO_SIZE_CATEGORIES } from '@/lib/constants';
import { useSyncExternalStore } from 'react';
import type { Language } from '@/contexts/LanguageContext';

export type CatalogProduct = Product & { meta: ProductMeta; img: string; gallery: string[] };

const fallback: Record<string, string> = {
  juices: smoothieOrange, smoothies: smoothieGreen, supplements: smoothieBerry,
  bubbles: smoothieOrange, yogurt: smoothieBerry, proteins: smoothieBerry,
};
const lifestyle = [smoothieGreen, smoothieOrange, smoothieBerry];

const toCatalog = (p: Product, i: number): CatalogProduct => {
  const img = p.image || fallback[p.category] || smoothieOrange;
  const extra = lifestyle.filter((l) => l !== img).slice(0, 2);
  return { ...p, meta: getProductMeta(p, i), img, gallery: [img, ...extra] };
};

/** Live catalog: starts from the built-in list, replaced in place by database products on load. */
export const catalog: CatalogProduct[] = products.map(toCatalog);

const staticImages = Object.fromEntries(products.map((p) => [p.id, p.image]));

export type DbProduct = {
  id: string; name_ar: string; name_he: string; name_en: string;
  description_ar: string; description_he: string; description_en: string;
  category: string; price_small: number; price_large: number; image_url: string | null;
  is_popular: boolean; is_available: boolean; sort_order: number;
};

export function dbToProduct(r: DbProduct): Product {
  return {
    id: r.id, nameAr: r.name_ar, nameHe: r.name_he, nameEn: r.name_en,
    descriptionAr: r.description_ar, descriptionHe: r.description_he, descriptionEn: r.description_en,
    category: r.category as Product['category'], priceSmall: Number(r.price_small), priceLarge: Number(r.price_large),
    image: r.image_url || staticImages[r.id], isPopular: r.is_popular, isAvailable: r.is_available,
  };
}

// Small external store so consumers re-render on catalog changes without remounting the tree.
let version = 0;
let loaded = false;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export function replaceCatalog(rows: DbProduct[]) {
  const next = rows.map((r, i) => toCatalog(dbToProduct(r), i));
  catalog.splice(0, catalog.length, ...next);
  loaded = true;
  version++;
  listeners.forEach((l) => l());
}

export function markCatalogLoaded() {
  if (loaded) return;
  loaded = true; version++;
  listeners.forEach((l) => l());
}

/** Subscribe to the live catalog. Returns the version (use as memo dep) and loaded flag. */
export function useCatalog() {
  const v = useSyncExternalStore(subscribe, () => version);
  return { catalog, version: v, loaded };
}

/** Unit price for a size: large uses priceLarge only when it is set (> 0). */
export function unitPrice(p: Pick<Product, 'priceSmall' | 'priceLarge'>, size: 'small' | 'large') {
  return size === 'large' && Number(p.priceLarge) > 0 ? Number(p.priceLarge) : Number(p.priceSmall);
}

export const isAvailable = (p: Product) => p.isAvailable !== false;

export const getCatalogProduct = (id: string) => catalog.find((p) => p.id === id);

export const hasSizes = (p: Product) =>
  !NO_SIZE_CATEGORIES.includes(p.category as (typeof NO_SIZE_CATEGORIES)[number]) && Number(p.priceLarge) > 0;

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

/** Order line name in the current language, falling back to the stored name. */
export function orderItemName(productId: string | null | undefined, fallback: string, lang: Language) {
  const p = productId ? getCatalogProduct(productId) : undefined;
  if (!p) return fallback;
  return (lang === 'ar' ? p.nameAr : lang === 'he' ? p.nameHe : p.nameEn) || p.nameAr || fallback;
}
