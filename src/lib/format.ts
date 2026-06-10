import { format, formatDistanceToNow, parseISO } from 'date-fns';

/** Format a number as currency using a symbol (defaults to ₹). */
export function formatMoney(amount: number, symbol = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy');
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'd MMM, h:mm a');
}

/** "3 min ago" style relative time. */
export function timeAgo(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

/** Human reservation date+time, e.g. "15 Jun · 7:00 PM". */
export function formatReservationSlot(date: string, time: string): string {
  try {
    const d = format(parseISO(date), 'd MMM');
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${d} · ${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch {
    return `${date} ${time}`;
  }
}
