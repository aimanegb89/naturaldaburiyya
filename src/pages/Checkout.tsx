import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { ArrowLeft, CheckCircle2, MapPin, ShoppingCart, Loader2 } from 'lucide-react';

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  postal_code: string | null;
  phone: string | null;
  is_default: boolean | null;
}

const Checkout: React.FC = () => {
  const { t, dir, language } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  const getName = (item: typeof items[0]) => {
    switch (language) {
      case 'ar': return item.nameAr;
      case 'he': return item.nameHe;
      default: return item.nameEn;
    }
  };

  const sizeLabel = (size: 'small' | 'large') => (size === 'small' ? t('small') : t('large'));

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data: addrs }, { data: profile }] = await Promise.all([
        supabase.from('addresses').select('*').order('is_default', { ascending: false }),
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
      ]);
      if (!active) return;
      if (addrs && addrs.length > 0) {
        setAddresses(addrs as SavedAddress[]);
        setSelectedAddressId(addrs[0].id);
      }
      setForm(prev => ({
        ...prev,
        name: prev.name || profile?.full_name || '',
        phone: prev.phone || profile?.phone || '',
      }));
    })();
    return () => { active = false; };
  }, [user]);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const usingSaved = !!selectedAddress;
    const phoneDigits = form.phone.replace(/\D/g, '');

    if (!form.name.trim() || phoneDigits.length < 9 || phoneDigits.length > 15) {
      toast({ title: t('requiredFields'), description: t('phoneNumber') });
      return;
    }
    if (!usingSaved && (!form.street.trim() || !form.city.trim())) {
      toast({ title: t('requiredFields'), description: t('deliveryAddress') });
      return;
    }

    setSubmitting(true);
    const street = usingSaved ? selectedAddress!.street : form.street;
    const city = usingSaved ? selectedAddress!.city : form.city;
    const postal = usingSaved ? selectedAddress!.postal_code || '' : form.postalCode;
    const orderTotal = totalPrice;
    let orderId: string | null = null;

    try {
      if (user) {
        let addressId = usingSaved ? selectedAddress!.id : null;

        if (!usingSaved) {
          const { data: newAddr } = await supabase
            .from('addresses')
            .insert({
              user_id: user.id,
              label: t('deliveryAddress'),
              street,
              city,
              postal_code: postal || null,
              phone: form.phone,
              is_default: addresses.length === 0,
            })
            .select('id')
            .single();
          addressId = newAddr?.id ?? null;
        }

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            address_id: addressId,
            total_amount: orderTotal,
            status: 'pending',
            notes: form.notes || null,
          })
          .select('id')
          .single();

        if (orderError) throw orderError;
        orderId = order.id;

        const { error: itemsError } = await supabase.from('order_items').insert(
          items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.nameEn,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          }))
        );
        if (itemsError) throw itemsError;
      }

      const orderLines = items
        .map(i => `• ${getName(i)} (${sizeLabel(i.size)}) x${i.quantity} - ₪${i.price * i.quantity}`)
        .join('\n');

      const message = `🌿 *Natural - ${t('orderDetails')}*\n\n*${t('name')}:* ${form.name}\n*${t('phoneNumber')}:* ${form.phone}\n*${t('deliveryAddress')}:* ${street}, ${city}${postal ? ` (${postal})` : ''}\n\n*${t('orderSummary')}:*\n${orderLines}\n\n*${t('total')}:* ₪${orderTotal}${form.notes ? `\n\n*${t('notes')}:* ${form.notes}` : ''}`;

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');

      setConfirmedTotal(orderTotal);
      setConfirmedId(orderId);
      clearCart();
    } catch (err) {
      toast({ title: t('addFailed'), description: err instanceof Error ? err.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedId !== null || confirmedTotal > 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center" dir={dir}>
        <div className="w-[72px] h-[72px] rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-[36px] h-[36px] text-primary" />
        </div>
        <h1 className="text-lg font-semibold text-foreground mb-2">{t('orderConfirmed')}</h1>
        <p className="text-xs text-muted-foreground max-w-[280px] mb-3">{t('orderConfirmedDesc')}</p>
        {confirmedId && (
          <p className="text-[10px] text-muted-foreground mb-1">
            {t('orderNumber')}: <span className="font-mono">{confirmedId.slice(0, 8)}</span>
          </p>
        )}
        <p className="text-sm font-semibold text-primary mb-6">
          {t('total')}: {t('currency')}{confirmedTotal}
        </p>
        <Button className="w-full max-w-[280px]" onClick={() => navigate('/')}>
          {t('continueShopping')}
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center" dir={dir}>
        <div className="w-[56px] h-[56px] rounded-full bg-surface-container-high flex items-center justify-center mb-3">
          <ShoppingCart className="w-[26px] h-[26px] opacity-40" />
        </div>
        <p className="text-sm text-muted-foreground mb-5">{t('emptyCartCheckout')}</p>
        <Button variant="outline" onClick={() => navigate('/')}>{t('viewMenu')}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[32px]" dir={dir}>
      <header className="sticky top-0 z-40 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex items-center gap-2 h-[56px] px-[16px]">
          <button
            onClick={() => navigate('/')}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
            aria-label={t('backToHome')}
          >
            <ArrowLeft className="w-[20px] h-[20px] rtl:rotate-180" />
          </button>
          <h1 className="text-sm font-semibold text-foreground">{t('checkoutTitle')}</h1>
        </div>
      </header>

      <form onSubmit={handleConfirm} className="px-[16px] py-[16px] space-y-[20px]">
        {/* Order summary */}
        <section>
          <h2 className="text-xs font-semibold text-foreground mb-2">{t('orderSummary')}</h2>
          <div className="rounded-2xl bg-surface-container p-[12px]">
            {items.map(item => (
              <div
                key={`${item.id}-${item.size}`}
                className="flex items-center gap-3 py-[8px] border-b border-outline-variant/30 last:border-0"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={getName(item)}
                    className="w-[44px] h-[44px] rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{getName(item)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {sizeLabel(item.size)} · x{item.quantity}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary">
                  {t('currency')}{item.price * item.quantity}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-[10px] mt-[6px] border-t border-outline-variant text-sm font-semibold">
              <span>{t('total')}</span>
              <span className="text-primary">{t('currency')}{totalPrice}</span>
            </div>
          </div>
        </section>

        {/* Delivery address */}
        <section>
          <h2 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <MapPin className="w-[14px] h-[14px] text-primary" />
            {t('deliveryAddress')}
          </h2>

          {addresses.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-[10px] text-muted-foreground">{t('selectAddress')}</p>
              {addresses.map(addr => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`w-full text-start rounded-xl p-[12px] border transition-colors ${
                    selectedAddressId === addr.id
                      ? 'border-primary bg-primary/10'
                      : 'border-outline-variant bg-surface-container'
                  }`}
                >
                  <p className="text-xs font-semibold text-foreground">{addr.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {addr.street}, {addr.city}
                  </p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedAddressId('new')}
                className={`w-full text-start rounded-xl p-[12px] border transition-colors ${
                  selectedAddressId === 'new'
                    ? 'border-primary bg-primary/10'
                    : 'border-outline-variant bg-surface-container'
                }`}
              >
                <p className="text-xs font-semibold text-foreground">{t('newAddress')}</p>
              </button>
            </div>
          )}

          {!selectedAddress && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('street')}</label>
                <Input
                  value={form.street}
                  onChange={e => setForm(p => ({ ...p, street: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('city')}</label>
                  <Input
                    value={form.city}
                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    required
                  />
                </div>
                <div className="w-[110px]">
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('postalCode')}</label>
                  <Input
                    value={form.postalCode}
                    onChange={e => setForm(p => ({ ...p, postalCode: e.target.value }))}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Contact */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-foreground">{t('contactDetails')}</h2>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('name')}</label>
            <Input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('phoneNumber')}</label>
            <Input
              type="tel"
              dir="ltr"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('notes')}</label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="min-h-[72px] rounded-lg border-outline-variant"
              rows={3}
            />
          </div>
        </section>

        <Button type="submit" className="w-full gap-2" disabled={submitting}>
          {submitting ? (
            <Loader2 className="w-[16px] h-[16px] animate-spin" />
          ) : (
            <CheckCircle2 className="w-[16px] h-[16px]" />
          )}
          {t('confirmOrder')}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">{t('sendViaWhatsApp')}</p>
      </form>
    </div>
  );
};

export default Checkout;
