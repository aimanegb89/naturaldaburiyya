import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { Home, Store, ShoppingBag, ClipboardList } from 'lucide-react';
import { useTx } from '@/lib/i18n';

const BottomNav: React.FC = () => {
  const { t, dir } = useLanguage();
  const tx = useTx();
  const { totalItems } = useCart();
  const { setOpen } = useCartDrawer();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = [
    { key: 'home', icon: Home, label: t('home'), active: pathname === '/', onClick: () => navigate('/') },
    { key: 'shop', icon: Store, label: tx({ ar: 'المتجر', he: 'חנות', en: 'Shop' }), active: pathname.startsWith('/shop') || pathname.startsWith('/product'), onClick: () => navigate('/shop') },
    { key: 'orders', icon: ClipboardList, label: tx({ ar: 'طلباتي', he: 'ההזמנות שלי', en: 'My orders' }), active: pathname === '/orders' || pathname.startsWith('/track'), onClick: () => navigate('/orders') },
    { key: 'cart', icon: ShoppingBag, label: t('cart'), active: false, onClick: () => setOpen(true), badge: totalItems },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/50 shadow-lift" dir={dir}>
      <div className="flex items-center justify-around h-[64px] px-[4px]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={item.onClick} className="flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-[4px]">
              <div className="relative flex items-center justify-center w-[56px] h-[30px]">
                <div className={`absolute inset-0 rounded-full transition-all duration-300 ${item.active ? 'bg-primary/15 scale-100' : 'scale-75 opacity-0'}`} />
                <Icon className={`w-[21px] h-[21px] relative z-10 ${item.active ? 'text-primary' : 'text-foreground/60'}`} />
                {!!item.badge && (
                  <span key={item.badge} className="absolute top-0 end-[4px] min-w-[18px] h-[18px] bg-secondary text-secondary-foreground rounded-full text-[12px] flex items-center justify-center font-bold px-[4px] z-20 animate-scale-in">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] leading-none ${item.active ? 'text-primary font-bold' : 'text-foreground/60 font-medium'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
