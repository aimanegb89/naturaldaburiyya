import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { markCatalogLoaded, replaceCatalog, type DbProduct } from '@/lib/catalog';

const CatalogContext = createContext({ reload: async () => {} });

/** Loads products from the database into the shared catalog store (consumers subscribe via useCatalog). */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const reload = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').order('sort_order');
    if (!error && data && data.length) replaceCatalog(data as DbProduct[]);
    else markCatalogLoaded();
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return <CatalogContext.Provider value={{ reload }}>{children}</CatalogContext.Provider>;
}

export const useCatalogReload = () => useContext(CatalogContext);
