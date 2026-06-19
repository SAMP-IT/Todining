import { Link } from 'react-router-dom';
import {
  ArrowRight, Boxes, CalendarCheck, IndianRupee, LayoutGrid, ReceiptText, ShoppingBag, UtensilsCrossed,
} from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { analyticsService, menuService, orderService, tableService } from '@/data/services';
import { Card, EmptyState, KpiCard, PageHeader } from '@/components/ui';
import { OrderStatusBadge } from '@/components/ui/StatusBadge';
import { formatMoney } from '@/lib/format';

const QUICK_ACTIONS = [
  { to: '/admin/menu', label: 'Manage menu', icon: UtensilsCrossed },
  { to: '/admin/categories', label: 'Manage categories', icon: Boxes },
  { to: '/admin/tables', label: 'Tables & QR', icon: LayoutGrid },
  { to: '/admin/orders', label: 'View orders', icon: ReceiptText },
];

export function DashboardPage() {
  const { restaurant, restaurantId } = useTenant();
  const symbol = restaurant?.settings.currencySymbol ?? '₹';

  const data = useLiveQuery(
    () => {
      if (!restaurantId) return null;
      const orders = orderService.list(restaurantId);
      return {
        menuCount: menuService.items(restaurantId).length,
        orderCount: orders.length,
        tableCount: tableService.list(restaurantId).length,
        dailyRevenue: analyticsService.summary(restaurantId).dailyRevenue,
        recentOrders: orders.slice(0, 6),
      };
    },
    {
      restaurantId: restaurantId ?? undefined,
      types: ['order:created', 'order:updated', 'data:changed'],
    },
  );

  if (!data) return <EmptyState title="Select a restaurant" />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Overview for ${restaurant?.name ?? ''}.`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Menu items" value={String(data.menuCount)} icon={<UtensilsCrossed className="h-4 w-4" />} />
        <KpiCard label="Total orders" value={String(data.orderCount)} icon={<ShoppingBag className="h-4 w-4" />} tone="sage" />
        <KpiCard label="Tables" value={String(data.tableCount)} icon={<LayoutGrid className="h-4 w-4" />} tone="gold" />
        <KpiCard label="Today's revenue" value={formatMoney(data.dailyRevenue, symbol)} icon={<IndianRupee className="h-4 w-4" />} tone="ink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent orders</h3>
            <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-ember-600 hover:text-ember-700">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="grid h-32 place-items-center text-sm text-ink-muted">No orders yet</div>
          ) : (
            <div className="divide-y divide-ink/5">
              {data.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink/5 text-xs font-bold">T{o.tableNumber}</span>
                    <div>
                      <div className="text-sm font-semibold">#{o.id.slice(-5).toUpperCase()}</div>
                      <div className="text-xs text-ink-muted">{o.items.length} item{o.items.length === 1 ? '' : 's'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold">{formatMoney(o.total, symbol)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Quick actions</h3>
          <div className="grid gap-2">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 px-4 py-3 text-sm font-medium transition-colors hover:bg-ink/5"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-ember-100 text-ember-600"><a.icon className="h-4 w-4" /></span>
                  {a.label}
                </span>
                <ArrowRight className="h-4 w-4 text-ink-muted" />
              </Link>
            ))}
            <Link
              to="/admin/reservations"
              className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 px-4 py-3 text-sm font-medium transition-colors hover:bg-ink/5"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-ember-100 text-ember-600"><CalendarCheck className="h-4 w-4" /></span>
                Reservations
              </span>
              <ArrowRight className="h-4 w-4 text-ink-muted" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
