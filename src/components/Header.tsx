import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Menu as MenuIcon, Search, User, X, Store, Phone, ChevronLeft, ChevronRight, Globe, Palette } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useOpenCart } from '@/contexts/CartDrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import SearchCommand from './SearchCommand';
import { useTx } from '@/lib/i18n';
import logo from '@/assets/logo.png';

const Badge = ({ n }: { n: number }) =>
  n > 0 ? (
    <span className="absolute -top-[2px] -end-[2px] min-w-[18px] h-[18px] px-[4px] rounded-full bg-secondary text-secondary-foreground text-[12px] font-bold flex items-center justify-center animate-scale-in">
      {n > 9 ? '9+' : n}
    </span>
  ) : null;

const Header: React.FC = () => {
  const { dir } = useLanguage();
  const tx = useTx();
  const { totalItems } = useCart();
  const { ids } = useWishlist();
  const openCart = useOpenCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const menuItems = [
    { to: '/shop', icon: Store, label: tx({ ar: 'المتجر', he: 'חנות', en: 'Shop' }), match: (p: string) => p.startsWith('/shop') },
    { to: user ? '/profile' : '/auth', icon: User, label: user ? tx({ ar: 'حسابي', he: 'הפרופיל שלי', en: 'My profile' }) : tx({ ar: 'تسجيل الدخول', he: 'התחברות', en: 'Sign in' }), match: (p: string) => p === '/profile' || p === '/auth' },
    { to: '/wishlist', icon: Heart, label: tx({ ar: 'المفضلة', he: 'מועדפים', en: 'Wishlist' }), match: (p: string) => p === '/wishlist', badge: ids.length },
    { to: '/contact', icon: Phone, label: tx({ ar: 'تواصل معنا', he: 'צור קשר', en: 'Contact us' }), match: (p: string) => p === '/contact' },
  ];
  const [searchOpen, setSearchOpen] = useState(false);

  const links = [
    { to: '/shop', label: tx({ ar: 'المتجر', he: 'חנות', en: 'Shop' }) },
    { to: '/contact', label: tx({ ar: 'تواصل', he: 'צור קשר', en: 'Contact' }) },
  ];

  const iconBtn = 'relative w-[40px] h-[40px] rounded-full flex items-center justify-center text-foreground hover:bg-surface-container transition-colors';

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-outline-variant/50" dir={dir}>
      <div className="max-w-[1200px] mx-auto px-[16px] md:px-[24px] h-[64px] flex items-center gap-[12px]">
        <button className={`${iconBtn} md:hidden`} onClick={() => setMenuOpen(true)} aria-label="menu">
          <MenuIcon className="w-[20px] h-[20px]" />
        </button>

        <Link to="/" className="flex items-center gap-[8px] flex-shrink-0">
          <span className="font-display text-[22px] font-semibold text-primary">Natural</span>
        </Link>

        <nav className="hidden md:flex items-center gap-[4px] ms-[16px]">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="px-[12px] h-[36px] flex items-center whitespace-nowrap rounded-full text-[14px] font-semibold text-foreground/80 hover:text-primary hover:bg-surface-container transition-colors">
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
          <button className={iconBtn} onClick={openCart} aria-label="cart">
            <ShoppingBag className="w-[20px] h-[20px]" />
            <Badge key={totalItems} n={totalItems} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="lg:hidden px-[16px] pb-[12px] animate-fade-in">
          <SearchCommand autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-[300px] p-0 bg-background flex flex-col" dir={dir}>
          <div className="bg-primary text-primary-foreground px-[20px] pt-[28px] pb-[20px] flex items-center gap-[12px]">
            <img src={logo} alt="" className="w-[52px] h-[52px] rounded-full bg-background object-cover ring-[2px] ring-primary-foreground/60" />
            <div className="min-w-0">
              <p className="font-display text-[20px] font-semibold leading-tight">Natural</p>
              <p className="text-[12px] opacity-80 truncate">{user ? (user.email?.endsWith('.natural.local') ? tx({ ar: 'أهلاً بك', he: 'ברוכים הבאים', en: 'Welcome back' }) : user.email) : tx({ ar: 'مشروبات صحية ومكملات', he: 'משקאות בריאים ותוספים', en: 'Healthy drinks & supplements' })}</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-[12px] py-[12px] flex flex-col gap-[2px]">
            {menuItems.map((m) => {
              const active = m.match ? m.match(pathname) : false;
              return (
                <Link key={m.to} to={m.to} onClick={() => setMenuOpen(false)}
                  className={`h-[52px] px-[12px] flex items-center gap-[14px] rounded-[14px] text-[15px] font-semibold transition-colors ${active ? 'bg-primary/12 text-primary' : 'text-foreground hover:bg-surface-container'}`}>
                  <span className={`w-[36px] h-[36px] rounded-full flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : 'bg-surface-container text-primary'}`}>
                    <m.icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="flex-1">{m.label}</span>
                  {!!m.badge && <span className="min-w-[22px] h-[22px] px-[6px] rounded-full bg-primary text-primary-foreground text-[12px] font-bold flex items-center justify-center">{m.badge}</span>}
                  <Chevron className="w-[16px] h-[16px] text-muted-foreground" />
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-outline-variant/60 px-[20px] py-[16px] space-y-[14px] bg-surface-container-low">
            <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{tx({ ar: 'التفضيلات', he: 'העדפות', en: 'Preferences' })}</p>
            <div className="space-y-[6px]">
              <p className="flex items-center gap-[6px] text-[13px] font-semibold"><Globe className="w-[14px] h-[14px] text-primary" />{tx({ ar: 'اللغة', he: 'שפה', en: 'Language' })}</p>
              <LanguageSwitcher />
            </div>
            <div className="space-y-[6px]">
              <p className="flex items-center gap-[6px] text-[13px] font-semibold"><Palette className="w-[14px] h-[14px] text-primary" />{tx({ ar: 'المظهر', he: 'ערכת נושא', en: 'Theme' })}</p>
              <ThemeToggle withLabels />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Header;
