import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import AppShell from '@/components/AppShell';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/contexts/WishlistContext';
import { catalog } from '@/lib/catalog';
import { useTx } from '@/lib/i18n';

const Wishlist = () => {
  const { ids } = useWishlist();
  const tx = useTx();
  const list = catalog.filter((p) => ids.includes(p.id));
  return (
    <AppShell>
      <div className="max-w-[1200px] mx-auto px-[16px] md:px-[24px] py-[24px] md:py-[40px] min-h-[50vh]">
        <h1 className="font-display text-[30px] md:text-[40px] mb-[20px]">{tx({ ar: 'المفضلة', he: 'מועדפים', en: 'Wishlist' })}</h1>
        {list.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] md:gap-[20px]">
            {list.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-[64px]">
            <div className="w-[72px] h-[72px] rounded-full bg-surface-container flex items-center justify-center mb-[16px]"><Heart className="w-[30px] h-[30px] text-secondary" /></div>
            <p className="text-[16px] font-semibold mb-[16px]">{tx({ ar: 'لم تضف أي منتج بعد', he: 'עוד לא הוספתם מוצרים', en: 'Nothing saved yet' })}</p>
            <Link to="/shop" className="h-[46px] px-[24px] rounded-full bg-primary text-primary-foreground font-bold flex items-center">{tx({ ar: 'تسوق الآن', he: 'לקנייה', en: 'Shop Now' })}</Link>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Wishlist;
