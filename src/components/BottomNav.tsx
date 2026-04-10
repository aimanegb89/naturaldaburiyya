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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container shadow-elevation-2" dir={dir}>
      <div className="flex items-center justify-around h-[56px] px-[4px]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className="flex flex-col items-center justify-center gap-[2px] flex-1 min-w-0 py-[6px] group relative focus:outline-none"
            >
              {/* Active indicator pill */}
              <div
                className={`absolute top-[6px] w-[56px] h-[28px] rounded-full transition-all duration-200 ${
                  item.active ? 'bg-secondary scale-100 opacity-100' : 'scale-75 opacity-0'
                }`}
              />
              <div className="relative z-10 flex items-center justify-center w-[22px] h-[22px]">
                <Icon
                  className={`w-[22px] h-[22px] transition-colors duration-200 ${
                    item.active ? 'text-secondary-foreground' : 'text-foreground/70'
                  }`}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-[4px] -right-[8px] min-w-[16px] h-[16px] bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-medium px-[2px] shadow-elevation-1">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors duration-200 relative z-10 ${
                  item.active ? 'text-foreground' : 'text-foreground/70'
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
