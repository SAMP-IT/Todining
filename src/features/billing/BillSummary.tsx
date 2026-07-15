import type { Bill } from '@/types';
import { formatMoney, formatDateTime } from '@/lib/format';

/** Printable bill view — used on the customer screen and admin billing modal.
 *  The printed check: a centred masthead, dashed rules, tabular figures, and a
 *  heavy ink rule under the serif grand total. */
export function BillSummary({ bill, restaurantName, symbol }: { bill: Bill; restaurantName: string; symbol: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <div className="text-center">
        <h3 className="font-display text-2xl font-semibold leading-tight">{restaurantName}</h3>
        <p className="mt-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
          Tax Invoice · <span className="tnum">{bill.invoiceNumber ?? `#${bill.id.slice(-6).toUpperCase()}`}</span>
        </p>
        <p className="tnum mt-1 text-[0.7rem] text-ink-muted">Table {bill.tableNumber} · {formatDateTime(bill.createdAt)}</p>
      </div>

      <div className="my-4 border-t border-dashed border-ink/20" />

      <div className="space-y-0.5">
        {bill.items.map((it) => (
          <div key={it.id} className="flex items-baseline justify-between gap-4 py-1 text-[0.82rem]">
            <span><span className="tnum font-bold">{it.qty}×</span> {it.name}</span>
            <span className="tnum shrink-0">{formatMoney(it.unitPrice * it.qty, symbol)}</span>
          </div>
        ))}
      </div>

      <div className="my-4 border-t border-dashed border-ink/20" />

      <div className="space-y-0.5">
        <Row label="Subtotal" value={formatMoney(bill.subtotal, symbol)} />
        <Row label="Tax" value={formatMoney(bill.tax, symbol)} />
        <Row label="Service charge" value={formatMoney(bill.serviceCharge, symbol)} />
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-4 border-t-[1.5px] border-ink pt-2.5">
        <span className="font-display text-base font-semibold">Grand Total</span>
        <span className="tnum font-display text-[1.4rem] font-bold leading-none">{formatMoney(bill.grandTotal, symbol)}</span>
      </div>

      <p className="mt-5 text-center font-display text-sm italic text-ink-muted">Thank you for dining with us.</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5 text-[0.82rem] text-ink-muted">
      <span>{label}</span>
      <span className="tnum shrink-0">{value}</span>
    </div>
  );
}
