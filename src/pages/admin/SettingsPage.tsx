import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { enableAdminPush } from '@/lib/push';
import { Button } from '@/components/ui/button';
import QrDialog from '@/components/admin/QrDialog';
import ProductsManager from './ProductsManager';
import ThemeToggle from '@/components/ThemeToggle';

const pushMsg: Record<string, string> = {
  registered: 'تم تفعيل الإشعارات على هذا الجهاز',
  'not-configured': 'إعداد إشعارات الويب في Firebase غير مكتمل بعد',
  unsupported: 'هذا المتصفح لا يدعم الإشعارات (على iPhone أضف التطبيق إلى الشاشة الرئيسية أولاً)',
  'open-in-new-tab': 'افتح صفحة الإدارة في نافذة مستقلة ثم أعد المحاولة',
  denied: 'الإشعارات محظورة — فعّلها من إعدادات الموقع في المتصفح',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-[14px] p-[14px] shadow-soft space-y-[10px] text-start">
      <h2 className="font-bold text-[16px]">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [channel, setChannel] = useState<'push' | 'whatsapp' | null>(null);

  useEffect(() => {
    supabase.from('store_settings').select('order_channel').eq('id', 1).maybeSingle()
      .then(({ data }) => setChannel((data?.order_channel as 'push' | 'whatsapp') ?? 'push'));
  }, []);

  const saveChannel = async (v: 'push' | 'whatsapp') => {
    const prev = channel; setChannel(v);
    const { error } = await supabase.from('store_settings').update({ order_channel: v, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) { setChannel(prev); toast.error('فشل الحفظ'); } else toast.success('تم الحفظ');
  };

  const opt = (v: 'push' | 'whatsapp', label: string, desc: string) => (
    <button onClick={() => saveChannel(v)}
      className={`flex-1 rounded-[12px] border p-[10px] text-start transition-colors ${channel === v ? 'border-primary bg-primary/10' : 'border-outline-variant'}`}>
      <div className="font-bold text-[14px]">{label}</div>
      <div className="text-[12px] text-muted-foreground">{desc}</div>
    </button>
  );

  return (
    <div className="space-y-[14px]">
      <Section title="استلام الطلبات">
        <div className="flex gap-[8px]">
          {opt('push', 'إشعار للتطبيق', 'الطلب يصل إلى صفحة الطلبات مع إشعار')}
          {opt('whatsapp', 'رسالة واتساب', 'يُحفظ الطلب ويُفتح واتساب للزبون أيضًا')}
        </div>
      </Section>

      <Section title="الإشعارات على هذا الجهاز">
        <div className="flex gap-[8px] flex-wrap">
          <Button size="sm" variant="outline" onClick={async () => user && toast(pushMsg[await enableAdminPush(user.id)])}>
            <Bell className="w-[16px] h-[16px]" /> تفعيل الإشعارات
          </Button>
          <Button size="sm" variant="outline" onClick={async () => {
            const { data, error } = await supabase.functions.invoke('availability-reminder', { body: { test: true } });
            toast(error ? 'فشل الإرسال' : data?.sent ? 'تم إرسال إشعار تجريبي' : 'لا توجد أجهزة مفعّلة');
          }}><Send className="w-[16px] h-[16px]" /> إرسال تجربة</Button>
          <QrDialog />
        </div>
      </Section>

      <Section title="المظهر">
        <ThemeToggle withLabels />
      </Section>
      <Section title="إدارة القائمة">
        <ProductsManager />
      </Section>
    </div>
  );
}
