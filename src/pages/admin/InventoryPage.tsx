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
      </div>

      {low.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-gold-400/40 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Low stock alert</p>
            <p className="text-sm text-amber-700">Reorder soon: {low.map((i) => i.name).join(', ')}.</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<Boxes className="h-8 w-8" />} title="No inventory tracked" description="Add ingredients and stock to start tracking usage." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep/60 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Low at</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {items.map((it) => {
                const isLow = it.stockQty <= it.lowThreshold;
                return (
                  <tr key={it.id} className={cn(isLow && 'bg-amber-50/40')}>
                    <td className="px-4 py-3 font-semibold">{it.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjust(it, -1)} className="grid h-7 w-7 place-items-center rounded-lg bg-ink/5 hover:bg-ink/10" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="min-w-14 text-center font-medium tabular-nums">{it.stockQty} {it.unit}</span>
                        <button onClick={() => adjust(it, 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-ink/5 hover:bg-ink/10" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">{it.lowThreshold} {it.unit}</td>
                    <td className="px-4 py-3">{isLow ? <Badge tone="gold" dot>Low</Badge> : <Badge tone="sage" dot>In stock</Badge>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(it)} className="rounded-lg p-2 text-ink-muted hover:bg-ink/5" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => { inventoryService.remove(it.id); toast('Item removed.'); }} className="rounded-lg p-2 text-ink-muted hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
