import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useAdminManifest } from '@/lib/installPrompt';
import { StatusPill, useStoreStatus } from '@/lib/storeStatus';
import { useNavigate } from 'react-router-dom';
const arTx = (m: { ar: string }) => m.ar;

/** Manager app shell: sign-in + admin gate, top title and Orders | Settings menu. */
export default function Admin() {
  const { user, loading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [roleError, setRoleError] = useState(false);
  useAdminManifest();
  const store = useStoreStatus();
  const navigate = useNavigate();

  useEffect(() => {
    setIsAdmin(null); setRoleError(false);
    if (!user) return;
    let cancelled = false;
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setRoleError(true); return; }
      setIsAdmin(!!data);
    });
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return null;
  if (!user) return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-[16px] bg-background p-[24px]">
      <h1 className="font-display text-[26px]">لوحة إدارة المتجر</h1>
      <Button asChild><Link to="/auth?next=/admin">تسجيل الدخول</Link></Button>
    </div>
  );
  if (roleError) return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-[12px] bg-background p-[24px] text-center text-[16px]">
      تعذر التحقق من الصلاحيات. تحقق من الاتصال وأعد المحاولة.
      <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
    </div>
  );
  if (isAdmin === null) return null;
  if (!isAdmin) return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-[24px] text-center text-[16px]">
      هذا الحساب ليس لديه صلاحية الإدارة.
    </div>
  );

  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex-1 flex items-center justify-center gap-[6px] h-[40px] rounded-full text-[14px] font-bold transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground'}`;

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-[24px]">
      <header className="sticky top-0 z-10 bg-card border-b border-outline-variant px-[16px] pt-[12px] pb-[10px] space-y-[10px]">
        <div className="flex items-center gap-[8px]">
          <h1 className="font-display text-[20px] flex-1">إدارة المتجر</h1>
          <StatusPill s={store} tx={arTx} lang="ar" onClick={() => { navigate('/admin/settings'); setTimeout(() => document.getElementById('store-availability')?.scrollIntoView({ behavior: 'smooth' }), 100); }} />
          <Button size="icon" variant="ghost" onClick={signOut} aria-label="خروج"><LogOut className="w-[18px] h-[18px]" /></Button>
        </div>
        <nav className="flex gap-[4px] p-[3px] bg-surface-container-high rounded-full max-w-[900px] mx-auto">
          <NavLink to="/admin" end className={tab}><ClipboardList className="w-[16px] h-[16px]" />الطلبات</NavLink>
          <NavLink to="/admin/settings" className={tab}><Settings className="w-[16px] h-[16px]" />الإعدادات</NavLink>
        </nav>
      </header>
      <div className="max-w-[900px] mx-auto p-[16px]">
        <Outlet />
      </div>
    </div>
  );
}
