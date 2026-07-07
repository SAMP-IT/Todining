import { format, isAfter, isSameDay, parseISO, startOfDay, subDays } from 'date-fns';
import { getDb } from '@/data/mock/store';
import { orderService } from './orderService';
import { feedbackService } from './feedbackService';

/**
 * Analytics — derived entirely from orders/reservations/feedback so it stays
 * correct as the demo is used. "Revenue" counts completed orders' totals.
 */
export const analyticsService = {
  summary(restaurantId: string) {
    const orders = orderService.list(restaurantId);
    const completed = orders.filter((o) => o.status === 'completed');
    const now = new Date();
    const since = (days: number) => completed.filter((o) => isAfter(parseISO(o.createdAt), subDays(now, days)));

    const revenue = (list: typeof completed) => list.reduce((s, o) => s + o.total, 0);

    return {
      // "Today" = calendar today for the active restaurant only, never a rolling
      // 24h window (which previously bled yesterday's orders into "Today's
      // revenue" and disagreed with the Orders page's day grouping).
      dailyRevenue: revenue(completed.filter((o) => isSameDay(parseISO(o.createdAt), now))),
      weeklyRevenue: revenue(since(7)),
      monthlyRevenue: revenue(since(30)),
      totalOrders: orders.length,
      activeOrders: orders.filter((o) => o.status !== 'completed').length,
      avgOrderValue: completed.length ? Math.round(revenue(completed) / completed.length) : 0,
    };
  },

  /** Revenue per day for the last `days` days (oldest → newest). */
  revenueTrend(restaurantId: string, days = 7) {
    const completed = orderService.list(restaurantId).filter((o) => o.status === 'completed');
    const today = startOfDay(new Date());
    return Array.from({ length: days }, (_, i) => {
      const day = subDays(today, days - 1 - i);
      const label = format(day, 'EEE');
      const total = completed
        .filter((o) => format(startOfDay(parseISO(o.createdAt)), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
        .reduce((s, o) => s + o.total, 0);
      return { label, revenue: total };
    });
  },

  /** Most ordered foods by quantity. */
  topFoods(restaurantId: string, limit = 5) {
    const counts = new Map<string, number>();
    orderService.list(restaurantId).forEach((o) =>
      o.items.forEach((it) => counts.set(it.name, (counts.get(it.name) ?? 0) + it.qty)),
    );
    return [...counts.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  },

  /** Orders bucketed by hour of day — reveals peak hours. */
  peakHours(restaurantId: string) {
    const buckets = new Map<number, number>();
    orderService.list(restaurantId).forEach((o) => {
      const h = parseISO(o.createdAt).getHours();
      buckets.set(h, (buckets.get(h) ?? 0) + 1);
    });
    // Show a sensible service window (11:00 → 23:00).
    return Array.from({ length: 13 }, (_, i) => {
      const hour = 11 + i;
      const label = `${((hour + 11) % 12) + 1}${hour < 12 ? 'a' : 'p'}`;
      return { label, orders: buckets.get(hour) ?? 0 };
    });
  },

  reservationTrend(restaurantId: string) {
    const byStatus = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
    getDb()
      .reservations.filter((r) => r.restaurantId === restaurantId)
      .forEach((r) => (byStatus[r.status] += 1));
    return byStatus;
  },

  ratings(restaurantId: string) {
    return feedbackService.averages(restaurantId);
  },
};
