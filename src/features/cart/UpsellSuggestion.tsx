import { Sparkles, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { upsellService } from '@/data/services';
import { ImageWithFallback } from '@/components/ui';
import { formatMoney } from '@/lib/format';

/**
 * Feature 13 — AI-based upselling (rule engine). Suggests a complementary item
 * based on what's in the cart, e.g. "Add Garlic Naan for ₹60?".
 */
export function UpsellSuggestion({ restaurantId, symbol }: { restaurantId: string; symbol: string }) {
  const { items, add } = useCart();
  const suggestion = upsellService.suggestFor(restaurantId, items);
  if (!suggestion) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ember-200 bg-ember-50 p-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <ImageWithFallback src={suggestion.item.imageUrl} alt={suggestion.item.name} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-ember-600">
          <Sparkles className="h-3 w-3" /> You might like
        </span>
        <p className="truncate text-sm font-semibold text-ink">{suggestion.message}</p>
      </div>
      <button
        onClick={() => add(suggestion.item)}
        className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-ember-500 px-3 py-2 text-sm font-semibold text-white active:scale-95"
      >
        <Plus className="h-4 w-4" /> {formatMoney(suggestion.item.price, symbol)}
      </button>
    </div>
  );
}
