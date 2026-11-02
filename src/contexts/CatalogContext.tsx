import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { replaceCatalog, type DbProduct } from '@/lib/catalog';

const CatalogContext = createContext({ version: 0, reload: async () => {} });

/** Loads products from the database into the shared catalog; remounts the tree once data changes. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const reload = async () => {
    const { data, error } = await supabase.from('products').select('*').order('sort_order');
    if (!error && data && data.length) {
      replaceCatalog(data as DbProduct[]);
      setVersion((v) => v + 1);
    }
  };
  useEffect(() => { reload(); }, []);
  return (
    <CatalogContext.Provider value={{ version, reload }}>
      <div key={version} className="contents">{children}</div>
    </CatalogContext.Provider>
  );
}

export const useCatalogReload = () => useContext(CatalogContext);
