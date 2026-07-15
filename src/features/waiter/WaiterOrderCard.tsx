import type { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';

// Status is carried by tint + badge, never a side stripe (DESIGN.md). The board
// only ever renders pending / preparing / ready, but the map stays total so a
// served or completed order can never fall through to an unstyled badge.
const BADGE_TONE: Record<OrderStatus, string> = {
  pending: 'bg-gold-100 text-gold-600',
  preparing: 'bg-ember-100 text-ember-700',
  // On the forest-tinted "ready" card, the badge lifts out of the tint instead
  // of stacking another green on green.
  ready: 'bg-white/70 text-sage-600',
  served: 'bg-sage-100 text-sage-600',
  completed: 'bg-ink/6 text-ink-soft',
};

const BADGE_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  completed: 'Completed',
};

/** Compact order card for the waiter board. */
export function WaiterOrderCard({ order, onServe }: { order: Order; onServe?: (id: string) => void }) {
  const summary = order.items.map((i) => `${i.qty}× ${i.name}`).join(' · ');
  const isReady = order.status === 'ready';
  return (
    <div className={cn('rounded-xl border p-3.5', isReady ? 'border-sage-200 bg-sage-100' : 'border-ink/10 bg-white')}>
      <div className="flex items-baseline justify-between gap-2">
        {/* No `tnum` here: Cormorant's figures are oldstyle, and tabular spacing
            gaps "Table 12" into "Table I 2". Tabular is for the data lines. */}
        <h3 className="font-display text-xl font-semibold leading-none">Table {order.tableNumber}</h3>
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-[0.08em]',
            BADGE_TONE[order.status],
          )}
        >
          {BADGE_LABEL[order.status]}
        </span>
      </div>
      <p className="tnum mt-1 text-[0.66rem] font-bold text-ink-muted">
        #{order.id.slice(-5).toUpperCase()} · {timeAgo(order.createdAt)}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{summary}</p>
      {onServe && isReady && (
        <Button fullWidth variant="success" className="mt-3" onClick={() => onServe(order.id)}>
          Mark served
        </Button>
      )}
    </div>
  );
}
