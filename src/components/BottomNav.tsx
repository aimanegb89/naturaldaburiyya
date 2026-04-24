import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Home, UtensilsCrossed, ShoppingCart, User } from 'lucide-react';

interface BottomNavProps {
  onCartClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onCartClick }) => {
  const { t, dir } = useLanguage();
  const { totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';

  const handleHomeClick = () => {
    if (!isHome) {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMenuClick = () => {
    if (!isHome) {
      navigate('/');
      setTimeout(() => {
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleProfileClick = () => {
    navigate(user ? '/profile' : '/auth');
  };

  const items = [
    { key: 'home', icon: Home, label: t('home'), active: isHome && location.hash !== '#menu', onClick: handleHomeClick },
    { key: 'menu', icon: UtensilsCrossed, label: t('menu'), active: isHome && location.hash === '#menu', onClick: handleMenuClick },
    { key: 'cart', icon: ShoppingCart, label: t('cart'), active: false, onClick: onCartClick, badge: totalItems },
    { key: 'profile', icon: User, label: t('profile'), active: location.pathname === '/profile' || location.pathname === '/auth', onClick: handleProfileClick },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container/95 backdrop-blur-md border-t border-outline-variant/30 rounded-t-2xl shadow-elevation-3"
      dir={dir}
    >
      <div className="flex items-center justify-around h-[60px] px-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className="flex flex-col items-center justify-center flex-1 min-w-0 h-full focus:outline-none"
            >
              {/* Pill + icon + badge, all in one sized container */}
              <div className="relative flex items-center justify-center w-14 h-7">
                {/* Active pill perfectly covers this container */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-300 ${
                    item.active ? 'bg-primary/15' : 'bg-transparent'
                  }`}
                />
                <Icon
                  className={`w-[20px] h-[20px] relative z-10 transition-colors duration-200 ${
                    item.active ? 'text-primary' : 'text-foreground/60'
                  }`}
                />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute top-0 right-2 min-w-[15px] h-[15px] bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-bold px-[2px] z-20 shadow-elevation-1">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[9px] leading-none mt-[2px] transition-colors duration-200 ${
                  item.active ? 'text-primary font-semibold' : 'text-foreground/60 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
