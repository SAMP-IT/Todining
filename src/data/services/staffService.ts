import type { Staff } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';

export const staffService = {
  list(restaurantId: string): Staff[] {
    return getDb().staff.filter((s) => s.restaurantId === restaurantId);
  },

  /** Demo auth: match by email across all tenants (no password in mock mode). */
  findByEmail(email: string): Staff | undefined {
    return getDb().staff.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
  },

  getById(id: string): Staff | undefined {
    return getDb().staff.find((s) => s.id === id);
  },

  create(restaurantId: string, input: Omit<Staff, 'id' | 'restaurantId'>): Staff {
    const created = mutate((db) => {
      const s: Staff = { ...input, id: makeId('stf'), restaurantId };
      db.staff.push(s);
      return s;
    });
    realtimeBus.emit({ type: 'data:changed', restaurantId, payload: { entity: 'staff' } });
    return created;
  },

  update(id: string, patch: Partial<Staff>): Staff | undefined {
    const updated = mutate((db) => {
      const s = db.staff.find((x) => x.id === id);
      if (s) Object.assign(s, patch);
      return s;
    });
    if (updated) realtimeBus.emit({ type: 'data:changed', restaurantId: updated.restaurantId, payload: { entity: 'staff' } });
    return updated;
  },

  remove(id: string): void {
    const s = this.getById(id);
    mutate((db) => {
      db.staff = db.staff.filter((x) => x.id !== id);
    });
    if (s) realtimeBus.emit({ type: 'data:changed', restaurantId: s.restaurantId, payload: { entity: 'staff' } });
  },
};
