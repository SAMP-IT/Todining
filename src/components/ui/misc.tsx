import type { ReactNode } from 'react';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-ember-500', className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function RatingStars({
  value,
  onChange,
  size = 20,
  readOnly,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn('transition-transform', !readOnly && 'hover:scale-110', readOnly && 'cursor-default')}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(n <= value ? 'fill-gold-400 text-gold-400' : 'fill-ink/5 text-ink/20')}
          />
        </button>
      ))}
    </div>
  );
}

export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  size = 'md',
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-7 w-7 text-sm' : 'h-9 w-9';
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-ember-500 p-0.5 text-cream">
      <button onClick={onDecrement} className={cn('grid place-items-center rounded-lg font-bold hover:bg-white/15', dim)} aria-label="Decrease">
        −
      </button>
      <span className={cn('min-w-6 text-center font-semibold tabular-nums', size === 'sm' && 'text-sm')}>{value}</span>
      <button onClick={onIncrement} className={cn('grid place-items-center rounded-lg font-bold hover:bg-white/15', dim)} aria-label="Increase">
        +
      </button>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-none tracking-tight sm:text-[2.2rem]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sublabel,
  icon,
  tone = 'ember',
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon?: ReactNode;
  tone?: 'ember' | 'sage' | 'gold' | 'ink';
}) {
  const toneBg = {
    ember: 'bg-ember-100 text-ember-600',
    sage: 'bg-sage-100 text-sage-600',
    gold: 'bg-gold-100 text-gold-600',
    ink: 'bg-ink/6 text-ink-soft',
  }[tone];
  return (
    <div className="flex items-start justify-between gap-2 rounded-xl border border-ink/10 bg-white p-3.5">
      <div className="min-w-0">
        <div className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-muted">{label}</div>
        <div className="tnum mt-1.5 font-display text-3xl font-bold leading-none tracking-tight">{value}</div>
        {sublabel && <div className="mt-1.5 text-[0.68rem] text-ink-muted">{sublabel}</div>}
      </div>
      {icon && <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-md', toneBg)}>{icon}</span>}
    </div>
  );
}
