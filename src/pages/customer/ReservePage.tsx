import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { restaurantService, reservationService } from '@/data/services';
import { ReservationForm } from '@/features/reservations/ReservationForm';
import type { ReservationFormValues } from '@/features/reservations/reservationSchema';
import { Button } from '@/components/ui';
import { Wordmark } from '@/components/layout/Brand';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { formatReservationSlot } from '@/lib/format';

// A monogram "seal" — the editorial brand lockup used on the dark photo panel.
// Mirrors LoginPage's, which shares this two-panel photo+form pattern.
function Seal({ className = '' }: { className?: string }) {
  return (
    <span
      className={'grid place-items-center rounded-full border font-display font-semibold ' + className}
    >
      T
    </span>
  );
}

export function ReservePage() {
  const { slug } = useParams<{ slug: string }>();
  const restaurant = slug ? restaurantService.getBySlug(slug) : undefined;
  const [done, setDone] = useState<ReservationFormValues | null>(null);

  if (!restaurant) return <NotFoundPage />;

  function submit(values: ReservationFormValues) {
    reservationService.create(restaurant!.id, values);
    setDone(values);
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* ---------- The room ---------- */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#1b130c] p-8 text-cream lg:flex xl:p-14">
        {/* dim restaurant atmosphere */}
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=70&auto=format&fit=crop"
          alt=""
          aria-hidden
          onError={(e) => (e.currentTarget.style.opacity = '0')}
          className="absolute inset-0 h-full w-full object-cover [filter:grayscale(0.3)_contrast(1.02)]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, oklch(0.18 0.02 40 / .5), oklch(0.15 0.016 38 / .82) 60%, oklch(0.14 0.015 38 / .94)), radial-gradient(90% 60% at 85% 8%, oklch(0.55 0.185 37 / .28), transparent 60%)',
          }}
        />
        <div className="pointer-events-none absolute inset-4 rounded-2xl border border-cream/15" />

        <div className="relative z-10 flex items-center gap-3">
          <Seal className="h-9 w-9 border-cream text-lg" />
          <span className="font-display text-2xl font-semibold tracking-tight">ToDining</span>
        </div>

        <div className="relative z-10 max-w-[18ch]">
          <span className="flex items-center gap-3 text-[0.66rem] font-bold uppercase tracking-[0.28em] text-cream/70">
            <span className="h-px w-8 shrink-0 bg-gold-400" />
            {restaurant.name} · Est. 2019
          </span>
          <h2 className="mt-5 font-display text-[clamp(2.6rem,4.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-cream">
            Keep a table <em className="italic text-ember-300">waiting</em> for you.
          </h2>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/50">
            Reserve · Arrive · Dine
          </span>
          {restaurant.tagline && (
            <span className="font-display text-xl italic text-cream/30">{restaurant.tagline}</span>
          )}
        </div>
      </aside>

      {/* ---------- The request ---------- */}
      <main className="flex items-center justify-center p-6 py-10">
        <div className="w-full max-w-md">
          <Link to="/site" className="mb-8 block w-fit lg:hidden">
            <Wordmark />
          </Link>

          {done ? (
            <div className="animate-fade-up">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-sage-500 text-cream">
                <Check className="h-7 w-7" strokeWidth={2.4} />
              </span>
              <h1 className="mt-6 font-display text-[2.4rem] font-semibold leading-none tracking-tight">
                Reservation requested
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Thanks {done.name.split(' ')[0]}, we've received your request for{' '}
                <strong className="font-semibold text-ink">{formatReservationSlot(done.date, done.time)}</strong> for{' '}
                {done.guests} {done.guests === 1 ? 'guest' : 'guests'} at {restaurant.name}. You'll get a WhatsApp
                confirmation once it's approved.
              </p>
              <Link to="/site" className="mt-7 inline-block">
                <Button variant="outline">Back to home</Button>
              </Link>
            </div>
          ) : (
            <>
              <span className="block text-[0.68rem] font-bold uppercase tracking-[0.28em] text-ember-600">
                Reservations
              </span>
              <h1 className="mt-2 font-display text-[2.4rem] font-semibold leading-none tracking-tight">
                Reserve a table
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                {restaurant.name}
                {restaurant.tagline && ` · ${restaurant.tagline}`}
              </p>

              <div className="mt-7">
                <ReservationForm onSubmit={submit} />
              </div>

              <p className="mt-4 text-center text-xs text-ink-muted">
                You'll get a WhatsApp confirmation once it's approved.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
