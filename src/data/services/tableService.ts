import type { QrCode, RestaurantTable, TableStatus } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';
import { restaurantService } from './restaurantService';

export const tableService = {
  list(restaurantId: string): RestaurantTable[] {
    return getDb()
      .tables.filter((t) => t.restaurantId === restaurantId)
      .sort((a, b) => a.number - b.number);
  },

  get(id: string): RestaurantTable | undefined {
    return getDb().tables.find((t) => t.id === id);
  },

  qrFor(tableId: string): QrCode | undefined {
    return getDb().qrCodes.find((q) => q.tableId === tableId);
  },

  setStatus(id: string, status: TableStatus): void {
    const t = mutate((db) => {
      const table = db.tables.find((x) => x.id === id);
      if (table) table.status = status;
      return table;
    });
    if (t) realtimeBus.emit({ type: 'table:updated', restaurantId: t.restaurantId, payload: { tableId: id, status } });
  },

  add(restaurantId: string, seats: number): RestaurantTable {
    const created = mutate((db) => {
      const nums = db.tables.filter((t) => t.restaurantId === restaurantId).map((t) => t.number);
      const number = (nums.length ? Math.max(...nums) : 0) + 1;
      const table: RestaurantTable = { id: makeId('tbl'), restaurantId, number, seats, status: 'available' };
      db.tables.push(table);
      const slug = restaurantService.getById(restaurantId)?.slug ?? restaurantId;
      const qr: QrCode = { id: makeId('qr'), restaurantId, tableId: table.id, token: table.id, url: `/r/${slug}/t/${table.id}` };
      db.qrCodes.push(qr);
      return table;
    });
    realtimeBus.emit({ type: 'data:changed', restaurantId, payload: { entity: 'tables' } });
    return created;
  },

  /**
   * Resolve a table by id, creating it if this device doesn't have it yet.
   * QR deep-links can reference a table that was added on another device or
   * survived a data reset; because the mock store is per-browser localStorage,
   * the table would otherwise be unresolvable and the QR menu would 404.
   * Idempotent and emit-free so it's safe to call during render.
   */
  ensure(restaurantId: string, tableId: string): RestaurantTable {
    const existing = this.get(tableId);
    if (existing) return existing;
    return mutate((db) => {
      const nums = db.tables.filter((t) => t.restaurantId === restaurantId).map((t) => t.number);
      // Reuse a trailing number from the id (e.g. tbl_rest_spice_7 → 7) when present.
      const parsed = Number(/(\d+)$/.exec(tableId)?.[1]);
      const number = Number.isInteger(parsed) && parsed > 0 ? parsed : (nums.length ? Math.max(...nums) : 0) + 1;
      const table: RestaurantTable = { id: tableId, restaurantId, number, seats: 4, status: 'available' };
      db.tables.push(table);
      const slug = restaurantService.getById(restaurantId)?.slug ?? restaurantId;
      db.qrCodes.push({ id: makeId('qr'), restaurantId, tableId, token: tableId, url: `/r/${slug}/t/${tableId}` });
      return table;
    });
  },

  remove(id: string): void {
    const t = this.get(id);
    mutate((db) => {
      db.tables = db.tables.filter((x) => x.id !== id);
      db.qrCodes = db.qrCodes.filter((q) => q.tableId !== id);
    });
    if (t) realtimeBus.emit({ type: 'data:changed', restaurantId: t.restaurantId, payload: { entity: 'tables' } });
  },
};
