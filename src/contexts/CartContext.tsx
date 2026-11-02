import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { getCatalogProduct, isAvailable, unitPrice, useCatalog, hasSizes } from '@/lib/catalog';

export const MAX_QTY = 50;
const clampQty = (q: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(q)));

/** Drops malformed saved cart lines (bad shape, non-finite price, qty outside 1..50). */
export function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((i): i is CartItem =>
    !!i && typeof i === 'object' && typeof i.id === 'string' && (i.size === 'small' || i.size === 'large') &&
    typeof i.price === 'number' && Number.isFinite(i.price) && i.price >= 0 &&
    Number.isInteger(i.quantity) && i.quantity >= 1 && i.quantity <= MAX_QTY &&
    typeof i.nameAr === 'string');
}

export interface CartItem {
  id: string;
  nameAr: string;
  nameHe: string;
  nameEn: string;
  size: 'small' | 'large';
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string, size: 'small' | 'large') => void;
  updateQuantity: (id: string, size: 'small' | 'large', quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'naturaldaburiyya_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? sanitizeCart(JSON.parse(stored)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); } catch { /* storage full or blocked */ }
  }, [items]);

  // Reconcile with the live catalog: refresh prices/names, drop deleted or unavailable products.
  const { version, loaded } = useCatalog();
  useEffect(() => {
    if (!loaded) return;
    setItems((prev) => {
      const removed: string[] = [];
      const next = prev.flatMap((i) => {
        const p = getCatalogProduct(i.id);
        if (!p || !isAvailable(p)) { removed.push(i.nameAr); return []; }
        const size = hasSizes(p) ? i.size : 'small';
        return [{ ...i, size, price: unitPrice(p, size), nameAr: p.nameAr, nameHe: p.nameHe, nameEn: p.nameEn }];
      });
      if (removed.length) setTimeout(() => toast.warning(`${removed.join('، ')} ✕`), 0);
      const same = next.length === prev.length && next.every((n, k) => n.price === prev[k].price && n.size === prev[k].size && n.nameAr === prev[k].nameAr);
      return same ? prev : next;
    });
  }, [version, loaded]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existingItem = prev.find(i => i.id === item.id && i.size === item.size);
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id && i.size === item.size
            ? { ...i, quantity: clampQty(i.quantity + 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string, size: 'small' | 'large') => {
    setItems(prev => prev.filter(i => !(i.id === id && i.size === size)));
  };

  const updateQuantity = (id: string, size: 'small' | 'large', quantity: number) => {
    if (quantity <= 0) {
      removeItem(id, size);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.id === id && i.size === size ? { ...i, quantity: clampQty(quantity) } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
