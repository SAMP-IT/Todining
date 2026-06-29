import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';
import { restaurantService, reservationService } from '@/data/services';
import { ReservationForm } from '@/features/reservations/ReservationForm';
import type { ReservationFormValues } from '@/features/reservations/reservationSchema';
import { Button } from '@/components/ui';
import { Wordmark } from '@/components/layout/Brand';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { formatReservationSlot } from '@/lib/format';

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
    <div className="mx-auto min-h-[100dvh] max-w-lg px-5 py-8">
      <Link to="/site" className="inline-block">
        <Wordmark />
      </Link>

      {done ? (
        <div className="mt-16 flex flex-col items-center text-center animate-fade-up">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sage-100 text-sage-600">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold">Reservation requested!</h1>
          <p className="mt-2 max-w-sm text-ink-soft">
            Thanks {done.name.split(' ')[0]} — we've received your request for{' '}
            <strong className="text-ink">{formatReservationSlot(done.date, done.time)}</strong> for {done.guests} guests at {restaurant.name}.
            You'll get a WhatsApp confirmation once it's approved.
          </p>
          <Link to="/site" className="mt-6">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 mt-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: restaurant.logoColor }}>
              <CalendarCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold leading-tight">Reserve a table</h1>
              <p className="text-sm text-ink-muted">{restaurant.name} · {restaurant.tagline}</p>
            </div>
          </div>
          <div className="card-surface p-5">
            <ReservationForm onSubmit={submit} />
          </div>
        </>
      )}
    </div>
  );
}
