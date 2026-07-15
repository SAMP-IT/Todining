import { Clock } from 'lucide-react';
import type { Order } from '@/types';
import { cn } from '@/lib/cn';

/** Minutes a ticket may sit before the clock warns, then flags late. */
const WARN_AFTER = 8;
const LATE_AFTER = 20;

/** Compact age for a board read at arm's length: "now", "6m", "1h 04m". */
function shortAge(minutes: number) {
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/**
 * A kitchen order ticket. Chef advances pending → preparing → ready.
 *
 * Read at arm's length during a rush, so: a big table number, countable qty
 * chips, and exactly one action. Status is carried by the card tint (and the
 * column's dot), never a side stripe. The clock ages from muted to ember to a
 * red flag so a forgotten table announces itself.
 */
export function KitchenTicket({ order, onAdvance }: { order: Order; onAdvance: (id: string) => void }) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000));
  const late = minutes >= LATE_AFTER;
  const warn = !late && minutes >= WARN_AFTER;

  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 transition-colors',
        order.status === 'pending' && 'border-gold-200 bg-gold-100',
        order.status === 'preparing' && 'border-ink/10 bg-white',
        order.status === 'ready' && 'border-sage-200 bg-sage-100',
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl font-semibold leading-none">Table {order.tableNumber}</h3>
        <span
          className={cn(
            'tnum inline-flex items-center gap-1 text-[0.68rem] font-bold',
            late && 'rounded bg-red-100 px-1.5 py-0.5 text-red-600',
            warn && 'text-ember-600',
            !late && !warn && 'text-ink-muted',
          )}
        >
          <Clock className="h-3 w-3" /> {shortAge(minutes)}
        </span>
      </div>
      <p className="mt-0.5 text-[0.62rem] font-bold tracking-[0.1em] text-ink-muted">
        #{order.id.slice(-5).toUpperCase()}
      </p>

      <ul className="mt-3 space-y-1.5">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-baseline gap-2 text-sm">
            <span className="tnum grid h-[1.35rem] min-w-[1.35rem] shrink-0 place-items-center rounded bg-ink text-[0.7rem] font-extrabold text-cream">
              {it.qty}
            </span>
            <span className="font-semibold">{it.name}</span>
          </li>
        ))}
      </ul>

      {order.status === 'pending' && (
        <button
          onClick={() => onAdvance(order.id)}
          className="mt-3.5 w-full rounded-lg bg-ember-500 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-ember-600"
        >
          Start cooking
        </button>
      )}
      {order.status === 'preparing' && (
        <button
          onClick={() => onAdvance(order.id)}
          className="mt-3.5 w-full rounded-lg bg-sage-500 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-sage-600"
        >
          Mark ready
        </button>
      )}
      {order.status === 'ready' && (
        <p className="mt-3.5 rounded-lg bg-white/50 py-2 text-center text-xs font-bold text-sage-600">
          Ready · waiting for waiter
        </p>
      )}
    </div>
  );
}
