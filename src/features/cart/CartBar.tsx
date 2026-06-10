import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/format';

/** Sticky bottom bar shown whenever the cart has items. */
export function CartBar({ to, symbol, label = 'View order' }: { to: string; symbol: string; label?: string }) {
  const { count, subtotal } = useCart();
  const navigate = useNavigate();
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-safe">
      <button
        onClick={() => navigate(to)}
        className="pointer-events-auto mb-3 flex w-full items-center justify-between rounded-2xl bg-ember-500 px-4 py-3.5 text-white shadow-lift transition-transform active:scale-[0.99]"
      >
        <span className="flex items-center gap-2 font-semibold">
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-ember-600">
              {count}
            </span>
          </span>
          {label}
        </span>
        <span className="font-display text-lg font-semibold">{formatMoney(subtotal, symbol)}</span>
      </button>
    </div>
  );
}
