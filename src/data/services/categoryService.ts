import type { MenuCategory } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';

// Category CRUD. Like every service it mutates the cache through `mutate()`, so
// changes write through to Supabase and broadcast on the realtime bus — meaning
// edits here reflect on the customer menu and every device automatically.
export const categoryService = {
  list(restaurantId: string): MenuCategory[] {
    return getDb()
      .categories.filter((c) => c.restaurantId === restaurantId)
      .sort((a, b) => a.sort - b.sort);
  },

  /** Number of menu items currently in a category (used to guard deletes).
   *  Scoped to the category's own restaurant so the count can never be skewed by
   *  another tenant's menu items — tenant isolation holds even for this guard. */
  itemCount(categoryId: string): number {
    const cat = getDb().categories.find((c) => c.id === categoryId);
    if (!cat) return 0;
    return getDb().menuItems.filter(
      (m) => m.categoryId === categoryId && m.restaurantId === cat.restaurantId,
    ).length;
  },

  create(restaurantId: string, name: string): MenuCategory {
    console.info('[ToDining][category] Creating category…', { restaurantId, name });
    const created = mutate((db) => {
      const sort = db.categories.filter((c) => c.restaurantId === restaurantId).length;
      const category: MenuCategory = { id: makeId('cat'), restaurantId, name: name.trim(), sort };
      db.categories.push(category);
      return category;
    });
    realtimeBus.emit({ type: 'data:changed', restaurantId, payload: { entity: 'menu' } });
    return created;
  },

  update(id: string, patch: Partial<Pick<MenuCategory, 'name' | 'sort'>>): MenuCategory | undefined {
    console.info('[ToDining][category] Updating category…', { id, patch });
    const updated = mutate((db) => {
      const c = db.categories.find((x) => x.id === id);
      if (c) Object.assign(c, patch, patch.name != null ? { name: patch.name.trim() } : {});
      return c;
    });
    if (updated) realtimeBus.emit({ type: 'data:changed', restaurantId: updated.restaurantId, payload: { entity: 'menu' } });
    return updated;
  },

  /** Returns false (without deleting) when the category still has menu items. */
  remove(id: string): boolean {
    if (this.itemCount(id) > 0) {
      console.warn('[ToDining][category] Refusing to delete non-empty category', id);
      return false;
    }
    console.info('[ToDining][category] Deleting category…', id);
    const cat = getDb().categories.find((c) => c.id === id);
    mutate((db) => {
      db.categories = db.categories.filter((c) => c.id !== id);
    });
    if (cat) realtimeBus.emit({ type: 'data:changed', restaurantId: cat.restaurantId, payload: { entity: 'menu' } });
    return true;
  },
};
