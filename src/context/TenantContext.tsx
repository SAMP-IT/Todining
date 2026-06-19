import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Restaurant } from '@/types';
import { restaurantService } from '@/data/services';

interface TenantValue {
  restaurant: Restaurant | null;
  restaurantId: string | null;
  setRestaurantById: (id: string) => void;
  setRestaurantBySlug: (slug: string) => boolean;
  allRestaurants: Restaurant[];
}

const TenantContext = createContext<TenantValue | null>(null);

const LAST_KEY = 'todining_last_restaurant';

export function TenantProvider({ children }: { children: ReactNode }) {
  const all = restaurantService.list();
  const [restaurantId, setRestaurantId] = useState<string | null>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_KEY) : null;
    return saved && all.some((r) => r.id === saved) ? saved : all[0]?.id ?? null;
  });

  const setRestaurantById = useCallback((id: string) => {
    setRestaurantId(id);
    window.localStorage.setItem(LAST_KEY, id);
  }, []);

  const setRestaurantBySlug = useCallback((slug: string) => {
    const found = restaurantService.getBySlug(slug);
    if (found) {
      setRestaurantId(found.id);
      window.localStorage.setItem(LAST_KEY, found.id);
      return true;
    }
    return false;
  }, []);

  const value = useMemo<TenantValue>(
    () => ({
      restaurant: restaurantId ? restaurantService.getById(restaurantId) ?? null : null,
      restaurantId,
      setRestaurantById,
      setRestaurantBySlug,
      allRestaurants: all,
    }),
    [restaurantId, setRestaurantById, setRestaurantBySlug, all],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
