import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, Package, ChefHat, CircleCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTx } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { orderItemName } from '@/lib/catalog';

type Tracked = {
  tracking_code: string;
  order_number?: number | null;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  order_items: { product_id?: string; product_name: string; size: string; quantity: number; price: number }[];
};

const stepOf = (s: string) => (s === 'done' || s === 'completed' ? 2 : s === 'preparing' ? 1 : 0);

export default function TrackOrder() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const tx = useTx();
  const { language } = useLanguage();
  const [code, setCode] = useState(urlCode ?? '');
  const [order, setOrder] = useState<Tracked | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    if (!user || urlCode) return;
    supabase.from('orders').select('id, tracking_code, order_number, status, total_amount, created_at, order_items(product_id, product_name, quantity)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setHistory(data ?? []));
  }, [user, urlCode]);
  const sizeLabel = (s: string) => s === 'large' ? tx({ ar: 'كبير', he: 'גדול', en: 'Large' }) : s === 'small' ? tx({ ar: 'صغير', he: 'קטן', en: 'Small' }) : s;
  const statusLabel = (s: string) => [tx({ ar: 'جديد', he: 'חדשה', en: 'New' }), tx({ ar: 'قيد التحضير', he: 'בהכנה', en: 'Preparing' }), tx({ ar: 'جاهز', he: 'מוכן', en: 'Done' })][stepOf(s)];

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
    if (!c) return;
    lookup(c);
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
        <h1 className="font-display text-[26px] font-bold mb-[6px]">{urlCode ? tx({ ar: 'تتبّع طلبك', he: 'מעקב הזמנה', en: 'Track your order' }) : tx({ ar: 'طلباتي', he: 'ההזמנות שלי', en: 'My orders' })}</h1>
        <p className="text-[14px] text-muted-foreground mb-[18px]">
          {tx({ ar: 'أدخل رقم الطلب لمعرفة حالته.', he: 'הזינו את מספר ההזמנה.', en: 'Enter your order number to see its status.' })}
        </p>

        <Tabs defaultValue="track" dir={language === 'en' ? 'ltr' : 'rtl'}>
        {!urlCode && (
          <TabsList className="grid grid-cols-2 w-full mb-[16px]">
            <TabsTrigger value="track">{tx({ ar: 'تتبّع طلب', he: 'מעקב', en: 'Track' })}</TabsTrigger>
            <TabsTrigger value="history">{tx({ ar: 'سجل الطلبات', he: 'היסטוריה', en: 'History' })}</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="track" className="mt-0">
        {!urlCode && (
          <form onSubmit={submit} className="bg-card rounded-[16px] p-[16px] shadow-soft space-y-[10px] mb-[18px]">
            <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder={tx({ ar: 'رقم الطلب (مثال: 482)', he: 'מספר הזמנה (לדוגמה 482)', en: 'Order number (e.g. 482)' })} className="font-mono uppercase" dir="ltr" />
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
                <p className="font-mono font-bold text-[18px]" dir="ltr">#{order.order_number ?? order.tracking_code}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-[6px] h-[34px] px-[12px]" onClick={() => { navigator.clipboard.writeText(link); toast.success(tx({ ar: 'تم نسخ الرابط', he: 'הקישור הועתק', en: 'Link copied' })); }}>
                <Copy className="w-[14px] h-[14px]" />{tx({ ar: 'نسخ الرابط', he: 'העתק קישור', en: 'Copy link' })}
              </Button>
            </div>

            <div>
              <div className="h-[10px] rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${[15, 55, 100][stepOf(order.status)]}%` }} />
              </div>
              <ol className="grid grid-cols-3 mt-[10px]">
                {steps.map(({ Icon, label }, i) => {
                  const reached = i <= stepOf(order.status);
                  return (
                    <li key={i} className={`flex items-center gap-[4px] text-[12px] font-semibold ${i === 0 ? 'justify-start' : i === 1 ? 'justify-center' : 'justify-end'} ${reached ? 'text-primary' : 'text-muted-foreground'}`}>
                      {reached && i < stepOf(order.status) ? <Check className="w-[14px] h-[14px]" /> : <Icon className="w-[14px] h-[14px]" />}{label}
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="border-t border-border pt-[12px] space-y-[6px]">
              {order.order_items.map((it, i) => (
                <div key={i} className="flex justify-between text-[14px]">
                  <span>{it.quantity}× {orderItemName(it.product_id, it.product_name, language)} ({sizeLabel(it.size)})</span>
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

        </TabsContent>
        {!urlCode && (
          <TabsContent value="history" className="mt-0">
          <section>
            {!user ? (
              <div className="bg-card rounded-[16px] p-[16px] text-center text-[14px] text-muted-foreground shadow-soft">
                {tx({ ar: 'سجّل الدخول لرؤية طلباتك السابقة.', he: 'התחברו כדי לראות הזמנות קודמות.', en: 'Sign in to see your past orders.' })}
                <Button className="mt-[10px] w-full" onClick={() => navigate('/auth?next=/orders')}>{tx({ ar: 'تسجيل الدخول', he: 'התחברות', en: 'Sign in' })}</Button>
              </div>
            ) : history.length === 0 ? (
              <p className="text-[14px] text-muted-foreground">{tx({ ar: 'لا توجد طلبات بعد.', he: 'אין הזמנות עדיין.', en: 'No orders yet.' })}</p>
            ) : (
              <ul className="space-y-[10px]">
                {history.map((h) => (
                  <li key={h.id}>
                    <button onClick={() => h.tracking_code && navigate(`/track/${h.tracking_code}`)} className="w-full text-start bg-card rounded-[14px] p-[14px] shadow-soft flex items-center gap-[12px] hover:bg-surface-container transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-[8px]">
                          <span className="font-mono font-bold" dir="ltr">#{h.order_number ?? h.tracking_code}</span>
                          <span className={`text-[11px] font-bold px-[8px] h-[22px] rounded-full inline-flex items-center ${stepOf(h.status) === 2 ? 'bg-surface-container-high text-muted-foreground' : 'bg-primary/15 text-primary'}`}>{statusLabel(h.status)}</span>
                        </div>
                        <p className="text-[13px] text-muted-foreground truncate mt-[2px]">
                          {(h.order_items ?? []).map((it: any) => `${orderItemName(it.product_id, it.product_name, language)}×${it.quantity}`).join('، ')}
                        </p>
                        <p className="text-[12px] text-muted-foreground mt-[2px]">{new Date(h.created_at).toLocaleDateString(language)}</p>
                      </div>
                      <span className="font-bold">₪{h.total_amount}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          </TabsContent>
        )}
        </Tabs>
      </div>
    </AppShell>
  );
}
