import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, Package, ChefHat, CircleCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTx } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

type Tracked = {
  tracking_code: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  order_items: { product_name: string; size: string; quantity: number; price: number }[];
};

const stepOf = (s: string) => (s === 'done' || s === 'completed' ? 2 : s === 'preparing' ? 1 : 0);

export default function TrackOrder() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const tx = useTx();
  const { language } = useLanguage();
  const [code, setCode] = useState(urlCode ?? '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Tracked | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const lookup = useCallback(async (c: string, p?: string, silent = false) => {
    if (!silent) { setLoading(true); setNotFound(false); }
    const { data, error } = await supabase.functions.invoke('track-order', { body: { code: c, phone: p || undefined } });
    if (!silent) setLoading(false);
    if (error || !data?.tracking_code) { if (!silent) { setOrder(null); setNotFound(true); } return; }
    setOrder(data as Tracked);
  }, []);

  useEffect(() => { if (urlCode) lookup(urlCode); }, [urlCode, lookup]);

  useEffect(() => {
    if (!order || stepOf(order.status) === 2) return;
    const id = setInterval(() => lookup(order.tracking_code, undefined, true), 20000);
    return () => clearInterval(id);
  }, [order, lookup]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().replace(/^#/, '').toUpperCase();
    if (!c || !phone.trim()) return;
    lookup(c, phone.trim());
  };

  const steps = [
    { Icon: Package, label: tx({ ar: 'تم استلام الطلب', he: 'ההזמנה התקבלה', en: 'Received' }) },
    { Icon: ChefHat, label: tx({ ar: 'قيد التحضير', he: 'בהכנה', en: 'Preparing' }) },
    { Icon: CircleCheck, label: tx({ ar: 'جاهز', he: 'מוכן', en: 'Done' }) },
  ];
  const link = order ? `${window.location.origin}/track/${order.tracking_code}` : '';

  return (
    <AppShell>
      <div className="max-w-[560px] mx-auto px-[16px] py-[24px] text-start">
        <h1 className="font-display text-[26px] font-bold mb-[6px]">{tx({ ar: 'تتبّع طلبك', he: 'מעקב הזמנה', en: 'Track your order' })}</h1>
        <p className="text-[14px] text-muted-foreground mb-[18px]">
          {tx({ ar: 'أدخل رقم الطلب ورقم الهاتف الذي استخدمته.', he: 'הזינו את מספר ההזמנה ואת מספר הטלפון.', en: 'Enter your order number and the phone number you used.' })}
        </p>

        {!urlCode && (
          <form onSubmit={submit} className="bg-card rounded-[16px] p-[16px] shadow-soft space-y-[10px] mb-[18px]">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={tx({ ar: 'رقم الطلب (مثال: A1B2C3D4)', he: 'מספר הזמנה', en: 'Order number (e.g. A1B2C3D4)' })} className="font-mono uppercase" dir="ltr" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder={tx({ ar: 'رقم الهاتف', he: 'מספר טלפון', en: 'Phone number' })} dir="ltr" />
            <Button type="submit" className="w-full gap-[8px]" disabled={loading}>
              <Search className="w-[16px] h-[16px]" />{tx({ ar: 'تتبّع', he: 'מעקב', en: 'Track' })}
            </Button>
          </form>
        )}

        {loading && <div className="h-[160px] rounded-[16px] bg-surface-container animate-pulse" />}
        {notFound && !loading && (
          <div className="bg-card rounded-[16px] p-[16px] text-center text-[14px] text-muted-foreground">
            {tx({ ar: 'لم نجد طلبًا بهذه البيانات.', he: 'לא נמצאה הזמנה.', en: 'No order found with these details.' })}
            {urlCode && <Button variant="link" onClick={() => navigate('/track')}>{tx({ ar: 'بحث يدوي', he: 'חיפוש ידני', en: 'Search manually' })}</Button>}
          </div>
        )}

        {order && !loading && (
          <div className="bg-card rounded-[16px] p-[16px] shadow-soft space-y-[18px]">
            <div className="flex items-center justify-between gap-[8px]">
              <div>
                <p className="text-[12px] text-muted-foreground">{tx({ ar: 'رقم الطلب', he: 'מספר הזמנה', en: 'Order number' })}</p>
                <p className="font-mono font-bold text-[18px]" dir="ltr">#{order.tracking_code}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-[6px] h-[34px] px-[12px]" onClick={() => { navigator.clipboard.writeText(link); toast.success(tx({ ar: 'تم نسخ الرابط', he: 'הקישור הועתק', en: 'Link copied' })); }}>
                <Copy className="w-[14px] h-[14px]" />{tx({ ar: 'نسخ الرابط', he: 'העתק קישור', en: 'Copy link' })}
              </Button>
            </div>

            <ol className="grid grid-cols-3 gap-[6px]">
              {steps.map(({ Icon, label }, i) => {
                const reached = i <= stepOf(order.status);
                return (
                  <li key={i} className="flex flex-col items-center text-center gap-[6px]">
                    <span className={`w-[40px] h-[40px] rounded-full flex items-center justify-center ${reached ? 'bg-primary text-primary-foreground' : 'bg-surface-container-high text-muted-foreground'}`}>
                      {reached && i < stepOf(order.status) ? <Check className="w-[18px] h-[18px]" /> : <Icon className="w-[18px] h-[18px]" />}
                    </span>
                    <span className={`text-[12px] font-semibold ${reached ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                  </li>
                );
              })}
            </ol>

            <div className="border-t border-border pt-[12px] space-y-[6px]">
              {order.order_items.map((it, i) => (
                <div key={i} className="flex justify-between text-[14px]">
                  <span>{it.quantity}× {it.product_name} ({it.size})</span>
                  <span>₪{it.price * it.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-[6px]">
                <span>{tx({ ar: 'المجموع', he: 'סה"כ', en: 'Total' })}</span><span>₪{order.total_amount}</span>
              </div>
              <p className="text-[12px] text-muted-foreground">
                {new Date(order.created_at).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
