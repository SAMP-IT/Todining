import type { Order } from '@/types';
import { Button, OrderStatusBadge } from '@/components/ui';
import { timeAgo } from '@/lib/format';

/** Compact order card for the waiter board. */
export function WaiterOrderCard({ order, onServe }: { order: Order; onServe?: (id: string) => void }) {
  const summary = order.items.map((i) => `${i.qty}× ${i.name}`).join(' · ');
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold">Table {order.tableNumber}</span>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-ink-soft">{summary}</p>
      <p className="mt-1 text-xs text-ink-muted">{timeAgo(order.createdAt)}</p>
      {onServe && order.status === 'ready' && (
        <Button fullWidth variant="success" className="mt-3" onClick={() => onServe(order.id)}>
          Mark as served
        </Button>
      )}
    </div>
  );
}
