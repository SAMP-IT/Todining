import { useMemo, useReducer } from 'react';
import { useParams } from 'react-router-dom';
import { restaurantService, tableService } from '@/data/services';
import { useRealtime } from '@/hooks/useRealtime';
import type { Restaurant, RestaurantTable } from '@/types';

export interface CustomerSession {
  restaurant: Restaurant;
  table: RestaurantTable;
}

/**
 * Resolves the QR deep-link params (`/r/:slug/t/:tableId`) into a restaurant +
 * table. Returns `null` when the link is invalid.
 *
 * This is the SOLE source of the customer site's restaurant — every customer
 * page reads it via the outlet context, never via TenantContext. Crucially it
 * does NOT touch the global active workspace: the customer URL is per-link and
 * must never overwrite (or persist over) the admin's selected hotel/branch,
 * which is the single source of truth owned by TenantContext.
 */
export function useCustomerSession(): CustomerSession | null {
  const { slug, tableId } = useParams<{ slug: string; tableId: string }>();

  // Re-resolve the restaurant/table when the admin renames or re-themes the
  // restaurant (or on a full cross-tab reset) so the customer header, tagline
  // and currency stay in sync with the admin without a page reload.
  const [version, bump] = useReducer((n: number) => n + 1, 0);
  useRealtime(
    (event) => {
      if (event.type !== 'data:changed') return;
      // Match both the same-tab semantic entity ('restaurant'/'table') and the
      // cross-tab Supabase dbKey ('restaurants'/'tables'), plus a full reset.
      const e = event.payload.entity;
      if (['restaurant', 'restaurants', 'table', 'tables', 'all'].includes(e)) bump();
    },
    { types: ['data:changed'] },
  );

  const session = useMemo(() => {
    const restaurant = slug ? restaurantService.getBySlug(slug) : undefined;
    if (!restaurant || !tableId) return null;
    const existing = tableService.get(tableId);
    // A table that belongs to a different restaurant is a genuinely bad link.
    if (existing && existing.restaurantId !== restaurant.id) return null;
    // The restaurant is valid, so the menu is available — make sure the table
    // exists (auto-provisioning it if this device hasn't seen it) instead of
    // dead-ending on the 404 page when a QR is scanned on a fresh device.
    const table = existing ?? tableService.ensure(restaurant.id, tableId);
    return { restaurant, table };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, tableId, version]);

  return session;
}
