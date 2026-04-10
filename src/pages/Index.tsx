import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Menu from '@/components/Menu';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import BottomNav from '@/components/BottomNav';

const Index: React.FC = () => {
  const { dir } = useLanguage();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-16" dir={dir}>
      <Navbar />
      <Hero />
      <Menu />
      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <ScrollToTop />
      <BottomNav onCartClick={() => setCartOpen(true)} />
    </div>
  );
};

export default Index;
