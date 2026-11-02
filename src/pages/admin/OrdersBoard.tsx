import { useEffect, useState } from 'react';
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
  { key: 'done', label: 'جاهزة' },
] as const;
const NEXT: Record<string, { to: string; label: string } | undefined> = {
  new: { to: 'preparing', label: 'بدء التحضير' },
  preparing: { to: 'done', label: 'تم التجهيز' },
};
const bucket = (s: string) => (s === 'pending' ? 'new' : s === 'completed' ? 'done' : s);

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<string>('new');

  const load = async () => {
    const { data: st } = await supabase.from('store_settings').select('auto_done_minutes').eq('id', 1).maybeSingle();
    await supabase.from('orders').update({ status: 'done' }).in('status', ['new', 'preparing'])
      .lt('created_at', new Date(Date.now() - (st?.auto_done_minutes ?? 60) * 60000).toISOString());
    const { data } = await supabase.from('orders')
      .select('id,order_number,status,total_amount,notes,created_at,customer_name,customer_phone,delivery_address,order_items(product_name,size,quantity,price,product_id)')
      .order('created_at', { ascending: false }).limit(200);
    setOrders((data ?? []) as Order[]);
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
          <div key={o.id} className="bg-card rounded-[14px] p-[14px] shadow-soft space-y-[8px] text-start">
            <div className="flex items-center justify-between gap-[8px]">
              <div className="font-bold text-[16px]">{o.customer_name || 'زبون'}</div>
              <div className="text-[12px] text-muted-foreground">
                #{(o as any).order_number ?? o.id.slice(0, 6)} · {new Date(o.created_at).toLocaleString('ar', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' })}
              </div>
            </div>
            {o.delivery_address && <div className="flex items-center gap-[6px] text-[13px]"><MapPin className="w-[14px] h-[14px] shrink-0" />{o.delivery_address}</div>}
            <ul className="text-[14px] space-y-[2px]">
              {o.order_items.map((i, k) => (
                <li key={k} className="flex justify-between gap-[8px]">
                  <span>{names[i.product_id] ?? i.product_name} · {i.size === 'large' ? 'كبير' : 'صغير'} × {i.quantity}</span>
                  <span>₪{Number(i.price) * i.quantity}</span>
                </li>
              ))}
            </ul>
            {o.notes && <div className="text-[13px] bg-surface-container rounded-[8px] p-[8px]">{o.notes}</div>}
            <div className="flex items-center justify-between font-bold text-[15px] border-t border-outline-variant pt-[8px]">
              <span>المجموع</span><span className="text-primary">₪{Number(o.total_amount)}</span>
            </div>
            <div className="flex gap-[6px] flex-wrap">
              {o.customer_phone && <>
                <Button size="sm" variant="outline" asChild><a href={`tel:${o.customer_phone}`}><Phone className="w-[14px] h-[14px]" />اتصال</a></Button>
                <Button size="sm" variant="outline" asChild><a href={`https://wa.me/${intl(o.customer_phone)}`} target="_blank" rel="noreferrer"><MessageCircle className="w-[14px] h-[14px]" />واتساب</a></Button>
              </>}
              {next && <Button size="sm" className="ms-auto" onClick={() => move(o, next.to)}>{next.label}</Button>}
              {bucket(o.status) !== 'new' && <Button size="sm" variant="ghost" onClick={() => move(o, bucket(o.status) === 'done' ? 'preparing' : 'new')}>رجوع</Button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
