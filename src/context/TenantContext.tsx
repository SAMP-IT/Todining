import { createContext, useCallback, useContext, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { Restaurant } from '@/types';
import { restaurantService } from '@/data/services';
import { useRealtime } from '@/hooks/useRealtime';

interface TenantValue {
  restaurant: Restaurant | null;
  restaurantId: string | null;
  setRestaurantById: (id: string) => void;
  allRestaurants: Restaurant[];
  /** Top-level hotels (parentId === null). */
  hotels: Restaurant[];
  /** Child branches of a given hotel. */
  branchesOf: (hotelId: string) => Restaurant[];
}

const TenantContext = createContext<TenantValue | null>(null);

const LAST_KEY = 'todining_last_restaurant';

/**
 * Deterministic default workspace, used ONLY when no valid workspace has ever
 * been selected (fresh browser) or the selected one was deleted. Prefers the
 * earliest-created hotel so the choice never depends on Supabase's row order
 * (SELECT * has no ORDER BY) — that nondeterminism previously let the dashboard
 * land on an arbitrary hotel. Never used to override an existing valid selection.
 */
function pickDefaultId(all: Restaurant[]): string | null {
  const hotels = all.filter((r) => !r.parentId);
  const pool = hotels.length ? hotels : all;
  const sorted = [...pool].sort(
    (a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.id.localeCompare(b.id),
  );
  return sorted[0]?.id ?? null;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  // Restaurant identity (name, tagline, brand colour, tax/currency settings) can
  // change from the admin's Restaurants page. Re-render the provider when that
  // happens so every consumer — admin sidebar, switcher and the customer site —
  // reads the fresh restaurant instead of the copy captured at mount.
  const [, bumpVersion] = useReducer((n: number) => n + 1, 0);

  // Single source of truth for the active workspace. Initialised from the last
  // EXPLICIT selection (card / switcher / login) if it still resolves; otherwise
  // a deterministic default. An already-selected valid workspace is never
  // overridden — not by a fallback, not by the customer site, not by row order.
  const [restaurantId, setRestaurantId] = useState<string | null>(() => {
    const all = restaurantService.list();
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_KEY) : null;
    if (saved && all.some((r) => r.id === saved)) return saved;
    return pickDefaultId(all);
  });

  // Keep the provider live AND self-heal: when restaurant data changes, re-render
  // so identity edits propagate, and if the active workspace was deleted, fall
  // back deterministically. The handler always sees the current restaurantId
  // because useRealtime stores it in a ref.
  useRealtime(
    (event) => {
      if (event.type !== 'data:changed') return;
      // Same-tab service edits emit the semantic entity ('restaurant'); the
      // cross-tab Supabase realtime path re-fetches and emits the dbKey
      // ('restaurants'); a full reset emits 'all'. Match all three.
      const e = event.payload.entity;
      if (e !== 'restaurant' && e !== 'restaurants' && e !== 'all') return;
      if (restaurantId && !restaurantService.getById(restaurantId)) {
        const next = pickDefaultId(restaurantService.list());
        setRestaurantId(next);
        if (typeof window !== 'undefined') {
          if (next) window.localStorage.setItem(LAST_KEY, next);
          else window.localStorage.removeItem(LAST_KEY);
        }
      }
      bumpVersion();
    },
    { types: ['data:changed'] },
  );

  // The ONLY way to change the active workspace. Validates the id against the
  // store so a stale/unknown id can never switch the dashboard to the wrong (or
  // a phantom) hotel, then persists it as the new explicit selection.
  const setRestaurantById = useCallback((id: string) => {
    const r = restaurantService.getById(id);
    if (!r) {
      console.warn('[ToDining][tenant] Ignored switch to unknown restaurant id:', id);
      return;
    }
    setRestaurantId(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(LAST_KEY, id);
  }, []);

  const all = restaurantService.list();
  const value = useMemo<TenantValue>(
    () => ({
      restaurant: restaurantId ? restaurantService.getById(restaurantId) ?? null : null,
      restaurantId,
      setRestaurantById,
      allRestaurants: all,
      hotels: all.filter((r) => !r.parentId),
      branchesOf: (hotelId: string) => all.filter((r) => r.parentId === hotelId),
    }),
    [restaurantId, setRestaurantById, all],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
