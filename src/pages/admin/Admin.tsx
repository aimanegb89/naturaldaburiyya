import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, Plus, Pencil, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCatalogReload } from '@/contexts/CatalogContext';
import { dbToProduct, type DbProduct } from '@/lib/catalog';
import { enableAdminPush } from '@/lib/push';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QrDialog from '@/components/admin/QrDialog';

const CATEGORIES = ['juices', 'smoothies', 'supplements', 'bubbles', 'yogurt', 'proteins'] as const;
const CAT_AR: Record<string, string> = { juices: 'عصائر', smoothies: 'كوكتيلات', supplements: 'مكملات', bubbles: 'بابلز', yogurt: 'يوجورت', proteins: 'بروتينات' };

const empty: DbProduct = {
  id: '', name_ar: '', name_he: '', name_en: '', description_ar: '', description_he: '', description_en: '',
  category: 'juices', price_small: 0, price_large: 0, image_url: null, is_popular: false, is_available: true, sort_order: 999,
};

const pushMsg: Record<string, string> = {
  registered: 'تم تفعيل الإشعارات على هذا الجهاز',
  'not-configured': 'إعداد إشعارات الويب في Firebase غير مكتمل بعد',
  unsupported: 'هذا المتصفح لا يدعم الإشعارات (على iPhone أضف التطبيق إلى الشاشة الرئيسية أولاً)',
  'open-in-new-tab': 'افتح صفحة الإدارة في نافذة مستقلة ثم أعد المحاولة',
  denied: 'الإشعارات محظورة — فعّلها من إعدادات الموقع في المتصفح',
};

