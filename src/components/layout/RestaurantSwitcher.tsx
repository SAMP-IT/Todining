import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/cn';

/** Multi-tenant switcher — changes the active restaurant for all dashboards. */
export function RestaurantSwitcher() {
  const { restaurant, allRestaurants, setRestaurantById } = useTenant();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-cream-deep"
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: restaurant?.logoColor }} />
        <span className="max-w-[10rem] truncate">{restaurant?.name ?? 'Select'}</span>
        <ChevronsUpDown className="h-4 w-4 text-ink-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lift animate-scale-in">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Your restaurants
            </div>
            {allRestaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setRestaurantById(r.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-cream-deep',
                  r.id === restaurant?.id && 'bg-cream-deep',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.logoColor }} />
                  <span className="font-medium">{r.name}</span>
                </span>
                {r.id === restaurant?.id && <Check className="h-4 w-4 text-ember-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
