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
        <KpiCard label="Overall" value={avg.overall ? `${avg.overall}★` : '—'} sublabel={`${avg.count} reviews`} icon={<Star className="h-4 w-4" />} tone="gold" />
        <KpiCard label="Food" value={avg.food ? `${avg.food}★` : '—'} tone="ember" />
        <KpiCard label="Service" value={avg.service ? `${avg.service}★` : '—'} tone="sage" />
        <KpiCard label="Experience" value={avg.experience ? `${avg.experience}★` : '—'} tone="ink" />
      </div>

      {reviews.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote className="h-8 w-8" />} title="No reviews yet" description="Guest feedback after dining appears here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {reviews.map((f) => (
            <div key={f.id} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Table {f.tableNumber ?? '—'}</span>
                <span className="text-xs text-ink-muted">{timeAgo(f.createdAt)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <Mini label="Food" value={f.foodRating} />
                <Mini label="Service" value={f.serviceRating} />
                <Mini label="Experience" value={f.experienceRating} />
              </div>
              {f.comment && <p className="mt-3 rounded-lg bg-cream-deep/50 px-3 py-2 text-sm text-ink-soft">“{f.comment}”</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-ink-muted">{label}</span>
      <RatingStars value={value} readOnly size={14} />
    </span>
  );
}
