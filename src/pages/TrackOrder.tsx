import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, Package, ChefHat, CircleCheck, RotateCcw, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTx } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCatalogProduct, hasSizes, isAvailable, orderItemName, unitPrice } from '@/lib/catalog';
import { useCart } from '@/contexts/CartContext';
import { useOpenCart } from '@/contexts/CartDrawerContext';

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
  const [prep, setPrep] = useState('10–15');
  useEffect(() => {
    supabase.from('store_settings').select('prep_time_text').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data?.prep_time_text) setPrep(data.prep_time_text); });
  }, []);
  const { language } = useLanguage();
  const [order, setOrder] = useState<Tracked | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    if (!user || urlCode) return;
    supabase.from('orders').select('id, tracking_code, order_number, status, total_amount, created_at, order_items(product_id, product_name, size, quantity)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setHistory(data ?? []));
  }, [user, urlCode]);
  const sizeLabel = (s: string) => s === 'large' ? tx({ ar: 'كبير', he: 'גדול', en: 'Large' }) : s === 'small' ? tx({ ar: 'صغير', he: 'קטן', en: 'Small' }) : s;
  const statusLabel = (s: string) => [tx({ ar: 'جديد', he: 'חדשה', en: 'New' }), tx({ ar: 'قيد التحضير', he: 'בהכנה', en: 'Preparing' }), tx({ ar: 'جاهز', he: 'מוכן', en: 'Done' })][stepOf(s)];

  const { addItem, updateQuantity } = useCart();
  const openCart = useOpenCart();
  const reorder = (its: { product_id?: string; size?: string; quantity: number }[]) => {
    let added = 0;
    for (const it of its) {
      const p = it.product_id ? getCatalogProduct(it.product_id) : undefined;
      if (!p || !isAvailable(p)) continue;
      const size = hasSizes(p) && it.size === 'large' ? 'large' : 'small';
      addItem({ id: p.id, nameAr: p.nameAr, nameHe: p.nameHe, nameEn: p.nameEn, size, price: unitPrice(p, size), image: p.img });
      if (it.quantity > 1) updateQuantity(p.id, size, it.quantity);
      added++;
    }
    if (added) openCart();
    else toast.error(tx({ ar: 'منتجات هذا الطلب غير متوفرة الآن', he: 'המוצרים בהזמנה זו אזלו', en: 'Items from this order are unavailable now' }));
  };
  // Poll only while the tab is visible.
  const useVisiblePoll = (fn: () => void, enabled: boolean) => useEffect(() => {
    if (!enabled) return;
    const tick = () => { if (document.visibilityState === 'visible') fn(); };
    const id = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [fn, enabled]);

  const lookup = useCallback(async (c: string, silent = false) => {
    if (!silent) { setLoading(true); setNotFound(false); }
    const { data, error } = await supabase.functions.invoke('track-order', { body: { code: c } });
    if (!silent) setLoading(false);
    if (error || !data?.tracking_code) { if (!silent) { setOrder(null); setNotFound(true); } return; }
    setOrder(data as Tracked);
  }, []);

  useEffect(() => { if (urlCode) lookup(urlCode); }, [urlCode, lookup]);

  const [active, setActive] = useState<Tracked[]>([]);
  const loadActive = useCallback(async () => {
    let saved: string[] = [];
    try { saved = JSON.parse(localStorage.getItem('natural-my-orders') || '[]'); } catch { /* ignore */ }
    let mine: string[] = [];
    if (user) {
      const { data } = await supabase.from('orders').select('tracking_code').eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 2 * 86400000).toISOString());
      mine = (data ?? []).map((r: any) => r.tracking_code).filter(Boolean);
    }
    const codes = Array.from(new Set([...saved, ...mine]));
    if (!codes.length) { setActive([]); return; }
    const { data } = await supabase.functions.invoke('track-order', { body: { codes } });
    const all: Tracked[] = data?.orders ?? [];
    const fresh = all.filter((o) => stepOf(o.status) < 2 || Date.now() - new Date(o.updated_at).getTime() < 30 * 60000)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    setActive(fresh);
    const keep = new Set(fresh.map((o) => o.tracking_code));
    localStorage.setItem('natural-my-orders', JSON.stringify(saved.filter((c) => keep.has(c) || !all.some((o) => o.tracking_code === c))));
  }, [user]);
  const [activeLoaded, setActiveLoaded] = useState(false);
  useEffect(() => { if (!urlCode) loadActive().finally(() => setActiveLoaded(true)); }, [urlCode, loadActive]);
  useVisiblePoll(loadActive, !urlCode && active.some((o) => stepOf(o.status) < 2));
  const refreshOrder = useCallback(() => { if (order) lookup(order.tracking_code, true); }, [order, lookup]);
  useVisiblePoll(refreshOrder, !!order && stepOf(order.status) < 2);

  const minsAgo = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  const statusLine = (o: Tracked) => {
    const st = stepOf(o.status);
    if (st === 2) return tx({ ar: 'طلبك جاهز. بالهناء والعافية!', he: 'ההזמנה מוכנה. בתיאבון!', en: 'Your order is ready. Enjoy!' });
    if (st === 1) return tx({ ar: `نحضّر طلبك الآن — عادةً خلال ${prep} دقيقة`, he: `מכינים את ההזמנה — בדרך כלל ${prep} דקות`, en: `We are preparing your order — usually ${prep} min` });
    return tx({ ar: 'استلمنا طلبك وسنبدأ بتحضيره قريبًا', he: 'קיבלנו את ההזמנה ונתחיל להכין בקרוב', en: 'We got your order and will start soon' });
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
          {tx({ ar: 'طلباتك الحالية تظهر هنا تلقائيًا.', he: 'ההזמנות הפעילות שלכם מופיעות כאן אוטומטית.', en: 'Your live orders show up here automatically.' })}
        </p>

        <Tabs defaultValue="track" dir={language === 'en' ? 'ltr' : 'rtl'}>
        {!urlCode && (
          <TabsList className="grid grid-cols-2 w-full mb-[16px]">
            <TabsTrigger value="track">{tx({ ar: 'تتبّع طلب', he: 'מעקב', en: 'Track' })}</TabsTrigger>
            <TabsTrigger value="history">{tx({ ar: 'سجل الطلبات', he: 'היסטוריה', en: 'History' })}</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="track" className="mt-0">
        {!urlCode && active.length > 0 && (
          <ul className="space-y-[10px] mb-[18px]">
            {active.map((o) => {
              const st = stepOf(o.status);
              return (
                <li key={o.tracking_code}>
                  <button onClick={() => navigate(`/track/${o.tracking_code}`)} className="w-full text-start bg-card rounded-[16px] p-[14px] shadow-soft space-y-[10px]">
                    <div className="flex items-center justify-between gap-[8px]">
                      <span className="font-mono font-bold text-[16px]" dir="ltr">#{o.order_number ?? o.tracking_code}</span>
                      <span className="font-bold"><bdi dir="ltr">₪{o.total_amount}</bdi></span>
                    </div>
                    <p className="text-[14px] font-semibold">{statusLine(o)} <span className="text-muted-foreground font-normal">· {tx({ ar: `قبل ${minsAgo(o.created_at)} د`, he: `לפני ${minsAgo(o.created_at)} דק׳`, en: `${minsAgo(o.created_at)} min ago` })}</span></p>
                    <div className="h-[8px] rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${[15, 55, 100][st]}%` }} />
                    </div>
                    <div className="grid grid-cols-3 text-[12px] font-semibold">
                      {steps.map(({ label }, i) => (
                        <span key={i} className={`${i === 0 ? 'text-start' : i === 1 ? 'text-center' : 'text-end'} ${i <= st ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
                      ))}
                    </div>
                    <p className="text-[13px] text-muted-foreground truncate">
                      {o.order_items.map((it) => `${orderItemName(it.product_id, it.product_name, language)}×${it.quantity}`).join('، ')}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!urlCode && activeLoaded && active.length === 0 && (
          <div className="bg-card rounded-[16px] p-[24px] shadow-soft text-center mb-[18px]">
            <ShoppingBag className="w-[32px] h-[32px] mx-auto text-muted-foreground mb-[8px]" />
            <p className="text-[15px] font-semibold mb-[4px]">{tx({ ar: 'لا توجد طلبات جارية', he: 'אין הזמנות פעילות', en: 'No live orders' })}</p>
            <p className="text-[14px] text-muted-foreground mb-[12px]">{tx({ ar: 'عند طلبك التالي ستتابع حالته هنا.', he: 'בהזמנה הבאה תוכלו לעקוב כאן.', en: 'Your next order will show up here.' })}</p>
            <Button onClick={() => navigate('/shop')}>{tx({ ar: 'تسوّق الآن', he: 'לחנות', en: 'Shop now' })}</Button>
          </div>
        )}

        {loading && <div className="h-[160px] rounded-[16px] bg-surface-container animate-pulse" />}
        {notFound && !loading && (
          <div className="bg-card rounded-[16px] p-[16px] text-center text-[14px] text-muted-foreground">
            {tx({ ar: 'لم نجد طلبًا بهذه البيانات.', he: 'לא נמצאה הזמנה.', en: 'No order found with these details.' })}
            {urlCode && <Button variant="link" onClick={() => navigate('/orders')}>{tx({ ar: 'طلباتي', he: 'ההזמנות שלי', en: 'My orders' })}</Button>}
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

            <p className="text-[15px] font-semibold">{statusLine(order)}</p>
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
                          <span className={`text-[12px] font-bold px-[8px] h-[22px] rounded-full inline-flex items-center ${stepOf(h.status) === 2 ? 'bg-surface-container-high text-muted-foreground' : 'bg-primary/15 text-primary'}`}>{statusLabel(h.status)}</span>
                        </div>
                        <p className="text-[13px] text-muted-foreground truncate mt-[2px]">
                          {(h.order_items ?? []).map((it: any) => `${orderItemName(it.product_id, it.product_name, language)}×${it.quantity}`).join('، ')}
                        </p>
                        <p className="text-[12px] text-muted-foreground mt-[2px]">{new Date(h.created_at).toLocaleDateString(language)}</p>
                      </div>
                      <span className="font-bold"><bdi dir="ltr">₪{h.total_amount}</bdi></span>
                    </button>
                    <Button variant="outline" size="sm" className="mt-[6px] w-full gap-[6px] h-[44px]" onClick={() => reorder(h.order_items ?? [])}>
                      <RotateCcw className="w-[16px] h-[16px]" />{tx({ ar: 'اطلب مرة أخرى', he: 'הזמנה חוזרת', en: 'Reorder' })}
                    </Button>
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
