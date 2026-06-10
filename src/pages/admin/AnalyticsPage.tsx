import {
  Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CalendarRange, IndianRupee, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { analyticsService } from '@/data/services';
import { Card, EmptyState, KpiCard, PageHeader } from '@/components/ui';
import { formatMoney } from '@/lib/format';

const EMBER = '#d9521f';
const PIE_COLORS = ['#e0a83c', '#4f8a5b', '#d9521f', '#8a7d72'];

export function AnalyticsPage() {
  const { restaurant, restaurantId } = useTenant();
  const symbol = restaurant?.settings.currencySymbol ?? '₹';

  const data = useLiveQuery(
    () => {
      if (!restaurantId) return null;
      return {
        summary: analyticsService.summary(restaurantId),
        revenueTrend: analyticsService.revenueTrend(restaurantId, 7),
        topFoods: analyticsService.topFoods(restaurantId, 5),
        peakHours: analyticsService.peakHours(restaurantId),
        reservations: analyticsService.reservationTrend(restaurantId),
        ratings: analyticsService.ratings(restaurantId),
      };
    },
    { restaurantId: restaurantId ?? undefined, types: ['order:created', 'order:updated', 'reservation:created', 'reservation:updated', 'data:changed'] },
  );

  if (!data) return <EmptyState title="Select a restaurant" />;

  const resData = [
    { name: 'Pending', value: data.reservations.pending },
    { name: 'Confirmed', value: data.reservations.confirmed },
    { name: 'Completed', value: data.reservations.completed },
    { name: 'Cancelled', value: data.reservations.cancelled },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader title="Analytics" subtitle={`Performance overview for ${restaurant?.name ?? ''}.`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Today's revenue" value={formatMoney(data.summary.dailyRevenue, symbol)} icon={<IndianRupee className="h-4 w-4" />} />
        <KpiCard label="This week" value={formatMoney(data.summary.weeklyRevenue, symbol)} icon={<TrendingUp className="h-4 w-4" />} tone="sage" />
        <KpiCard label="This month" value={formatMoney(data.summary.monthlyRevenue, symbol)} icon={<CalendarRange className="h-4 w-4" />} tone="gold" />
        <KpiCard label="Avg order value" value={formatMoney(data.summary.avgOrderValue, symbol)} icon={<ShoppingBag className="h-4 w-4" />} tone="ink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue — last 7 days">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.revenueTrend} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMBER} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} />
              <Tooltip formatter={(v: number) => formatMoney(v, symbol)} />
              <Area type="monotone" dataKey="revenue" stroke={EMBER} strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Peak hours (orders)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.peakHours} margin={{ left: -16, right: 8, top: 8 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={1} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="orders" fill={EMBER} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most ordered foods">
          {data.topFoods.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={data.topFoods} margin={{ left: 24, right: 16 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={110} />
                <Tooltip />
                <Bar dataKey="qty" fill="#4f8a5b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Reservations & ratings">
          <div className="flex items-center gap-4">
            <div className="h-[200px] flex-1">
              {resData.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={resData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {resData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-3">
              <div className="text-center">
                <div className="flex items-center gap-1 text-3xl font-semibold text-ink">
                  {data.ratings.overall || '—'} <Star className="h-5 w-5 fill-gold-400 text-gold-400" />
                </div>
                <p className="text-xs text-ink-muted">{data.ratings.count} reviews</p>
              </div>
              <Legend items={resData.map((d, i) => ({ label: `${d.name} (${d.value})`, color: PIE_COLORS[i % PIE_COLORS.length] }))} />
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </Card>
  );
}

function Empty() {
  return <div className="grid h-[200px] place-items-center text-sm text-ink-muted">No data yet</div>;
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="space-y-1 text-xs">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
