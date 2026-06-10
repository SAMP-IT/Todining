// ─────────────────────────────────────────────────────────────────────────────
// In-memory database for the mock data layer.
// - Partitioned implicitly by `restaurantId` on every row (multi-tenant).
// - Persisted to localStorage so a refresh keeps state and TWO browser tabs
//   (e.g. a customer phone + the kitchen screen) stay in sync via `storage` events.
// Services are the only thing that should touch this directly.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Bill,
  Customer,
  Feedback,
  InventoryItem,
  MenuCategory,
  MenuItem,
  Notification,
  Order,
  QrCode,
  Reservation,
  Restaurant,
  RestaurantTable,
  ServiceRequest,
  Staff,
  UpsellRule,
} from '@/types';
import { realtimeBus } from '@/data/realtime/bus';
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

const STORAGE_KEY = 'smartdine_db_v1';

function load(): Database {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Database;
    } catch {
      /* fall through to seed */
    }
  }
  const seed = createSeedData();
  persist(seed);
  return seed;
}

function persist(database: Database): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    } catch {
      /* storage full / unavailable — keep in memory only */
    }
  }
}

let db: Database = load();

/** Read the whole database (services slice + filter from here). */
export function getDb(): Database {
  return db;
}

/** Apply a mutation, persist, and return the result. */
export function mutate<T>(fn: (database: Database) => T): T {
  const result = fn(db);
  persist(db);
  return result;
}

/** Reset everything back to seed data (used by the "Reset demo" action). */
export function resetDb(): void {
  db = createSeedData();
  persist(db);
  realtimeBus.emit({ type: 'data:changed', restaurantId: '*', payload: { entity: 'all' } });
}

// Cross-tab sync: when another tab writes, reload and notify subscribers here.
if (typeof window !== 'undefined') {
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
