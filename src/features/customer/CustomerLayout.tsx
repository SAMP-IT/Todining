import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, MapPin } from 'lucide-react';
import { useCustomerSession } from './useCustomerSession';
import { CartProvider } from '@/context/CartContext';
import { Wordmark } from '@/components/layout/Brand';
import { ServiceRequestSheet } from '@/features/service-requests/ServiceRequestSheet';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Mobile-first shell for the QR ordering flow. Validates the table link,
 * scopes the cart to this table, and shows a slim header with the auto-detected
 * table number (Feature 1: "table number is automatically detected").
 */
export function CustomerLayout() {
  const session = useCustomerSession();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  if (!session) return <NotFoundPage />;
  const { restaurant, table } = session;

  return (
    <CartProvider scopeKey={table.id}>
      <div className="mx-auto min-h-[100dvh] max-w-md bg-cream">
        <header className="sticky top-0 z-30 border-b border-ink/8 bg-cream/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(`/r/${restaurant.slug}/t/${table.id}`)} className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white" style={{ background: restaurant.logoColor }}>
                {restaurant.name.charAt(0)}
              </span>
              <span className="font-display text-lg font-semibold leading-none">{restaurant.name}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHelpOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-ember-200 bg-white px-2.5 py-1 text-xs font-bold text-ember-600 hover:bg-ember-50"
              >
                <Bell className="h-3.5 w-3.5" /> Help
              </button>
              <span className="inline-flex items-center gap-1 rounded-full bg-ember-100 px-2.5 py-1 text-xs font-bold text-ember-700">
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

        <Outlet context={session} />

        <footer className="px-4 pb-6 pt-10 text-center">
          <Wordmark className="justify-center opacity-50 [&_span]:text-base" />
        </footer>
      </div>
    </CartProvider>
  );
}
