import type { MenuCategory, MenuItem } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';

export const menuService = {
  categories(restaurantId: string): MenuCategory[] {
    return getDb()
      .categories.filter((c) => c.restaurantId === restaurantId)
      .sort((a, b) => a.sort - b.sort);
  },

  items(restaurantId: string): MenuItem[] {
    return getDb().menuItems.filter((m) => m.restaurantId === restaurantId);
  },

  availableItems(restaurantId: string): MenuItem[] {
    return this.items(restaurantId).filter((m) => m.isAvailable);
  },

  getItem(id: string): MenuItem | undefined {
    return getDb().menuItems.find((m) => m.id === id);
  },

  create(restaurantId: string, input: Omit<MenuItem, 'id' | 'restaurantId'>): MenuItem {
    const created = mutate((db) => {
      const item: MenuItem = { ...input, id: makeId('mi'), restaurantId };
      db.menuItems.push(item);
      return item;
    });
    realtimeBus.emit({ type: 'data:changed', restaurantId, payload: { entity: 'menu' } });
    return created;
  },

  update(id: string, patch: Partial<MenuItem>): MenuItem | undefined {
    const updated = mutate((db) => {
      const item = db.menuItems.find((m) => m.id === id);
      if (item) Object.assign(item, patch);
      return item;
    });
    if (updated) realtimeBus.emit({ type: 'data:changed', restaurantId: updated.restaurantId, payload: { entity: 'menu' } });
    return updated;
  },

  toggleAvailability(id: string): void {
    const item = this.getItem(id);
    if (item) this.update(id, { isAvailable: !item.isAvailable });
  },

  remove(id: string): void {
    const item = this.getItem(id);
    mutate((db) => {
      db.menuItems = db.menuItems.filter((m) => m.id !== id);
    });
    if (item) realtimeBus.emit({ type: 'data:changed', restaurantId: item.restaurantId, payload: { entity: 'menu' } });
  },
};
