import { useState } from 'react';
import type { InventoryItem } from '@/types';
import { Button, Input } from '@/components/ui';

export interface InventoryFormValues {
  name: string;
  unit: string;
  stockQty: number;
  lowThreshold: number;
}

export function InventoryForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: InventoryItem;
  onSubmit: (v: InventoryFormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? 'kg');
  const [stockQty, setStockQty] = useState(initial?.stockQty ?? 0);
  const [lowThreshold, setLowThreshold] = useState(initial?.lowThreshold ?? 5);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSubmit({ name: name.trim(), unit, stockQty: Number(stockQty), lowThreshold: Number(lowThreshold) });
      }}
    >
      <Input label="Item name" placeholder="e.g. Chicken" value={name} onChange={(e) => setName(e.target.value)} required />

      {/* Two-up on a phone (the uppercase micro-labels need the room), three-up from sm. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Input label="Unit" placeholder="kg" value={unit} onChange={(e) => setUnit(e.target.value)} />
        <Input className="tnum" label="In stock" type="number" min={0} step="any" value={stockQty} onChange={(e) => setStockQty(e.target.valueAsNumber || 0)} />
        <Input className="tnum" label="Low at" type="number" min={0} step="any" value={lowThreshold} onChange={(e) => setLowThreshold(e.target.valueAsNumber || 0)} hint="Flags the item gold." />
      </div>

      <div className="flex justify-end gap-2 border-t border-ink/10 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add item'}</Button>
      </div>
    </form>
  );
}
