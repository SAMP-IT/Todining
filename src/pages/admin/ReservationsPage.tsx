import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarCheck } from 'lucide-react';
import type { Reservation, ReservationStatus } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { reservationService } from '@/data/services';
import { ReservationCard } from '@/features/reservations/ReservationCard';
import { Button, EmptyState, Input, Modal, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

const FILTERS: ('all' | ReservationStatus)[] = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export function ReservationsPage() {
  const { restaurantId } = useTenant();
  const [filter, setFilter] = useState<'all' | ReservationStatus>('all');
  const [rescheduling, setRescheduling] = useState<Reservation | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const reservations = useLiveQuery<Reservation[]>(() => (restaurantId ? reservationService.list(restaurantId) : []), {
    restaurantId: restaurantId ?? undefined,
    types: ['reservation:created', 'reservation:updated', 'data:changed'],
  });

  const filtered = filter === 'all' ? reservations : reservations.filter((r) => r.status === filter);

  function openReschedule(r: Reservation) {
    setRescheduling(r);
    setNewDate(r.date);
    setNewTime(r.time);
  }
  function saveReschedule() {
    if (rescheduling) {
      reservationService.reschedule(rescheduling.id, newDate, newTime);
      toast.success('Reservation rescheduled.');
      setRescheduling(null);
    }
  }

  return (
    <div>
      <PageHeader title="Reservations" subtitle="Approve, reschedule or cancel. Guests get a WhatsApp on confirm." />

      {/* Ink pills, same language as Orders: the filter is a state, not an
          action, so it never takes ember. */}
      <div className="hide-scrollbar mb-5 flex gap-1.5 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[0.74rem] font-bold capitalize transition-colors',
              filter === f
                ? 'border-ink bg-ink text-cream'
                : 'border-ink/10 bg-white text-ink-soft hover:border-ink/25 hover:text-ink',
            )}
          >
            {f}{' '}
            {f !== 'all' && (
              <span className="tnum opacity-60">({reservations.filter((r) => r.status === f).length})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<CalendarCheck className="h-8 w-8" />} title="No reservations" description="New booking requests appear here instantly." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onConfirm={(id) => { reservationService.setStatus(id, 'confirmed'); toast.success('Confirmed · WhatsApp sent to guest.'); }}
              onCancel={(id) => { reservationService.setStatus(id, 'cancelled'); toast('Reservation cancelled.'); }}
              onComplete={(id) => { reservationService.setStatus(id, 'completed'); toast.success('Marked completed.'); }}
              onReschedule={openReschedule}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!rescheduling}
        onClose={() => setRescheduling(null)}
        title="Reschedule reservation"
        description={rescheduling?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRescheduling(null)}>Cancel</Button>
            <Button onClick={saveReschedule}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input className="tnum" label="New date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <Input className="tnum" label="New time" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
