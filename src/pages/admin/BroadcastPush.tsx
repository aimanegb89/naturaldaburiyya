import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type L = { ar: string; he: string; en: string };
const empty: L = { ar: '', he: '', en: '' };
const inputCls = 'w-full rounded-[10px] border border-input bg-background px-[10px] py-[8px] text-[14px]';

/** Manager: send a notification to all customers who allowed notifications. */
export default function BroadcastPush() {
  const [title, setTitle] = useState<L>(empty);
  const [body, setBody] = useState<L>(empty);
  const [link, setLink] = useState('/');
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<{ id: string; title: L; delivered: number; targeted: number; created_at: string }[]>([]);

  const load = async () => {
    const { data } = await supabase.functions.invoke('broadcast-push', { body: { title: { ar: 'x', he: '', en: '' }, body: empty, dry_run: true } });
    setCount(data?.targeted ?? 0);
    const { data: h } = await supabase.from('push_broadcasts').select('id,title,delivered,targeted,created_at').order('created_at', { ascending: false }).limit(5);
    setHistory((h as never) ?? []);
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!title.ar.trim() || !body.ar.trim()) { toast.error('اكتب العنوان والنص بالعربية على الأقل'); return; }
    if (!/^\/[A-Za-z0-9/_\-?=&#.%]*$/.test(link)) { toast.error('الرابط يجب أن يبدأ بـ /'); return; }
    if (!confirm(`إرسال الإشعار إلى ${count ?? 0} جهاز؟`)) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('broadcast-push', { body: { title, body, link } });
    setBusy(false);
    if (error || !data?.ok) { toast.error('فشل الإرسال'); return; }
    toast.success(`تم الإرسال إلى ${data.delivered} من ${data.targeted}`);
    setTitle(empty); setBody(empty); load();
  };

  const field = (lang: keyof L, label: string, dir: 'rtl' | 'ltr') => (
    <div className="space-y-[4px]" dir={dir}>
      <p className="text-[12px] font-semibold text-muted-foreground">{label}</p>
      <input className={inputCls} placeholder="العنوان" value={title[lang]} maxLength={100} onChange={(e) => setTitle({ ...title, [lang]: e.target.value })} />
      <textarea className={inputCls} rows={2} placeholder="النص" value={body[lang]} maxLength={200} onChange={(e) => setBody({ ...body, [lang]: e.target.value })} />
    </div>
  );

  return (
    <section className="space-y-[12px] text-start">
      <p className="text-[13px] text-muted-foreground">الأجهزة المشتركة: <b>{count ?? '…'}</b>. كل زبون يستلم الإشعار بلغته (أو بالعربية إذا تُركت لغته فارغة).</p>
      {field('ar', 'العربية (مطلوب)', 'rtl')}
      {field('he', 'עברית (اختياري)', 'rtl')}
      {field('en', 'English (optional)', 'ltr')}
      <div className="space-y-[4px]">
        <p className="text-[12px] font-semibold text-muted-foreground">الصفحة عند الضغط</p>
        <select className={inputCls} value={link} onChange={(e) => setLink(e.target.value)}>
          <option value="/">الرئيسية</option>
          <option value="/shop">المتجر</option>
          <option value="/contact">التواصل وساعات العمل</option>
        </select>
      </div>
      <Button className="w-full h-[42px]" disabled={busy || !count} onClick={send}>{busy ? '...' : 'إرسال'}</Button>
      {history.length > 0 && (
        <div className="space-y-[4px] pt-[4px]">
          <p className="text-[12px] font-bold text-muted-foreground">آخر الإرسالات</p>
          {history.map((h) => (
            <p key={h.id} className="text-[12px] flex justify-between gap-[8px]"><span className="truncate">{h.title.ar}</span><bdi dir="ltr" className="shrink-0 text-muted-foreground">{h.delivered}/{h.targeted} · {new Date(h.created_at).toLocaleDateString('en-GB')}</bdi></p>
          ))}
        </div>
      )}
    </section>
  );
}
