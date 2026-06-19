import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/context/TenantContext';
import { restaurantService, tableService } from '@/data/services';
import type { Restaurant, RestaurantTable } from '@/types';

export interface CustomerSession {
  restaurant: Restaurant;
  table: RestaurantTable;
}

/**
 * Resolves the QR deep-link params (`/r/:slug/t/:tableId`) into a restaurant +
 * table, and syncs the active tenant. Returns `null` when the link is invalid.
 */
export function useCustomerSession(): CustomerSession | null {
  const { slug, tableId } = useParams<{ slug: string; tableId: string }>();
  const { setRestaurantBySlug } = useTenant();

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
  }, [slug, tableId]);

  useEffect(() => {
    if (slug) setRestaurantBySlug(slug);
  }, [slug, setRestaurantBySlug]);

  return session;
}
