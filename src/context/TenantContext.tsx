import { createContext, useCallback, useContext, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { Restaurant } from '@/types';
import { restaurantService } from '@/data/services';
import { useRealtime } from '@/hooks/useRealtime';

interface TenantValue {
  restaurant: Restaurant | null;
  restaurantId: string | null;
  setRestaurantById: (id: string) => void;
  setRestaurantBySlug: (slug: string) => boolean;
  allRestaurants: Restaurant[];
  /** Top-level hotels (parentId === null). */
  hotels: Restaurant[];
  /** Child branches of a given hotel. */
  branchesOf: (hotelId: string) => Restaurant[];
}

const TenantContext = createContext<TenantValue | null>(null);

const LAST_KEY = 'todining_last_restaurant';

export function TenantProvider({ children }: { children: ReactNode }) {
  // Restaurant identity (name, tagline, brand colour, tax/currency settings) can
  // change from the admin's Restaurants page. Re-render the provider when that
  // happens so every consumer — admin sidebar, switcher and the customer site —
  // reads the fresh restaurant instead of the copy captured at mount.
  const [, bumpVersion] = useReducer((n: number) => n + 1, 0);
  useRealtime(
    (event) => {
      if (event.type !== 'data:changed') return;
      // Same-tab service edits emit the semantic entity ('restaurant'); the
      // cross-tab Supabase realtime path re-fetches and emits the dbKey
      // ('restaurants'); a full reset emits 'all'. Match all three.
      const e = event.payload.entity;
      if (e === 'restaurant' || e === 'restaurants' || e === 'all') bumpVersion();
    },
    { types: ['data:changed'] },
  );

  const all = restaurantService.list();
  const [restaurantId, setRestaurantId] = useState<string | null>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_KEY) : null;
    return saved && all.some((r) => r.id === saved) ? saved : all[0]?.id ?? null;
  });

  const setRestaurantById = useCallback((id: string) => {
    // [DEBUG-MENU] temporary — trace which workspace becomes active.
    const r = restaurantService.getById(id);
    console.debug('[DEBUG-MENU] setActiveRestaurant', {
      restaurantId: id, name: r?.name, parentId: r?.parentId ?? null,
      kind: r?.parentId ? 'BRANCH' : 'HOTEL',
    });
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
      hotels: all.filter((r) => !r.parentId),
      branchesOf: (hotelId: string) => all.filter((r) => r.parentId === hotelId),
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
