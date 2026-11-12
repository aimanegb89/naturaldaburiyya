import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Phone, MessageCircle, MapPin, Banknote, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const REASONS = [
  { key: 'out_of_stock', label: 'نفاد المنتج' },
  { key: 'closing', label: 'المحل يغلق' },
  { key: 'customer', label: 'بطلب من الزبون' },
  { key: 'other', label: 'سبب آخر' },
] as const;
const reasonLabel = (r?: string | null) => REASONS.find((x) => x.key === r)?.label ?? r ?? '';

const payInfo = (o: { notes: string | null; payment_method?: string | null }) => {
  const m = (o.notes || '').match(/^(Cash|Card)(\s*·\s*)?/i);
  const method = o.payment_method || (m ? m[1].toLowerCase() : null);
  const note = m ? (o.notes || '').slice(m[0].length).trim() : o.notes;
  return { method, note };
};

type Item = { product_name: string; size: string; quantity: number; price: number; product_id: string };
type Order = {
  id: string; status: string; total_amount: number; notes: string | null; payment_method?: string | null; created_at: string;
  cancel_reason?: string | null; order_number?: number | null;
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


import { systemNotify } from '@/lib/push';
const bucket = (s: string) => (s === 'pending' ? 'new' : s === 'completed' || s === 'cancelled' ? 'done' : s);

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
      .select('id,order_number,status,cancel_reason,total_amount,notes,payment_method,created_at,customer_name,customer_phone,delivery_address,order_items(product_name,size,quantity,price,product_id)')
      .order('created_at', { ascending: false }).limit(200);
    const list = (data ?? []) as Order[];
    const ids = new Set(list.map((o) => o.id));
    const fresh = seen.current ? list.filter((o) => !seen.current!.has(o.id) && bucket(o.status) === 'new') : [];
    // Only when visible: in the background the push from the server already alerts (no duplicates).
    if (fresh.length && chimeOn.current && document.visibilityState === 'visible') {
      const o = fresh[0];
      systemNotify(`طلب جديد #${o.order_number ?? ''} – ₪${o.total_amount}`, o.customer_name ?? '');
    }
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

  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [reason, setReason] = useState<string>('out_of_stock');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmCancel = async () => {
    if (!cancelling || busy) return;
    if (reason === 'other' && !note.trim()) { toast.error('اكتب سبب الإلغاء'); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('cancel-order', { body: { order_id: cancelling.id, reason, note: note.trim() } });
    setBusy(false);
    if (error || !data?.ok) toast.error('لا يمكن إلغاء هذا الطلب (ربما أُلغي أو اكتمل)');
    else toast.success(data.pushed ? 'تم إلغاء الطلب وإعلام الزبون' : 'تم إلغاء الطلب (الزبون لم يفعّل الإشعارات)');
    setCancelling(null); setNote(''); setReason('out_of_stock');
    load();
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
        const pay = payInfo(o);
        return (
          <div key={o.id} className={`bg-card rounded-[14px] p-[14px] shadow-soft space-y-[8px] text-start ${bucket(o.status) !== 'done' && minsAgo(o.created_at) >= warnMin ? 'ring-2 ring-destructive' : ''}`}>
            <div className="flex items-center justify-between gap-[8px]">
              <div className="font-bold text-[16px]">{o.customer_name || 'زبون'}</div>
              <div className="text-[12px] text-muted-foreground">
                <bdi dir="ltr">#{(o as any).order_number ?? o.id.slice(0, 6)}</bdi> · <span className={bucket(o.status) !== 'done' && minsAgo(o.created_at) >= warnMin ? 'text-destructive font-bold' : ''}>قبل {minsAgo(o.created_at)} د</span> · {new Date(o.created_at).toLocaleString('ar', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' })}
              </div>
            </div>
            {o.delivery_address && <div className="flex items-center gap-[6px] text-[13px]"><MapPin className="w-[14px] h-[14px] shrink-0" />{o.delivery_address === 'pickup' ? 'استلام من المحل' : o.delivery_address}</div>}
            <ul className="text-[14px] space-y-[2px]">
              {o.order_items.map((i, k) => (
                <li key={k} className="flex justify-between gap-[8px]">
                  <span>{names[i.product_id] ?? i.product_name} · {i.size === 'large' ? 'كبير' : 'صغير'} × {i.quantity}</span>
                  <bdi dir="ltr">₪{Number(i.price) * i.quantity}</bdi>
                </li>
              ))}
            </ul>
            {pay.method && (
              <div className="inline-flex items-center gap-[6px] text-[13px] font-semibold rounded-full bg-primary/10 text-primary px-[10px] py-[4px]" title={pay.method === 'card' ? 'بطاقة عند الاستلام' : 'نقدًا عند الاستلام'}>
                {pay.method === 'card' ? <CreditCard className="w-[16px] h-[16px]" /> : <Banknote className="w-[16px] h-[16px]" />}
                {pay.method === 'card' ? 'بطاقة' : 'نقدًا'}
              </div>
            )}
            {pay.note && <div className="text-[13px] bg-surface-container rounded-[8px] p-[8px]">{pay.note}</div>}
            <div className="flex items-center justify-between font-bold text-[15px] border-t border-outline-variant pt-[8px]">
              <span>المجموع</span><bdi dir="ltr" className="text-primary">₪{Number(o.total_amount)}</bdi>
            </div>
            <div className="flex gap-[6px] flex-wrap">
              {o.customer_phone && <>
                <Button size="sm" variant="outline" asChild><a href={`tel:${o.customer_phone}`} aria-label={`اتصال ${o.customer_phone}`}><Phone className="w-[14px] h-[14px]" />اتصال</a></Button>
                <Button size="sm" variant="outline" asChild><a href={`https://wa.me/${intl(o.customer_phone)}`} target="_blank" rel="noreferrer"><MessageCircle className="w-[14px] h-[14px]" />واتساب</a></Button>
              </>}
              {o.status === 'cancelled' && <span className="inline-flex items-center gap-[4px] text-[12px] font-bold rounded-full bg-destructive/12 text-destructive px-[10px] h-[26px]"><XCircle className="w-[14px] h-[14px]" />ملغى{o.cancel_reason ? ` · ${reasonLabel(o.cancel_reason)}` : ''}</span>}
              {next && <Button size="sm" variant="ghost" className="text-destructive ms-auto" onClick={() => setCancelling(o)}><XCircle className="w-[14px] h-[14px]" />إلغاء الطلب</Button>}
              {bucket(o.status) !== 'new' && o.status !== 'cancelled' && <Button size="sm" variant="ghost" className="ms-auto" onClick={() => move(o, bucket(o.status) === 'done' ? 'preparing' : 'new')}>رجوع</Button>}
            </div>
            {next && <Button className="w-full h-[52px] text-[16px] font-bold" onClick={() => move(o, next.to)}>{next.label}</Button>}
          </div>
        );
      })}

      <AlertDialog open={!!cancelling} onOpenChange={(v) => { if (!v && !busy) setCancelling(null); }}>
        <AlertDialogContent dir="rtl" className="text-start">
          <AlertDialogHeader className="text-start sm:text-start">
            <AlertDialogTitle>إلغاء الطلب؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء الطلب <bdi dir="ltr" className="font-bold">#{cancelling?.order_number ?? cancelling?.id.slice(0, 6)}</bdi> لـ {cancelling?.customer_name || 'زبون'}؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-[6px]">
            {REASONS.map((r) => (
              <button key={r.key} type="button" onClick={() => setReason(r.key)}
                className={`h-[40px] rounded-[10px] border text-[13px] font-semibold ${reason === r.key ? 'border-destructive bg-destructive/10 text-destructive' : 'border-outline-variant'}`}>{r.label}</button>
            ))}
          </div>
          {reason === 'other' && <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="اكتب السبب" className="h-[40px] rounded-[10px] border border-input bg-background px-[10px] text-[14px]" />}
          <AlertDialogFooter className="gap-[8px] sm:gap-[8px]">
            <AlertDialogCancel disabled={busy}>رجوع</AlertDialogCancel>
            <AlertDialogAction disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={(e) => { e.preventDefault(); confirmCancel(); }}>
              {busy ? '...' : 'تأكيد الإلغاء'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
