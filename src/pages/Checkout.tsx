import React, { useEffect, useRef, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
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
import { useTx } from '@/lib/i18n';
import { Banknote, CreditCard } from 'lucide-react';
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
  const [confirmedNumber, setConfirmedNumber] = useState<number | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [channel, setChannel] = useState<'push' | 'whatsapp'>('push');
  const [waLink, setWaLink] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<{ id: string; name: string } | null>(null);
  const idemKey = useRef<string>(crypto.randomUUID());
  const { removeItem } = useCart();
  useEffect(() => {
    supabase.from('store_settings').select('order_channel').eq('id', 1).maybeSingle()
      .then(({ data }) => setChannel(data?.order_channel === 'whatsapp' ? 'whatsapp' : 'push'));
  }, []);

  const tx = useTx();
  const [payment, setPayment] = useState<'cash' | 'card'>('cash');
  const [errors, setErrors] = useState<Record<string, string>>({});
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

    const phoneDigits = form.phone.replace(/\D/g, '');

    const errs: Record<string, string> = {};
    const req = tx({ ar: 'هذا الحقل مطلوب', he: 'שדה חובה', en: 'This field is required' });
    if (!form.name.trim()) errs.name = req;
    if (phoneDigits.length < 9 || phoneDigits.length > 15) errs.phone = tx({ ar: 'رقم هاتف غير صالح', he: 'מספר טלפון לא תקין', en: 'Enter a valid phone number' });
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast({ title: t('requiredFields') });
      return;
    }

    setSubmitting(true);
    let orderId: string | null = null;

    try {
      const { data: placed, error: placeErr } = await supabase.functions.invoke('place-order', {
        body: {
          name: form.name, phone: form.phone,
          notes: form.notes, payment_method: payment,
          idempotency_key: idemKey.current,
          items: items.map(i => ({ id: i.id, size: i.size, quantity: i.quantity })),
        },
      });
      if (placeErr || !placed?.id) {
        let body: any = placed;
        if (placeErr instanceof FunctionsHttpError) { try { body = await placeErr.context.json(); } catch { body = null; } }
        const code = body?.error;
        if (code === 'product_unavailable' && body?.product_id) {
          const nm = body.name?.[language] || body.name?.ar || body.product_id;
          setUnavailable({ id: body.product_id, name: nm });
          toast({ title: tx({ ar: `«${nm}» غير متوفر الآن`, he: `«${nm}» אזל כרגע`, en: `“${nm}” is out of stock` }) });
        } else if (code === 'rate_limited') {
          toast({ title: tx({ ar: 'طلبات كثيرة، حاول بعد قليل', he: 'יותר מדי הזמנות, נסו שוב בעוד מעט', en: 'Too many orders, please try again shortly' }) });
        } else if (code === 'validation') {
          toast({ title: tx({ ar: 'تحقق من البيانات المدخلة', he: 'בדקו את הפרטים', en: 'Please check your details' }) });
        } else if (code === 'unknown_product') {
          toast({ title: tx({ ar: 'منتج في السلة لم يعد موجودًا', he: 'מוצר בעגלה כבר לא קיים', en: 'An item in your cart no longer exists' }) });
        } else {
          toast({ title: t('addFailed') });
        }
        return;
      }
      const orderTotal = Number(placed.total ?? totalPrice);
      orderId = placed.tracking_code ?? placed.id;
      setConfirmedNumber(placed.order_number ?? null);
      if (placed.tracking_code) {
        try {
          const prev: string[] = JSON.parse(localStorage.getItem('natural-my-orders') || '[]');
          localStorage.setItem('natural-my-orders', JSON.stringify([placed.tracking_code, ...prev.filter((c) => c !== placed.tracking_code)].slice(0, 10)));
        } catch { /* ignore */ }
      }

      if (channel === 'whatsapp') {
      const orderLines = items
        .map(i => `• ${getName(i)} (${sizeLabel(i.size)}) x${i.quantity} - ₪${i.price * i.quantity}`)
        .join('\n');

      const message = `🌿 *Natural - ${t('orderDetails')}* #${placed.order_number ?? orderId}\n\n*${t('name')}:* ${form.name}\n*${t('phoneNumber')}:* ${form.phone}\n*${tx({ ar: 'الاستلام', he: 'איסוף', en: 'Pickup' })}:* ${tx({ ar: 'من المحل', he: 'מהחנות', en: 'From the shop' })}\n\n*${t('orderSummary')}:*\n${orderLines}\n\n*${t('total')}:* ₪${orderTotal}\n*${tx({ ar: 'الدفع', he: 'תשלום', en: 'Payment' })}:* ${payment === 'cash' ? tx({ ar: 'نقدًا عند الاستلام', he: 'מזומן באיסוף', en: 'Cash at pickup' }) : tx({ ar: 'بطاقة عند الاستلام', he: 'כרטיס באיסוף', en: 'Card at pickup' })}${form.notes ? `\n\n*${t('notes')}:* ${form.notes}` : ''}\n\n${tx({ ar: 'تتبّع الطلب', he: 'מעקב הזמנה', en: 'Track order' })}: ${window.location.origin}/track/${orderId}`;

      setWaLink(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`);
      }

      setConfirmedTotal(orderTotal);
      setConfirmedId(orderId);
      clearCart();
      idemKey.current = crypto.randomUUID();
    } catch {
      toast({ title: t('addFailed') });
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
        <p className="text-[14px] text-muted-foreground max-w-[300px] mb-3">{channel === 'whatsapp' ? t('orderConfirmedDesc') : tx({ ar: 'وصل طلبك إلى المحل وسنبدأ بتحضيره قريبًا.', he: 'ההזמנה התקבלה בחנות ונתחיל להכין אותה בקרוב.', en: 'Your order reached the shop and will be prepared shortly.' })}</p>
        {confirmedId && (
          <p className="text-[14px] text-muted-foreground mb-1">
            {t('orderNumber')}: <span className="font-mono" dir="ltr">#{confirmedNumber ?? confirmedId.slice(0, 8)}</span>
          </p>
        )}
        <p className="text-sm font-semibold text-primary mb-6">
          {t('total')}: <bdi dir="ltr">{t('currency')}{confirmedTotal}</bdi>
        </p>
        {waLink && (
          <Button asChild className="w-full max-w-[280px] mb-[10px]">
            <a href={waLink} target="_blank" rel="noopener noreferrer">{tx({ ar: 'أرسل الطلب عبر واتساب', he: 'שליחת ההזמנה בוואטסאפ', en: 'Send order on WhatsApp' })}</a>
          </Button>
        )}
        {confirmedId && (
          <Button variant="outline" className="w-full max-w-[280px] mb-[10px]" onClick={() => navigate(`/track/${confirmedId}`)}>
            {tx({ ar: 'تتبّع الطلب', he: 'מעקב הזמנה', en: 'Track order' })}
          </Button>
        )}
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
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-outline-variant/50">
        <div className="flex items-center gap-[8px] h-[64px] px-[16px] max-w-[1100px] mx-auto">
          <button
            onClick={() => navigate('/')}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
            aria-label={t('backToHome')}
          >
            <ArrowLeft className="w-[20px] h-[20px] rtl:rotate-180" />
          </button>
          <h1 className="font-display text-[22px] text-foreground">{t('checkoutTitle')}</h1>
        </div>
      </header>

      <form onSubmit={handleConfirm} noValidate className="px-[16px] py-[20px] max-w-[1100px] mx-auto grid md:grid-cols-[1fr_380px] gap-[24px] items-start">
        {unavailable && (
          <div role="alert" className="md:col-span-2 rounded-[16px] border border-destructive/40 bg-destructive/10 p-[14px] flex items-center justify-between gap-[10px]">
            <span className="text-[14px] font-semibold">{tx({ ar: `«${unavailable.name}» غير متوفر الآن`, he: `«${unavailable.name}» אזל כרגע`, en: `“${unavailable.name}” is out of stock` })}</span>
            <Button type="button" size="sm" variant="outline" onClick={() => { items.filter((i) => i.id === unavailable.id).forEach((i) => removeItem(i.id, i.size)); setUnavailable(null); }}>
              {tx({ ar: 'إزالته من السلة', he: 'הסרה מהעגלה', en: 'Remove from cart' })}
            </Button>
          </div>
        )}
        {/* Order summary */}
        <section className="md:col-start-2 md:row-start-1 md:sticky md:top-[88px]">
          <h2 className="text-xs font-semibold text-foreground mb-2">{t('orderSummary')}</h2>
          <div className="rounded-[20px] bg-surface-container-low border border-outline-variant/50 shadow-soft p-[16px]">
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
                  <p className="text-[12px] text-muted-foreground">
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

        <div className="md:col-start-1 md:row-start-1 flex flex-col gap-[20px]">
        {/* Contact */}
        <section className="space-y-3 rounded-[20px] bg-surface-container-low border border-outline-variant/50 p-[16px]">
          <h2 className="text-[16px] font-bold text-foreground flex items-center gap-[8px]"><span className="w-[26px] h-[26px] rounded-full bg-primary text-primary-foreground text-[13px] flex items-center justify-center">1</span>{t('contactDetails')}</h2>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-[4px] block">{t('name')}</label>
            <Input
              value={form.name}
              maxLength={100}
              autoComplete="name"
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); if (errors.name) setErrors(x => ({ ...x, name: '' })); }}
              aria-invalid={!!errors.name}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-[12px] text-destructive mt-[4px]">{errors.name}</p>}
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-[4px] block">{t('phoneNumber')}</label>
            <Input
              type="tel"
              dir="ltr"
              value={form.phone}
              maxLength={20}
              autoComplete="tel"
              onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); if (errors.phone) setErrors(x => ({ ...x, phone: '' })); }}
              aria-invalid={!!errors.phone}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && <p className="text-[12px] text-destructive mt-[4px]">{errors.phone}</p>}
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-[4px] block">{t('notes')}</label>
            <Textarea
              value={form.notes}
              maxLength={500 - 7}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="min-h-[72px] rounded-lg border-outline-variant"
              rows={3}
            />
          </div>
        </section>

        {/* Pickup only */}
        <section className="rounded-[20px] bg-primary/5 border border-primary/20 p-[16px] flex items-start gap-[12px]">
          <MapPin className="w-[20px] h-[20px] text-primary flex-shrink-0 mt-[2px]" />
          <div>
            <p className="text-[15px] font-bold text-foreground">{tx({ ar: 'استلام من المحل', he: 'איסוף מהחנות', en: 'Pickup from the shop' })}</p>
            <p className="text-[13px] text-muted-foreground mt-[2px]">{tx({ ar: 'نجهّز طلبك وتستلمه من محل Natural في دبورية', he: 'נכין את ההזמנה ותאספו אותה מחנות Natural בדבוריה', en: 'We prepare your order and you pick it up at Natural, Daburiyya' })}</p>
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-[20px] bg-surface-container-low border border-outline-variant/50 p-[16px]">
          <h2 className="text-[16px] font-bold text-foreground mb-[12px] flex items-center gap-[8px]"><span className="w-[26px] h-[26px] rounded-full bg-primary text-primary-foreground text-[13px] flex items-center justify-center">2</span>{tx({ ar: 'طريقة الدفع', he: 'אמצעי תשלום', en: 'Payment method' })}</h2>
          <div className="grid grid-cols-2 gap-[10px]">
            {([['cash', Banknote, { ar: 'نقدًا عند الاستلام', he: 'מזומן באיסוף', en: 'Cash at pickup' }], ['card', CreditCard, { ar: 'بطاقة عند الاستلام', he: 'כרטיס באיסוף', en: 'Card at pickup' }]] as const).map(([k, Icon, l]) => (
              <button key={k} type="button" onClick={() => setPayment(k)} className={`rounded-[14px] border-2 p-[14px] flex flex-col items-start gap-[6px] text-start transition-all ${payment === k ? 'border-primary bg-primary/10' : 'border-outline-variant'}`}>
                <Icon className="w-[20px] h-[20px] text-primary" />
                <span className="text-[14px] font-bold">{tx(l)}</span>
              </button>
            ))}
          </div>
        </section>
        </div>

        <div className="md:col-start-2 space-y-[8px] sticky bottom-0 md:static -mx-[16px] md:mx-0 px-[16px] md:px-0 py-[10px] md:py-0 bg-background/95 md:bg-transparent backdrop-blur border-t border-border md:border-0">
        <Button type="submit" className="w-full gap-2 h-[52px] rounded-full text-[16px] font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={submitting}>
          {submitting ? (
            <Loader2 className="w-[16px] h-[16px] animate-spin" />
          ) : (
            <CheckCircle2 className="w-[16px] h-[16px]" />
          )}
          {t('confirmOrder')} · <bdi dir="ltr">{t('currency')}{totalPrice}</bdi>
        </Button>
        {channel === 'whatsapp' && <p className="text-[12px] text-center text-muted-foreground">{t('sendViaWhatsApp')}</p>}
        </div>
      </form>
    </div>
  );
};

export default Checkout;
