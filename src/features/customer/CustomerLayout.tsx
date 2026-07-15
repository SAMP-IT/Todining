import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, MapPin } from 'lucide-react';
import { useCustomerSession } from './useCustomerSession';
import { CartProvider } from '@/context/CartContext';
import { ServiceRequestSheet } from '@/features/service-requests/ServiceRequestSheet';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Shell for the QR ordering flow. Validates the table link, scopes the cart to
 * this table, and shows the header with the auto-detected table number
 * (Feature 1: "table number is automatically detected").
 *
 * Responsive: phone-width column on mobile (how guests actually scan), and a
 * full editorial spread on desktop. The old hard `max-w-md` with no breakpoints
 * is what left the whole flow as a 448px strip on a laptop.
 */
export function CustomerLayout() {
  const session = useCustomerSession();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  if (!session) return <NotFoundPage />;
  const { restaurant, table } = session;

  return (
    <CartProvider scopeKey={table.id}>
      <div className="min-h-[100dvh] bg-cream">
        <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/92 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3 lg:max-w-[1240px] lg:px-8 lg:py-4">
            <button
              onClick={() => navigate(`/r/${restaurant.slug}/t/${table.id}`)}
              className="flex items-center gap-2.5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink font-display text-sm font-semibold text-ink lg:h-9 lg:w-9 lg:text-base">
                {restaurant.name.charAt(0)}
              </span>
              <span className="font-display text-xl font-semibold leading-none tracking-tight lg:text-2xl">
                {restaurant.name}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHelpOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-2.5 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ember-400 hover:text-ember-600"
              >
                <Bell className="h-3.5 w-3.5" /> Help
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-ember-200 bg-ember-100 px-2.5 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ember-700">
                <MapPin className="h-3.5 w-3.5" /> Table {table.number}
              </span>
            </div>
          </div>
        </header>

        <ServiceRequestSheet
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          restaurantId={restaurant.id}
          tableId={table.id}
          tableNumber={table.number}
        />

        {/* Pages own their internal grid; the shell only sets the reading width. */}
        <div className="mx-auto max-w-md lg:max-w-[1240px]">
          <Outlet context={session} />
        </div>

        <footer className="px-4 pb-8 pt-10 text-center">
          <span className="font-display text-base italic text-ink-muted/60">Scan · Order · Dine</span>
        </footer>
      </div>
    </CartProvider>
  );
}
