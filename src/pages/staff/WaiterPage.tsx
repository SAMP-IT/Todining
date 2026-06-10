import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Armchair, Bell, Soup } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useRealtime } from '@/hooks/useRealtime';
import { orderService, serviceRequestService, tableService, SERVICE_REQUEST_LABELS } from '@/data/services';
import { WaiterOrderCard } from '@/features/waiter/WaiterOrderCard';
import { ServiceRequestCard } from '@/features/service-requests/ServiceRequestCard';
import { EmptyState, KpiCard } from '@/components/ui';
import type { RealtimeEvent } from '@/data/realtime/bus';

const EVENT_TYPES: RealtimeEvent['type'][] = [
  'order:created', 'order:updated', 'service:created', 'service:resolved', 'table:updated', 'data:changed',
];

export function WaiterPage() {
  const { restaurantId } = useTenant();
  const rid = restaurantId ?? undefined;

  const data = useLiveQuery(() => {
    if (!restaurantId) return { ready: [], inProgress: [], requests: [], activeTables: [] };
    const active = orderService.active(restaurantId);
    return {
      ready: active.filter((o) => o.status === 'ready'),
      inProgress: active.filter((o) => o.status === 'pending' || o.status === 'preparing'),
      requests: serviceRequestService.open(restaurantId),
      activeTables: tableService.list(restaurantId).filter((t) => t.status === 'occupied'),
    };
  }, { restaurantId: rid, types: EVENT_TYPES });

  // Alert on new service requests + ready orders.
  const first = useRef(true);
  useRealtime((e) => {
    if (first.current) return;
    if (e.type === 'service:created') toast(`🔔 Table ${e.payload.tableNumber} — ${SERVICE_REQUEST_LABELS[e.payload.kind as keyof typeof SERVICE_REQUEST_LABELS] ?? 'request'}`);
    if (e.type === 'order:updated' && e.payload.status === 'ready') toast('🍽️ An order is ready to serve');
  }, { restaurantId: rid, types: EVENT_TYPES });
  useEffect(() => { first.current = false; }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Waiter board</h1>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Active tables" value={String(data.activeTables.length)} icon={<Armchair className="h-4 w-4" />} tone="ember" />
        <KpiCard label="Ready to serve" value={String(data.ready.length)} icon={<Soup className="h-4 w-4" />} tone="sage" />
        <KpiCard label="Service calls" value={String(data.requests.length)} icon={<Bell className="h-4 w-4" />} tone="gold" />
      </div>

      {/* Service requests */}
      <section>
        <h2 className="mb-3 font-semibold">Service requests</h2>
        {data.requests.length === 0 ? (
          <EmptyState title="No open requests" description="Guest call-button requests show up here instantly." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.requests.map((r) => (
              <ServiceRequestCard key={r.id} request={r} onResolve={(id) => serviceRequestService.resolve(id)} />
            ))}
          </div>
        )}
      </section>

      {/* Ready to serve */}
      <section>
        <h2 className="mb-3 font-semibold">Ready to serve</h2>
        {data.ready.length === 0 ? (
          <EmptyState title="Nothing ready yet" description="Orders marked ready by the kitchen appear here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.ready.map((o) => (
              <WaiterOrderCard key={o.id} order={o} onServe={(id) => orderService.advance(id)} />
            ))}
          </div>
        )}
      </section>

      {/* In progress */}
      <section>
        <h2 className="mb-3 font-semibold">In the kitchen</h2>
        {data.inProgress.length === 0 ? (
          <EmptyState title="No active orders" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.inProgress.map((o) => (
              <WaiterOrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
