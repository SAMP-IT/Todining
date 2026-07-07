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

      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors',
              filter === f ? 'bg-ink text-cream' : 'bg-white text-ink-soft hover:bg-cream-deep',
            )}
          >
            {f} {f !== 'all' && <span className="opacity-60">({orders.filter((o) => o.status === f).length})</span>}
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
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-ink">
                    {group.label} <span className="font-normal text-ink-muted">· {group.orders.length} order{group.orders.length === 1 ? '' : 's'}</span>
                  </h2>
                  <span className="text-sm font-semibold text-ink-soft">{formatMoney(dayTotal, symbol)}</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-soft">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-deep/60 text-left text-xs uppercase tracking-wide text-ink-muted">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">Table</th>
                        <th className="hidden px-4 py-3 font-semibold sm:table-cell">Items</th>
                        <th className="px-4 py-3 font-semibold">Total</th>
                        <th className="hidden px-4 py-3 font-semibold sm:table-cell">Time</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {group.orders.map((o) => (
                        <tr key={o.id} className="cursor-pointer hover:bg-cream-deep/40" onClick={() => setSelected(o)}>
                          <td className="px-4 py-3 font-semibold">#{o.id.slice(-5).toUpperCase()}</td>
                          <td className="px-4 py-3">T{o.tableNumber}</td>
                          <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">{o.items.reduce((s, i) => s + i.qty, 0)} items</td>
                          <td className="px-4 py-3 font-semibold">{formatMoney(o.total, symbol)}</td>
                          <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">{formatTime(o.createdAt)}</td>
                          <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
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
          <div className="space-y-4">
            <div className="space-y-2">
              {selectedLive.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between text-sm">
                  <span><span className="font-semibold">{it.qty}×</span> {it.name}</span>
                  <span className="font-medium">{formatMoney(it.unitPrice * it.qty, symbol)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-ink/8 pt-3 text-sm">
              <Row label="Subtotal" value={formatMoney(selectedLive.subtotal, symbol)} />
              <Row label="Tax" value={formatMoney(selectedLive.tax, symbol)} />
              <Row label="Service charge" value={formatMoney(selectedLive.serviceCharge, symbol)} />
              <div className="flex justify-between pt-1 font-bold"><span>Total</span><span>{formatMoney(selectedLive.total, symbol)}</span></div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Update status</p>
              <div className="flex flex-wrap gap-2">
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
                      'rounded-xl px-3 py-1.5 text-sm font-semibold capitalize transition-colors',
                      selectedLive.status === s ? 'bg-ember-500 text-white' : 'bg-ink/5 text-ink-soft hover:bg-ink/10',
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
    <div className="flex items-center justify-between text-ink-soft">
      <span>{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
