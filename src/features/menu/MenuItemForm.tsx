import { useState } from 'react';
import { Upload } from 'lucide-react';
import type { MenuCategory, MenuItem } from '@/types';
import { Button, ImageWithFallback, Input, Select, Textarea } from '@/components/ui';

export interface MenuItemFormValues {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
}

export function MenuItemForm({
  initial,
  categories,
  onSubmit,
  onCancel,
}: {
  initial?: MenuItem;
  categories: MenuCategory[];
  onSubmit: (v: MenuItemFormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);

  // Demo image "upload": read the chosen file as a data URL (Supabase Storage in prod).
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && categoryId) onSubmit({ name: name.trim(), description, price: Number(price), categoryId, imageUrl, isAvailable });
      }}
    >
      {/* The photo leads: it is the first thing a diner sees, so it is the first
          thing the operator sets. Preview and source sit on one row. */}
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-cream-deep">
          <ImageWithFallback src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <Input label="Photo" placeholder="Paste an image URL…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ember-600 transition-colors hover:text-ember-700">
            <Upload className="h-3.5 w-3.5" />
            or upload
            <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          </label>
        </div>
      </div>

      <Input label="Name" placeholder="e.g. Butter Chicken" value={name} onChange={(e) => setName(e.target.value)} required />
      <Textarea label="Description" placeholder="Short, appetising description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Price" type="number" min={0} step="any" className="tnum" value={price} onChange={(e) => setPrice(e.target.valueAsNumber || 0)} />
        <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {/* Availability is a state of the dish, not a field: give it its own
          hairline row so it reads as a switch rather than another input. */}
      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/10 bg-cream-deep/40 px-3.5 py-3 transition-colors hover:border-ink/20">
        <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="h-4 w-4 shrink-0 rounded accent-ember-500" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">Available for ordering</span>
          <span className="block text-xs text-ink-muted">Unavailable dishes still show on the menu, marked sold out.</span>
        </span>
      </label>

      <div className="flex justify-end gap-2 border-t border-ink/10 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add item'}</Button>
      </div>
    </form>
  );
}
