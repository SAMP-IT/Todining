import { MessageSquareQuote, Star } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { feedbackService } from '@/data/services';
import { EmptyState, KpiCard, PageHeader, RatingStars } from '@/components/ui';
import { timeAgo } from '@/lib/format';

export function FeedbackPage() {
  const { restaurantId } = useTenant();

  const { reviews, avg } = useLiveQuery(
    () => ({
      reviews: restaurantId ? feedbackService.list(restaurantId) : [],
      avg: restaurantId ? feedbackService.averages(restaurantId) : { food: 0, service: 0, experience: 0, overall: 0, count: 0 },
    }),
    { restaurantId: restaurantId ?? undefined, types: ['data:changed'] },
  );

  return (
    <div>
      <PageHeader title="Feedback" subtitle="What guests are saying about the food, service and experience." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Overall"
          value={avg.overall ? String(avg.overall) : '—'}
          sublabel={`${avg.count} review${avg.count === 1 ? '' : 's'}`}
          icon={<Star className="h-4 w-4" />}
          tone="gold"
        />
        <KpiCard label="Food" value={avg.food ? String(avg.food) : '—'} sublabel="out of 5" tone="ember" />
        <KpiCard label="Service" value={avg.service ? String(avg.service) : '—'} sublabel="out of 5" tone="sage" />
        <KpiCard label="Experience" value={avg.experience ? String(avg.experience) : '—'} sublabel="out of 5" tone="ink" />
      </div>

      {reviews.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote className="h-8 w-8" />} title="No reviews yet" description="Guest feedback after dining appears here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {reviews.map((f) => (
            <article key={f.id} className="rounded-xl border border-ink/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="tnum truncate font-display text-lg font-semibold leading-tight">
                    Table {f.tableNumber ?? '—'}
                  </h3>
                  {f.orderId && (
                    <p className="tnum mt-0.5 truncate text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      Order #{f.orderId.slice(-5).toUpperCase()}
                    </p>
                  )}
                </div>
                <span className="tnum shrink-0 text-[0.68rem] text-ink-muted">{timeAgo(f.createdAt)}</span>
              </div>

              {/* Three scored lines, ruled like a printed scorecard. */}
              <dl className="mt-3 border-t border-ink/10 pt-2.5">
                <Score label="Food" value={f.foodRating} />
                <Score label="Service" value={f.serviceRating} />
                <Score label="Experience" value={f.experienceRating} />
              </dl>

              {f.comment && (
                <p className="mt-3 rounded-lg bg-cream-deep/60 px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft">
                  “{f.comment}”
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/** One rating line: micro-label, gold stars, and the tabular numeral. */
function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <dt className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-muted">{label}</dt>
      <dd className="flex shrink-0 items-center gap-2">
        <RatingStars value={value} readOnly size={13} />
        <span className="tnum w-3 text-right font-display text-sm font-semibold text-ink-soft">{value}</span>
      </dd>
    </div>
  );
}
