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
      <div className="px-4 py-10">
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
    <div className="px-4 pb-40">
      <button onClick={back} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-soft">
        <ArrowLeft className="h-4 w-4" /> Add more items
      </button>
      <h1 className="mt-2 font-display text-2xl font-semibold">Your order</h1>
      <p className="text-sm text-ink-muted">Table {table.number} · {restaurant.name}</p>

      <div className="mt-4 divide-y divide-ink/5 rounded-2xl border border-ink/5 bg-white px-4 shadow-soft">
        {items.map((line) => (
          <CartLine key={line.menuItemId} line={line} symbol={symbol} />
        ))}
      </div>

      <div className="mt-4">
        <UpsellSuggestion restaurantId={restaurant.id} symbol={symbol} />
      </div>

      {/* Bill preview */}
      <div className="mt-4 space-y-2 rounded-2xl border border-ink/5 bg-white p-4 text-sm shadow-soft">
        <Row label="Subtotal" value={formatMoney(subtotal, symbol)} />
        <Row label={`Tax (${Math.round(taxRate * 100)}%)`} value={formatMoney(tax, symbol)} />
        <Row label={`Service charge (${Math.round(serviceChargeRate * 100)}%)`} value={formatMoney(serviceCharge, symbol)} />
        <div className="mt-2 flex items-center justify-between border-t border-ink/8 pt-3 text-base font-bold">
          <span>Total</span>
          <span className="font-display text-lg">{formatMoney(total, symbol)}</span>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-safe">
        <Button onClick={placeOrder} loading={placing} fullWidth size="lg" className="pointer-events-auto mb-3 shadow-lift">
          Place order · {formatMoney(total, symbol)}
        </Button>
      </div>
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
