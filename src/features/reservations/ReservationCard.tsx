import { CalendarClock, Mail, Phone } from 'lucide-react';
import type { Reservation } from '@/types';
import { Button, ReservationStatusBadge } from '@/components/ui';
import { formatReservationSlot } from '@/lib/format';

/**
 * A booking, set like a place card: the guest's name in the display face, the
 * slot right under it, then the covers + contact below a hairline.
 *
 * Status reads from the badge alone (gold pending / sage confirmed / red
 * cancelled / neutral completed). Deliberately NO side-stripe border and no
 * ember on the data — ember is the action colour and lives on the buttons only.
 */
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
    <div className="flex flex-col rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-semibold leading-tight">{r.name}</h3>
          {/* The slot is the headline datum: tabular so 1s and 0s stay figures. */}
          <p className="tnum mt-1 flex items-center gap-1.5 text-[0.76rem] font-bold text-ink-soft">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
            {formatReservationSlot(r.date, r.time)}
          </p>
        </div>
        <span className="shrink-0">
          <ReservationStatusBadge status={r.status} />
        </span>
      </div>

      {/* Covers as a ghosted display numeral, the printed-menu way of counting. */}
      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-ink/10 pt-3">
        <span className="flex items-baseline gap-1.5">
          <span className="tnum font-display text-2xl font-semibold leading-none">{r.guests}</span>
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-ink-muted">
            {r.guests === 1 ? 'guest' : 'guests'}
          </span>
        </span>
        <span className="tnum flex shrink-0 items-center gap-1.5 text-[0.76rem] font-semibold text-ink-soft">
          <Phone className="h-3 w-3 shrink-0 text-ink-muted" />
          {r.mobile}
        </span>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-[0.72rem] text-ink-muted">
        <Mail className="h-3 w-3 shrink-0" />
        <span className="truncate">{r.email}</span>
      </p>

      {r.notes && (
        <p className="mt-2.5 rounded-lg bg-cream-deep/60 px-3 py-2 font-display text-[0.95rem] italic leading-snug text-ink-soft">
          “{r.notes}”
        </p>
      )}

      {(r.status === 'pending' || r.status === 'confirmed') && (
        <>
          {/* Growing spacer: pins the action bar to the card's foot so a row of
              cards shares one button line, however long each note runs. */}
          <div className="mt-4 flex-1" />
          <div className="flex flex-wrap gap-1.5 border-t border-ink/10 pt-3.5">
            {r.status === 'pending' && (
              <Button size="sm" variant="success" onClick={() => onConfirm(r.id)}>Approve</Button>
            )}
            {r.status === 'confirmed' && (
              <Button size="sm" onClick={() => onComplete(r.id)}>Mark completed</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onReschedule(r)}>Reschedule</Button>
            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => onCancel(r.id)}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  );
}
