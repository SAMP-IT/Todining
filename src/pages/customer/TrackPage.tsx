import { useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Download, Printer, Star, UtensilsCrossed } from 'lucide-react';
import type { CustomerSession } from '@/features/customer/useCustomerSession';
import { billingService, feedbackService, orderService, sessionService } from '@/data/services';
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
  const [completing, setCompleting] = useState(false);
  useRealtime(() => setTick((t) => t + 1), { restaurantId: restaurant.id, types: ['order:updated', 'order:created', 'data:changed'] });

  // Resolve the order by id, but only honour it when it belongs to THIS
  // workspace (the slug's restaurant). Orders are keyed by globally-unique id,
  // so a crafted /r/<slugA>/t/<tableA>/order/<orderId-from-another-tenant> URL
  // must NOT render another restaurant's order inside this one. Tenant isolation
  // is enforced at the read, not assumed from the URL.
  const found = orderId ? orderService.get(orderId) : undefined;
  const order = found && found.restaurantId === restaurant.id ? found : undefined;

  // The whole dining session this order belongs to — every order placed on this
  // table during the visit, aggregated. The bill (if any) covers the session.
  const session = order ? sessionService.get(restaurant.id, order.sessionId) : null;
  const sessionBill = order ? billingService.getBySession(restaurant.id, order.sessionId) : undefined;
  const alreadyReviewed = useMemo(
    () => (orderId ? feedbackService.list(restaurant.id).some((f) => f.orderId === orderId) : false),
    [orderId, restaurant.id, feedbackSent],
  );

  if (!order || !session) {
    return (
      <div className="px-4 py-10">
        <EmptyState title="Order not found" description="This order may have been cleared." action={<Link to={`/r/${restaurant.slug}/t/${table.id}`}><Button>Back to menu</Button></Link>} />
      </div>
    );
  }

  const sessionOpen = session.status === 'active' && !sessionBill;

  function completeDining() {
    setCompleting(true);
    sessionService.completeDining(restaurant.id, order!.sessionId);
    setTick((t) => t + 1);
    setCompleting(false);
    toast.success('Dining complete. Here is your final bill.');
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
    <div className="px-4 pb-10 lg:px-8 lg:pb-16">
      {/* Two columns on desktop: the kitchen's progress on the left, the guest's
          running table and the close-out on the right. The `sessionOpen` and
          `sessionBill` branches are mutually exclusive, so the phone's single
          column always reads in the right order without any reordering. */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-10">
        <div className="min-w-0">
          <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-sage-200 bg-sage-100 px-3.5 py-2.5 text-sage-600 lg:mt-8">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="text-xs font-bold">
              Order #{order.id.slice(-5).toUpperCase()} placed at {formatTime(order.createdAt)}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-5 lg:p-6">
            <h2 className="mb-5 font-display text-xl font-semibold lg:text-2xl">Live status</h2>
            <OrderStatusTimeline status={order.status} />
          </div>

          {/* Session closed: the single final bill for the whole visit */}
          {sessionBill && (
            <div className="mt-4">
              <BillSummary bill={sessionBill} restaurantName={restaurant.name} symbol={symbol} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={async () => (await import('@/features/billing/billPdf')).printBillPdf(sessionBill, restaurant.name, symbol)}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button variant="outline" onClick={async () => (await import('@/features/billing/billPdf')).downloadBillPdf(sessionBill, restaurant.name, symbol)}>
                  <Download className="h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          )}

          {/* Feedback — after the final bill */}
          {sessionBill && (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-5 lg:p-6">
              {alreadyReviewed || feedbackSent ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <Star className="h-7 w-7 fill-gold-400 text-gold-400" />
                  <p className="mt-2 font-display text-xl font-semibold">Thanks for your feedback!</p>
                  <p className="mt-0.5 text-xs text-ink-muted">We hope to see you again soon.</p>
                </div>
              ) : (
                <>
                  <h3 className="mb-4 font-display text-xl font-semibold lg:text-2xl">How was everything?</h3>
                  <FeedbackForm onSubmit={submitFeedback} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Still dining: the running table, plus add-more or finish the visit.
            No bill exists until "Complete Dining" closes the session. */}
        {sessionOpen && (
          <aside className="mt-4 lg:sticky lg:top-24 lg:mt-8">
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-semibold">Your table so far</h3>
                <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted">
                  Table {session.tableNumber} · {session.orders.length} order{session.orders.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-3">
                {session.items.map((it) => (
                  <div key={it.id} className="flex items-baseline gap-2 border-b border-ink/10 py-2 text-sm last:border-b-0">
                    <span className="tnum font-bold text-ink-muted">{it.qty}×</span>
                    <span className="min-w-0 flex-1 truncate">{it.name}</span>
                    <span className="tnum font-display font-semibold">{formatMoney(it.unitPrice * it.qty, symbol)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t-[1.5px] border-ink pt-2">
                <span className="font-display text-base font-semibold">Running total</span>
                <span className="tnum font-display text-xl font-bold">{formatMoney(session.total, symbol)}</span>
              </div>
            </div>

            <Link to={`/r/${restaurant.slug}/t/${table.id}`} className="mt-3 block">
              <Button variant="outline" fullWidth>
                <UtensilsCrossed className="h-4 w-4" /> Order more items
              </Button>
            </Link>

            <div className="mt-3 rounded-2xl border border-ink/10 bg-white p-5 text-center">
              <h3 className="font-display text-xl font-semibold">Finished dining?</h3>
              <p className="mb-4 mt-1 text-xs leading-relaxed text-ink-muted">
                Close your table and get one final bill for everything you ordered.
              </p>
              <Button fullWidth loading={completing} onClick={completeDining}>
                Complete Dining · <span className="tnum">{formatMoney(session.total, symbol)}</span>
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
