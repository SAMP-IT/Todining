import type { Staff } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';
import { verifyPassword } from '@/lib/password';

export const staffService = {
  list(restaurantId: string): Staff[] {
    return getDb().staff.filter((s) => s.restaurantId === restaurantId);
  },

  /** Match a login identifier (email OR username) across all tenants. */
  findByIdentifier(identifier: string): Staff | undefined {
    const id = identifier.trim().toLowerCase();
    return getDb().staff.find(
      (s) => s.email.toLowerCase() === id || (s.username && s.username.toLowerCase() === id),
    );
  },

  /** Back-compat: match by email across all tenants. */
  findByEmail(email: string): Staff | undefined {
    return getDb().staff.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
  },

  /**
   * Authenticate a sign-in attempt.
   *  - Accounts WITH a password (hotel owners created via the workspace form)
   *    require the correct password.
   *  - Accounts WITHOUT a password (seeded demo staff, role quick-cards) sign in
   *    by identifier alone, preserving the demo experience.
   * Returns the staff member, or null on failure.
   */
  authenticate(identifier: string, password?: string): Staff | null {
    const staff = this.findByIdentifier(identifier);
    if (!staff || !staff.active) return null;
    if (staff.passwordHash) {
      return password && verifyPassword(password, staff.passwordHash) ? staff : null;
    }
    return staff;
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
