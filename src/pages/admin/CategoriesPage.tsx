import { useState } from 'react';
import { toast } from 'sonner';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import type { MenuCategory } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { categoryService } from '@/data/services';
import { Badge, Button, EmptyState, Input, Modal, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

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
        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          {categories.map(({ category, items }, i) => (
            <div
              key={category.id}
              className={cn('flex items-center gap-3 px-3 py-3.5 sm:px-4', i > 0 && 'border-t border-ink/10')}
            >
              {/* Ghosted index numeral: the printed-menu way of marking order,
                  and it reads as the section number the diner sees. */}
              <span className="tnum w-6 shrink-0 font-display text-lg font-semibold leading-none text-ink/25">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg font-semibold leading-tight">{category.name}</div>
              </div>

              <Badge tone={items > 0 ? 'sage' : 'neutral'} className="tnum shrink-0">
                {items} item{items === 1 ? '' : 's'}
              </Badge>

              <div className="flex shrink-0 gap-1">
                <button onClick={() => openEdit(category)} className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(category)} className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add category"
        footer={<><Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={submitAdd} disabled={!name.trim()}>Add</Button></>}
      >
        <Input label="Category name" placeholder="e.g. Desserts" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit category"
        footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={submitEdit} disabled={!name.trim()}>Save</Button></>}
      >
        <Input label="Category name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Modal>
    </div>
  );
}
