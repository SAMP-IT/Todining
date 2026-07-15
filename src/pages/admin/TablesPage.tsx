import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, QrCode, Trash2, Users } from 'lucide-react';
import type { RestaurantTable, TableStatus } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { orderService, tableService } from '@/data/services';
import { QrCodeView } from '@/features/tables/QrCodeView';
import { Badge, Button, Modal, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * Floor status reads by TINT + BADGE, never a side stripe (banned by DESIGN.md).
 * `tone` maps onto the shared Badge tones so the language matches the rest of
 * the admin: sage = free, gold = held, red = in service.
 */
const STATUS_STYLES: Record<
  TableStatus,
  { card: string; rule: string; dot: string; tone: 'sage' | 'gold' | 'red'; label: string }
> = {
  available: { card: 'border-sage-500/25 bg-sage-50', rule: 'border-sage-500/20', dot: 'bg-sage-500', tone: 'sage', label: 'Available' },
  reserved: { card: 'border-gold-400/30 bg-gold-100/45', rule: 'border-gold-400/25', dot: 'bg-gold-400', tone: 'gold', label: 'Reserved' },
  occupied: { card: 'border-red-400/30 bg-red-50', rule: 'border-red-400/20', dot: 'bg-red-500', tone: 'red', label: 'Occupied' },
};

const CYCLE: TableStatus[] = ['available', 'reserved', 'occupied'];

export function TablesPage() {
  const { restaurantId } = useTenant();
  const [selected, setSelected] = useState<RestaurantTable | null>(null);

  const tables = useLiveQuery<RestaurantTable[]>(() => (restaurantId ? tableService.list(restaurantId) : []), {
    restaurantId: restaurantId ?? undefined,
    types: ['table:updated', 'order:created', 'data:changed'],
  });

  const selectedLive = selected ? tables.find((t) => t.id === selected.id) ?? null : null;
  const qr = selectedLive ? tableService.qrFor(selectedLive.id) : undefined;
  const activeOrders = selectedLive && restaurantId ? orderService.byTable(restaurantId, selectedLive.id).filter((o) => o.status !== 'completed') : [];

  const counts = {
    available: tables.filter((t) => t.status === 'available').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
  };

  return (
    <div>
      <PageHeader
        title="Tables & QR"
        subtitle="Live floor status. Tap a table to manage it or print its QR."
        actions={
          <Button
            onClick={() => {
              if (restaurantId) {
                tableService.add(restaurantId, 4);
                toast.success('Table added with its own QR code.');
              }
            }}
          >
            <Plus className="h-4 w-4" /> Add table
          </Button>
        }
      />

      {/* Legend (Feature 9) — a hairline masthead rule, not a row of chips. */}
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-y border-ink/10 py-2.5">
        {(Object.keys(STATUS_STYLES) as TableStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-soft">
            <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_STYLES[s].dot)} />
            {STATUS_STYLES[s].label}
            <span className="tnum font-extrabold text-ink-muted">{counts[s]}</span>
          </span>
        ))}
        <span className="tnum ml-auto text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
          {tables.length} tables
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tables.map((t) => {
          const s = STATUS_STYLES[t.status];
          return (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={cn(
                'group flex flex-col rounded-2xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft',
                s.card,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-ink-muted">Table</span>
                <QrCode className="h-3.5 w-3.5 text-ink-muted transition-colors group-hover:text-ember-600" />
              </div>
              <span className="tnum mt-0.5 font-display text-[2.6rem] font-semibold leading-none tracking-tight">
                {t.number}
              </span>
              <div className={cn('mt-3 flex items-center justify-between gap-1.5 border-t pt-2.5', s.rule)}>
                <Badge tone={s.tone} dot className="px-1.5 py-0 text-[0.55rem] uppercase tracking-[0.08em]">
                  {s.label}
                </Badge>
                <span className="flex shrink-0 items-center gap-1 text-[0.68rem] font-semibold text-ink-soft">
                  <Users className="h-3 w-3" />
                  <span className="tnum">{t.seats}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Modal
        open={!!selectedLive}
        onClose={() => setSelected(null)}
        title={selectedLive ? `Table ${selectedLive.number}` : ''}
        description={selectedLive ? `${selectedLive.seats} seats · ${STATUS_STYLES[selectedLive.status].label}` : ''}
      >
        {selectedLive && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.2em] text-ink-muted">Set status</p>
              <div className="flex gap-2">
                {CYCLE.map((s) => (
                  <button
                    key={s}
                    onClick={() => tableService.setStatus(selectedLive.id, s)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold capitalize transition-colors',
                      selectedLive.status === s
                        ? STATUS_STYLES[s].card
                        : 'border-ink/10 bg-white text-ink-soft hover:bg-ink/5',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', selectedLive.status === s ? STATUS_STYLES[s].dot : 'bg-ink/20')} />
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {activeOrders.length > 0 && (
              <div className="rounded-xl border border-ink/10 bg-cream-deep/50 p-3">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-muted">
                  <span className="tnum">{activeOrders.length}</span> active order{activeOrders.length > 1 ? 's' : ''}
                </p>
                <p className="mt-1 text-sm font-semibold">{activeOrders.map((o) => `#${o.id.slice(-5).toUpperCase()}`).join(', ')}</p>
              </div>
            )}

            <div className="border-t border-ink/10 pt-4">
              <p className="mb-3 flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.2em] text-ink-muted">
                <QrCode className="h-3.5 w-3.5" /> Table QR code
              </p>
              {qr && <QrCodeView path={qr.url} label={`Table ${selectedLive.number}`} />}
            </div>

            <button
              onClick={() => {
                tableService.remove(selectedLive.id);
                toast.success(`Table ${selectedLive.number} removed.`);
                setSelected(null);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove table
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
