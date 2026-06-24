// ─────────────────────────────────────────────────────────────────────────────
// Data store — a synchronous in-memory cache that the whole app reads through.
//
// Two backends, chosen at runtime:
//  • Supabase (when VITE_SUPABASE_URL/ANON_KEY are set): the cache is hydrated
//    from Supabase on startup, every mutation is written through to Supabase,
//    and Postgres realtime changes refresh the cache so all devices stay in
//    sync. Reads stay synchronous so no screen/service code had to change.
//  • localStorage fallback (no env): the original offline mock behaviour.
//
// Services are the only thing that should touch this directly.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Bill, Customer, Feedback, InventoryItem, MenuCategory, MenuItem, Notification,
  Order, QrCode, Reservation, Restaurant, RestaurantTable, ServiceRequest, Staff,
  UpsellRule,
} from '@/types';
import { realtimeBus } from '@/data/realtime/bus';
import { supabase, isSupabaseEnabled } from '@/data/supabase/client';
import {
  SPECS, SPEC_BY_TABLE, ORDER_ITEMS_TABLE, orderItemsToRows, orderItemFromRow,
} from '@/data/supabase/mappers';
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

function emptyDatabase(): Database {
  return {
    restaurants: [], staff: [], tables: [], qrCodes: [], categories: [],
    menuItems: [], orders: [], serviceRequests: [], reservations: [], bills: [],
    feedback: [], inventory: [], customers: [], upsellRules: [], notifications: [],
  };
}

// The cache starts empty; bootstrapStore() fills it before the app renders.
let db: Database = isSupabaseEnabled ? emptyDatabase() : loadLocal();

/** Read the whole database (services slice + filter from here). */
export function getDb(): Database {
  return db;
}

/** Apply a mutation, persist (Supabase write-through or localStorage), return the result. */
export function mutate<T>(fn: (database: Database) => T): T {
  if (isSupabaseEnabled) {
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
  if (isSupabaseEnabled) {
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
    if (!isSupabaseEnabled || !supabase) {
      db = loadLocal();
      return;
    }
    await hydrateAll();
    // First run against a fresh project: push the seed so the demo has data.
    if (db.restaurants.length === 0) {
      const seed = createSeedData();
      await pushAll(seed);
      db = seed;
    }
    subscribeRealtime();
  })();
  return bootstrapped;
}

async function hydrateAll(): Promise<void> {
  const next = emptyDatabase();
  console.info('[ToDining][supabase] Hydrating cache — SELECT * from all tables…');
  await Promise.all(
    SPECS.map(async (spec) => {
      const { data, error } = await supabase!.from(spec.table).select('*');
      if (error) throw new Error(`Load ${spec.table}: ${error.message}`);
      console.info(`[ToDining][supabase] SELECT ${spec.table}: ${data?.length ?? 0} rows`);
      (next[spec.dbKey] as unknown[]) = (data ?? []).map((r) => spec.fromRow(r));
    }),
  );
  await attachOrderItems(next);
  db = next;
}

/** Re-read a single table into the cache (used by realtime), then notify the UI. */
async function refetch(dbKey: keyof Database): Promise<void> {
  if (!supabase) return;
  const spec = SPECS.find((s) => s.dbKey === dbKey);
  if (!spec) return;
  console.info(`[ToDining][supabase] Realtime change → re-fetching ${spec.table}…`);
  const { data, error } = await supabase.from(spec.table).select('*');
  if (error) {
    console.error(`[ToDining][supabase] Re-fetch ${spec.table} ERROR:`, error);
    return;
  }
  console.info(`[ToDining][supabase] Re-fetched ${spec.table}: ${data?.length ?? 0} rows`);
  (db[spec.dbKey] as unknown[]) = (data ?? []).map((r) => spec.fromRow(r));
  if (dbKey === 'orders') await attachOrderItems(db);
  realtimeBus.emit({ type: 'data:changed', restaurantId: '*', payload: { entity: dbKey } });
}

async function attachOrderItems(target: Database): Promise<void> {
  if (!supabase || target.orders.length === 0) return;
  const { data, error } = await supabase.from(ORDER_ITEMS_TABLE).select('*');
  if (error || !data) return;
  const byOrder = new Map<string, ReturnType<typeof orderItemFromRow>[]>();
  for (const row of data) {
    const it = orderItemFromRow(row);
    (byOrder.get(it.orderId) ?? byOrder.set(it.orderId, []).get(it.orderId)!).push(it);
  }
  target.orders.forEach((o) => {
    o.items = (byOrder.get(o.id) ?? []).map(({ orderId: _orderId, ...rest }) => rest);
  });
}

// ── Write-through (diff the cache, push changes to Supabase) ────────────────────

// Serialise all writes so FK-dependent rows (orders → order_items) land in order
// and concurrent mutations don't race.
let writeChain: Promise<void> = Promise.resolve();
function enqueue(task: () => Promise<void>): void {
  writeChain = writeChain.then(task).catch(reportWriteError);
}

