import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTx } from '@/lib/i18n';

export default function ThemeToggle({ withLabels = false }: { withLabels?: boolean }) {
  const { theme, setTheme } = useTheme();
  const tx = useTx();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const opts = [
    { v: 'light', Icon: Sun, label: tx({ ar: 'فاتح', he: 'בהיר', en: 'Light' }) },
    { v: 'dark', Icon: Moon, label: tx({ ar: 'داكن', he: 'כהה', en: 'Dark' }) },
    { v: 'system', Icon: Monitor, label: tx({ ar: 'تلقائي', he: 'אוטומטי', en: 'Auto' }) },
  ];
  return (
    <div className="inline-flex items-center bg-surface-container rounded-full p-[3px] gap-[2px]" role="radiogroup" aria-label="Theme">
      {opts.map(({ v, Icon, label }) => {
        const active = mounted && theme === v;
        return (
          <button
            key={v}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(v)}
            className={`h-[30px] ${withLabels ? 'px-[12px]' : 'w-[30px]'} rounded-full inline-flex items-center justify-center gap-[6px] text-[13px] font-semibold transition-all ${
              active ? 'bg-primary text-primary-foreground shadow-soft' : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            <Icon className="w-[15px] h-[15px]" />
            {withLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
