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
import { cn } from '@/lib/cn';

/** The veg marker, drawn to match the customer menu row (MenuItemCard). */
function VegMark() {
  return (
    <span className="grid h-3 w-3 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-sage-500">
      <span className="h-1 w-1 rounded-full bg-sage-500" />
    </span>
  );
}

/**
 * A category section header: an italic display title, a hairline rule carrying
 * the eye across, and the count. Mirrors the printed sections of the customer
 * menu so operators recognise what a diner will see.
 */
function SectionHead({ name, count }: { name: string; count: number }) {
  return (
    <div className="mb-2 flex items-baseline gap-3">
      <h2 className="font-display text-xl font-semibold italic leading-none">{name}</h2>
      <span className="h-px flex-1 bg-ink/10" />
      <span className="tnum shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-muted">
        {count} {count === 1 ? 'dish' : 'dishes'}
      </span>
    </div>
  );
}

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
                <SectionHead name={cat.name} count={catItems.length} />

                <div className="rounded-xl border border-ink/10 bg-white px-3 sm:px-4">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'grid grid-cols-[3.5rem_1fr] items-center gap-3 border-b border-ink/10 py-3 last:border-b-0 sm:grid-cols-[4rem_1fr] sm:gap-4 sm:py-3.5',
                        !item.isAvailable && 'opacity-75',
                      )}
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-deep sm:h-16 sm:w-16">
                        <ImageWithFallback src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      </div>

                      {/* Stacks under 640px so the phone never scrolls sideways;
                          on wider screens name and controls share a baseline. */}
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="truncate font-display text-[1.05rem] font-semibold leading-tight">{item.name}</h3>
                            {item.tags?.includes('veg') && <VegMark />}
                          </div>
                          {item.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-ink-muted">{item.description}</p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                          <span className="tnum font-display text-lg font-semibold">{formatMoney(item.price, symbol)}</span>

                          <button
                            onClick={() => menuService.toggleAvailability(item.id)}
                            className="cursor-pointer"
                            title="Toggle availability"
                          >
                            {item.isAvailable ? <Badge tone="sage" dot>Available</Badge> : <Badge tone="red" dot>Sold out</Badge>}
                          </button>

                          <div className="flex gap-1">
                            <button onClick={() => setEditing(item)} className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => { menuService.remove(item.id); toast('Item removed.'); }} className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
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
