export interface Product {
  id: string;
  nameAr: string;
  nameHe: string;
  nameEn: string;
  descriptionAr: string;
  descriptionHe: string;
  descriptionEn: string;
  category: 'juices' | 'smoothies' | 'supplements' | 'bubbles' | 'yogurt' | 'proteins';
  priceSmall: number;
  priceLarge: number;
  image?: string;
  isPopular?: boolean;
}

// Import product images
import beetrootJuice from '@/assets/products/beetroot-juice.jpg';
import carrotOrangeJuice from '@/assets/products/carrot-orange-juice.jpg';
import turmericGingerJuice from '@/assets/products/turmeric-ginger-juice.jpg';
import orangeGingerJuice from '@/assets/products/orange-ginger-juice.jpg';
import greenAppleLimeGinger from '@/assets/products/green-apple-lime-ginger.jpg';
import relaxCocktail from '@/assets/products/relax-cocktail.jpg';
import berryCocktail from '@/assets/products/berry-cocktail.jpg';
import freshCocktail from '@/assets/products/fresh-cocktail.jpg';
import doubleFreshCocktail from '@/assets/products/double-fresh-cocktail.jpg';
import tropicalCocktail from '@/assets/products/tropical-cocktail.jpg';
import greenDrinkCocktail from '@/assets/products/green-drink-cocktail.jpg';
import acaiCocktail from '@/assets/products/acai-cocktail.jpg';
import vanillaYogurt from '@/assets/products/vanilla-yogurt.jpg';
import berryYogurt from '@/assets/products/berry-yogurt.jpg';
import berryBubbles from '@/assets/products/berry-bubbles.jpg';
import blueberryBubbles from '@/assets/products/blueberry-bubbles.jpg';
import mangoBubbles from '@/assets/products/mango-bubbles.jpg';
import vitaminC from '@/assets/products/vitamin-c.jpg';
import proteinPowder from '@/assets/products/protein-powder.jpg';
import omega3 from '@/assets/products/omega-3.jpg';
import wheyProteinVanilla from '@/assets/products/whey-protein-vanilla.jpg';
import wheyProteinChocolate from '@/assets/products/whey-protein-chocolate.jpg';
import wheyIsolate from '@/assets/products/whey-isolate.jpg';
import massGainer from '@/assets/products/mass-gainer.jpg';
import bcaa from '@/assets/products/bcaa.jpg';

