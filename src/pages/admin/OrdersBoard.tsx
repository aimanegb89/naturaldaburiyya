import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Phone, MessageCircle, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type Item = { product_name: string; size: string; quantity: number; price: number; product_id: string };
type Order = {
  id: string; status: string; total_amount: number; notes: string | null; created_at: string;
  customer_name: string | null; customer_phone: string | null; delivery_address: string | null;
  order_items: Item[];
};

const TABS = [
  { key: 'new', label: 'جديدة' },
  { key: 'preparing', label: 'قيد التحضير' },
  { key: 'done', label: 'جاهزة / سُلّمت' },
] as const;
const NEXT: Record<string, { to: string; label: string } | undefined> = {
  new: { to: 'preparing', label: 'بدء التحضير' },
  preparing: { to: 'done', label: 'جاهز — تم التسليم' },
};


/** Short soft chime + vibration for a new order. */
export function chime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    });
  } catch { /* audio blocked */ }
  navigator.vibrate?.([200, 100, 200]);
}
const bucket = (s: string) => (s === 'pending' ? 'new' : s === 'completed' ? 'done' : s);

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<string>('new');

  const seen = useRef<Set<string> | null>(null);
  const chimeOn = useRef(true);
  const [warnMin, setWarnMin] = useState(15);
  useEffect(() => {
    supabase.from('store_settings').select('chime_enabled,stale_warn_minutes').eq('id', 1).maybeSingle().then(({ data }) => {
      if (!data) return;
      chimeOn.current = data.chime_enabled;
      setWarnMin(data.stale_warn_minutes);
    });
  }, []);
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 60000); return () => clearInterval(id); }, []);
  const load = async () => {
    // Server-side sweep (uses the last status change, so "back" sticks).
    await supabase.rpc('auto_done_sweep');
    const { data } = await supabase.from('orders')
      .select('id,order_number,status,total_amount,notes,created_at,customer_name,customer_phone,delivery_address,order_items(product_name,size,quantity,price,product_id)')
      .order('created_at', { ascending: false }).limit(200);
    const list = (data ?? []) as Order[];
    const ids = new Set(list.map((o) => o.id));
    if (seen.current && list.some((o) => !seen.current!.has(o.id) && bucket(o.status) === 'new') && chimeOn.current) chime();
    seen.current = ids;
    setOrders(list);
  };

  useEffect(() => {
    load();
    supabase.from('products').select('id,name_ar').then(({ data }) =>
      setNames(Object.fromEntries((data ?? []).map((p) => [p.id, p.name_ar]))));
    const ch = supabase.channel('orders-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const move = async (o: Order, to: string) => {
    setOrders((xs) => xs.map((x) => (x.id === o.id ? { ...x, status: to } : x)));
    const { error } = await supabase.from('orders').update({ status: to }).eq('id', o.id);
    if (error) { toast.error('فشل التحديث'); load(); }
  };

  const newCount = orders.filter((o) => bucket(o.status) === 'new').length;
  useEffect(() => {
    const base = 'Natural Admin';
    document.title = newCount ? `(${newCount}) ${base}` : base;
    return () => { document.title = base; };
  }, [newCount]);
  const minsAgo = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

  const shown = orders.filter((o) => bucket(o.status) === tab);
  const count = (k: string) => orders.filter((o) => bucket(o.status) === k).length;
  const intl = (p: string) => { const d = p.replace(/\D/g, ''); return d.startsWith('0') ? '972' + d.slice(1) : d; };

  return (
    <div className="space-y-[12px]">
      <div className="grid grid-cols-3 gap-[6px]">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`h-[44px] rounded-[12px] text-[14px] font-bold border transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-outline-variant'}`}>
            {t.label} <span className="text-[12px] opacity-80">({count(t.key)})</span>
          </button>
        ))}
      </div>

      {shown.length === 0 && <p className="text-center text-muted-foreground text-[14px] py-[40px]">لا توجد طلبات هنا</p>}

      {shown.map((o) => {
        const next = NEXT[bucket(o.status)];
        return (
          <div key={o.id} className={`bg-card rounded-[14px] p-[14px] shadow-soft space-y-[8px] text-start ${bucket(o.status) !== 'done' && minsAgo(o.created_at) >= warnMin ? 'ring-2 ring-destructive' : ''}`}>
            <div className="flex items-center justify-between gap-[8px]">
              <div className="font-bold text-[16px]">{o.customer_name || 'زبون'}</div>
              <div className="text-[12px] text-muted-foreground">
                <bdi dir="ltr">#{(o as any).order_number ?? o.id.slice(0, 6)}</bdi> · <span className={bucket(o.status) !== 'done' && minsAgo(o.created_at) >= warnMin ? 'text-destructive font-bold' : ''}>قبل {minsAgo(o.created_at)} د</span> · {new Date(o.created_at).toLocaleString('ar', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' })}
              </div>
            </div>
            {o.delivery_address && <div className="flex items-center gap-[6px] text-[13px]"><MapPin className="w-[14px] h-[14px] shrink-0" />{o.delivery_address}</div>}
            <ul className="text-[14px] space-y-[2px]">
              {o.order_items.map((i, k) => (
                <li key={k} className="flex justify-between gap-[8px]">
                  <span>{names[i.product_id] ?? i.product_name} · {i.size === 'large' ? 'كبير' : 'صغير'} × {i.quantity}</span>
                  <bdi dir="ltr">₪{Number(i.price) * i.quantity}</bdi>
                </li>
              ))}
            </ul>
            {o.notes && <div className="text-[13px] bg-surface-container rounded-[8px] p-[8px]">{o.notes}</div>}
            <div className="flex items-center justify-between font-bold text-[15px] border-t border-outline-variant pt-[8px]">
              <span>المجموع</span><bdi dir="ltr" className="text-primary">₪{Number(o.total_amount)}</bdi>
            </div>
            <div className="flex gap-[6px] flex-wrap">
              {o.customer_phone && <>
                <Button size="sm" variant="outline" asChild><a href={`tel:${o.customer_phone}`} aria-label={`اتصال ${o.customer_phone}`}><Phone className="w-[14px] h-[14px]" />اتصال</a></Button>
                <Button size="sm" variant="outline" asChild><a href={`https://wa.me/${intl(o.customer_phone)}`} target="_blank" rel="noreferrer"><MessageCircle className="w-[14px] h-[14px]" />واتساب</a></Button>
              </>}
              {bucket(o.status) !== 'new' && <Button size="sm" variant="ghost" className="ms-auto" onClick={() => move(o, bucket(o.status) === 'done' ? 'preparing' : 'new')}>رجوع</Button>}
            </div>
            {next && <Button className="w-full h-[52px] text-[16px] font-bold" onClick={() => move(o, next.to)}>{next.label}</Button>}
          </div>
        );
      })}
    </div>
  );
}
