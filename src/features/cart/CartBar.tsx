import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/format';

/**
 * Sticky bottom bar shown whenever the cart has items. Phone only — on desktop
 * the running order lives in the sticky order panel beside the menu.
 */
export function CartBar({ to, symbol, label = 'View order' }: { to: string; symbol: string; label?: string }) {
  const { count, subtotal } = useCart();
  const navigate = useNavigate();
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-safe lg:hidden">
      <button
        onClick={() => navigate(to)}
        className="pointer-events-auto mb-3 flex w-full items-center justify-between rounded-2xl bg-ink px-4 py-3.5 text-cream shadow-lift transition-transform active:scale-[0.99]"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold">
          <span className="grid h-6 min-w-[1.5rem] place-items-center rounded-full bg-ember-500 px-1 text-xs font-bold text-cream">
            {count}
          </span>
          {label}
        </span>
        <span className="tnum font-display text-lg font-semibold">{formatMoney(subtotal, symbol)} →</span>
      </button>
    </div>
  );
}
