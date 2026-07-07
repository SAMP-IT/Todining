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

  /**
   * The sessionId of the table's OPEN dining session, or null. A session is open
   * while it has at least one not-yet-completed order — i.e. the party is still
   * dining and hasn't pressed "Complete Dining". Once every order is completed
   * (billed), the table has no open session and the next order starts a fresh one.
   */
  activeSessionId(restaurantId: string, tableId: string): string | null {
    const open = this.byTable(restaurantId, tableId).find((o) => o.status !== 'completed');
    return open?.sessionId ?? null;
  },

  /** Every order in a dining session, oldest first. */
  bySession(restaurantId: string, sessionId: string): Order[] {
    return this.list(restaurantId)
      .filter((o) => o.sessionId === sessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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

    // Join the table's open dining session if one exists (the customer is
    // re-ordering during the same visit); otherwise this order opens a new one.
    const sessionId = this.activeSessionId(restaurantId, tableId) ?? makeId('sess');

    const order: Order = {
      id: makeId('ord'),
      restaurantId,
      tableId,
      tableNumber,
      sessionId,
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
      // When an order is completed, free its table — unless another active
      // order still occupies it (a table may hold multiple concurrent orders).
      if (status === 'completed' && updated.tableId) {
        const stillActive = this.byTable(updated.restaurantId, updated.tableId).some(
          (o) => o.id !== id && o.status !== 'completed',
        );
        if (!stillActive) tableService.setStatus(updated.tableId, 'available');
      }
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
