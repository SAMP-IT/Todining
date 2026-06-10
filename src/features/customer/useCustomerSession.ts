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
    const table = tableId ? tableService.get(tableId) : undefined;
    if (!restaurant || !table || table.restaurantId !== restaurant.id) return null;
    return { restaurant, table };
  }, [slug, tableId]);

  useEffect(() => {
    if (slug) setRestaurantBySlug(slug);
  }, [slug, setRestaurantBySlug]);

  return session;
}
