import { useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Armchair, Bell, Soup } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useRealtime } from '@/hooks/useRealtime';
import { orderService, serviceRequestService, tableService, SERVICE_REQUEST_LABELS } from '@/data/services';
import { WaiterOrderCard } from '@/features/waiter/WaiterOrderCard';
import { ServiceRequestCard } from '@/features/service-requests/ServiceRequestCard';
import { EmptyState } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { RealtimeEvent } from '@/data/realtime/bus';

const EVENT_TYPES: RealtimeEvent['type'][] = [
  'order:created', 'order:updated', 'service:created', 'service:resolved', 'table:updated', 'data:changed',
];

const KPI_TONES = {
  ember: 'bg-ember-100 text-ember-600',
  sage: 'bg-sage-100 text-sage-600',
  gold: 'bg-gold-100 text-gold-600',
} as const;

/**
 * A count tile for the board's top row. Deliberately local rather than the
 * shared `KpiCard`: this board needs the prototype's uppercase micro-label,
 * tabular display numeral and a 3-up layout that survives a 390px phone, none
 * of which `KpiCard` exposes — and it is shared with six admin pages, so
 * bending it here would move all of them.
 */
function KpiTile({
  label,
  short,
  value,
  icon,
  tone,
}: {
  label: string;
  /** Phone label. "Active tables" wraps to two lines in a third of a phone. */
  short: string;
  value: number;
  icon: ReactNode;
  tone: keyof typeof KPI_TONES;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-ink/10 bg-white p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2 sm:p-4">
      <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:order-2 sm:h-8 sm:w-8', KPI_TONES[tone])}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink-muted">
          <span className="sm:hidden">{short}</span>
          <span className="hidden sm:inline">{label}</span>
        </div>
        <div className="tnum mt-1 font-display text-[1.75rem] font-bold leading-none sm:mt-1.5 sm:text-[2.1rem]">
          {value}
        </div>
      </div>
    </div>
  );
}

/** Section rule: title, a hairline that runs to the count chip, then the count. */
function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      <span className="h-px flex-1 bg-ink/10" />
      <span className="tnum grid h-5 min-w-[1.25rem] shrink-0 place-items-center rounded-full border border-ink/10 bg-white px-1.5 text-[0.64rem] font-extrabold text-ink-soft">
        {count}
      </span>
    </div>
  );
}

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
      {/* ── Board header ── */}
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Waiter board</h1>
          <p className="mt-1 text-xs font-semibold text-ink-muted">
            Guests calling first, then plates ready, then what the kitchen still holds.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sage-600">
          <span className="h-1.5 w-1.5 rounded-full bg-sage-500 motion-safe:animate-pulse" />
          Live
        </span>
      </header>

      {/* ── The three counts ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <KpiTile label="Active tables" short="Tables" value={data.activeTables.length} icon={<Armchair className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} tone="ember" />
        <KpiTile label="Ready to serve" short="Ready" value={data.ready.length} icon={<Soup className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} tone="sage" />
        <KpiTile label="Service calls" short="Calls" value={data.requests.length} icon={<Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} tone="gold" />
      </div>

      {/* Service requests */}
      <section>
        <SectionHead title="Service requests" count={data.requests.length} />
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
        <SectionHead title="Ready to serve" count={data.ready.length} />
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
        <SectionHead title="In the kitchen" count={data.inProgress.length} />
        {data.inProgress.length === 0 ? (
          <EmptyState title="No active orders" description="New orders appear here the moment a guest places one." />
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
