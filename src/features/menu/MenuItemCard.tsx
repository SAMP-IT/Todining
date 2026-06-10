import { Plus } from 'lucide-react';
import type { MenuItem } from '@/types';
import { ImageWithFallback, QuantityStepper } from '@/components/ui';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';

export function MenuItemCard({ item, currencySymbol }: { item: MenuItem; currencySymbol: string }) {
  const { qtyOf, add, increment, decrement } = useCart();
  const qty = qtyOf(item.id);
  const disabled = !item.isAvailable;

  return (
    <div className={cn('flex gap-3 rounded-2xl border border-ink/5 bg-white p-3 shadow-soft', disabled && 'opacity-70')}>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <ImageWithFallback src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        {disabled && (
          <div className="absolute inset-0 grid place-items-center bg-ink/55">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
              Sold out
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{item.name}</h3>
          {item.tags?.includes('veg') && <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-sm border-2 border-sage-500"><span className="h-2 w-2 rounded-full bg-sage-500" /></span>}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{item.description}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-lg font-semibold">{formatMoney(item.price, currencySymbol)}</span>
          {disabled ? (
            <span className="text-xs font-medium text-ink-muted">Unavailable</span>
          ) : qty > 0 ? (
            <QuantityStepper value={qty} onIncrement={() => increment(item.id)} onDecrement={() => decrement(item.id)} size="sm" />
          ) : (
            <button
              onClick={() => add(item)}
              className="inline-flex items-center gap-1 rounded-xl bg-ember-500 px-3 py-1.5 text-sm font-semibold text-white shadow-soft transition-transform hover:bg-ember-600 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
