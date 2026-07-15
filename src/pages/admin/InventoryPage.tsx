import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Boxes, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import type { InventoryItem } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { inventoryService } from '@/data/services';
import { Badge, Button, EmptyState, KpiCard, Modal, PageHeader } from '@/components/ui';
import { InventoryForm, type InventoryFormValues } from '@/features/inventory/InventoryForm';
import { cn } from '@/lib/cn';

export function InventoryPage() {
  const { restaurantId } = useTenant();
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [adding, setAdding] = useState(false);

  const items = useLiveQuery<InventoryItem[]>(() => (restaurantId ? inventoryService.list(restaurantId) : []), {
    restaurantId: restaurantId ?? undefined,
    types: ['inventory:low', 'data:changed', 'order:created'],
  });

  const low = items.filter((i) => i.stockQty <= i.lowThreshold);

  function adjust(item: InventoryItem, delta: number) {
    inventoryService.update(item.id, { stockQty: Math.max(0, Math.round((item.stockQty + delta) * 100) / 100) });
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock auto-deducts as orders are placed. Low items are flagged."
        actions={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add item</Button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Tracked items" value={String(items.length)} icon={<Boxes className="h-4 w-4" />} />
        <KpiCard label="Low stock" value={String(low.length)} icon={<AlertTriangle className="h-4 w-4" />} tone={low.length ? 'gold' : 'sage'} />
        <KpiCard label="Well stocked" value={String(items.length - low.length)} icon={<Boxes className="h-4 w-4" />} tone="sage" />
      </div>

      {/* Low-stock alert: gold tint + full hairline border. Never a side stripe. */}
      {low.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-gold-400/35 bg-gold-100/45 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
          <div className="min-w-0">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-gold-600">Low stock alert</p>
            <p className="mt-1 text-sm text-ink-soft">Reorder soon: {low.map((i) => i.name).join(', ')}.</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<Boxes className="h-8 w-8" />} title="No inventory tracked" description="Add ingredients and stock to start tracking usage." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[0.82rem]">
              <thead className="bg-cream-deep/70 text-left text-ink-muted">
                <tr>
                  <th className="px-3 py-2.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] sm:px-4">Item</th>
                  <th className="px-3 py-2.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] sm:px-4">Stock</th>
                  <th className="hidden px-4 py-2.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] sm:table-cell">Low at</th>
                  {/* Status rides under the item name on a phone (see the row below). */}
                  <th className="hidden px-4 py-2.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] sm:table-cell">Status</th>
                  <th className="px-3 py-2.5 sm:px-4"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const isLow = it.stockQty <= it.lowThreshold;
                  const badge = isLow ? <Badge tone="gold" dot className="whitespace-nowrap">Low</Badge> : <Badge tone="sage" dot className="whitespace-nowrap">In stock</Badge>;
                  return (
                    <tr key={it.id} className={cn('border-t border-ink/10 transition-colors', isLow ? 'bg-gold-100/35' : 'hover:bg-cream-deep/40')}>
                      <td className="px-3 py-2.5 sm:px-4">
                        <div className="font-semibold">{it.name}</div>
                        {/* Phone: the status column is dropped, so the badge rides here. */}
                        <div className="mt-1 sm:hidden">{badge}</div>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => adjust(it, -1)} className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-ink/10 bg-white text-ink-soft transition-colors hover:border-ink/25 hover:text-ink" aria-label="Decrease"><Minus className="h-3 w-3" /></button>
                          <span className="tnum min-w-[2.75rem] whitespace-nowrap text-center font-display text-base font-semibold leading-none">
                            {it.stockQty} <span className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted">{it.unit}</span>
                          </span>
                          <button onClick={() => adjust(it, 1)} className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-ink/10 bg-white text-ink-soft transition-colors hover:border-ink/25 hover:text-ink" aria-label="Increase"><Plus className="h-3 w-3" /></button>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-2.5 text-ink-muted sm:table-cell"><span className="tnum">{it.lowThreshold}</span> {it.unit}</td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">{badge}</td>
                      <td className="px-3 py-2.5 sm:px-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditing(it)} className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { inventoryService.remove(it.id); toast('Item removed.'); }} className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add inventory item">
        <InventoryForm
          onCancel={() => setAdding(false)}
          onSubmit={(v: InventoryFormValues) => {
            if (restaurantId) inventoryService.create(restaurantId, v);
            setAdding(false);
            toast.success('Inventory item added.');
          }}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit item">
        {editing && (
          <InventoryForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(v) => {
              inventoryService.update(editing.id, v);
              setEditing(null);
              toast.success('Inventory updated.');
            }}
          />
        )}
      </Modal>
    </div>
  );
}
