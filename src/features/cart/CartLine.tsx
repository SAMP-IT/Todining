import { Trash2 } from 'lucide-react';
import type { CartItem } from '@/types';
import { ImageWithFallback, QuantityStepper } from '@/components/ui';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/format';

/**
 * One line of the guest's order: photo, dish, unit price, the stepper, and the
 * line total. Rows are hairline-separated rather than boxed as cards — the cart
 * should read like a printed check, not a feed.
 *
 * The phone tucks the stepper under the name so the line total keeps the right
 * margin to itself; desktop promotes it to its own column, which lines the
 * totals up into a clean tabular rail. Same DOM, placed by the grid.
 */
export function CartLine({ line, symbol }: { line: CartItem; symbol: string }) {
  const { increment, decrement, remove } = useCart();

  return (
    <div className="grid grid-cols-[3.1rem_1fr_auto] items-center gap-x-3 border-b border-ink/10 py-3 lg:grid-cols-[3.6rem_1fr_auto_auto] lg:gap-x-4 lg:py-3.5">
      <div className="row-start-1 row-end-3 h-[3.1rem] w-[3.1rem] overflow-hidden rounded-lg bg-cream-deep lg:row-end-2 lg:h-[3.6rem] lg:w-[3.6rem]">
        <ImageWithFallback src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" />
      </div>

      <div className="col-start-2 row-start-1 min-w-0">
        <h3 className="truncate font-display text-[0.95rem] font-semibold leading-tight lg:text-base">{line.name}</h3>
        <p className="tnum mt-0.5 text-[0.68rem] font-semibold text-ink-muted lg:text-[0.7rem]">
          {formatMoney(line.price, symbol)} each
        </p>
      </div>

      <div className="col-start-2 row-start-2 mt-1.5 flex items-center gap-2 justify-self-start lg:col-start-3 lg:row-start-1 lg:mt-0">
        <QuantityStepper
          value={line.qty}
          onIncrement={() => increment(line.menuItemId)}
          onDecrement={() => decrement(line.menuItemId)}
          size="sm"
        />
        {/* Clearing a line outright: the stepper only removes on the last unit. */}
        <button
          onClick={() => remove(line.menuItemId)}
          aria-label={`Remove ${line.name}`}
          className="grid h-7 w-7 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-ink/5 hover:text-ember-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="tnum col-start-3 row-start-1 row-end-3 text-right font-display text-base font-semibold lg:col-start-4 lg:row-end-2 lg:min-w-[4rem] lg:text-lg">
        {formatMoney(line.price * line.qty, symbol)}
      </span>
    </div>
  );
}
