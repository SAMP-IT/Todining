import type { Bill, DiningSession, OrderItem } from '@/types';
import { orderService } from './orderService';
import { billingService } from './billingService';

/**
 * Dining-session orchestration. A session is the whole of one table visit: the
 * customer scans a QR, orders one or more times, and every order shares a
 * sessionId until "Complete Dining". Sessions are DERIVED from orders (+ the
 * session's bill) rather than stored as their own table, so nothing about the
 * existing schema, analytics or realtime has to change.
 */
export const sessionService = {
  /** The open session's id for a table, or null when the table is free. */
  activeIdForTable(restaurantId: string, tableId: string): string | null {
    return orderService.activeSessionId(restaurantId, tableId);
  },

  /** Build the aggregate view of a session (running totals + all its orders). */
  get(restaurantId: string, sessionId: string): DiningSession | null {
    const orders = orderService.bySession(restaurantId, sessionId);
    if (orders.length === 0) return null;

    const bill = billingService.getBySession(restaurantId, sessionId);
    const items: OrderItem[] = orders.flatMap((o) => o.items);
    const primary = orders[0];
    const stillDining = orders.some((o) => o.status !== 'completed');

    return {
      id: sessionId,
      restaurantId,
      tableId: primary.tableId,
      tableNumber: primary.tableNumber,
      orders,
      items,
      subtotal: orders.reduce((s, o) => s + o.subtotal, 0),
      tax: orders.reduce((s, o) => s + o.tax, 0),
      serviceCharge: orders.reduce((s, o) => s + o.serviceCharge, 0),
      total: orders.reduce((s, o) => s + o.total, 0),
      status: bill || !stillDining ? 'closed' : 'active',
      billId: bill?.id,
      openedAt: primary.createdAt,
      closedAt: bill?.createdAt,
    };
  },

  /**
   * "Complete Dining": close the session, complete all its orders, free the
   * table and generate the single final bill. Idempotent — returns the existing
   * bill if the session was already completed.
   */
  completeDining(restaurantId: string, sessionId: string): Bill | undefined {
    return billingService.generateForSession(restaurantId, sessionId);
  },
};
