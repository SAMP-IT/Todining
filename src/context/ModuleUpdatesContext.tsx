import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react';
import type { RealtimeEvent } from '@/data/realtime/bus';
import { useRealtime } from '@/hooks/useRealtime';
import { useTenant } from '@/context/TenantContext';

// ─────────────────────────────────────────────────────────────────────────────
// Module update indicator.
//
// Every service mutation emits a realtime event carrying the `restaurantId` it
// touched. This provider maps those events to the dashboard module they belong
// to and remembers, PER RESTAURANT, which modules have unseen updates. The
// sidebar renders a small green dot next to a module while it has an unseen
// update; visiting that page marks it viewed and clears the dot.
//
// Tracking is keyed by restaurantId, so it works for every existing and newly
// created restaurant with no extra code, and honours tenant isolation — a change
// to one hotel never lights another hotel's sidebar.
// ─────────────────────────────────────────────────────────────────────────────

/** A module key is simply the sidebar item's route (`to`) — a stable identity. */
export type ModuleKey = string;

/**
 * Map a realtime event to the module route(s) it affects. New restaurants need
 * no changes here (events are attributed by restaurantId); only a genuinely new
 * KIND of event would extend this table. Events that don't map to a sidebar
 * module (service requests, internal notifications, bulk hydrate) return [].
 */
function modulesForEvent(event: RealtimeEvent): ModuleKey[] {
  switch (event.type) {
    case 'order:created':
    case 'order:updated':
      return ['/admin/orders'];
    case 'reservation:created':
    case 'reservation:updated':
      return ['/admin/reservations'];
    case 'table:updated':
      return ['/admin/tables'];
    case 'inventory:low':
      return ['/admin/inventory'];
    case 'data:changed':
      switch (event.payload.entity) {
        case 'menu': return ['/admin/menu'];
        case 'staff': return ['/admin/staff'];
        case 'tables': return ['/admin/tables'];
        case 'inventory': return ['/admin/inventory'];
        case 'billing': return ['/admin/billing'];
        case 'feedback': return ['/admin/feedback'];
        case 'restaurant': return ['/admin/restaurants'];
        default: return [];
      }
    default:
      return [];
  }
}

/** restaurantId → module routes with an unseen update. */
type UpdatesByRestaurant = Record<string, ModuleKey[]>;

interface ModuleUpdatesValue {
  /** Does this module have an unseen update for the ACTIVE restaurant? */
  hasUpdate: (module: ModuleKey) => boolean;
  /** Mark a module viewed for the active restaurant (clears its dot). */
  markViewed: (module: ModuleKey) => void;
}

const STORAGE_KEY = 'todining_module_updates_v1';

const ModuleUpdatesContext = createContext<ModuleUpdatesValue | null>(null);

function loadState(): UpdatesByRestaurant {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UpdatesByRestaurant;
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    /* ignore malformed */
  }
  return {};
}

function saveState(state: UpdatesByRestaurant): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full / unavailable — keep in memory only */
  }
}

export function ModuleUpdatesProvider({ children }: { children: ReactNode }) {
  const { restaurantId } = useTenant();
  const [map, setMap] = useState<UpdatesByRestaurant>(() => loadState());

  useRealtime((event) => {
    const rid = event.restaurantId;
    // Skip broadcasts ('*' — bulk hydrate / reset / cross-tab sync): they can't
    // be attributed to a single restaurant's sidebar.
    if (!rid || rid === '*') return;
    const modules = modulesForEvent(event);
    if (modules.length === 0) return;

    setMap((prev) => {
      const current = new Set(prev[rid] ?? []);
      let changed = false;
      for (const m of modules) {
        if (!current.has(m)) {
          current.add(m);
          changed = true;
        }
      }
      if (!changed) return prev;
      const next = { ...prev, [rid]: [...current] };
      saveState(next);
      return next;
    });
  });

  const hasUpdate = useCallback(
    (module: ModuleKey) => (restaurantId ? (map[restaurantId] ?? []).includes(module) : false),
    [map, restaurantId],
  );

  const markViewed = useCallback(
    (module: ModuleKey) => {
      if (!restaurantId) return;
      setMap((prev) => {
        const arr = prev[restaurantId];
        if (!arr || !arr.includes(module)) return prev;
        const next = { ...prev, [restaurantId]: arr.filter((m) => m !== module) };
        saveState(next);
        return next;
      });
    },
    [restaurantId],
  );

  const value = useMemo<ModuleUpdatesValue>(() => ({ hasUpdate, markViewed }), [hasUpdate, markViewed]);

  return <ModuleUpdatesContext.Provider value={value}>{children}</ModuleUpdatesContext.Provider>;
}

export function useModuleUpdates(): ModuleUpdatesValue {
  const ctx = useContext(ModuleUpdatesContext);
  if (!ctx) throw new Error('useModuleUpdates must be used within ModuleUpdatesProvider');
  return ctx;
}
