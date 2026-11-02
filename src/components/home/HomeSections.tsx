import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, FlaskConicalOff, Truck, ShieldCheck, ArrowLeft, ArrowRight, Clock, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { catalog, type CatalogProduct } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import ShimmerImage from '@/components/ShimmerImage';
import { useTx, type Tri } from '@/lib/i18n';
import { products } from '@/data/products';

const SectionTitle = ({ eyebrow, title, link }: { eyebrow?: string; title: string; link?: { to: string; label: string } }) => {
  const { dir } = useLanguage();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  return (
    <div className="flex items-end justify-between gap-[12px] mb-[14px]">
      <div>
        {eyebrow && <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-secondary mb-[6px]">{eyebrow}</p>}
        <h2 className="font-display text-[26px] md:text-[34px] text-foreground leading-tight">{title}</h2>
      </div>
      {link && (
        <Link to={link.to} className="flex items-center gap-[4px] text-[14px] font-bold text-primary hover:underline whitespace-nowrap">
          {link.label} <Arrow className="w-[16px] h-[16px]" />
        </Link>
      )}
    </div>
  );
};

const wrap = 'max-w-[1200px] mx-auto px-[16px] md:px-[24px]';

const CATS: { key: string; label: Tri; icon: string; img?: string }[] = [
  { key: 'juices', icon: '🍊', label: { ar: 'عصائر طازجة', he: 'מיצים טריים', en: 'Fresh juices' } },
  { key: 'smoothies', icon: '🥤', label: { ar: 'سموذي وكوكتيل', he: 'שייקים', en: 'Smoothies' } },
  { key: 'bubbles', icon: '🧋', label: { ar: 'بابلز', he: 'באבלס', en: 'Bubble tea' } },
  { key: 'yogurt', icon: '🍦', label: { ar: 'يوجورت', he: 'יוגורט', en: 'Yogurt' } },
  { key: 'supplements', icon: '💊', label: { ar: 'مكملات', he: 'תוספים', en: 'Supplements' } },
  { key: 'proteins', icon: '💪', label: { ar: 'بروتينات', he: 'חלבונים', en: 'Proteins' } },
];

export const CategoryGrid = () => {
  const tx = useTx();
  return (
    <section className={`${wrap} pt-[48px]`}>
      <SectionTitle title={tx({ ar: 'اختر ما يناسبك', he: 'בחרו מה מתאים לכם', en: 'Shop by category' })} />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-[12px]">
        {CATS.map((c) => {
          const img = products.find((p) => p.category === c.key && p.image)?.image;
          return (
            <Link key={c.key} to={`/shop?category=${c.key}`} className="group flex flex-col items-center gap-[8px]">
              <div className="relative w-full aspect-square rounded-[22px] overflow-hidden bg-surface-container shadow-soft">
                {img && <ShimmerImage src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" wrapperClassName="w-full h-full" />}
                <span className="absolute bottom-[6px] end-[6px] w-[30px] h-[30px] rounded-full bg-surface-container-lowest/90 flex items-center justify-center text-[15px] shadow-soft">{c.icon}</span>
              </div>
              <span className="text-[13px] font-bold text-foreground text-center group-hover:text-primary transition-colors">{tx(c.label)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export const BestSellers = () => {
  const tx = useTx();
  const [quick, setQuick] = useState<CatalogProduct | null>(null);
  const list = [...catalog].sort((a, b) => b.meta.popularity - a.meta.popularity).slice(0, 8);
  return (
    <section className={`${wrap} pt-[56px]`}>
      <SectionTitle
        eyebrow={tx({ ar: 'الأكثر مبيعًا', he: 'רבי מכר', en: 'Best sellers' })}
        title={tx({ ar: 'المفضّلة لدى زبائننا', he: 'האהובים על הלקוחות', en: 'Customer favourites' })}
        link={{ to: '/shop?sort=best', label: tx({ ar: 'عرض الكل', he: 'הכל', en: 'View all' }) }}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] md:gap-[20px]">
        {list.map((p) => <ProductCard key={p.id} product={p} onQuickView={setQuick} />)}
      </div>
      <ProductDetailModal product={quick} isOpen={!!quick} onClose={() => setQuick(null)} />
    </section>
  );
};

export const TrustStrip = () => {
  const tx = useTx();
  const items = [
    { icon: Leaf, t: { ar: '100% طبيعي', he: '100% טבעי', en: '100% Natural' }, d: { ar: 'فواكه وخضار طازجة يوميًا', he: 'פירות וירקות טריים מדי יום', en: 'Fresh fruit & veg, every day' } },
    { icon: FlaskConicalOff, t: { ar: 'بدون كيماويات', he: 'ללא כימיקלים', en: 'Chemical-free' }, d: { ar: 'لا سكر مضاف ولا مواد حافظة', he: 'ללא סוכר מוסף וחומרים משמרים', en: 'No added sugar or preservatives' } },
    { icon: Truck, t: { ar: 'توصيل محلي سريع', he: 'משלוח מקומי מהיר', en: 'Fast local delivery' }, d: { ar: 'دبورية والمنطقة', he: 'דבוריה והסביבה', en: 'Daburiyya & surroundings' } },
    { icon: ShieldCheck, t: { ar: 'طلب آمن', he: 'הזמנה בטוחה', en: 'Secure ordering' }, d: { ar: 'تأكيد عبر واتساب والدفع عند الاستلام', he: 'אישור בוואטסאפ ותשלום במסירה', en: 'WhatsApp confirmation, pay on delivery' } },
  ];
  return (
    <section id="benefits" className={`${wrap} pt-[56px] scroll-mt-[80px]`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[12px] md:gap-[16px] bg-primary text-primary-foreground rounded-[28px] p-[20px] md:p-[32px]">
        {items.map(({ icon: Icon, t, d }) => (
          <div key={t.en} className="flex flex-col md:flex-row items-start gap-[10px] md:gap-[14px]">
            <div className="w-[44px] h-[44px] rounded-[14px] bg-primary-foreground/12 flex items-center justify-center flex-shrink-0">
              <Icon className="w-[22px] h-[22px] text-gold" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold">{tx(t)}</h3>
              <p className="text-[12px] text-primary-foreground/75 leading-relaxed">{tx(d)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const AboutSection = () => {
  const tx = useTx();
  const img = products.find((p) => p.id === 'green-drink-cocktail')?.image;
  return (
    <section id="about" className={`${wrap} py-[56px] scroll-mt-[80px]`}>
      <div className="grid md:grid-cols-2 gap-[24px] md:gap-[48px] items-center">
        <div className="rounded-[28px] overflow-hidden aspect-[4/3] bg-surface-container shadow-soft">
          {img && <ShimmerImage src={img} alt="" className="w-full h-full object-cover" wrapperClassName="w-full h-full" />}
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-secondary mb-[8px]">{tx({ ar: 'قصتنا', he: 'הסיפור שלנו', en: 'Our story' })}</p>
          <h2 className="font-display text-[26px] md:text-[34px] leading-tight mb-[14px]">{tx({ ar: 'طازج من الطبيعة، كل يوم', he: 'טרי מהטבע, כל יום', en: 'Fresh from nature, every day' })}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-[20px]">
            {tx({
              ar: 'في Natural نختار أجود الفواكه والخضروات ونحضّر كل كوب عند الطلب، لنقدّم لك مشروبات صحية ولذيذة ومكملات طبيعية تدعم نمط حياتك.',
              he: 'ב-Natural אנחנו בוחרים את הפירות והירקות הטובים ביותר ומכינים כל כוס לפי הזמנה — משקאות בריאים, טעימים ותוספים טבעיים לאורח חיים בריא.',
              en: 'At Natural we hand-pick the finest fruit and vegetables and prepare every cup to order — healthy, delicious drinks and natural supplements for your lifestyle.',
            })}
          </p>
          <div className="flex flex-col gap-[10px] text-[14px]">
            <span className="flex items-center gap-[10px]"><MapPin className="w-[18px] h-[18px] text-primary" />{tx({ ar: 'شارع السعدية، دبورية', he: 'רחוב א-סעדיה, דבוריה', en: 'Al-Saadiya St, Daburiyya' })}</span>
            <span className="flex items-center gap-[10px]"><Clock className="w-[18px] h-[18px] text-primary" />{tx({ ar: 'يوميًا 17:00 – 00:00', he: 'כל יום 17:00 – 00:00', en: 'Daily 17:00 – 00:00' })}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
