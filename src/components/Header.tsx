import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Menu as MenuIcon, Search, User, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import SearchCommand from './SearchCommand';
import { useTx } from '@/lib/i18n';
import logo from '@/assets/logo.png';

const Badge = ({ n }: { n: number }) =>
  n > 0 ? (
    <span className="absolute -top-[2px] -end-[2px] min-w-[18px] h-[18px] px-[4px] rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center animate-scale-in">
      {n > 9 ? '9+' : n}
    </span>
  ) : null;

const Header: React.FC = () => {
  const { dir } = useLanguage();
  const tx = useTx();
  const { totalItems } = useCart();
  const { ids } = useWishlist();
  const { setOpen } = useCartDrawer();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const links = [
    { to: '/shop', label: tx({ ar: 'المتجر', he: 'חנות', en: 'Shop' }) },
    { to: '/#about', label: tx({ ar: 'من نحن', he: 'אודות', en: 'About' }) },
    { to: '/#benefits', label: tx({ ar: 'الفوائد', he: 'יתרונות', en: 'Benefits' }) },
    { to: '/#contact', label: tx({ ar: 'تواصل', he: 'צור קשר', en: 'Contact' }) },
  ];

  const iconBtn = 'relative w-[40px] h-[40px] rounded-full flex items-center justify-center text-foreground hover:bg-surface-container transition-colors';

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-outline-variant/50" dir={dir}>
      <div className="max-w-[1200px] mx-auto px-[16px] md:px-[24px] h-[64px] flex items-center gap-[12px]">
        <button className={`${iconBtn} md:hidden`} onClick={() => setMenuOpen(true)} aria-label="menu">
          <MenuIcon className="w-[20px] h-[20px]" />
        </button>

        <Link to="/" className="flex items-center gap-[8px] flex-shrink-0">
          <img src={logo} alt="Natural" className="w-[40px] h-[40px] rounded-full object-cover" />
          <span className="font-display text-[20px] font-semibold text-primary hidden sm:block">Natural</span>
        </Link>

        <nav className="hidden md:flex items-center gap-[4px] ms-[16px]">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="px-[12px] h-[36px] flex items-center rounded-full text-[14px] font-semibold text-foreground/80 hover:text-primary hover:bg-surface-container transition-colors">
              {l.label}
            </NavLink>
          ))}
        </nav>

        <SearchCommand className="hidden lg:block flex-1 max-w-[380px] ms-auto" />

        <div className="flex items-center gap-[2px] ms-auto lg:ms-[8px]">
          <button className={`${iconBtn} lg:hidden`} onClick={() => setSearchOpen((v) => !v)} aria-label="search">
            {searchOpen ? <X className="w-[20px] h-[20px]" /> : <Search className="w-[20px] h-[20px]" />}
          </button>
          <div className="hidden md:block me-[4px]"><ThemeToggle /></div>
          <div className="hidden sm:block me-[4px]"><LanguageSwitcher /></div>
          <button className={iconBtn} onClick={() => navigate('/wishlist')} aria-label="wishlist">
            <Heart className="w-[20px] h-[20px]" />
            <Badge n={ids.length} />
          </button>
          <button className={`${iconBtn} hidden md:flex`} onClick={() => navigate(user ? '/profile' : '/auth')} aria-label="account">
            <User className="w-[20px] h-[20px]" />
          </button>
          <button className={iconBtn} onClick={() => setOpen(true)} aria-label="cart">
            <ShoppingBag className="w-[20px] h-[20px]" />
            <Badge n={totalItems} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="lg:hidden px-[16px] pb-[12px] animate-fade-in">
          <SearchCommand autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-[280px] bg-background" dir={dir}>
          <div className="flex items-center gap-[10px] mb-[24px] pe-[44px] min-h-[44px]">
            <img src={logo} alt="" className="w-[44px] h-[44px] rounded-full" />
            <span className="font-display text-[20px] text-primary font-semibold">Natural</span>
          </div>
          <nav className="flex flex-col gap-[4px]">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="h-[48px] px-[12px] flex items-center rounded-[12px] text-[16px] font-semibold hover:bg-surface-container">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-[24px]"><LanguageSwitcher /></div>
          <div className="mt-[12px]"><ThemeToggle withLabels /></div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Header;
