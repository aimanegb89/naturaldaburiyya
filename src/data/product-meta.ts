import type { Product } from './products';
import type { Tri } from '@/lib/i18n';

export type HealthGoal = 'energy' | 'immunity' | 'detox' | 'muscle' | 'relax';

export const HEALTH_GOALS: { key: HealthGoal; label: Tri; icon: string }[] = [
  { key: 'energy', icon: '⚡', label: { ar: 'طاقة', he: 'אנרגיה', en: 'Energy' } },
  { key: 'immunity', icon: '🛡️', label: { ar: 'مناعة', he: 'חסינות', en: 'Immunity' } },
  { key: 'detox', icon: '🌿', label: { ar: 'ديتوكس', he: 'ניקוי רעלים', en: 'Detox' } },
  { key: 'muscle', icon: '💪', label: { ar: 'عضلات', he: 'שריר', en: 'Muscle' } },
  { key: 'relax', icon: '🍃', label: { ar: 'استرخاء', he: 'רוגע', en: 'Relax' } },
];

export interface ProductMeta {
  goals: HealthGoal[];
  ingredients: Tri;
  usage: Tri;
  isNew?: boolean;
  popularity: number; // higher = sells more (placeholder until real sales data)
  addedOrder: number; // higher = newer
}

const usageByCategory: Record<Product['category'], Tri> = {
  juices: { ar: 'يُقدَّم باردًا ويُفضَّل شربه خلال ساعة من التحضير.', he: 'מוגש קר, מומלץ לשתות תוך שעה מההכנה.', en: 'Served chilled — best enjoyed within an hour of pressing.' },
  smoothies: { ar: 'رجّه جيدًا واستمتع به كوجبة خفيفة أو بعد التمرين.', he: 'נערו היטב ותיהנו כארוחה קלה או אחרי אימון.', en: 'Shake well and enjoy as a light meal or post-workout.' },
  bubbles: { ar: 'حرّك الكرات قبل الشرب لمذاق متوازن.', he: 'ערבבו את הבועות לפני השתייה.', en: 'Stir the pearls before sipping for the best balance.' },
  yogurt: { ar: 'يُقدَّم طازجًا وباردًا.', he: 'מוגש טרי וקר.', en: 'Served fresh and cold.' },
  supplements: { ar: 'حسب التعليمات على العبوة أو استشارة مختص.', he: 'לפי ההוראות על האריזה או בהתייעצות עם מומחה.', en: 'Follow the label directions or consult a professional.' },
  proteins: { ar: 'مغرفة واحدة مع 250 مل ماء أو حليب بعد التمرين.', he: 'סקופ אחד עם 250 מ״ל מים או חלב אחרי אימון.', en: 'One scoop with 250 ml water or milk after training.' },
};

const goalsByCategory: Record<Product['category'], HealthGoal[]> = {
  juices: ['detox', 'immunity'],
  smoothies: ['energy'],
  bubbles: ['energy'],
  yogurt: ['relax'],
  supplements: ['immunity'],
  proteins: ['muscle', 'energy'],
};

const overrides: Record<string, Partial<ProductMeta> & { ingredients?: Tri }> = {
  'beetroot-juice': { goals: ['energy', 'detox'], ingredients: { ar: 'شمندر طازج', he: 'סלק טרי', en: 'Fresh beetroot' } },
  'carrot-orange-juice': { goals: ['immunity'], ingredients: { ar: 'جزر، برتقال', he: 'גזר, תפוז', en: 'Carrot, orange' } },
  'turmeric-ginger-juice': { goals: ['immunity', 'detox'], ingredients: { ar: 'كركم، زنجبيل، ليمون', he: 'כורכום, ג׳ינג׳ר, לימון', en: 'Turmeric, ginger, lemon' }, isNew: true },
  'orange-ginger-juice': { goals: ['immunity', 'energy'], ingredients: { ar: 'برتقال، زنجبيل', he: 'תפוז, ג׳ינג׳ר', en: 'Orange, ginger' } },
  'green-apple-lime-ginger': { goals: ['detox'], ingredients: { ar: 'تفاح أخضر، ليمون أخضر، زنجبيل', he: 'תפוח ירוק, ליים, ג׳ינג׳ר', en: 'Green apple, lime, ginger' } },
  'relax-cocktail': { goals: ['relax'] },
  'green-drink-cocktail': { goals: ['detox', 'energy'], isNew: true },
  'acai-cocktail': { goals: ['energy', 'immunity'], isNew: true },
  'vitamin-c': { goals: ['immunity'], ingredients: { ar: 'فيتامين C', he: 'ויטמין C', en: 'Vitamin C' } },
  'omega-3': { goals: ['relax', 'immunity'], ingredients: { ar: 'زيت سمك أوميغا 3', he: 'שמן דגים אומגה 3', en: 'Omega-3 fish oil' } },
  'bcaa': { goals: ['muscle'], isNew: true },
  'whey-isolate': { goals: ['muscle'] },
  'mass-gainer': { goals: ['muscle'] },
};

export function getProductMeta(p: Product, index: number): ProductMeta {
  const o = overrides[p.id] ?? {};
  return {
    goals: o.goals ?? goalsByCategory[p.category],
    ingredients: o.ingredients ?? { ar: p.descriptionAr, he: p.descriptionHe, en: p.descriptionEn },
    usage: usageByCategory[p.category],
    isNew: o.isNew ?? false,
    popularity: (p.isPopular ? 100 : 0) + (30 - index),
    addedOrder: o.isNew ? 1000 + index : index,
  };
}
