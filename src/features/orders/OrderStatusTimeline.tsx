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

/**
 * The order's journey through the kitchen, drawn as a printed rail: a forest
 * fill for what's done, a hairline for what's still to come, and one ember ring
 * marking exactly where the plates are right now.
 *
 * The rail is built from per-step segments rather than one absolutely-positioned
 * bar, so the fill always lands on the node centres no matter how the labels
 * wrap. The pulsing active node is the only motion on the page — it is the live
 * signal, so it is also the one thing that must stand down for
 * `prefers-reduced-motion`.
 */
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
          <li key={s} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors',
                  done && 'border-sage-500 bg-sage-500 text-cream',
                  // Active reads as an ember *ring* on paper, not a fill: the
                  // step is happening, not finished.
                  active &&
                    'animate-pulse-ring border-ember-500 bg-white text-ember-600 motion-reduce:animate-none',
                  !done && !active && 'border-ink/15 bg-white text-ink-muted',
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              {/* The segment leaving a completed node is filled; everything from
                  the active node up is still just a rule. */}
              {!last && (
                <span
                  className={cn(
                    'my-1 w-0.5 flex-1 rounded-full transition-colors',
                    i < currentIdx ? 'bg-sage-500' : 'bg-ink/10',
                  )}
                />
              )}
            </div>
            <div className={cn('min-w-0 pb-5', last && 'pb-0')}>
              <p
                className={cn(
                  'font-display text-[1.05rem] font-semibold leading-tight',
                  active ? 'text-ember-600' : done ? 'text-ink' : 'text-ink-muted',
                )}
              >
                {label}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
