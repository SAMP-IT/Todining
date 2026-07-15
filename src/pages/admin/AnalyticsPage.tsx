import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CalendarRange, IndianRupee, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { analyticsService } from '@/data/services';
import { EmptyState, KpiCard, PageHeader } from '@/components/ui';
import { formatMoney } from '@/lib/format';

/**
 * Chart palette.
 *
 * Our UI greens and neutrals are deliberately desaturated for editorial restraint,
 * which puts them under the chart chroma floor (OKLCH C >= 0.10) — below it a hue
 * reads as gray and stops carrying identity as a fill. So the data green holds our
 * hue and lifts chroma. Checked with the dataviz palette validator (lightness band,
 * chroma floor, CVD separation, contrast): the three chromatic slots pass every
 * check, worst adjacent CVD pair ΔE 18.5 (target >= 12).
 */
const EMBER = '#c0451c'; // ember-500
const DATA_GREEN = '#2f9159';
const INK_MUTED = '#8a7d6f';

/**
 * Reservation slice colours, keyed by STATUS rather than array position, and
 * matched to the ReservationStatusBadge tones used everywhere else. Keying by
 * entity matters: `resData` drops empty statuses, so an index-based palette
 * repainted the survivors (an empty "Pending" made "Confirmed" render gold).
 * "Completed" is intentionally neutral, and every slice is legend-labelled, so
 * identity is never carried by colour alone.
 */
const RESERVATION_COLORS: Record<string, string> = {
  Pending: '#b0862f', // gold-400
  Confirmed: DATA_GREEN,
  Completed: INK_MUTED,
  Cancelled: '#dc2626', // red-600
};

const AXIS_TICK = { fill: INK_MUTED, fontSize: 11, fontWeight: 600 };
const TOOLTIP_STYLE = {
  borderRadius: '0.6rem',
  border: '1px solid rgba(42,33,27,0.12)',
  background: '#fffefc',
  fontSize: '0.78rem',
  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  boxShadow: '0 12px 30px -14px rgba(42,33,27,0.35)',
};

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
        <ChartCard title="Revenue" caption="Last 7 days">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.revenueTrend} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMBER} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(42,33,27,0.08)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} width={48} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(42,33,27,0.2)' }} formatter={(v: number) => formatMoney(v, symbol)} />
              <Area type="monotone" dataKey="revenue" stroke={EMBER} strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Peak hours" caption="Orders by hour">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.peakHours} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="rgba(42,33,27,0.08)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ ...AXIS_TICK, fontSize: 10 }} interval={1} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} width={32} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(42,33,27,0.05)' }} />
              <Bar dataKey="orders" fill={EMBER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most ordered" caption="Top dishes by quantity">
          {data.topFoods.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={data.topFoods} margin={{ left: 24, right: 16 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={AXIS_TICK} width={110} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(42,33,27,0.05)' }} />
                <Bar dataKey="qty" fill={DATA_GREEN} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Reservations" caption="By status, with guest rating">
          <div className="flex items-center gap-4">
            <div className="h-[200px] flex-1">
              {resData.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={resData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2} stroke="#fffefc" strokeWidth={2}>
                      {resData.map((d) => (
                        <Cell key={d.name} fill={RESERVATION_COLORS[d.name] ?? INK_MUTED} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-muted">Guest rating</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="tnum font-display text-3xl font-bold leading-none">{data.ratings.overall || '·'}</span>
                  <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
                </div>
                <p className="tnum mt-1 text-[0.68rem] text-ink-muted">{data.ratings.count} reviews</p>
              </div>
              <Legend items={resData.map((d) => ({ label: d.name, value: d.value, color: RESERVATION_COLORS[d.name] ?? INK_MUTED }))} />
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        {caption && (
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-muted">{caption}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="grid h-[200px] place-items-center text-sm text-ink-muted">No data yet</div>;
}

function Legend({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <ul className="space-y-1">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-[0.72rem]">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: it.color }} />
          <span className="text-ink-soft">{it.label}</span>
          <span className="tnum ml-auto font-bold">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}
