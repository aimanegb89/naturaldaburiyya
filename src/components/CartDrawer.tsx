import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ShoppingCart, ShoppingBag, Store, Minus, Plus, Trash2, Truck } from 'lucide-react';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/catalog';
import { useTx } from '@/lib/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CartDrawer: React.FC = () => {
  const { open: isOpen, setOpen } = useCartDrawer();
  const onClose = () => setOpen(false);
  const tx = useTx();
  const { language, t, dir } = useLanguage();
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - totalPrice);
  const progress = Math.min(100, (totalPrice / FREE_DELIVERY_THRESHOLD) * 100);
  const navigate = useNavigate();
  const [deleteItemDialog, setDeleteItemDialog] = useState<{ id: string; size: 'small' | 'large' } | null>(null);
  const [showEmptyCartDialog, setShowEmptyCartDialog] = useState(false);

  const getName = (item: typeof items[0]) => {
    switch (language) {
      case 'ar': return item.nameAr;
      case 'he': return item.nameHe;
      default: return item.nameEn;
    }
  };

  const handleConfirmDelete = () => {
    if (deleteItemDialog) {
      removeItem(deleteItemDialog.id, deleteItemDialog.size);
      setDeleteItemDialog(null);
    }
  };

  const handleConfirmEmptyCart = () => {
    clearCart();
    setShowEmptyCartDialog(false);
  };

  const sizeLabel = (size: 'small' | 'large') => size === 'small' ? t('small') : t('large');

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[420px] bg-background border-outline-variant flex flex-col p-[20px]"
          dir={dir}
        >
          <SheetHeader className="pe-[40px] flex-shrink-0 text-start">
            <div className="flex items-center justify-between gap-[8px]">
              <SheetTitle className="flex items-center gap-[10px] text-[20px] font-bold text-foreground">
                <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-primary/10">
                  <ShoppingCart className="w-[18px] h-[18px] text-primary" />
                </span>
                {t('yourCart')}
                {items.length > 0 && (
                  <span className="rounded-full bg-primary px-[8px] py-[2px] text-[12px] font-bold text-primary-foreground">
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </SheetTitle>
              {items.length > 0 && (
                <button
                  onClick={() => setShowEmptyCartDialog(true)}
                  className="flex items-center gap-[4px] rounded-full px-[10px] py-[6px] text-[12px] font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-[13px] h-[13px]" />
                  {t('emptyCartButton')}
                </button>
              )}
            </div>
          </SheetHeader>
          {items.length > 0 && (
            <div className="mt-[14px] rounded-[14px] bg-surface-container p-[12px]">
              <p className="flex items-center gap-[8px] text-[13px] font-semibold mb-[8px]">
                <Truck className="w-[16px] h-[16px] text-primary" />
                {remaining > 0
                  ? tx({ ar: `أضف ₪${remaining} للحصول على توصيل مجاني`, he: `הוסיפו ₪${remaining} למשלוח חינם`, en: `Add ₪${remaining} more for free delivery` })
                  : tx({ ar: 'مبروك! حصلت على توصيل مجاني', he: 'מעולה! המשלוח בחינם', en: 'You unlocked free delivery!' })}
              </p>
              <div className="h-[6px] rounded-full bg-surface-container-highest overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex flex-col flex-1 min-h-0 mt-[12px]">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-[16px]">
                <div className="w-[88px] h-[88px] bg-primary/10 rounded-full flex items-center justify-center mb-[18px]">
                  <ShoppingBag className="w-[38px] h-[38px] text-primary" />
                </div>
                <p className="text-[18px] font-bold text-foreground">{t('emptyCart')}</p>
                <p className="text-[14px] text-muted-foreground mt-[6px] max-w-[260px]">
                  {tx({ ar: 'اكتشف عصائرنا الطبيعية ومكمّلاتنا الصحية', he: 'גלו את המיצים הטבעיים והתוספים שלנו', en: 'Discover our natural juices and supplements' })}
                </p>
                <Button
                  className="mt-[22px] h-[48px] rounded-full px-[28px] text-[15px] font-bold gap-[8px]"
                  onClick={() => { onClose(); navigate('/shop'); }}
                >
                  <Store className="w-[18px] h-[18px]" />
                  {tx({ ar: 'تسوّق الآن', he: 'לחנות', en: 'Go to shop' })}
                </Button>
              </div>
            ) : (
              /* Cart Items — flat list, no individual cards */
              <>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {items.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex gap-[12px] py-[14px] border-b border-outline-variant/50 last:border-0"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={getName(item)}
                          className="w-[72px] h-[72px] rounded-[14px] object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold text-foreground truncate">{getName(item)}</h4>
                        <span className="inline-block mt-[4px] rounded-full bg-surface-container-high px-[8px] py-[2px] text-[12px] font-semibold text-muted-foreground">{sizeLabel(item.size)}</span>
                        <p className="text-[15px] font-bold text-primary mt-[6px]">{t("currency")}{item.price * item.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between gap-[6px] flex-shrink-0">
                        <button
                          onClick={() => setDeleteItemDialog({ id: item.id, size: item.size })}
                          className="w-[24px] h-[24px] flex items-center justify-center rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-[13px] h-[13px]" />
                        </button>
                        <div className="flex items-center gap-[2px] bg-surface-container-high rounded-full p-[2px]">
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                            className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors"
                          >
                            <Minus className="w-[11px] h-[11px]" />
                          </button>
                          <span className="w-[24px] text-center text-[14px] font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                            className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors"
                          >
                            <Plus className="w-[11px] h-[11px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex-shrink-0 space-y-[10px] pt-[14px] border-t border-outline-variant mt-[8px]">
                  <div className="flex justify-between items-center text-[13px] text-muted-foreground">
                    <span>{tx({ ar: 'التوصيل', he: 'משלוח', en: 'Delivery' })}</span>
                    <span>{remaining > 0 ? tx({ ar: 'يُحدَّد عند التأكيد', he: 'ייקבע באישור', en: 'Confirmed on WhatsApp' }) : tx({ ar: 'مجاني', he: 'חינם', en: 'Free' })}</span>
                  </div>
                  <div className="flex justify-between items-center text-[17px] font-extrabold">
                    <span>{tx({ ar: 'المجموع الفرعي', he: 'סכום ביניים', en: 'Subtotal' })}</span>
                    <span>{t('currency')}{totalPrice}</span>
                  </div>
                  <Button
                    className="w-full h-[52px] rounded-full text-[16px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevation-2"
                    onClick={() => {
                      onClose();
                      navigate('/checkout');
                    }}
                  >
                    {t('checkout')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {[
        { open: !!deleteItemDialog, onChange: () => setDeleteItemDialog(null), title: t('confirmDelete'), msg: t('confirmDeleteMessage'), action: handleConfirmDelete, cta: tx({ ar: 'حذف', he: 'מחק', en: 'Remove' }) },
        { open: showEmptyCartDialog, onChange: setShowEmptyCartDialog, title: t('emptyCartButton'), msg: t('confirmEmptyCart'), action: handleConfirmEmptyCart, cta: tx({ ar: 'إفراغ', he: 'רוקן', en: 'Empty' }) },
      ].map((d, i) => (
        <AlertDialog key={i} open={d.open} onOpenChange={d.onChange as (o: boolean) => void}>
          <AlertDialogContent dir={dir} className="w-[calc(100%-40px)] max-w-[340px] rounded-[24px] border-outline-variant bg-background p-[24px] gap-[0px] shadow-elevation-3">
            <div className="mx-auto mb-[14px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-[22px] w-[22px] text-destructive" />
            </div>
            <AlertDialogHeader className="space-y-[6px] text-center sm:text-center">
              <AlertDialogTitle className="text-[17px] font-bold text-foreground">{d.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-[14px] leading-[1.5]">{d.msg}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-[20px] flex flex-row gap-[10px] sm:gap-[10px]">
              <AlertDialogCancel className="mt-0 h-[44px] flex-1 rounded-full px-[16px] text-[14px] font-semibold">
                {t('cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={d.action}
                className="h-[44px] flex-1 rounded-full bg-destructive px-[16px] text-[14px] font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                {d.cta}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </>
  );
};

export default CartDrawer;
