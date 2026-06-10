import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import type { MenuItem } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { menuService } from '@/data/services';
import { Badge, Button, EmptyState, ImageWithFallback, Modal, PageHeader } from '@/components/ui';
import { MenuItemForm, type MenuItemFormValues } from '@/features/menu/MenuItemForm';
import { formatMoney } from '@/lib/format';

export function MenuManagePage() {
  const { restaurant, restaurantId } = useTenant();
  const symbol = restaurant?.settings.currencySymbol ?? '₹';
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [adding, setAdding] = useState(false);

  const { categories, items } = useLiveQuery(
    () => ({
      categories: restaurantId ? menuService.categories(restaurantId) : [],
      items: restaurantId ? menuService.items(restaurantId) : [],
    }),
    { restaurantId: restaurantId ?? undefined, types: ['data:changed'] },
  );

  return (
    <div>
      <PageHeader
        title="Menu"
        subtitle="Add, edit, price and toggle availability of dishes."
        actions={<Button onClick={() => setAdding(true)} disabled={!categories.length}><Plus className="h-4 w-4" /> Add item</Button>}
      />

      {items.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed className="h-8 w-8" />} title="No menu items" description="Add your first dish to get started." />
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.categoryId === cat.id);
            if (!catItems.length) return null;
            return (
              <section key={cat.id}>
                <h2 className="mb-3 font-display text-lg font-semibold">{cat.name}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-2xl border border-ink/5 bg-white p-3 shadow-soft">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                        <ImageWithFallback src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate font-semibold">{item.name}</h3>
                          <span className="shrink-0 font-display font-semibold">{formatMoney(item.price, symbol)}</span>
                        </div>
                        <p className="line-clamp-1 text-xs text-ink-muted">{item.description}</p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <button
                            onClick={() => menuService.toggleAvailability(item.id)}
                            className="cursor-pointer"
                            title="Toggle availability"
                          >
                            {item.isAvailable ? <Badge tone="sage" dot>Available</Badge> : <Badge tone="red" dot>Sold out</Badge>}
                          </button>
                          <div className="flex gap-1">
                            <button onClick={() => setEditing(item)} className="rounded-lg p-1.5 text-ink-muted hover:bg-ink/5" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => { menuService.remove(item.id); toast('Item removed.'); }} className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add menu item" size="lg">
        <MenuItemForm
          categories={categories}
          onCancel={() => setAdding(false)}
          onSubmit={(v: MenuItemFormValues) => {
            if (restaurantId) menuService.create(restaurantId, v);
            setAdding(false);
            toast.success('Menu item added.');
          }}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit menu item" size="lg">
        {editing && (
          <MenuItemForm
            initial={editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onSubmit={(v) => {
              menuService.update(editing.id, v);
              setEditing(null);
              toast.success('Menu item updated.');
            }}
          />
        )}
      </Modal>
    </div>
  );
}
