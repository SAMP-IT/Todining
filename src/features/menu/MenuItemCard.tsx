import { Plus } from 'lucide-react';
import type { MenuItem } from '@/types';
import { ImageWithFallback, QuantityStepper } from '@/components/ui';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';

/** The veg marker: the familiar green square-and-dot, drawn to our palette. */
function VegMark() {
  return (
    <span className="grid h-3 w-3 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-sage-500">
      <span className="h-1 w-1 rounded-full bg-sage-500" />
    </span>
  );
}

/**
 * An editorial menu row: photo, name, description, then price and the add
 * control on a baseline. Rows are separated by hairlines rather than boxed as
 * cards — the menu should read like a printed page, not a feed.
 */
export function MenuItemCard({ item, currencySymbol }: { item: MenuItem; currencySymbol: string }) {
  const { qtyOf, add, increment, decrement } = useCart();
  const qty = qtyOf(item.id);
  const disabled = !item.isAvailable;

  return (
    <div
      className={cn(
        'grid grid-cols-[4.6rem_1fr] items-center gap-3.5 border-b border-ink/10 py-3.5 last:border-b-0 lg:grid-cols-[5rem_1fr] lg:gap-4 lg:py-4',
        disabled && 'opacity-70',
      )}
    >
      <div className="relative h-[4.6rem] w-[4.6rem] overflow-hidden rounded-xl bg-cream-deep lg:h-20 lg:w-20">
        <ImageWithFallback src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        {disabled && (
          <div className="absolute inset-0 grid place-items-center bg-ink/55">
            <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[0.5rem] font-extrabold uppercase tracking-[0.08em] text-ink">
              Sold out
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-display text-[1.05rem] font-semibold leading-tight">{item.name}</h3>
          {item.tags?.includes('veg') && <VegMark />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">{item.description}</p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="tnum font-display text-lg font-semibold">{formatMoney(item.price, currencySymbol)}</span>
          {disabled ? (
            <span className="text-xs font-semibold text-ink-muted">Unavailable</span>
          ) : qty > 0 ? (
            <QuantityStepper
              value={qty}
              onIncrement={() => increment(item.id)}
              onDecrement={() => decrement(item.id)}
              size="sm"
            />
          ) : (
            <button
              onClick={() => add(item)}
              className="inline-flex items-center gap-1 rounded-lg border border-ember-300 px-2.5 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.05em] text-ember-600 transition-colors hover:border-ember-500 hover:bg-ember-500 hover:text-cream active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
