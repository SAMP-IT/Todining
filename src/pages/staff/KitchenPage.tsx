import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ChefHat } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useRealtime } from '@/hooks/useRealtime';
import { orderService } from '@/data/services';
import { KitchenTicket } from '@/features/kitchen/KitchenTicket';
import { EmptyState } from '@/components/ui';

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: 'pending', title: 'New' },
  { status: 'preparing', title: 'Preparing' },
  { status: 'ready', title: 'Ready' },
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
      if (e.type === 'order:created') toast(`🔔 New order — Table ${e.payload.tableNumber}`, { duration: 5000 });
    },
    { restaurantId: restaurantId ?? undefined, types: ['order:created'] },
  );
  useEffect(() => {
    firstRender.current = false;
  }, []);

  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s);

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <ChefHat className="h-6 w-6 text-ember-500" />
        <h1 className="text-2xl font-semibold">Kitchen board</h1>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ChefHat className="h-8 w-8" />} title="All caught up" description="New orders will appear here the moment they're placed." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = byStatus(col.status);
            return (
              <div key={col.status} className="rounded-2xl bg-ink/[0.03] p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="font-semibold">{col.title}</h2>
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-2 text-xs font-bold text-ink-soft">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((o) => (
                    <KitchenTicket key={o.id} order={o} onAdvance={(id) => orderService.advance(id)} />
                  ))}
                  {items.length === 0 && <p className="px-1 py-6 text-center text-sm text-ink-muted">Nothing here</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
