// ─────────────────────────────────────────────────────────────────────────────
// Data store — a synchronous in-memory cache that the whole app reads through.
//
// Two backends, chosen at runtime:
//  • API (when VITE_API_URL is set): the cache is hydrated from GET /api/bootstrap
//    on startup and every mutation is written through via POST /api/sync
//    (server/ → PostgreSQL). Reads stay synchronous so no screen/service changed.
//  • localStorage fallback (no env): the original offline mock behaviour.
//
// Cross-device live updates will come from an API WebSocket (TODO); today the
// in-app realtime bus keeps a single tab in sync.
//
// Services are the only thing that should touch this directly.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Bill, Customer, Feedback, InventoryItem, MenuCategory, MenuItem, Notification,
  Order, QrCode, Reservation, Restaurant, RestaurantTable, ServiceRequest, Staff,
  UpsellRule,
} from '@/types';
import { realtimeBus } from '@/data/realtime/bus';
import { api, isApiEnabled } from '@/data/supabase/client';
import { SPECS, orderItemsToRows, orderItemFromRow } from '@/data/supabase/mappers';
import { createSeedData } from './seed';

export interface Database {
  restaurants: Restaurant[];
  staff: Staff[];
  tables: RestaurantTable[];
  qrCodes: QrCode[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  serviceRequests: ServiceRequest[];
  reservations: Reservation[];
  bills: Bill[];
  feedback: Feedback[];
  inventory: InventoryItem[];
  customers: Customer[];
  upsellRules: UpsellRule[];
  notifications: Notification[];
}

const STORAGE_KEY = 'todining_db_v1';
const ORDER_ITEMS_TABLE = 'order_items';

function emptyDatabase(): Database {
  return {
    restaurants: [], staff: [], tables: [], qrCodes: [], categories: [],
    menuItems: [], orders: [], serviceRequests: [], reservations: [], bills: [],
    feedback: [], inventory: [], customers: [], upsellRules: [], notifications: [],
  };
}

// The cache starts empty; bootstrapStore() fills it before the app renders.
let db: Database = isApiEnabled ? emptyDatabase() : loadLocal();

/** Read the whole database (services slice + filter from here). */
export function getDb(): Database {
  return db;
}

/** Apply a mutation, persist (API write-through or localStorage), return the result. */
export function mutate<T>(fn: (database: Database) => T): T {
  if (isApiEnabled) {
    const before = structuredClone(db);
    const result = fn(db);
    syncDiff(before, db);
    return result;
  }
  const result = fn(db);
  persistLocal(db);
  return result;
}

/** Reset everything back to seed data (used by the "Reset demo" action). */
export function resetDb(): void {
  const seed = createSeedData();
  db = seed;
  if (isApiEnabled) {
    enqueue(() => pushAll(seed));
  } else {
    persistLocal(seed);
  }
  realtimeBus.emit({ type: 'data:changed', restaurantId: '*', payload: { entity: 'all' } });
}

// ── Startup hydration ─────────────────────────────────────────────────────────

let bootstrapped: Promise<void> | null = null;

/** Hydrate the cache before first render. Safe to call more than once. */
export function bootstrapStore(): Promise<void> {
  if (bootstrapped) return bootstrapped;
  bootstrapped = (async () => {
    if (!isApiEnabled) {
      db = loadLocal();
      return;
    }
    await hydrateAll();
    // First run against a fresh database: push the seed so the demo has data.
    if (db.restaurants.length === 0) {
      const seed = createSeedData();
      await pushAll(seed);
      db = seed;
    }
    // TODO: subscribe to an API WebSocket here for cross-device live updates.
  })();
  return bootstrapped;
}

async function hydrateAll(): Promise<void> {
  const next = emptyDatabase();
  const boot = await api.bootstrap();
  for (const spec of SPECS) {
    const rows = boot[spec.dbKey] ?? [];
    (next[spec.dbKey] as unknown[]) = rows.map((r) => spec.fromRow(r));
  }
  attachOrderItems(next, boot.orderItems ?? []);
  db = next;
}

/** Attach `order_items` rows (from /api/bootstrap) to their parent orders. */
function attachOrderItems(target: Database, rows: Record<string, unknown>[]): void {
  if (target.orders.length === 0) return;
  const byOrder = new Map<string, ReturnType<typeof orderItemFromRow>[]>();
  for (const row of rows) {
    const it = orderItemFromRow(row);
    (byOrder.get(it.orderId) ?? byOrder.set(it.orderId, []).get(it.orderId)!).push(it);
  }
  target.orders.forEach((o) => {
    o.items = (byOrder.get(o.id) ?? []).map(({ orderId: _orderId, ...rest }) => rest);
  });
}

// ── Write-through (diff the cache, push changes to the API) ─────────────────────

// Serialise all writes so FK-dependent rows (orders → order_items) land in order
// and concurrent mutations don't race.
let writeChain: Promise<void> = Promise.resolve();
function enqueue(task: () => Promise<void>): void {
  writeChain = writeChain.then(task).catch(reportWriteError);
}

function syncDiff(before: Database, after: Database): void {
  enqueue(async () => {
    for (const spec of SPECS) {
      const beforeArr = before[spec.dbKey] as { id: string }[];
      const afterArr = after[spec.dbKey] as { id: string }[];
      const beforeById = new Map(beforeArr.map((r) => [r.id, JSON.stringify(r)]));
      const afterIds = new Set(afterArr.map((r) => r.id));

      const changed = afterArr.filter((r) => beforeById.get(r.id) !== JSON.stringify(r));
      const deletes = beforeArr.filter((r) => !afterIds.has(r.id)).map((r) => r.id);
      if (!changed.length && !deletes.length) continue;

      await api.sync(spec.table, changed.map((r) => spec.toRow(r)), deletes);

      // New orders: also push their line items to the order_items child table.
      if (spec.dbKey === 'orders') {
        const newOrders = changed.filter((o) => !beforeById.has(o.id)) as unknown as Order[];
        for (const o of newOrders) {
          if (o.items?.length) await api.sync(ORDER_ITEMS_TABLE, orderItemsToRows(o), []);
        }
      }
    }
  });
}

/** Insert an entire database (seed / reset) respecting FK order. */
async function pushAll(source: Database): Promise<void> {
  for (const spec of SPECS) {
    const rows = (source[spec.dbKey] as unknown[]).map((r) => spec.toRow(r));
    if (rows.length) await api.sync(spec.table, rows, []);
  }
  const itemRows = source.orders.flatMap((o) => orderItemsToRows(o));
  if (itemRows.length) await api.sync(ORDER_ITEMS_TABLE, itemRows, []);
}

function reportWriteError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[ToDining] API write failed:', message);
  // Surfaced lazily so the store has no hard dependency on the toast lib timing.
  void import('sonner').then(({ toast }) => toast.error(`Couldn't save changes: ${message}`));
  // The cache still holds the optimistic rows the API rejected. Re-hydrate so the
  // in-memory state — and every screen — matches what was actually persisted,
  // instead of showing phantom data that silently disappears on the next reload.
  if (isApiEnabled) {
    void hydrateAll()
      .then(() => realtimeBus.emit({ type: 'data:changed', restaurantId: '*', payload: { entity: 'all' } }))
      .catch((e) => console.error('[ToDining] Re-hydrate after write failure also failed:', e));
  }
}

// ── localStorage fallback (no API configured) ───────────────────────────────────

function loadLocal(): Database {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Database;
        if (isUsable(parsed)) return parsed;
      }
    } catch {
      /* fall through to seed */
    }
  }
  const seed = createSeedData();
  persistLocal(seed);
  return seed;
}

function persistLocal(database: Database): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    } catch {
      /* storage full / unavailable — keep in memory only */
    }
  }
}

function isUsable(d: Partial<Database> | null): d is Database {
  return (
    !!d &&
    Array.isArray(d.restaurants) && d.restaurants.length > 0 &&
    Array.isArray(d.tables) && d.tables.length > 0 &&
    Array.isArray(d.categories) &&
    Array.isArray(d.menuItems)
  );
}

// Cross-tab sync for the localStorage fallback: when another tab writes, reload.
if (typeof window !== 'undefined' && !isApiEnabled) {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        db = JSON.parse(e.newValue) as Database;
        realtimeBus.emit({ type: 'data:changed', restaurantId: '*', payload: { entity: 'all' } });
      } catch {
        /* ignore malformed */
      }
    }
  });
}
