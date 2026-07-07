import type { Bill, OrderItem } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';
import { orderService } from './orderService';
import { tableService } from './tableService';

/**
 * Ensure a bill carries its line items. Bills are persisted without their items
 * (there is no bill-items table) and come back from Supabase with `items: []`.
 * A freshly generated bill still has them in memory, but a hydrated one does not,
 * which left the on-screen invoice showing only the totals. We rebuild the exact
 * lines from the dining session's orders — whose items ARE hydrated — returning a
 * copy so the cached row is never mutated. No schema or billing-math change.
 */
function withItems(bill: Bill): Bill {
  if (bill.items?.length) return bill;
  const fromSession = bill.sessionId
    ? orderService.bySession(bill.restaurantId, bill.sessionId).flatMap((o) => o.items)
    : [];
  const items: OrderItem[] = fromSession.length ? fromSession : orderService.get(bill.orderId)?.items ?? [];
  return items.length ? { ...bill, items } : bill;
}

/**
 * The next invoice number for a restaurant: one past the highest sequence it has
 * ever used for the given year (`INV-<year>-<0000>`). Derived from the MAX of the
 * stored numbers — not a row count — so deleting a bill never renumbers or reuses
 * another's number, and existing numbers stay immutable. Assigned exactly once at
 * generation time and then persisted; the DB's UNIQUE (restaurant_id,
 * invoice_number) index is the final guard against any duplicate across devices.
 */
function nextInvoiceNumber(restaurantId: string, createdAtIso: string): string {
  const year = (createdAtIso || new Date().toISOString()).slice(0, 4);
  const prefix = `INV-${year}-`;
  const maxSeq = getDb()
    .bills.filter((b) => b.restaurantId === restaurantId && b.invoiceNumber?.startsWith(prefix))
    .reduce((max, b) => {
      const m = /(\d+)$/.exec(b.invoiceNumber ?? '');
      const n = m ? parseInt(m[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

export const billingService = {
  list(restaurantId: string): Bill[] {
    return getDb()
      .bills.filter((b) => b.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(withItems);
  },

  /** The single bill for a dining session, if it has been generated. */
  getBySession(restaurantId: string, sessionId: string): Bill | undefined {
    const found = getDb().bills.find((b) => b.restaurantId === restaurantId && b.sessionId === sessionId);
    return found ? withItems(found) : undefined;
  },

  /** Back-compat lookup: the bill whose representative order is `orderId`. */
  getByOrder(orderId: string): Bill | undefined {
    const found = getDb().bills.find((b) => b.orderId === orderId);
    return found ? withItems(found) : undefined;
  },

  /**
   * Generate the ONE final bill for a whole dining session (idempotent).
   *
   * Aggregates every order placed during the visit into a single itemised bill,
   * marks each order completed, and frees the table. Totals are the SUM of the
   * per-order totals so Billing revenue always equals the completed-order revenue
   * that Analytics/Dashboard/Orders report — no rounding drift between the two.
   * Returns the existing bill if the session was already billed.
   */
  generateForSession(restaurantId: string, sessionId: string): Bill | undefined {
    const existing = this.getBySession(restaurantId, sessionId);
    if (existing) return existing;

    const orders = orderService.bySession(restaurantId, sessionId);
    if (orders.length === 0) return undefined;

    const items: OrderItem[] = orders.flatMap((o) => o.items);
    const subtotal = orders.reduce((s, o) => s + o.subtotal, 0);
    const tax = orders.reduce((s, o) => s + o.tax, 0);
    const serviceCharge = orders.reduce((s, o) => s + o.serviceCharge, 0);
    const grandTotal = orders.reduce((s, o) => s + o.total, 0);
    const primary = orders[0];
    const createdAt = new Date().toISOString();
    // Assign the permanent invoice number ONCE, here at creation, then store it.
    const invoiceNumber = nextInvoiceNumber(restaurantId, createdAt);

    const bill = mutate((db) => {
      const b: Bill = {
        id: makeId('bill'),
        restaurantId,
        invoiceNumber,
        sessionId,
        orderId: primary.id,
        tableNumber: primary.tableNumber,
        items,
        subtotal,
        tax,
        serviceCharge,
        grandTotal,
        createdAt,
      };
      db.bills.push(b);
      return b;
    });

    // Close the session: complete every order (the last completion frees the
    // table via orderService), then make sure the table is released.
    orders.forEach((o) => {
      if (o.status !== 'completed') orderService.setStatus(o.id, 'completed');
    });
    tableService.setStatus(primary.tableId, 'available');

    realtimeBus.emit({ type: 'data:changed', restaurantId, payload: { entity: 'billing' } });
    return bill;
  },

  /**
   * Back-compat: bill the session that `orderId` belongs to. Kept so any caller
   * that still thinks in single orders produces the same one-bill-per-session
   * result instead of a per-order bill.
   */
  generate(orderId: string): Bill | undefined {
    const order = orderService.get(orderId);
    if (!order) return undefined;
    return this.generateForSession(order.restaurantId, order.sessionId);
  },
};
