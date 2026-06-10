import type { Bill } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';
import { orderService } from './orderService';
import { tableService } from './tableService';

export const billingService = {
  list(restaurantId: string): Bill[] {
    return getDb()
      .bills.filter((b) => b.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getByOrder(orderId: string): Bill | undefined {
    return getDb().bills.find((b) => b.orderId === orderId);
  },

  /**
   * Generate a bill from an order (idempotent). Marks the order completed and
   * frees the table. Returns the existing bill if already generated.
   */
  generate(orderId: string): Bill | undefined {
    const existing = this.getByOrder(orderId);
    if (existing) return existing;

    const order = orderService.get(orderId);
    if (!order) return undefined;

    const bill = mutate((db) => {
      const b: Bill = {
        id: makeId('bill'),
        restaurantId: order.restaurantId,
        orderId: order.id,
        tableNumber: order.tableNumber,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        serviceCharge: order.serviceCharge,
        grandTotal: order.total,
        createdAt: new Date().toISOString(),
      };
      db.bills.push(b);
      return b;
    });

    orderService.setStatus(order.id, 'completed');
    tableService.setStatus(order.tableId, 'available');
    realtimeBus.emit({ type: 'data:changed', restaurantId: order.restaurantId, payload: { entity: 'billing' } });
    return bill;
  },
};
