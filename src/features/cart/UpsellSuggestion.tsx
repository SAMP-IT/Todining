import { Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { upsellService } from '@/data/services';
import { ImageWithFallback } from '@/components/ui';
import { formatMoney } from '@/lib/format';

/**
 * Feature 13 — AI-based upselling (rule engine). Suggests a complementary item
 * based on what's in the cart, e.g. "Add Garlic Naan for ₹60?".
 *
 * Styled as the one gold note on the check: a dashed panel, the way a printed
 * menu pencils in the sommelier's pairing. Gold (not ember) keeps it a
 * suggestion — ember stays reserved for the guest's own action.
 */
export function UpsellSuggestion({ restaurantId, symbol }: { restaurantId: string; symbol: string }) {
  const { items, add } = useCart();
  const suggestion = upsellService.suggestFor(restaurantId, items);
  if (!suggestion) return null;

  return (
    <div className="mt-4 rounded-xl border border-dashed border-ink/25 bg-gold-100 p-3 lg:mt-5 lg:p-3.5">
      <p className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-gold-600 lg:mb-2.5">
        Goes well with
      </p>
      <div className="flex items-center gap-2.5 lg:gap-3">
        <div className="h-[2.4rem] w-[2.4rem] shrink-0 overflow-hidden rounded-lg bg-cream-deep lg:h-[2.8rem] lg:w-[2.8rem]">
          <ImageWithFallback
            src={suggestion.item.imageUrl}
            alt={suggestion.item.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[0.9rem] font-semibold leading-tight lg:text-[0.95rem]">
            {suggestion.item.name}
          </h3>
          <p className="truncate text-[0.7rem] font-semibold text-ink-soft">{suggestion.message}</p>
        </div>
        <button
          onClick={() => add(suggestion.item)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-ember-300 px-2.5 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.05em] text-ember-600 transition-colors hover:border-ember-500 hover:bg-ember-500 hover:text-cream active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> Add <span className="tnum">{formatMoney(suggestion.item.price, symbol)}</span>
        </button>
      </div>
    </div>
  );
}
