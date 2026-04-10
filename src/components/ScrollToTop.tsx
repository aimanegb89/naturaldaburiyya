import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ticking = useRef(false);

  const toggleVisibility = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setIsVisible(scrollPercent >= 50);
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [toggleVisibility]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-[72px] right-[24px] z-50 w-[40px] h-[40px] rounded-full gradient-hero shadow-lg hover:scale-110 transition-transform p-0 min-w-0 min-h-0"
      size="icon"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-[20px] h-[20px]" />
    </Button>
  );
};

export default ScrollToTop;
