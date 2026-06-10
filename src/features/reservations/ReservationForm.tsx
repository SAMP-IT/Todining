import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationSchema, type ReservationFormValues } from './reservationSchema';
import { Button, Input, Textarea } from '@/components/ui';

/** Feature 7 — Smart Table Reservation form. Reused on the public page. */
export function ReservationForm({
  onSubmit,
  submitLabel = 'Request reservation',
}: {
  onSubmit: (values: ReservationFormValues) => void;
  submitLabel?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: { guests: 2 },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="Full name" placeholder="e.g. Arun Nair" error={errors.name?.message} {...register('name')} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Mobile number" placeholder="+91 98765 43210" inputMode="tel" error={errors.mobile?.message} {...register('mobile')} />
        <Input label="Email" type="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Input label="Date" type="date" min={today} error={errors.date?.message} {...register('date')} />
        <Input label="Time" type="time" error={errors.time?.message} {...register('time')} />
        <Input label="Guests" type="number" min={1} max={50} error={errors.guests?.message} {...register('guests')} />
      </div>
      <Textarea label="Special notes (optional)" placeholder="Window seat, birthday, allergies…" error={errors.notes?.message} {...register('notes')} />
      <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