export default function Admin() {
  const { user, loading, signOut } = useAuth();
  const { reload } = useCatalogReload();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<DbProduct[]>([]);
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('sort_order');
    setRows((data ?? []) as DbProduct[]);
  };

  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data }) => {
      setIsAdmin(!!data);
      if (data) load();
    });
  }, [user]);

  if (loading) return null;
  if (!user) return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-[16px] bg-background p-[24px]">
      <h1 className="font-display text-[26px]">لوحة إدارة المتجر</h1>
      <Button asChild><Link to="/auth?next=/admin">تسجيل الدخول</Link></Button>
    </div>
  );
  if (isAdmin === false) return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-[24px] text-center text-[16px]">
      هذا الحساب ليس لديه صلاحية الإدارة.
    </div>
  );

  const toggle = async (r: DbProduct, v: boolean) => {
    setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, is_available: v } : x)));
    const { error } = await supabase.from('products').update({ is_available: v }).eq('id', r.id);
    if (error) { toast.error('فشل التحديث'); load(); return; }
    toast.success(v ? 'أصبح المنتج متوفرًا' : 'المنتج غير متوفر — سيصلك تذكير غدًا 16:50');
    reload();
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name_ar.trim() || (isNew && !/^[a-z0-9-]+$/.test(editing.id))) {
      toast.error('أدخل الاسم بالعربية ومعرّفًا بالإنجليزية (أحرف صغيرة وأرقام و -)'); return;
    }
    setSaving(true);
    let image_url = editing.image_url;
    if (file) {
      const path = `${editing.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const up = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (up.error) { toast.error('فشل رفع الصورة'); setSaving(false); return; }
      const { data } = await supabase.storage.from('product-images').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      image_url = data?.signedUrl ?? null;
    }
    const payload = { ...editing, image_url, price_small: Number(editing.price_small), price_large: Number(editing.price_large) };
    const { error } = isNew
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', editing.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('تم الحفظ');
    setEditing(null); setFile(null);
    load(); reload();
  };

  const set = (k: keyof DbProduct, v: unknown) => setEditing((e) => (e ? { ...e, [k]: v } : e));

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-outline-variant px-[16px] py-[12px] flex items-center gap-[8px]">
        <h1 className="font-display text-[20px] flex-1">إدارة المنتجات</h1>
        <QrDialog />
        <Button size="sm" variant="outline" onClick={async () => toast(pushMsg[await enableAdminPush(user.id)])}>
          <Bell className="w-[16px] h-[16px]" /> الإشعارات
        </Button>
        <Button size="sm" variant="outline" onClick={async () => {
          const { data, error } = await supabase.functions.invoke('availability-reminder', { body: { test: true } });
          toast(error ? 'فشل الإرسال' : data?.sent ? 'تم إرسال إشعار تجريبي' : 'لا توجد أجهزة مفعّلة');
        }}>تجربة</Button>
        <Button size="icon" variant="ghost" onClick={signOut} aria-label="خروج"><LogOut className="w-[18px] h-[18px]" /></Button>
      </header>

      <main className="max-w-[900px] mx-auto p-[16px] space-y-[10px]">
        <Button className="w-full" onClick={() => { setEditing({ ...empty }); setIsNew(true); setFile(null); }}>
          <Plus className="w-[18px] h-[18px]" /> منتج جديد
        </Button>
        {rows.map((r) => {
          const p = dbToProduct(r);
          return (
            <div key={r.id} className="flex items-center gap-[12px] bg-card rounded-[14px] p-[10px] shadow-soft">
              <img src={p.image} alt="" className="w-[56px] h-[56px] rounded-[10px] object-cover bg-surface-container" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[15px] truncate">{r.name_ar}</div>
                <div className="text-[12px] text-muted-foreground">{CAT_AR[r.category]} · ₪{r.price_small}{Number(r.price_large) ? ` / ₪${r.price_large}` : ''}</div>
              </div>
              <div className="flex flex-col items-center gap-[4px] w-[64px] shrink-0">
                <Switch checked={r.is_available} onCheckedChange={(v) => toggle(r, v)} />
                <span className={`text-[11px] ${r.is_available ? 'text-primary' : 'text-destructive'}`}>{r.is_available ? 'متوفر' : 'غير متوفر'}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => { setEditing({ ...r }); setIsNew(false); setFile(null); }} aria-label="تعديل">
                <Pencil className="w-[16px] h-[16px]" />
              </Button>
            </div>
          );
        })}
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isNew ? 'منتج جديد' : 'تعديل المنتج'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-[10px]">
              {isNew && <div><Label>المعرّف (بالإنجليزية)</Label><Input dir="ltr" value={editing.id} onChange={(e) => set('id', e.target.value.toLowerCase())} placeholder="mango-juice" /></div>}
              <div><Label>الاسم بالعربية</Label><Input value={editing.name_ar} onChange={(e) => set('name_ar', e.target.value)} /></div>
              <div><Label>الاسم بالعبرية</Label><Input value={editing.name_he} onChange={(e) => set('name_he', e.target.value)} /></div>
              <div><Label>الاسم بالإنجليزية</Label><Input dir="ltr" value={editing.name_en} onChange={(e) => set('name_en', e.target.value)} /></div>
              <div><Label>الوصف بالعربية</Label><Textarea value={editing.description_ar} onChange={(e) => set('description_ar', e.target.value)} /></div>
              <div><Label>الوصف بالعبرية</Label><Textarea value={editing.description_he} onChange={(e) => set('description_he', e.target.value)} /></div>
              <div><Label>الوصف بالإنجليزية</Label><Textarea dir="ltr" value={editing.description_en} onChange={(e) => set('description_en', e.target.value)} /></div>
              <div>
                <Label>الفئة</Label>
                <select className="w-full h-[40px] rounded-md border border-input bg-background px-[10px]" value={editing.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_AR[c]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-[10px]">
                <div><Label>سعر صغير ₪</Label><Input type="number" value={editing.price_small} onChange={(e) => set('price_small', e.target.value)} /></div>
                <div><Label>سعر كبير ₪</Label><Input type="number" value={editing.price_large} onChange={(e) => set('price_large', e.target.value)} /></div>
              </div>
              <div><Label>الصورة</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
              <div className="flex items-center justify-between"><Label>الأكثر طلبًا</Label><Switch checked={editing.is_popular} onCheckedChange={(v) => set('is_popular', v)} /></div>
              <div className="flex items-center justify-between"><Label>متوفر</Label><Switch checked={editing.is_available} onCheckedChange={(v) => set('is_available', v)} /></div>
              <Button className="w-full" disabled={saving} onClick={save}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
