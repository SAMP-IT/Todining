import type { Bill } from '@/types';
import { formatMoney, formatDateTime } from '@/lib/format';

/** Printable bill view — used on the customer screen and admin billing modal. */
export function BillSummary({ bill, restaurantName, symbol }: { bill: Bill; restaurantName: string; symbol: string }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5">
      <div className="text-center">
        <h3 className="font-display text-xl font-semibold">{restaurantName}</h3>
        <p className="text-xs text-ink-muted">Tax Invoice · {bill.invoiceNumber ?? `#${bill.id.slice(-6).toUpperCase()}`}</p>
        <p className="text-xs text-ink-muted">Table {bill.tableNumber} · {formatDateTime(bill.createdAt)}</p>
      </div>

      <div className="my-4 border-t border-dashed border-ink/15" />

      <div className="space-y-1.5 text-sm">
        {bill.items.map((it) => (
          <div key={it.id} className="flex items-center justify-between">
            <span className="text-ink-soft">{it.qty}× {it.name}</span>
            <span className="font-medium">{formatMoney(it.unitPrice * it.qty, symbol)}</span>
          </div>
        ))}
      </div>

      <div className="my-4 border-t border-dashed border-ink/15" />

      <div className="space-y-1 text-sm">
        <Row label="Subtotal" value={formatMoney(bill.subtotal, symbol)} />
        <Row label="Tax" value={formatMoney(bill.tax, symbol)} />
        <Row label="Service charge" value={formatMoney(bill.serviceCharge, symbol)} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-ink/15 pt-3 text-base font-bold">
        <span>Grand Total</span>
        <span className="font-display text-lg">{formatMoney(bill.grandTotal, symbol)}</span>
      </div>

      <p className="mt-4 text-center text-xs text-ink-muted">Thank you for dining with us!</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink-soft">
      <span>{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
