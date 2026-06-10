import { Check, ChefHat, Clock, ConciergeBell, PartyPopper, Soup } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_FLOW } from '@/types';
import { cn } from '@/lib/cn';

const META: Record<OrderStatus, { label: string; hint: string; icon: typeof Clock }> = {
  pending: { label: 'Order received', hint: 'Sent to the kitchen', icon: Clock },
  preparing: { label: 'Preparing', hint: 'The chef is on it', icon: ChefHat },
  ready: { label: 'Ready to serve', hint: 'Fresh off the pass', icon: Soup },
  served: { label: 'Served', hint: 'Enjoy your meal!', icon: ConciergeBell },
  completed: { label: 'Completed', hint: 'Thanks for dining', icon: PartyPopper },
};

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const currentIdx = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <ol className="relative">
      {ORDER_STATUS_FLOW.map((s, i) => {
        const { label, hint, icon: Icon } = META[s];
        const done = i < currentIdx;
        const active = i === currentIdx;
        const last = i === ORDER_STATUS_FLOW.length - 1;
        return (
          <li key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-full border-2 transition-colors',
                  done && 'border-sage-500 bg-sage-500 text-white',
                  active && 'border-ember-500 bg-ember-500 text-white animate-pulse-ring',
                  !done && !active && 'border-ink/15 bg-white text-ink-muted',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              {!last && <span className={cn('my-1 w-0.5 flex-1', i < currentIdx ? 'bg-sage-500' : 'bg-ink/10')} />}
            </div>
            <div className={cn('pb-6', last && 'pb-0')}>
              <p className={cn('font-semibold', active ? 'text-ink' : done ? 'text-ink-soft' : 'text-ink-muted')}>{label}</p>
              <p className="text-sm text-ink-muted">{hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
