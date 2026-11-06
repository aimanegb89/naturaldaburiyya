import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void } | undefined>(undefined);

export const CartDrawerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
};

export const useCartDrawer = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCartDrawer must be used within CartDrawerProvider');
  return c;
};

/** Phones go to the /cart page (like other bottom tabs); computers open the side panel. */
export const useOpenCart = () => {
  const { setOpen } = useCartDrawer();
  const navigate = useNavigate();
  return () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) navigate('/cart');
    else setOpen(true);
  };
};
