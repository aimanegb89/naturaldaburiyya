import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  count?: number;
  size?: number;
  onChange?: (v: number) => void;
  className?: string;
}

const StarRating = ({ value, count, size = 12, onChange, className }: Props) => (
  <div className={cn('flex items-center gap-[2px]', className)} dir="ltr">
    {[1, 2, 3, 4, 5].map((i) => {
      const filled = value >= i - 0.25;
      const Comp = onChange ? 'button' : 'span';
      return (
        <Comp
          key={i}
          type={onChange ? 'button' : undefined}
          onClick={onChange ? () => onChange(i) : undefined}
          aria-label={onChange ? `${i}` : undefined}
          className={onChange ? 'p-[2px] transition-transform hover:scale-110' : undefined}
        >
          <Star
            style={{ width: size, height: size }}
            className={filled ? 'fill-gold text-gold' : 'text-outline-variant'}
          />
        </Comp>
      );
    })}
    {count !== undefined && (
      <span className="text-[12px] text-muted-foreground ms-[4px]">({count})</span>
    )}
  </div>
);

export default StarRating;
