import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ShoppingCart, Minus, Plus, Trash2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WHATSAPP_NUMBER } from '@/lib/constants';
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

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { language, t, dir } = useLanguage();
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: '',
  });
  const [deleteItemDialog, setDeleteItemDialog] = useState<{ id: string; size: 'small' | 'large' } | null>(null);
  const [showEmptyCartDialog, setShowEmptyCartDialog] = useState(false);

  const getName = (item: typeof items[0]) => {
    switch (language) {
      case 'ar': return item.nameAr;
      case 'he': return item.nameHe;
      default: return item.nameEn;
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      toast({ title: t('invalidPhone'), description: t('phoneNumber') });
      return;
    }

    const orderItems = items.map(item =>
      `• ${getName(item)} (${item.size === 'small' ? '350ml' : '500ml'}) x${item.quantity} - ₪${item.price * item.quantity}`
    ).join('\n');

    const message = `🌿 *Natural - ${t('orderDetails')}*\n\n*${t('name')}:* ${formData.name}\n*${t('phoneNumber')}:* ${formData.phone}\n\n*${t('orders')}:*\n${orderItems}\n\n*${t('total')}:* ₪${totalPrice}\n\n${formData.notes ? `*${t('notes')}:* ${formData.notes}` : ''}`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast({ title: t('orderSuccess'), description: '✓' });

    clearCart();
    setShowCheckout(false);
    setFormData({ name: '', phone: '', notes: '' });
    onClose();
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
          side={dir === 'rtl' ? 'left' : 'right'}
          className="w-full sm:max-w-md bg-surface border-outline-variant flex flex-col"
          dir={dir}
        >
          {/* Header with clear cart button */}
          <SheetHeader className="pr-8 flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShoppingCart className="w-[18px] h-[18px] text-primary" />
                {t('yourCart')}
              </SheetTitle>
              {items.length > 0 && !showCheckout && (
                <button
                  onClick={() => setShowEmptyCartDialog(true)}
                  className="flex items-center gap-1 text-[10px] text-destructive hover:underline transition-all"
                >
                  <Trash2 className="w-[11px] h-[11px]" />
                  {t('emptyCartButton')}
                </button>
              )}
            </div>
          </SheetHeader>

          <div className="flex flex-col flex-1 min-h-0 mt-4">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-[56px] h-[56px] bg-surface-container-high rounded-full flex items-center justify-center mb-3">
                  <ShoppingCart className="w-[26px] h-[26px] opacity-40" />
                </div>
                <p className="text-sm">{t('emptyCart')}</p>
              </div>
            ) : showCheckout ? (
              /* Checkout Form */
              <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col gap-4 min-h-0">
                <h3 className="text-sm font-semibold text-foreground">{t('orderDetails')}</h3>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('name')}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('phoneNumber')}</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('notes')}</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[80px] rounded-lg border-outline-variant"
                    rows={3}
                  />
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex justify-between items-center text-sm font-semibold py-3 border-t border-outline-variant">
                    <span>{t('total')}</span>
                    <span className="text-primary">{t('currency')}{totalPrice}</span>
                  </div>
                  <Button type="submit" className="w-full gap-2">
                    <CheckCircle className="w-[16px] h-[16px]" />
                    {t('placeOrder')}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full gap-2" onClick={() => setShowCheckout(false)}>
                    <ArrowLeft className="w-[16px] h-[16px] rtl:rotate-180" />
                    {t('cart')}
                  </Button>
                </div>
              </form>
            ) : (
              /* Cart Items — flat list, no individual cards */
              <>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {items.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex gap-3 py-3 border-b border-outline-variant/30 last:border-0"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={getName(item)}
                          className="w-[48px] h-[48px] rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">{getName(item)}</h4>
                        <p className="text-[10px] text-muted-foreground">{sizeLabel(item.size)}</p>
                        <p className="text-xs font-semibold text-primary mt-0.5">{t('currency')}{item.price}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setDeleteItemDialog({ id: item.id, size: item.size })}
                          className="w-[24px] h-[24px] flex items-center justify-center rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-[13px] h-[13px]" />
                        </button>
                        <div className="flex items-center gap-[2px] bg-surface-container-high rounded-full p-[2px]">
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                            className="w-[24px] h-[24px] flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors"
                          >
                            <Minus className="w-[11px] h-[11px]" />
                          </button>
                          <span className="w-[20px] text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                            className="w-[24px] h-[24px] flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors"
                          >
                            <Plus className="w-[11px] h-[11px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex-shrink-0 space-y-3 pt-3 border-t border-outline-variant mt-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span>{t('total')}</span>
                    <span className="text-primary">{t('currency')}{totalPrice}</span>
                  </div>
                  <Button className="w-full" onClick={() => setShowCheckout(true)}>
                    {t('checkout')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!deleteItemDialog} onOpenChange={() => setDeleteItemDialog(null)}>
        <AlertDialogContent dir={dir} className="bg-surface-container rounded-2xl shadow-elevation-3 max-w-[320px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {t('confirmDeleteMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-2 justify-end sm:space-x-0">
            <AlertDialogCancel className="rounded-full h-8 text-xs px-4 mt-0">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full h-8 text-xs px-4"
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Cart Confirmation */}
      <AlertDialog open={showEmptyCartDialog} onOpenChange={setShowEmptyCartDialog}>
        <AlertDialogContent dir={dir} className="bg-surface-container rounded-2xl shadow-elevation-3 max-w-[320px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">{t('emptyCartButton')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {t('confirmEmptyCart')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-2 justify-end sm:space-x-0">
            <AlertDialogCancel className="rounded-full h-8 text-xs px-4 mt-0">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmEmptyCart}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full h-8 text-xs px-4"
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CartDrawer;
