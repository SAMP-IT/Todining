import { useState } from 'react';
import { Download, IndianRupee, Printer, ReceiptText } from 'lucide-react';
import type { Bill } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { billingService } from '@/data/services';
import { BillSummary } from '@/features/billing/BillSummary';
import { Button, EmptyState, KpiCard, Modal, PageHeader } from '@/components/ui';
import { formatMoney, formatDateTime } from '@/lib/format';

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
        <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep/60 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Bill</th>
                <th className="px-4 py-3 font-semibold">Table</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Date</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-cream-deep/40">
                  <td className="px-4 py-3 font-semibold">#{b.id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3">T{b.tableNumber}</td>
                  <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">{formatDateTime(b.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(b.grandTotal, symbol)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelected(b)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
