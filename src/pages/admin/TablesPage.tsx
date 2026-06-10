import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, QrCode, Trash2, Users } from 'lucide-react';
import type { RestaurantTable, TableStatus } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { orderService, tableService } from '@/data/services';
import { QrCodeView } from '@/features/tables/QrCodeView';
import { Button, Modal, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<TableStatus, { ring: string; dot: string; label: string }> = {
  available: { ring: 'border-sage-500/40 bg-sage-50', dot: 'bg-sage-500', label: 'Available' },
  reserved: { ring: 'border-gold-400/50 bg-amber-50', dot: 'bg-gold-400', label: 'Reserved' },
  occupied: { ring: 'border-red-400/40 bg-red-50', dot: 'bg-red-500', label: 'Occupied' },
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

      {/* Legend (Feature 9) */}
      <div className="mb-5 flex flex-wrap gap-4 text-sm">
        {(Object.keys(STATUS_STYLES) as TableStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-2 font-medium text-ink-soft">
            <span className={cn('h-3 w-3 rounded-full', STATUS_STYLES[s].dot)} />
            {STATUS_STYLES[s].label} <span className="text-ink-muted">({counts[s]})</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tables.map((t) => {
          const s = STATUS_STYLES[t.status];
          return (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={cn('flex flex-col items-center gap-1 rounded-2xl border-2 p-5 transition-transform hover:-translate-y-0.5', s.ring)}
            >
              <span className="font-display text-2xl font-semibold">T{t.number}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
                <span className={cn('h-2 w-2 rounded-full', s.dot)} /> {s.label}
              </span>
              <span className="flex items-center gap-1 text-xs text-ink-muted">
                <Users className="h-3 w-3" /> {t.seats}
              </span>
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
              <p className="mb-2 text-sm font-semibold">Set status</p>
              <div className="flex gap-2">
                {CYCLE.map((s) => (
                  <button
                    key={s}
                    onClick={() => tableService.setStatus(selectedLive.id, s)}
                    className={cn(
                      'flex-1 rounded-xl border-2 py-2 text-sm font-semibold capitalize transition-colors',
                      selectedLive.status === s ? STATUS_STYLES[s].ring : 'border-ink/10 text-ink-soft hover:bg-ink/5',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {activeOrders.length > 0 && (
              <div className="rounded-xl bg-cream-deep/50 p-3 text-sm">
                <p className="font-semibold">{activeOrders.length} active order(s)</p>
                <p className="text-ink-muted">{activeOrders.map((o) => `#${o.id.slice(-5).toUpperCase()}`).join(', ')}</p>
              </div>
            )}

            <div className="border-t border-ink/8 pt-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                <QrCode className="h-4 w-4" /> Table QR code
              </p>
              {qr && <QrCodeView path={qr.url} label={`Table ${selectedLive.number}`} />}
            </div>

            <button
              onClick={() => {
                tableService.remove(selectedLive.id);
                toast.success(`Table ${selectedLive.number} removed.`);
                setSelected(null);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Remove table
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
