import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import type { CustomerSession } from '@/features/customer/useCustomerSession';
import { useCart } from '@/context/CartContext';
import { orderService } from '@/data/services';
import { CartLine } from '@/features/cart/CartLine';
import { UpsellSuggestion } from '@/features/cart/UpsellSuggestion';
import { Button, EmptyState } from '@/components/ui';
import { formatMoney } from '@/lib/format';

export function CartPage() {
  const { restaurant, table } = useOutletContext<CustomerSession>();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const { taxRate, serviceChargeRate, currencySymbol: symbol } = restaurant.settings;
  const tax = Math.round(subtotal * taxRate);
  const serviceCharge = Math.round(subtotal * serviceChargeRate);
  const total = subtotal + tax + serviceCharge;

  const back = () => navigate(`/r/${restaurant.slug}/t/${table.id}`);

  function placeOrder() {
    setPlacing(true);
    const order = orderService.placeFromCart(restaurant.id, table.id, table.number, items);
    clear();
    toast.success('Order placed! The kitchen has it.');
    navigate(`/r/${restaurant.slug}/t/${table.id}/order/${order.id}`);
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-10 lg:px-8 lg:py-16">
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Your order is empty"
          description="Add a few dishes from the menu to get started."
          action={<Button onClick={back}>Browse menu</Button>}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pb-40 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-10 lg:px-8 lg:pb-16">
      {/* ── The order: lines and the pairing note ── */}
      <div className="min-w-0">
        <button
          onClick={back}
          className="mt-4 inline-flex items-center gap-1.5 text-[0.78rem] font-bold text-ink-soft transition-colors hover:text-ember-600 lg:mt-8 lg:text-[0.82rem]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Add more items
        </button>
        <h1 className="mt-1.5 font-display text-[1.6rem] font-semibold leading-[1.1] tracking-tight lg:text-[2rem]">
          Your order
        </h1>
        <p className="text-[0.74rem] text-ink-muted lg:text-[0.82rem]">
          Table {table.number} · {restaurant.name}
        </p>

        {/* A leading hairline closes the first line's rule, so the stack reads as
            a ruled column rather than a list that starts mid-air. */}
        <div className="mt-3.5 border-t border-ink/10 lg:mt-5">
          {items.map((line) => (
            <CartLine key={line.menuItemId} line={line} symbol={symbol} />
          ))}
        </div>

        <UpsellSuggestion restaurantId={restaurant.id} symbol={symbol} />
      </div>

      {/* ── The check. Sticky on desktop, where it also carries the CTA; on the
             phone it sits inline and the fixed bar below does the placing. ── */}
      <aside className="mt-4 rounded-2xl border border-ink/10 bg-white p-3.5 lg:sticky lg:top-24 lg:mt-8 lg:p-4">
        <h2 className="mb-2.5 hidden font-display text-xl font-semibold lg:block">The check</h2>
        <Row label="Subtotal" value={formatMoney(subtotal, symbol)} />
        <Row label={`Tax (${Math.round(taxRate * 100)}%)`} value={formatMoney(tax, symbol)} />
        <Row label={`Service charge (${Math.round(serviceChargeRate * 100)}%)`} value={formatMoney(serviceCharge, symbol)} />
        <div className="mt-2 flex items-baseline justify-between border-t-[1.5px] border-ink pt-2.5">
          <span className="font-display text-base font-semibold">Total</span>
          <span className="tnum font-display text-[1.4rem] font-bold leading-none">{formatMoney(total, symbol)}</span>
        </div>
        <Button onClick={placeOrder} loading={placing} fullWidth className="mt-3.5 hidden lg:flex">
          Place order · <span className="tnum">{formatMoney(total, symbol)}</span>
        </Button>
      </aside>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-safe lg:hidden">
        <Button onClick={placeOrder} loading={placing} fullWidth size="lg" className="pointer-events-auto mb-3 shadow-lift">
          Place order · <span className="tnum">{formatMoney(total, symbol)}</span>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-[0.78rem] text-ink-soft">
      <span>{label}</span>
      <span className="tnum font-semibold text-ink">{value}</span>
    </div>
  );
}
