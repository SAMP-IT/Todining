import type { CartItem, MenuItem } from '@/types';
import { getDb } from '@/data/mock/store';
import { menuService } from './menuService';

export interface UpsellSuggestion {
  item: MenuItem;
  message: string;
}

/**
 * AI-based upselling — SIMULATED with a rule engine.
 * Given the current cart, returns the best suggested add-on that isn't already
 * in the cart. Swap `suggestFor` for a model call later; the UI stays the same.
 */
export const upsellService = {
  suggestFor(restaurantId: string, cart: CartItem[]): UpsellSuggestion | null {
    if (!cart.length) return null;
    const rules = getDb().upsellRules.filter((r) => r.restaurantId === restaurantId);
    const inCart = new Set(cart.map((c) => c.menuItemId));

    for (const line of cart) {
      const rule = rules.find((r) => r.triggerItemId === line.menuItemId && !inCart.has(r.suggestedItemId));
      if (!rule) continue;
      const item = menuService.getItem(rule.suggestedItemId);
      if (item?.isAvailable) return { item, message: rule.message };
    }
    return null;
  },
};
