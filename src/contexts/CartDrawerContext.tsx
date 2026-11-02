import React, { createContext, useContext, useState, ReactNode } from 'react';

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