function syncDiff(before: Database, after: Database): void {
  enqueue(async () => {
    if (!supabase) return;
    let wrote = false;
    for (const spec of SPECS) {
      const beforeArr = before[spec.dbKey] as { id: string }[];
      const afterArr = after[spec.dbKey] as { id: string }[];
      const beforeById = new Map(beforeArr.map((r) => [r.id, JSON.stringify(r)]));
      const afterIds = new Set(afterArr.map((r) => r.id));

      const upserts = afterArr.filter((r) => beforeById.get(r.id) !== JSON.stringify(r));
      const deletes = beforeArr.filter((r) => !afterIds.has(r.id)).map((r) => r.id);

      if (upserts.length) {
        wrote = true;
        const rows = upserts.map((r) => spec.toRow(r));
        console.info(`[ToDining][supabase] INSERT/UPDATE → ${spec.table} payload:`, rows);
        // .select() makes Postgres echo the stored rows back, confirming the write.
        const { data, error } = await supabase.from(spec.table).upsert(rows).select();
        if (error) {
          console.error(`[ToDining][supabase] ${spec.table} upsert ERROR:`, error);
          throw new Error(`Save ${spec.table}: ${error.message}`);
        }
        console.info(`[ToDining][supabase] ${spec.table} upsert SUCCESS — stored rows:`, data);
        if (spec.dbKey === 'orders') {
          const newOrders = upserts.filter((o) => !beforeById.has(o.id)) as unknown as Order[];
          for (const o of newOrders) {
            if (o.items?.length) {
              const itemRows = orderItemsToRows(o);
              console.info('[ToDining][supabase] INSERT → order_items payload:', itemRows);
              const { error: e2 } = await supabase.from(ORDER_ITEMS_TABLE).upsert(itemRows);
              if (e2) {
                console.error('[ToDining][supabase] order_items upsert ERROR:', e2);
                throw new Error(`Save order_items: ${e2.message}`);
              }
            }
          }
        }
      }
      if (deletes.length) {
        wrote = true;
        console.info(`[ToDining][supabase] DELETE → ${spec.table} ids:`, deletes);
        const { error } = await supabase.from(spec.table).delete().in('id', deletes);
        if (error) {
          console.error(`[ToDining][supabase] ${spec.table} delete ERROR:`, error);
          throw new Error(`Delete ${spec.table}: ${error.message}`);
        }
        console.info(`[ToDining][supabase] ${spec.table} delete SUCCESS:`, deletes);
      }
    }
    if (!wrote) console.warn('[ToDining][supabase] syncDiff ran but found NO changes to persist.');
  });
}

/** Insert an entire database (seed / reset) respecting FK order. */
async function pushAll(source: Database): Promise<void> {
  if (!supabase) return;
  for (const spec of SPECS) {
    const rows = (source[spec.dbKey] as unknown[]).map((r) => spec.toRow(r));
    if (!rows.length) continue;
    const { error } = await supabase.from(spec.table).upsert(rows);
    if (error) throw new Error(`Seed ${spec.table}: ${error.message}`);
  }
  const itemRows = source.orders.flatMap((o) => orderItemsToRows(o));
  if (itemRows.length) {
    const { error } = await supabase.from(ORDER_ITEMS_TABLE).upsert(itemRows);
    if (error) throw new Error(`Seed order_items: ${error.message}`);
  }
}

function reportWriteError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[ToDining] Supabase write failed:', message);
  // A missing column / schema mismatch is the usual culprit — make it unmistakable.
  const schemaHint = /column .* does not exist|schema cache|PGRST204|42703/i.test(message)
    ? ' (database schema is out of date — run supabase/migrations/0001_multi_tenant.sql)'
    : '';
  // Surfaced lazily so the store has no hard dependency on the toast lib timing.
  void import('sonner').then(({ toast }) =>
    toast.error(`Couldn't save changes${schemaHint}: ${message}`));
  // The cache still holds the optimistic rows the database rejected. Re-hydrate
  // from Supabase so the in-memory state — and therefore every screen, including
  // the workspace manager — matches what was actually persisted, instead of
  // showing phantom data that silently disappears on the next reload.
  if (isSupabaseEnabled && supabase) {
    void hydrateAll()
      .then(() => realtimeBus.emit({ type: 'data:changed', restaurantId: '*', payload: { entity: 'all' } }))
      .catch((e) => console.error('[ToDining] Re-hydrate after write failure also failed:', e));
  }
}

// ── Realtime (Postgres changes → refresh cache → notify UI) ─────────────────────

function subscribeRealtime(): void {
  if (!supabase) return;
  const pending = new Set<keyof Database>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    timer = null;
    const keys = [...pending];
    pending.clear();
    keys.forEach((k) => void refetch(k));
  };
  const schedule = (key: keyof Database) => {
    pending.add(key);
    if (!timer) timer = setTimeout(flush, 120);
  };

  supabase
    .channel('todining-db')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      const table = (payload as { table: string }).table;
      if (table === ORDER_ITEMS_TABLE) return schedule('orders');
      const spec = SPEC_BY_TABLE[table];
      if (spec) schedule(spec.dbKey);
    })
    .subscribe();
}

// ── localStorage fallback (no Supabase configured) ──────────────────────────────

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
if (typeof window !== 'undefined' && !isSupabaseEnabled) {
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
