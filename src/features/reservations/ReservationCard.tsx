import { CalendarClock, Mail, Phone, Users } from 'lucide-react';
import type { Reservation } from '@/types';
import { Button, ReservationStatusBadge } from '@/components/ui';
import { formatReservationSlot } from '@/lib/format';

export function ReservationCard({
  reservation: r,
  onConfirm,
  onCancel,
  onComplete,
  onReschedule,
}: {
  reservation: Reservation;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onReschedule: (r: Reservation) => void;
}) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-tight">{r.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-ember-600">
            <CalendarClock className="h-4 w-4" /> {formatReservationSlot(r.date, r.time)}
          </p>
        </div>
        <ReservationStatusBadge status={r.status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm text-ink-soft">
        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {r.guests} guests</span>
        <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {r.mobile}</span>
        <span className="col-span-2 flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5" /> {r.email}</span>
      </div>
      {r.notes && <p className="mt-2 rounded-lg bg-cream-deep/50 px-3 py-2 text-sm text-ink-soft">“{r.notes}”</p>}

      {(r.status === 'pending' || r.status === 'confirmed') && (
        <div className="mt-4 flex flex-wrap gap-2">
          {r.status === 'pending' && (
            <Button size="sm" variant="success" onClick={() => onConfirm(r.id)}>Approve</Button>
          )}
          {r.status === 'confirmed' && (
            <Button size="sm" onClick={() => onComplete(r.id)}>Mark completed</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onReschedule(r)}>Reschedule</Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => onCancel(r.id)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
