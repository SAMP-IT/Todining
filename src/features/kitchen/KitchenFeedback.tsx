import { MessageSquareQuote } from 'lucide-react';
import type { Feedback } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { feedbackService } from '@/data/services';
import { EmptyState, RatingStars } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

/**
 * Read-only customer feedback for the Kitchen board. Kitchen staff can SEE guest
 * ratings and comments but never edit or delete them — this component renders no
 * mutating controls, and feedbackService exposes no update/delete. Feedback is
 * scoped to the active restaurant and refreshes live as new reviews arrive.
 */
export function KitchenFeedback() {
  const { restaurantId } = useTenant();

  // Newest-first is guaranteed by feedbackService.list (sorts on createdAt desc).
  // Re-runs on every data:changed for this restaurant, so a review submitted from
  // the customer site appears here without a manual refresh.
  const reviews = useLiveQuery<Feedback[]>(
    () => (restaurantId ? feedbackService.list(restaurantId) : []),
    { restaurantId: restaurantId ?? undefined, types: ['data:changed'] },
  );

  return (
    <section className="mt-8">
      {/* Same masthead language as the Kitchen board's column heads. */}
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-ink/10 pb-2">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold leading-tight">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          Customer feedback
        </h2>
        {reviews.length > 0 && (
          <span className="tnum grid h-6 min-w-[1.5rem] shrink-0 place-items-center rounded-full border border-ink/10 bg-white px-1.5 text-[0.68rem] font-extrabold text-ink-soft">
            {reviews.length}
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote className="h-8 w-8" />}
          title="No customer feedback available yet."
          description="Guest ratings and comments will appear here after diners submit feedback."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                <span className="tnum shrink-0 text-[0.68rem] text-ink-muted">{formatDateTime(f.createdAt)}</span>
              </div>

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
    </section>
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
