import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProductName } from '@/lib/product-utils';
import { hasSizes, isAvailable, type CatalogProduct } from '@/lib/catalog';
import { useTx } from '@/lib/i18n';

export function useAddToCart() {
  const { addItem, updateQuantity, items } = useCart();
  const { setOpen } = useCartDrawer();
  const { language } = useLanguage();
  const tx = useTx();

  return (p: CatalogProduct, size: 'small' | 'large' = 'small', qty = 1) => {
    if (!isAvailable(p)) {
      toast.error(tx({ ar: 'هذا المنتج غير متوفر حاليًا', he: 'המוצר אזל כרגע', en: 'This product is currently out of stock' }));
      return;
    }
    const s = hasSizes(p) ? size : 'small';
    const price = s === 'large' && hasSizes(p) ? p.priceLarge : p.priceSmall;
    const existing = items.find((i) => i.id === p.id && i.size === s)?.quantity ?? 0;
    addItem({ id: p.id, nameAr: p.nameAr, nameHe: p.nameHe, nameEn: p.nameEn, size: s, price, image: p.img });
    if (qty > 1) updateQuantity(p.id, s, existing + qty);
    toast.success(tx({ ar: 'تمت الإضافة إلى السلة', he: 'נוסף לעגלה', en: 'Added to cart' }), {
      description: getProductName(p, language),
      action: { label: tx({ ar: 'عرض السلة', he: 'לעגלה', en: 'View cart' }), onClick: () => setOpen(true) },
    });
  };
}
