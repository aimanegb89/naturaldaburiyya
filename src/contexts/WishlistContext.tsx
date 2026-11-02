import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

const KEY = 'naturaldaburiyya_wishlist';

interface WishlistCtx {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<boolean>; // returns new state
}

const Ctx = createContext<WishlistCtx | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (!user) {
      try { setIds(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { setIds([]); }
      return;
    }
    let cancelled = false;
    (async () => {
      // Merge guest hearts into the account, then clear the guest list.
      let guest: string[] = [];
      try { guest = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { /* ignore */ }
      if (guest.length) {
        const { error } = await supabase.from('favorites').upsert(
          guest.map((product_id) => ({ user_id: user.id, product_id })), { onConflict: 'user_id,product_id', ignoreDuplicates: true });
        if (!error) try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      }
      const { data, error } = await supabase.from('favorites').select('product_id').eq('user_id', user.id);
      if (cancelled) return;
      if (error) { console.error('favorites load failed', error); setIds(guest); return; }
      setIds(Array.from(new Set([...(data ?? []).map((d) => d.product_id), ...guest])));
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids, user]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const pending = useRef(new Set<string>());
  const toggle = async (id: string) => {
    const adding = !ids.includes(id);
    if (pending.current.has(id)) return !adding;
    pending.current.add(id);
    setIds((prev) => (adding ? [...prev, id] : prev.filter((x) => x !== id)));
    if (user) {
      const res = adding
        ? await supabase.from('favorites').insert({ user_id: user.id, product_id: id })
        : await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id);
      if (res.error) setIds((prev) => (adding ? prev.filter((x) => x !== id) : [...prev, id]));
    }
    pending.current.delete(id);
    return adding;
  };

  return <Ctx.Provider value={{ ids, has, toggle }}>{children}</Ctx.Provider>;
};

export const useWishlist = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useWishlist must be used within WishlistProvider');
  return c;
};
