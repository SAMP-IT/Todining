import { Trash2 } from 'lucide-react';
import type { CartItem } from '@/types';
import { ImageWithFallback, QuantityStepper } from '@/components/ui';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/format';

export function CartLine({ line, symbol }: { line: CartItem; symbol: string }) {
  const { increment, decrement, remove } = useCart();
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <ImageWithFallback src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{line.name}</p>
        <p className="text-sm text-ink-muted">{formatMoney(line.price, symbol)}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <QuantityStepper value={line.qty} onIncrement={() => increment(line.menuItemId)} onDecrement={() => decrement(line.menuItemId)} size="sm" />
        <button onClick={() => remove(line.menuItemId)} className="flex items-center gap-1 text-xs text-ink-muted hover:text-red-500">
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>
    </div>
  );
}
