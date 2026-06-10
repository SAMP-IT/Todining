import { Clock } from 'lucide-react';
import type { Order } from '@/types';
import { Button } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';

/** A kitchen order ticket. Chef advances pending → preparing → ready. */
export function KitchenTicket({ order, onAdvance }: { order: Order; onAdvance: (id: string) => void }) {
  const accent =
    order.status === 'pending' ? 'border-l-gold-400' : order.status === 'preparing' ? 'border-l-ember-500' : 'border-l-sage-500';

  return (
    <div className={cn('rounded-2xl border border-ink/5 border-l-4 bg-white p-4 shadow-soft', accent)}>
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold">Table {order.tableNumber}</span>
        <span className="flex items-center gap-1 text-xs font-medium text-ink-muted">
          <Clock className="h-3.5 w-3.5" /> {timeAgo(order.createdAt)}
        </span>
      </div>
      <p className="text-xs text-ink-muted">#{order.id.slice(-5).toUpperCase()}</p>

      <ul className="mt-3 space-y-1.5">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-baseline gap-2 text-sm">
            <span className="grid h-6 min-w-6 place-items-center rounded-md bg-ink text-xs font-bold text-cream">{it.qty}</span>
            <span className="font-medium">{it.name}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        {order.status === 'pending' && (
          <Button fullWidth onClick={() => onAdvance(order.id)}>Start cooking</Button>
        )}
        {order.status === 'preparing' && (
          <Button fullWidth variant="success" onClick={() => onAdvance(order.id)}>Mark ready</Button>
        )}
        {order.status === 'ready' && (
          <p className="rounded-xl bg-sage-50 py-2 text-center text-sm font-semibold text-sage-600">Ready — waiting for waiter</p>
        )}
      </div>
    </div>
  );
}
