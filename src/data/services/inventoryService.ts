import type { InventoryItem } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';

export const inventoryService = {
  list(restaurantId: string): InventoryItem[] {
    return getDb().inventory.filter((i) => i.restaurantId === restaurantId);
  },

  lowStock(restaurantId: string): InventoryItem[] {
    return this.list(restaurantId).filter((i) => i.stockQty <= i.lowThreshold);
  },

  create(restaurantId: string, input: Omit<InventoryItem, 'id' | 'restaurantId'>): InventoryItem {
    const created = mutate((db) => {
      const it: InventoryItem = { ...input, id: makeId('inv'), restaurantId };
      db.inventory.push(it);
      return it;
    });
    realtimeBus.emit({ type: 'data:changed', restaurantId, payload: { entity: 'inventory' } });
    return created;
  },

  update(id: string, patch: Partial<InventoryItem>): InventoryItem | undefined {
    const updated = mutate((db) => {
      const it = db.inventory.find((x) => x.id === id);
      if (it) Object.assign(it, patch);
      return it;
    });
    if (updated) realtimeBus.emit({ type: 'data:changed', restaurantId: updated.restaurantId, payload: { entity: 'inventory' } });
    return updated;
  },

  remove(id: string): void {
    const it = getDb().inventory.find((x) => x.id === id);
    mutate((db) => {
      db.inventory = db.inventory.filter((x) => x.id !== id);
    });
    if (it) realtimeBus.emit({ type: 'data:changed', restaurantId: it.restaurantId, payload: { entity: 'inventory' } });
  },

  /** Deduct ingredients for sold items; emits a low-stock alert when crossing the threshold. */
  deductForRecipe(restaurantId: string, recipe: { inventoryItemId: string; qty: number }[]): void {
    const crossed: string[] = [];
    mutate((db) => {
      recipe.forEach(({ inventoryItemId, qty }) => {
        const it = db.inventory.find((x) => x.id === inventoryItemId && x.restaurantId === restaurantId);
        if (!it) return;
        const wasAbove = it.stockQty > it.lowThreshold;
        it.stockQty = Math.max(0, Math.round((it.stockQty - qty) * 100) / 100);
        if (wasAbove && it.stockQty <= it.lowThreshold) crossed.push(it.name);
      });
    });
    realtimeBus.emit({ type: 'data:changed', restaurantId, payload: { entity: 'inventory' } });
    crossed.forEach((name) => realtimeBus.emit({ type: 'inventory:low', restaurantId, payload: { name } }));
  },
};
