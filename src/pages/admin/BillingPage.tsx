import { useState } from 'react';
import { Download, IndianRupee, Printer, ReceiptText } from 'lucide-react';
import type { Bill } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { billingService } from '@/data/services';
import { BillSummary } from '@/features/billing/BillSummary';
import { Button, EmptyState, KpiCard, Modal, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatMoney, formatDateTime } from '@/lib/format';

/** Micro-caps column head, matching the Orders table. */
const TH = 'px-3.5 py-2.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-ink-muted';

export function BillingPage() {
  const { restaurant, restaurantId } = useTenant();
  const symbol = restaurant?.settings.currencySymbol ?? '₹';
  const [selected, setSelected] = useState<Bill | null>(null);

  const bills = useLiveQuery<Bill[]>(() => (restaurantId ? billingService.list(restaurantId) : []), {
    restaurantId: restaurantId ?? undefined,
    types: ['data:changed'],
  });

  const total = bills.reduce((s, b) => s + b.grandTotal, 0);

  return (
    <div>
      <PageHeader title="Billing" subtitle="Itemised bills with tax & service charge, ready to print or export." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Total billed" value={formatMoney(total, symbol)} icon={<IndianRupee className="h-4 w-4" />} />
        <KpiCard label="Bills issued" value={String(bills.length)} icon={<ReceiptText className="h-4 w-4" />} tone="sage" />
        <KpiCard label="Avg bill" value={formatMoney(bills.length ? Math.round(total / bills.length) : 0, symbol)} tone="gold" />
      </div>

      {bills.length === 0 ? (
        <EmptyState icon={<ReceiptText className="h-8 w-8" />} title="No bills yet" description="Bills appear here once orders are completed." />
      ) : (
        <div>
          <div className="flex items-baseline justify-between gap-3 px-0.5 pb-2">
            <h2 className="font-sans text-[0.78rem] font-bold text-ink">
              Issued{' '}
              <span className="tnum font-medium text-ink-muted">· {bills.length} bill{bills.length === 1 ? '' : 's'}</span>
            </h2>
            <span className="tnum font-display text-base font-semibold">{formatMoney(total, symbol)}</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
            <table className="w-full text-left text-[0.82rem]">
              <thead className="bg-cream-deep">
                <tr>
                  <th className={TH}>Bill</th>
                  <th className={TH}>Table</th>
                  <th className={cn(TH, 'hidden sm:table-cell')}>Date</th>
                  <th className={TH}>Total</th>
                  <th className={TH}></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id} className="border-t border-ink/10 transition-colors hover:bg-cream-deep/50">
                    <td className="tnum whitespace-nowrap px-3.5 py-2.5 font-bold">{b.invoiceNumber ?? `#${b.id.slice(-6).toUpperCase()}`}</td>
                    <td className="tnum px-3.5 py-2.5">T{b.tableNumber}</td>
                    <td className="tnum hidden px-3.5 py-2.5 text-ink-muted sm:table-cell">{formatDateTime(b.createdAt)}</td>
                    <td className="tnum px-3.5 py-2.5 font-display text-[0.95rem] font-semibold">{formatMoney(b.grandTotal, symbol)}</td>
                    <td className="px-3.5 py-2.5 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(b)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Bill"
        footer={
          selected && (
            <>
              <Button variant="outline" onClick={async () => (await import('@/features/billing/billPdf')).printBillPdf(selected, restaurant!.name, symbol)}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button onClick={async () => (await import('@/features/billing/billPdf')).downloadBillPdf(selected, restaurant!.name, symbol)}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </>
          )
        }
      >
        {selected && <BillSummary bill={selected} restaurantName={restaurant!.name} symbol={symbol} />}
      </Modal>
    </div>
  );
}
