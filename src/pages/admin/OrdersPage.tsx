import { useState } from 'react';
import { ReceiptText } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import type { Order, OrderStatus } from '@/types';
import { ORDER_STATUS_FLOW } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { orderService, sessionService } from '@/data/services';
import { EmptyState, Modal, OrderStatusBadge, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatMoney, formatTime } from '@/lib/format';

const FILTERS: ('all' | OrderStatus)[] = ['all', ...ORDER_STATUS_FLOW];

/** Micro-caps column head, shared by every table on this screen. */
const TH = 'px-3.5 py-2.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-ink-muted';

/** Human label for a day's order group: "Today", "Yesterday", or "Mon, 23 Jun 2026". */
function dayLabel(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, d MMM yyyy');
}

/** Group orders (assumed newest-first) into day buckets, preserving order. */
function groupByDay(orders: Order[]): { key: string; label: string; orders: Order[] }[] {
  const groups: { key: string; label: string; orders: Order[] }[] = [];
  for (const o of orders) {
    const key = format(parseISO(o.createdAt), 'yyyy-MM-dd');
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.orders.push(o);
    else groups.push({ key, label: dayLabel(o.createdAt), orders: [o] });
  }
  return groups;
}

export function OrdersPage() {
  const { restaurant, restaurantId } = useTenant();
  const symbol = restaurant?.settings.currencySymbol ?? '₹';
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [selected, setSelected] = useState<Order | null>(null);

  const orders = useLiveQuery<Order[]>(() => (restaurantId ? orderService.list(restaurantId) : []), {
    restaurantId: restaurantId ?? undefined,
    types: ['order:created', 'order:updated', 'data:changed'],
  });

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const dayGroups = groupByDay(filtered);
  const selectedLive = selected ? orders.find((o) => o.id === selected.id) ?? selected : null;

  return (
    <div>
      <PageHeader title="Orders" subtitle="Every order across all tables, live." />

      {/* Ink pills: the filter is a state, not an action, so it never takes ember. */}
      <div className="hide-scrollbar mb-5 flex gap-1.5 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[0.74rem] font-bold capitalize transition-colors',
              filter === f
                ? 'border-ink bg-ink text-cream'
                : 'border-ink/10 bg-white text-ink-soft hover:border-ink/25 hover:text-ink',
            )}
          >
            {f}{' '}
            {f !== 'all' && (
              <span className="tnum opacity-60">({orders.filter((o) => o.status === f).length})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ReceiptText className="h-8 w-8" />} title="No orders here" description="Orders placed by guests will show up instantly." />
      ) : (
        <div className="space-y-6">
          {dayGroups.map((group) => {
            // Revenue = completed orders only, matching Dashboard/Analytics so
            // the day total never counts pending/preparing orders as earnings.
            const dayTotal = group.orders
              .filter((o) => o.status === 'completed')
              .reduce((s, o) => s + o.total, 0);
            return (
              <div key={group.key}>
                <div className="flex items-baseline justify-between gap-3 px-0.5 pb-2">
                  <h2 className="font-sans text-[0.78rem] font-bold text-ink">
                    {group.label}{' '}
                    <span className="tnum font-medium text-ink-muted">· {group.orders.length} order{group.orders.length === 1 ? '' : 's'}</span>
                  </h2>
                  <span className="tnum font-display text-base font-semibold">{formatMoney(dayTotal, symbol)}</span>
                </div>
                <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
                  <table className="w-full text-left text-[0.82rem]">
                    <thead className="bg-cream-deep">
                      <tr>
                        <th className={TH}>Order</th>
                        <th className={TH}>Table</th>
                        <th className={cn(TH, 'hidden sm:table-cell')}>Items</th>
                        <th className={TH}>Total</th>
                        <th className={cn(TH, 'hidden sm:table-cell')}>Time</th>
                        <th className={TH}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.orders.map((o) => (
                        <tr
                          key={o.id}
                          className="cursor-pointer border-t border-ink/10 transition-colors hover:bg-cream-deep/50"
                          onClick={() => setSelected(o)}
                        >
                          <td className="tnum px-3.5 py-2.5 font-bold">#{o.id.slice(-5).toUpperCase()}</td>
                          <td className="tnum px-3.5 py-2.5">T{o.tableNumber}</td>
                          <td className="tnum hidden px-3.5 py-2.5 text-ink-muted sm:table-cell">
                            {(() => {
                              const n = o.items.reduce((s, i) => s + i.qty, 0);
                              return `${n} item${n === 1 ? '' : 's'}`;
                            })()}
                          </td>
                          <td className="tnum px-3.5 py-2.5 font-display text-[0.95rem] font-semibold">{formatMoney(o.total, symbol)}</td>
                          <td className="tnum hidden px-3.5 py-2.5 text-ink-muted sm:table-cell">{formatTime(o.createdAt)}</td>
                          <td className="px-3.5 py-2.5"><OrderStatusBadge status={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selectedLive}
        onClose={() => setSelected(null)}
        title={selectedLive ? `Order #${selectedLive.id.slice(-5).toUpperCase()}` : ''}
        description={selectedLive ? `Table ${selectedLive.tableNumber} · ${formatTime(selectedLive.createdAt)}` : ''}
      >
        {selectedLive && (
          <div>
            {/* The printed check: items, then the charges, then a heavy rule
                under the grand total. */}
            <div className="space-y-0.5">
              {selectedLive.items.map((it) => (
                <div key={it.id} className="flex items-baseline justify-between gap-4 py-1 text-[0.82rem]">
                  <span><span className="tnum font-bold">{it.qty}×</span> {it.name}</span>
                  <span className="tnum shrink-0">{formatMoney(it.unitPrice * it.qty, symbol)}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 space-y-0.5 border-t border-ink/10 pt-2">
              <Row label="Subtotal" value={formatMoney(selectedLive.subtotal, symbol)} />
              <Row label="Tax" value={formatMoney(selectedLive.tax, symbol)} />
              <Row label="Service charge" value={formatMoney(selectedLive.serviceCharge, symbol)} />
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-4 border-t-[1.5px] border-ink pt-2.5">
              <span className="font-display text-base font-semibold">Total</span>
              <span className="tnum font-display text-[1.4rem] font-bold leading-none">{formatMoney(selectedLive.total, symbol)}</span>
            </div>

            <div className="mt-5 border-t border-ink/10 pt-4">
              <p className="mb-2 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-ink-muted">Update status</p>
              <div className="flex flex-wrap gap-1.5">
                {ORDER_STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      // "Completed" closes the whole dining session: it completes
                      // every order on the table for that visit and generates the
                      // single final bill (idempotent). Other statuses only move
                      // this one order along the kitchen/serve flow.
                      s === 'completed'
                        ? sessionService.completeDining(selectedLive.restaurantId, selectedLive.sessionId)
                        : orderService.setStatus(selectedLive.id, s)
                    }
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-[0.74rem] font-bold capitalize transition-colors',
                      // The current status is where you are (ink); the rest are
                      // the actions available from here.
                      selectedLive.status === s
                        ? 'border-ink bg-ink text-cream'
                        : 'border-ink/10 bg-white text-ink-soft hover:border-ember-500 hover:bg-ember-100 hover:text-ember-600',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5 text-[0.82rem] text-ink-muted">
      <span>{label}</span>
      <span className="tnum shrink-0">{value}</span>
    </div>
  );
}
