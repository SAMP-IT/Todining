import { useState } from 'react';
import { toast } from 'sonner';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import type { MenuCategory } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { categoryService } from '@/data/services';
import { Badge, Button, EmptyState, Input, Modal, PageHeader } from '@/components/ui';

export function CategoriesPage() {
  const { restaurantId } = useTenant();
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const categories = useLiveQuery(
    () =>
      (restaurantId ? categoryService.list(restaurantId) : []).map((c) => ({
        category: c,
        items: categoryService.itemCount(c.id),
      })),
    { restaurantId: restaurantId ?? undefined, types: ['data:changed'] },
  );

  function openAdd() {
    setName('');
    setAdding(true);
  }
  function openEdit(c: MenuCategory) {
    setName(c.name);
    setEditing(c);
  }
  function submitAdd() {
    if (!restaurantId || !name.trim()) return;
    categoryService.create(restaurantId, name);
    toast.success('Category added.');
    setAdding(false);
  }
  function submitEdit() {
    if (!editing || !name.trim()) return;
    categoryService.update(editing.id, { name });
    toast.success('Category updated.');
    setEditing(null);
  }
  function remove(c: MenuCategory) {
    const ok = categoryService.remove(c.id);
    if (ok) toast.success('Category deleted.');
    else toast.error('Move or delete its menu items first.');
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Group your menu. Categories appear as sections on the customer menu."
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4" /> Add category</Button>}
      />

      {categories.length === 0 ? (
        <EmptyState icon={<FolderTree className="h-8 w-8" />} title="No categories" description="Add your first category to organise the menu." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-soft">
          {categories.map(({ category, items }, i) => (
            <div
              key={category.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ink/5' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-ember-100 text-ember-600">
                  <FolderTree className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-semibold">{category.name}</div>
                  <Badge tone={items > 0 ? 'sage' : 'neutral'}>{items} item{items === 1 ? '' : 's'}</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(category)} className="rounded-lg p-2 text-ink-muted hover:bg-ink/5" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(category)} className="rounded-lg p-2 text-ink-muted hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add category"
        footer={<><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={submitAdd} disabled={!name.trim()}>Add</Button></>}
      >
        <Input label="Category name" placeholder="e.g. Desserts" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit category"
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={submitEdit} disabled={!name.trim()}>Save</Button></>}
      >
        <Input label="Category name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Modal>
    </div>
  );
}
