import type { CartItem, Order, OrderItem, OrderStatus } from '@/types';
import { ORDER_STATUS_FLOW } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';
import { restaurantService } from './restaurantService';
import { menuService } from './menuService';
import { inventoryService } from './inventoryService';
import { tableService } from './tableService';

function computeTotals(restaurantId: string, items: OrderItem[]) {
  const settings = restaurantService.getById(restaurantId)!.settings;
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tax = Math.round(subtotal * settings.taxRate);
  const serviceCharge = Math.round(subtotal * settings.serviceChargeRate);
  return { subtotal, tax, serviceCharge, total: subtotal + tax + serviceCharge };
}

export const orderService = {
  list(restaurantId: string): Order[] {
    return getDb()
      .orders.filter((o) => o.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** Orders that are still active (not completed) — used by kitchen/waiter boards. */
  active(restaurantId: string): Order[] {
    return this.list(restaurantId).filter((o) => o.status !== 'completed');
  },

  byTable(restaurantId: string, tableId: string): Order[] {
    return this.list(restaurantId).filter((o) => o.tableId === tableId);
  },

  get(id: string): Order | undefined {
    return getDb().orders.find((o) => o.id === id);
  },

  /** Place an order from a customer's cart: totals, inventory deduct, table → occupied. */
  placeFromCart(restaurantId: string, tableId: string, tableNumber: number, cart: CartItem[]): Order {
    const now = new Date().toISOString();
    const items: OrderItem[] = cart.map((c, i) => ({
      id: `oi_${makeId('x')}_${i}`,
      menuItemId: c.menuItemId,
      name: c.name,
      qty: c.qty,
      unitPrice: c.price,
    }));
    const totals = computeTotals(restaurantId, items);

    const order: Order = {
      id: makeId('ord'),
      restaurantId,
      tableId,
      tableNumber,
      items,
      status: 'pending',
      ...totals,
      createdAt: now,
      updatedAt: now,
    };

    mutate((db) => {
      db.orders.push(order);
    });

    // Auto-deduct inventory based on each item's recipe.
    cart.forEach((c) => {
      const menuItem = menuService.getItem(c.menuItemId);
      if (menuItem?.recipe?.length) {
        inventoryService.deductForRecipe(
          restaurantId,
          menuItem.recipe.map((r) => ({ inventoryItemId: r.inventoryItemId, qty: r.qty * c.qty })),
        );
      }
    });

    tableService.setStatus(tableId, 'occupied');
    realtimeBus.emit({ type: 'order:created', restaurantId, payload: { orderId: order.id, tableNumber } });
    return order;
  },

  setStatus(id: string, status: OrderStatus): Order | undefined {
    const updated = mutate((db) => {
      const o = db.orders.find((x) => x.id === id);
      if (o) {
        o.status = status;
        o.updatedAt = new Date().toISOString();
      }
      return o;
    });
    if (updated) {
      realtimeBus.emit({ type: 'order:updated', restaurantId: updated.restaurantId, payload: { orderId: id, status } });
    }
    return updated;
  },

  /** Advance an order to the next status in the lifecycle. */
  advance(id: string): Order | undefined {
    const order = this.get(id);
    if (!order) return undefined;
    const idx = ORDER_STATUS_FLOW.indexOf(order.status);
    const next = ORDER_STATUS_FLOW[Math.min(idx + 1, ORDER_STATUS_FLOW.length - 1)];
    return this.setStatus(id, next);
  },
};
