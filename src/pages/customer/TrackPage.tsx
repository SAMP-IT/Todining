import { useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Download, Printer, Star } from 'lucide-react';
import type { CustomerSession } from '@/features/customer/useCustomerSession';
import { billingService, feedbackService, orderService } from '@/data/services';
import { useRealtime } from '@/hooks/useRealtime';
import { OrderStatusTimeline } from '@/features/orders/OrderStatusTimeline';
import { BillSummary } from '@/features/billing/BillSummary';
import { FeedbackForm, type FeedbackValues } from '@/features/feedback/FeedbackForm';
import { Button, EmptyState } from '@/components/ui';
import { formatMoney, formatTime } from '@/lib/format';

export function TrackPage() {
  const { restaurant, table } = useOutletContext<CustomerSession>();
  const { orderId } = useParams<{ orderId: string }>();
  const symbol = restaurant.settings.currencySymbol;

  const [, setTick] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  useRealtime(() => setTick((t) => t + 1), { restaurantId: restaurant.id, types: ['order:updated', 'data:changed'] });

  // Resolve the order by id, but only honour it when it belongs to THIS
  // workspace (the slug's restaurant). Orders are keyed by globally-unique id,
  // so a crafted /r/<slugA>/t/<tableA>/order/<orderId-from-another-tenant> URL
  // must NOT render another restaurant's order inside this one. Tenant isolation
  // is enforced at the read, not assumed from the URL.
  const found = orderId ? orderService.get(orderId) : undefined;
  const order = found && found.restaurantId === restaurant.id ? found : undefined;
  const existingBill = order ? billingService.getByOrder(order.id) : undefined;
  const alreadyReviewed = useMemo(
    () => (orderId ? feedbackService.list(restaurant.id).some((f) => f.orderId === orderId) : false),
    [orderId, restaurant.id, feedbackSent],
  );

  if (!order) {
    return (
      <div className="px-4 py-10">
        <EmptyState title="Order not found" description="This order may have been cleared." action={<Link to={`/r/${restaurant.slug}/t/${table.id}`}><Button>Back to menu</Button></Link>} />
      </div>
    );
  }

  const canBill = order.status === 'served' || order.status === 'completed';

  function requestBill() {
    billingService.generate(order!.id);
    setTick((t) => t + 1);
    toast.success('Here is your bill.');
  }

  function submitFeedback(v: FeedbackValues) {
    feedbackService.create(restaurant.id, {
      orderId: order!.id,
      tableNumber: order!.tableNumber,
      foodRating: v.foodRating,
      serviceRating: v.serviceRating,
      experienceRating: v.experienceRating,
      comment: v.comment || undefined,
    });
    setFeedbackSent(true);
    toast.success('Thank you for your feedback! 🙏');
  }

  return (
    <div className="px-4 pb-10">
      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-sage-50 p-3 text-sage-600">
        <CheckCircle2 className="h-5 w-5" />
        <p className="text-sm font-semibold">Order #{order.id.slice(-5).toUpperCase()} placed at {formatTime(order.createdAt)}</p>
      </div>

      <div className="mt-5 rounded-2xl border border-ink/5 bg-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold">Live status</h2>
        <OrderStatusTimeline status={order.status} />
      </div>

      {/* Bill (Feature 10) */}
      {canBill && (
        <div className="mt-4">
          {existingBill ? (
            <>
              <BillSummary bill={existingBill} restaurantName={restaurant.name} symbol={symbol} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={async () => (await import('@/features/billing/billPdf')).printBillPdf(existingBill, restaurant.name, symbol)}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button variant="outline" onClick={async () => (await import('@/features/billing/billPdf')).downloadBillPdf(existingBill, restaurant.name, symbol)}>
                  <Download className="h-4 w-4" /> PDF
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-ink/5 bg-white p-5 text-center shadow-soft">
              <p className="font-semibold">Finished your meal?</p>
              <p className="mb-3 mt-1 text-sm text-ink-muted">Generate your itemised bill with tax & service charge.</p>
              <Button fullWidth onClick={requestBill}>Get the bill · {formatMoney(order.total, symbol)}</Button>
            </div>
          )}
        </div>
      )}

      {/* Feedback (Feature 11) — after the bill */}
      {existingBill && (
        <div className="mt-4 rounded-2xl border border-ink/5 bg-white p-5 shadow-soft">
          {alreadyReviewed || feedbackSent ? (
            <div className="flex flex-col items-center py-4 text-center">
              <Star className="h-8 w-8 fill-gold-400 text-gold-400" />
              <p className="mt-2 font-semibold">Thanks for your feedback!</p>
              <p className="text-sm text-ink-muted">We hope to see you again soon.</p>
            </div>
          ) : (
            <>
              <h3 className="mb-4 font-display text-lg font-semibold">How was everything?</h3>
              <FeedbackForm onSubmit={submitFeedback} />
            </>
          )}
        </div>
      )}

      {/* Order summary */}
      <div className="mt-4 rounded-2xl border border-ink/5 bg-white p-5 shadow-soft">
        <h3 className="font-semibold">Order summary</h3>
        <div className="mt-3 space-y-2 text-sm">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between">
              <span className="text-ink-soft"><span className="font-semibold text-ink">{it.qty}×</span> {it.name}</span>
              <span className="font-medium">{formatMoney(it.unitPrice * it.qty, symbol)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-ink/8 pt-2 font-bold">
            <span>Total</span>
            <span className="font-display">{formatMoney(order.total, symbol)}</span>
          </div>
        </div>
      </div>

      <Link to={`/r/${restaurant.slug}/t/${table.id}`}>
        <Button variant="outline" fullWidth className="mt-4">Order more items</Button>
      </Link>
    </div>
  );
}