export const products: Product[] = [
  // Fresh Juices
  {
    id: 'beetroot-juice',
    nameAr: 'عصير شمندر',
    nameHe: 'מיץ סלק',
    nameEn: 'Beetroot Juice',
    descriptionAr: 'عصير شمندر طازج مليء بالفيتامينات',
    descriptionHe: 'מיץ סלק טרי עשיר בויטמינים',
    descriptionEn: 'Fresh beetroot juice packed with vitamins',
    category: 'juices',
    priceSmall: 18,
    priceLarge: 24,
    image: beetrootJuice,
    isPopular: true,
  },
  {
    id: 'carrot-orange-juice',
    nameAr: 'عصير جزر / برتقال',
    nameHe: 'מיץ גזר / תפוז',
    nameEn: 'Carrot / Orange Juice',
    descriptionAr: 'مزيج منعش من الجزر والبرتقال',
    descriptionHe: 'שילוב מרענן של גזר ותפוז',
    descriptionEn: 'Refreshing mix of carrot and orange',
    category: 'juices',
    priceSmall: 18,
    priceLarge: 24,
    image: carrotOrangeJuice,
    isPopular: true,
  },
  {
    id: 'turmeric-ginger-juice',
    nameAr: 'عصير كركم زنجبيل',
    nameHe: 'מיץ כורכום ג׳ינג׳ר',
    nameEn: 'Turmeric Ginger Juice',
    descriptionAr: 'عصير صحي مضاد للالتهابات',
    descriptionHe: 'מיץ בריא נוגד דלקות',
    descriptionEn: 'Healthy anti-inflammatory juice',
    category: 'juices',
    priceSmall: 20,
    priceLarge: 26,
    image: turmericGingerJuice,
  },
  {
    id: 'orange-ginger-juice',
    nameAr: 'عصير برتقال زنجبيل',
    nameHe: 'מיץ תפוז ג׳ינג׳ר',
    nameEn: 'Orange Ginger Juice',
    descriptionAr: 'برتقال طازج مع لمسة زنجبيل منعشة',
    descriptionHe: 'תפוז טרי עם נגיעת ג׳ינג׳ר מרעננת',
    descriptionEn: 'Fresh orange with refreshing ginger touch',
    category: 'juices',
    priceSmall: 18,
    priceLarge: 24,
    image: orangeGingerJuice,
  },
  {
    id: 'green-apple-lime-ginger',
    nameAr: 'عصير تفاح اخضر + لايم + زنجبيل',
    nameHe: 'מיץ תפוח ירוק + ליים + ג׳ינג׳ר',
    nameEn: 'Green Apple + Lime + Ginger Juice',
    descriptionAr: 'مزيج منعش ومنظف للجسم',
    descriptionHe: 'שילוב מרענן ומנקה לגוף',
    descriptionEn: 'Refreshing and detoxifying blend',
    category: 'juices',
    priceSmall: 20,
    priceLarge: 26,
    image: greenAppleLimeGinger,
    isPopular: true,
  },
  
  // Smoothies & Cocktails
  {
    id: 'relax-cocktail',
    nameAr: 'كوكتيل RELAX',
    nameHe: 'קוקטייל RELAX',
    nameEn: 'RELAX Cocktail',
    descriptionAr: 'أناناس - مانجو - موز - يوجورت مع عصير برتقال/تفاح',
    descriptionHe: 'אננס - מנגו - בננה - יוגורט עם מיץ תפוז/תפוח',
    descriptionEn: 'Pineapple - Mango - Banana - Yogurt with Orange/Apple juice',
    category: 'smoothies',
    priceSmall: 22,
    priceLarge: 28,
    image: relaxCocktail,
    isPopular: true,
  },
  {
    id: 'berry-cocktail',
    nameAr: 'كوكتيل توت بري',
    nameHe: 'קוקטייל פירות יער',
    nameEn: 'Wild Berry Cocktail',
    descriptionAr: 'كوكتيل من الفاكهة البرية مضاد للأكسدة',
    descriptionHe: 'קוקטייל פירות יער נוגד חמצון',
    descriptionEn: 'Antioxidant wild berry cocktail',
    category: 'smoothies',
    priceSmall: 24,
    priceLarge: 30,
    image: berryCocktail,
    isPopular: true,
  },
  {
    id: 'fresh-cocktail',
    nameAr: 'كوكتيل فريش',
    nameHe: 'קוקטייל פרש',
    nameEn: 'Fresh Cocktail',
    descriptionAr: 'أناناس - مانجو - موز - يوجورت - نعنع مع عصير برتقال',
    descriptionHe: 'אננס - מנגו - בננה - יוגורט - נענע עם מיץ תפוז',
    descriptionEn: 'Pineapple - Mango - Banana - Yogurt - Mint with Orange juice',
    category: 'smoothies',
    priceSmall: 22,
    priceLarge: 28,
    image: freshCocktail,
  },
  {
    id: 'double-fresh-cocktail',
    nameAr: 'كوكتيل دابل فريش',
    nameHe: 'קוקטייל דאבל פרש',
    nameEn: 'Double Fresh Cocktail',
    descriptionAr: 'أناناس - مانجو - موز - يوجورت - نعنع - باسيفلورة - تمر - تفاح اخضر مع عصير برتقال',
    descriptionHe: 'אננס - מנגו - בננה - יוגורט - נענע - פסיפלורה - תמר - תפוח ירוק עם מיץ תפוז',
    descriptionEn: 'Pineapple - Mango - Banana - Yogurt - Mint - Passionfruit - Date - Green Apple with Orange juice',
    category: 'smoothies',
    priceSmall: 26,
    priceLarge: 32,
    image: doubleFreshCocktail,
  },
  {
    id: 'tropical-cocktail',
    nameAr: 'كوكتيل Tropical',
    nameHe: 'קוקטייל טרופיקל',
    nameEn: 'Tropical Cocktail',
    descriptionAr: 'أناناس - مانجو - باسيفلورة مع عصير برتقال',
    descriptionHe: 'אננס - מנגו - פסיפלורה עם מיץ תפוז',
    descriptionEn: 'Pineapple - Mango - Passionfruit with Orange juice',
    category: 'smoothies',
    priceSmall: 22,
    priceLarge: 28,
    image: tropicalCocktail,
  },
  {
    id: 'green-drink-cocktail',
    nameAr: 'كوكتيل دربك خضرا',
    nameHe: 'קוקטייל ירוק',
    nameEn: 'Green Drink Cocktail',
    descriptionAr: 'أبو كادو - مانجو - موز - سبانخ - نعنع - يوجورت مع عصير برتقال',
    descriptionHe: 'אבוקדו - מנגו - בננה - תרד - נענע - יוגורט עם מיץ תפוז',
    descriptionEn: 'Avocado - Mango - Banana - Spinach - Mint - Yogurt with Orange juice',
    category: 'smoothies',
    priceSmall: 26,
    priceLarge: 32,
    image: greenDrinkCocktail,
    isPopular: true,
  },
  {
    id: 'acai-cocktail',
    nameAr: 'كوكتيل أساي',
    nameHe: 'קוקטייל אסאי',
    nameEn: 'Acai Cocktail',
    descriptionAr: 'أساي - مانجو - موز - بلوبيري - حليب لوز بدون سكر مع فواكه موسمية',
    descriptionHe: 'אסאי - מנגו - בננה - אוכמניות - חלב שקדים ללא סוכר עם פירות עונה',
    descriptionEn: 'Acai - Mango - Banana - Blueberry - Sugar-free almond milk with seasonal fruits',
    category: 'smoothies',
    priceSmall: 28,
    priceLarge: 35,
    image: acaiCocktail,
    isPopular: true,
  },
  
  // Yogurt
  {
    id: 'vanilla-yogurt',
    nameAr: 'يوجورت فانيل',
    nameHe: 'יוגורט וניל',
    nameEn: 'Vanilla Yogurt',
    descriptionAr: 'توت - كيوي - اناناس - جوز - جرانولا - عسل',
    descriptionHe: 'תות - קיווי - אננס - אגוז - גרנולה - דבש',
    descriptionEn: 'Strawberry - Kiwi - Pineapple - Walnut - Granola - Honey',
    category: 'yogurt',
    priceSmall: 24,
    priceLarge: 30,
    image: vanillaYogurt,
  },
  {
    id: 'berry-yogurt',
    nameAr: 'يوجورت توت',
    nameHe: 'יוגורט תות',
    nameEn: 'Berry Yogurt',
    descriptionAr: 'توت - كيوي - اناناس - جوز - جرانولا - عسل',
    descriptionHe: 'תות - קיווי - אננס - אגוז - גרנולה - דבש',
    descriptionEn: 'Berry - Kiwi - Pineapple - Walnut - Granola - Honey',
    category: 'yogurt',
    priceSmall: 24,
    priceLarge: 30,
    image: berryYogurt,
  },
  
  // Bubble Tea
  {
    id: 'berry-bubbles',
    nameAr: 'بابلز توت',
    nameHe: 'באבלס תות',
    nameEn: 'Berry Bubbles',
    descriptionAr: 'شاي بابل بنكهة التوت المنعش',
    descriptionHe: 'באבל טי בטעם תות מרענן',
    descriptionEn: 'Refreshing berry bubble tea',
    category: 'bubbles',
    priceSmall: 20,
    priceLarge: 26,
    image: berryBubbles,
  },
  {
    id: 'blueberry-bubbles',
    nameAr: 'بابلز بلو بيري',
    nameHe: 'באבלס אוכמניות',
    nameEn: 'Blueberry Bubbles',
    descriptionAr: 'شاي بابل بنكهة التوت الأزرق',
    descriptionHe: 'באבל טי בטעם אוכמניות',
    descriptionEn: 'Blueberry bubble tea',
    category: 'bubbles',
    priceSmall: 20,
    priceLarge: 26,
    image: blueberryBubbles,
  },
  {
    id: 'mango-bubbles',
    nameAr: 'بابلز مانجا',
    nameHe: 'באבלס מנגו',
    nameEn: 'Mango Bubbles',
    descriptionAr: 'شاي بابل بنكهة المانجو الاستوائية',
    descriptionHe: 'באבל טי בטעם מנגו טרופי',
    descriptionEn: 'Tropical mango bubble tea',
    category: 'bubbles',
    priceSmall: 20,
    priceLarge: 26,
    image: mangoBubbles,
    isPopular: true,
  },
  
  // Supplements
  {
    id: 'vitamin-c',
    nameAr: 'فيتامين C',
    nameHe: 'ויטמין C',
    nameEn: 'Vitamin C',
    descriptionAr: 'مكمل فيتامين C الطبيعي لتعزيز المناعة',
    descriptionHe: 'תוסף ויטמין C טבעי לחיזוק המערכת החיסונית',
    descriptionEn: 'Natural Vitamin C supplement for immune support',
    category: 'supplements',
    priceSmall: 45,
    priceLarge: 75,
    image: vitaminC,
  },
  {
    id: 'protein-powder',
    nameAr: 'بروتين طبيعي',
    nameHe: 'אבקת חלבון טבעית',
    nameEn: 'Natural Protein',
    descriptionAr: 'بروتين نباتي طبيعي 100%',
    descriptionHe: 'חלבון צמחי טבעי 100%',
    descriptionEn: '100% Natural plant protein',
    category: 'supplements',
    priceSmall: 89,
    priceLarge: 149,
    image: proteinPowder,
  },
  {
    id: 'omega-3',
    nameAr: 'أوميغا 3',
    nameHe: 'אומגה 3',
    nameEn: 'Omega 3',
    descriptionAr: 'أحماض دهنية أساسية لصحة القلب والدماغ',
    descriptionHe: 'חומצות שומן חיוניות לבריאות הלב והמוח',
    descriptionEn: 'Essential fatty acids for heart and brain health',
    category: 'supplements',
    priceSmall: 65,
    priceLarge: 110,
    image: omega3,
  },
  
  // Proteins
  {
    id: 'whey-protein-vanilla',
    nameAr: 'واي بروتين فانيلا',
    nameHe: 'וואי פרוטאין וניל',
    nameEn: 'Whey Protein Vanilla',
    descriptionAr: 'بروتين مصل اللبن بنكهة الفانيلا - 2 كغم',
    descriptionHe: 'חלבון מי גבינה בטעם וניל - 2 ק"ג',
    descriptionEn: 'Whey protein vanilla flavor - 2kg',
    category: 'proteins',
    priceSmall: 199,
    priceLarge: 349,
    image: wheyProteinVanilla,
    isPopular: true,
  },
  {
    id: 'whey-protein-chocolate',
    nameAr: 'واي بروتين شوكولاتة',
    nameHe: 'וואי פרוטאין שוקולד',
    nameEn: 'Whey Protein Chocolate',
    descriptionAr: 'بروتين مصل اللبن بنكهة الشوكولاتة - 2 كغم',
    descriptionHe: 'חלבון מי גבינה בטעם שוקולד - 2 ק"ג',
    descriptionEn: 'Whey protein chocolate flavor - 2kg',
    category: 'proteins',
    priceSmall: 199,
    priceLarge: 349,
    image: wheyProteinChocolate,
    isPopular: true,
  },
  {
    id: 'whey-isolate',
    nameAr: 'واي ايزوليت',
    nameHe: 'וואי איזולט',
    nameEn: 'Whey Isolate',
    descriptionAr: 'بروتين ايزوليت نقي 90% - 2 كغم',
    descriptionHe: 'חלבון איזולט טהור 90% - 2 ק"ג',
    descriptionEn: 'Pure isolate protein 90% - 2kg',
    category: 'proteins',
    priceSmall: 249,
    priceLarge: 449,
    image: wheyIsolate,
  },
  {
    id: 'mass-gainer',
    nameAr: 'ماس جينر',
    nameHe: 'מאס גיינר',
    nameEn: 'Mass Gainer',
    descriptionAr: 'مكمل لزيادة الكتلة العضلية - 3 كغم',
    descriptionHe: 'תוסף להגדלת מסת השריר - 3 ק"ג',
    descriptionEn: 'Mass building supplement - 3kg',
    category: 'proteins',
    priceSmall: 179,
    priceLarge: 299,
    image: massGainer,
  },
  {
    id: 'bcaa',
    nameAr: 'BCAA أحماض أمينية',
    nameHe: 'BCAA חומצות אמינו',
    nameEn: 'BCAA Amino Acids',
    descriptionAr: 'أحماض أمينية متفرعة السلسلة للتعافي العضلي',
    descriptionHe: 'חומצות אמינו מסועפות להתאוששות השריר',
    descriptionEn: 'Branched chain amino acids for muscle recovery',
    category: 'proteins',
    priceSmall: 129,
    priceLarge: 219,
    image: bcaa,
  },
];
