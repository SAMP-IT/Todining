import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/cn';

/**
 * Branch switcher — scoped to the ACTIVE hotel only. Lists the hotel (Main
 * Branch) and its own branches, never other hotels' workspaces, so the
 * dashboard reflects only the currently active branch and its siblings.
 * Switching to a different hotel happens in the Admin Panel workspace manager.
 */
export function RestaurantSwitcher() {
  const { restaurant, allRestaurants, branchesOf, setRestaurantById } = useTenant();
  const [open, setOpen] = useState(false);

  // Resolve the parent hotel of whatever is active (the hotel itself when a
  // hotel is active, or its parent when a branch is active), then offer only
  // that hotel + its branches.
  const parentHotelId = restaurant?.parentId ?? restaurant?.id ?? null;
  const hotel = parentHotelId ? allRestaurants.find((r) => r.id === parentHotelId) ?? null : null;
  const options = hotel ? [hotel, ...branchesOf(hotel.id)] : [];

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
              Your branches
            </div>
            {options.map((r) => (
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
                  <span className="font-medium">{r.id === parentHotelId && options.length > 1 ? 'Main Branch' : r.name}</span>
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
