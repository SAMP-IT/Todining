import { MessageSquareQuote, Star } from 'lucide-react';
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
      <div className="mb-4 flex items-center gap-2">
        <Star className="h-5 w-5 text-ember-500" />
        <h2 className="text-xl font-semibold">Customer feedback</h2>
        {reviews.length > 0 && (
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink/[0.06] px-2 text-xs font-bold text-ink-soft">
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
            <div key={f.id} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold">Table {f.tableNumber ?? '—'}</span>
                  {f.orderId && <span className="ml-2 text-xs text-ink-muted">Order {f.orderId}</span>}
                </div>
                <span className="shrink-0 text-xs text-ink-muted">{formatDateTime(f.createdAt)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                <Rating label="Food" value={f.foodRating} />
                <Rating label="Service" value={f.serviceRating} />
                <Rating label="Experience" value={f.experienceRating} />
              </div>

              {f.comment && (
                <p className="mt-3 rounded-lg bg-cream-deep/50 px-3 py-2 text-sm text-ink-soft">“{f.comment}”</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Rating({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-ink-muted">{label}</span>
      <RatingStars value={value} readOnly size={14} />
    </span>
  );
}
