import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const STORE_URL = 'https://naturaldaburiyya.lovable.app';

const QrDialog = () => {
  const ref = useRef<HTMLDivElement>(null);
  const download = () => {
    const c = ref.current?.querySelector('canvas');
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'natural-qr.png';
    a.click();
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><QrCode className="w-[16px] h-[16px]" /> QR</Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-[360px]">
        <DialogHeader><DialogTitle>رمز QR للمتجر</DialogTitle></DialogHeader>
        <div ref={ref} className="flex flex-col items-center gap-[12px]">
          <QRCodeCanvas value={STORE_URL} size={1024} marginSize={4} level="H"
            imageSettings={{ src: '/icon-192.png', height: 200, width: 200, excavate: true }}
            style={{ width: 260, height: 260 }} />
          <p className="text-[13px] text-muted-foreground text-center">
            يفتح المتجر عند المسح، ويظهر للزبون زر "تثبيت" لإضافته للشاشة الرئيسية.
          </p>
          <Button className="w-full" onClick={download}><Download className="w-[16px] h-[16px]" /> تحميل للطباعة</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrDialog;
