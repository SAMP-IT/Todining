import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ChefHat } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useRealtime } from '@/hooks/useRealtime';
import { orderService } from '@/data/services';
import { KitchenTicket } from '@/features/kitchen/KitchenTicket';
import { KitchenFeedback } from '@/features/kitchen/KitchenFeedback';
import { EmptyState } from '@/components/ui';
import { cn } from '@/lib/cn';

const COLUMNS: { status: OrderStatus; title: string; dot: string }[] = [
  { status: 'pending', title: 'New', dot: 'bg-gold-400' },
  { status: 'preparing', title: 'Preparing', dot: 'bg-ember-500' },
  { status: 'ready', title: 'Ready', dot: 'bg-sage-500' },
];

export function KitchenPage() {
  const { restaurantId } = useTenant();
  const orders = useLiveQuery<Order[]>(() => (restaurantId ? orderService.active(restaurantId) : []), {
    restaurantId: restaurantId ?? undefined,
    types: ['order:created', 'order:updated', 'data:changed'],
  });

  // Alert the kitchen when a new order arrives (Feature 4: "instantly receive").
  const firstRender = useRef(true);
  useRealtime(
    (e) => {
      if (firstRender.current) return;
      if (e.type === 'order:created') toast(`🔔 New order · Table ${e.payload.tableNumber}`, { duration: 5000 });
    },
    { restaurantId: restaurantId ?? undefined, types: ['order:created'] },
  );
  useEffect(() => {
    firstRender.current = false;
  }, []);

  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Kitchen board</h1>
          <p className="mt-0.5 text-xs font-semibold text-ink-muted">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · service
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sage-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage-500 motion-reduce:animate-none" />
          Live · {orders.length} active
        </span>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ChefHat className="h-8 w-8" />}
          title="All caught up"
          description="New orders will appear here the moment they're placed."
        />
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = byStatus(col.status);
            return (
              <div key={col.status} className="rounded-2xl border border-ink/10 bg-cream-deep/50 p-2.5">
                <div className="flex items-center justify-between px-1 pb-2.5 pt-0.5">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <span className={cn('h-1.5 w-1.5 rounded-full', col.dot)} />
                    {col.title}
                  </h2>
                  <span className="tnum grid h-6 min-w-[1.5rem] place-items-center rounded-full border border-ink/10 bg-white px-1.5 text-[0.68rem] font-extrabold text-ink-soft">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {items.map((o) => (
                    <KitchenTicket key={o.id} order={o} onAdvance={(id) => orderService.advance(id)} />
                  ))}
                  {items.length === 0 && (
                    <p className="py-7 text-center text-xs text-ink-muted">Nothing here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <KitchenFeedback />
    </div>
  );
}
