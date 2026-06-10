import { useState } from 'react';
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
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-ink/10">
          <ImageWithFallback src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 space-y-2">
          <Input label="Image URL" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <label className="inline-block cursor-pointer text-sm font-semibold text-ember-600 hover:underline">
            or upload an image
            <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          </label>
        </div>
      </div>

      <Input label="Name" placeholder="e.g. Butter Chicken" value={name} onChange={(e) => setName(e.target.value)} required />
      <Textarea label="Description" placeholder="Short, appetising description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Price" type="number" min={0} step="any" value={price} onChange={(e) => setPrice(e.target.valueAsNumber || 0)} />
        <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
        <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="h-4 w-4 rounded accent-ember-500" />
        Available for ordering
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add item'}</Button>
      </div>
    </form>
  );
}
