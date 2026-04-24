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
    
    toast({
      title: t('orderSuccess'),
      description: '✓',
    });
    
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
          className="w-full sm:max-w-md bg-surface border-outline-variant" 
          dir={dir}
        >
          <SheetHeader className="pr-8">
            <SheetTitle className="flex items-center gap-[12px] md-headline-small text-foreground">
              <ShoppingCart className="w-[22px] h-[22px] text-primary" />
              {t('yourCart')}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-100px)] mt-6">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-[64px] h-[64px] bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-[32px] h-[32px] opacity-40" />
                </div>
                <p className="md-body-large">{t('emptyCart')}</p>
              </div>
            ) : showCheckout ? (
              /* Checkout Form */
              <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col gap-5">
                <h3 className="md-title-large text-foreground">{t('orderDetails')}</h3>
                
                <div>
                  <label className="md-label-large text-muted-foreground mb-2 block">{t('name')}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="md-label-large text-muted-foreground mb-2 block">{t('phoneNumber')}</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="md-label-large text-muted-foreground mb-2 block">{t('notes')}</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[100px] rounded-lg border-outline-variant"
                    rows={3}
                  />
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex justify-between items-center md-title-large py-4 border-t border-outline-variant">
                    <span>{t('total')}</span>
                    <span className="text-primary">{t('currency')}{totalPrice}</span>
                  </div>
                  
                  <Button type="submit" size="lg" className="w-full gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {t('placeOrder')}
                  </Button>
                  
                  <Button type="button" variant="ghost" size="lg" className="w-full gap-2" onClick={() => setShowCheckout(false)}>
                    <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                    {t('cart')}
                  </Button>
                </div>
              </form>
            ) : (
              /* Cart Items */
              <>
                <div className="flex-1 overflow-auto space-y-3 pb-4">
                  {items.map((item) => (
                    <div 
                      key={`${item.id}-${item.size}`} 
                      className="flex gap-3 p-3 bg-surface-container-low rounded-xl shadow-elevation-1"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={getName(item)}
                          className="w-[56px] h-[56px] rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="md-title-small text-foreground truncate">{getName(item)}</h4>
                        <p className="md-body-small text-muted-foreground">{sizeLabel(item.size)}</p>
                        <p className="md-title-small text-primary">{t('currency')}{item.price}</p>
                      </div>
                      <div className="flex flex-col items-end gap-[8px]">
                        <button
                          onClick={() => setDeleteItemDialog({ id: item.id, size: item.size })}
                          className="w-[28px] h-[28px] flex items-center justify-center rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-[16px] h-[16px]" />
                        </button>
                        <div className="flex items-center gap-[2px] bg-surface-container-high rounded-full p-[3px]">
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                            className="w-[28px] h-[28px] flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors"
                          >
                            <Minus className="w-[14px] h-[14px]" />
                          </button>
                          <span className="w-[24px] text-center md-label-large">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                            className="w-[28px] h-[28px] flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors"
                          >
                            <Plus className="w-[14px] h-[14px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto space-y-4 pt-4 border-t border-outline-variant">
                  <div className="flex justify-between items-center md-title-large">
                    <span>{t('total')}</span>
                    <span className="text-primary">{t('currency')}{totalPrice}</span>
                  </div>
                  
                  <Button size="lg" className="w-full" onClick={() => setShowCheckout(true)}>
                    {t('checkout')}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setShowEmptyCartDialog(true)}
                  >
                    <Trash2 className="w-[16px] h-[16px] mr-[8px]" />
                    {t('emptyCartButton')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog open={!!deleteItemDialog} onOpenChange={() => setDeleteItemDialog(null)}>
        <AlertDialogContent dir={dir} className="bg-surface-container rounded-2xl shadow-elevation-3">
          <AlertDialogHeader>
            <AlertDialogTitle className="md-headline-small">{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription className="md-body-large">
              {t('confirmDeleteMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={dir === 'rtl' ? 'flex-row-reverse gap-2' : ''}>
            <AlertDialogCancel className="rounded-full">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Cart Confirmation Dialog */}
      <AlertDialog open={showEmptyCartDialog} onOpenChange={setShowEmptyCartDialog}>
        <AlertDialogContent dir={dir} className="bg-surface-container rounded-2xl shadow-elevation-3">
          <AlertDialogHeader>
            <AlertDialogTitle className="md-headline-small">{t('emptyCartButton')}</AlertDialogTitle>
            <AlertDialogDescription className="md-body-large">
              {t('confirmEmptyCart')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={dir === 'rtl' ? 'flex-row-reverse gap-2' : ''}>
            <AlertDialogCancel className="rounded-full">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmEmptyCart} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
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
