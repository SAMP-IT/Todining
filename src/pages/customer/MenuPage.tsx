import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Receipt, Search } from 'lucide-react';
import type { CustomerSession } from '@/features/customer/useCustomerSession';
import { menuService, sessionService } from '@/data/services';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useCart } from '@/context/CartContext';
import { MenuItemCard } from '@/features/menu/MenuItemCard';
import { CategoryNav, CategoryIndex } from '@/features/menu/CategoryNav';
import { CartBar } from '@/features/cart/CartBar';
import { EmptyState } from '@/components/ui';
import { formatMoney } from '@/lib/format';

export function MenuPage() {
  const { restaurant, table } = useOutletContext<CustomerSession>();
  const symbol = restaurant.settings.currencySymbol;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // The table's open dining session (if the guest has already ordered this
  // visit). Lets them jump back to the running tab / "Complete Dining" while
  // they keep adding items. Refreshes live as orders are placed or served.
  const activeSession = useLiveQuery(
    () => {
      const sid = sessionService.activeIdForTable(restaurant.id, table.id);
      return sid ? sessionService.get(restaurant.id, sid) : null;
    },
    { restaurantId: restaurant.id, types: ['order:created', 'order:updated', 'data:changed'] },
  );
  const latestOrderId = activeSession?.orders[activeSession.orders.length - 1]?.id;

  // Live-bound to the menu: only *available* items are shown, and the view
  // re-reads whenever the owner adds, edits, removes or toggles a dish — so an
  // item deleted or marked unavailable in the admin disappears here immediately.
  const { categories, items } = useLiveQuery(
    () => {
      const cats = menuService.categories(restaurant.id);
      const avail = menuService.availableItems(restaurant.id);
      return { categories: cats, items: avail };
    },
    { restaurantId: restaurant.id, types: ['data:changed'] },
  );

  // Only show categories that actually have items (after any search filter).
  const q = query.trim().toLowerCase();
  const sections = useMemo(
    () =>
      categories
        .map((c) => ({
          category: c,
          items: items.filter(
            (i) =>
              i.categoryId === c.id &&
              (!q || i.name.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q)),
          ),
        }))
        .filter((s) => s.items.length > 0),
    [categories, items, q],
  );

  const [activeId, setActiveId] = useState<string | null>(sections[0]?.category.id ?? null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Scrollspy: highlight the category currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -65% 0px', threshold: [0, 0.25, 0.5] },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections.length]);

  function scrollTo(id: string) {
    setActiveId(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const menuEmpty = categories.length === 0 || items.length === 0;
  if (menuEmpty) {
    return (
      <div className="px-4 py-10">
        <EmptyState title="Menu is being prepared" description="This restaurant hasn't published its menu yet." />
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 lg:px-8 lg:pb-16">
      {/* ── Editorial masthead ── */}
      <div className="pt-5 text-center lg:pt-10">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.34em] text-ink-muted">{restaurant.name}</p>
        <h1 className="mt-2 font-display text-[1.75rem] font-semibold leading-[1.05] tracking-tight lg:text-[3rem]">
          What are you <em className="italic text-ember-600">craving?</em>
        </h1>
        {restaurant.tagline && <p className="mt-1 text-sm text-ink-muted">{restaurant.tagline}</p>}
        <div className="mt-4 flex items-center justify-center gap-3 text-ink/25">
          <span className="h-px w-10 bg-current" />
          <span className="h-1 w-1 rotate-45 bg-ember-500" />
          <span className="h-px w-10 bg-current" />
        </div>
      </div>

      {/* Running dining session (phone: banner; desktop: inside the order panel) */}
      {activeSession && activeSession.status === 'active' && latestOrderId && (
        <Link
          to={`/r/${restaurant.slug}/t/${table.id}/order/${latestOrderId}`}
          className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-ember-200 bg-ember-100 px-3.5 py-2.5 text-ember-700 lg:hidden"
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <Receipt className="h-3.5 w-3.5" />
            Dining session · {activeSession.orders.length} order{activeSession.orders.length === 1 ? '' : 's'}
          </span>
          <span className="tnum text-xs font-bold">{formatMoney(activeSession.total, symbol)} →</span>
        </Link>
      )}

      <div className="mt-5 lg:mt-8 lg:grid lg:grid-cols-[180px_1fr_290px] lg:items-start lg:gap-9">
        {/* ── Desktop index ── */}
        <CategoryIndex
          categories={sections.map((s) => ({ id: s.category.id, name: s.category.name, count: s.items.length }))}
          activeId={activeId}
          onSelect={scrollTo}
        />

        {/* ── Sections ── */}
        <div className="min-w-0">
          <label className="mb-4 flex items-center gap-2.5 rounded-full border border-ink/12 bg-white px-4 py-2.5 text-sm text-ink-muted focus-within:border-ember-500">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              className="w-full bg-transparent text-ink outline-none placeholder:text-ink-muted"
            />
          </label>

          <CategoryNav
            categories={sections.map((s) => s.category)}
            activeId={activeId}
            onSelect={scrollTo}
          />

          {sections.length === 0 ? (
            <div className="py-10">
              <EmptyState title="No dishes match" description={`Nothing on the menu matches "${query}".`} />
            </div>
          ) : (
            <div className="mt-2">
              {sections.map(({ category, items: secItems }, i) => (
                <section
                  key={category.id}
                  id={category.id}
                  ref={(el) => (sectionRefs.current[category.id] = el)}
                  className="scroll-mt-32"
                >
                  <div className="mb-1 mt-6 flex items-center gap-3 first:mt-2">
                    <span className="text-[0.64rem] font-bold tracking-[0.14em] text-ember-600">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h2 className="font-display text-xl font-medium italic lg:text-2xl">{category.name}</h2>
                    <span className="h-px flex-1 bg-ink/10" />
                  </div>
                  <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
                    {secItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} currencySymbol={symbol} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop order panel (replaces the phone's floating cart bar) ── */}
        <OrderPanel
          symbol={symbol}
          tableNumber={table.number}
          taxRate={restaurant.settings.taxRate}
          serviceChargeRate={restaurant.settings.serviceChargeRate}
          sessionNote={
            activeSession && activeSession.status === 'active' && latestOrderId
              ? {
                  orders: activeSession.orders.length,
                  total: activeSession.total,
                  href: `/r/${restaurant.slug}/t/${table.id}/order/${latestOrderId}`,
                }
              : null
          }
          onReview={() => navigate(`/r/${restaurant.slug}/t/${table.id}/cart`)}
        />
      </div>

      <CartBar to="cart" symbol={symbol} />
    </div>
  );
}

/**
 * The desktop-only running order. Mirrors the cart maths exactly (the cart page
 * remains the single place an order is actually placed, so the upsell still
 * gets its moment).
 */
function OrderPanel({
  symbol,
  tableNumber,
  taxRate,
  serviceChargeRate,
  sessionNote,
  onReview,
}: {
  symbol: string;
  tableNumber: number;
  taxRate: number;
  serviceChargeRate: number;
  sessionNote: { orders: number; total: number; href: string } | null;
  onReview: () => void;
}) {
  const { items, subtotal, count } = useCart();
  const tax = Math.round(subtotal * taxRate);
  const serviceCharge = Math.round(subtotal * serviceChargeRate);
  const total = subtotal + tax + serviceCharge;

  return (
    <aside className="sticky top-24 hidden overflow-hidden rounded-2xl border border-ink/10 bg-white lg:block">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <h3 className="font-display text-xl font-semibold">Your table</h3>
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted">Table {tableNumber}</span>
      </div>

      {count === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-ink-muted">
          Nothing added yet. Tap <span className="font-bold text-ember-600">Add</span> on a dish to start your order.
        </p>
      ) : (
        <div className="px-4 py-1">
          {items.map((line) => (
            <div key={line.menuItemId} className="flex items-baseline gap-2 border-b border-ink/10 py-2 text-sm last:border-b-0">
              <span className="tnum font-bold text-ink-muted">{line.qty}×</span>
              <span className="min-w-0 flex-1 truncate">{line.name}</span>
              <span className="tnum font-display font-semibold">{formatMoney(line.price * line.qty, symbol)}</span>
            </div>
          ))}
        </div>
      )}

      {sessionNote && (
        <Link
          to={sessionNote.href}
          className="mx-4 my-3 flex items-center justify-between rounded-lg border border-ember-200 bg-ember-100 px-2.5 py-2 text-[0.68rem] font-bold text-ember-700"
        >
          <span>Dining session · {sessionNote.orders} order{sessionNote.orders === 1 ? '' : 's'}</span>
          <span className="tnum">{formatMoney(sessionNote.total, symbol)} →</span>
        </Link>
      )}

      {count > 0 && (
        <div className="border-t border-ink/10 bg-cream px-4 py-3">
          <Row label="Subtotal" value={formatMoney(subtotal, symbol)} />
          <Row label={`Tax (${Math.round(taxRate * 100)}%)`} value={formatMoney(tax, symbol)} />
          <Row label={`Service (${Math.round(serviceChargeRate * 100)}%)`} value={formatMoney(serviceCharge, symbol)} />
          <div className="mt-2 flex items-baseline justify-between border-t-[1.5px] border-ink pt-2">
            <span className="font-display text-base font-semibold">Total</span>
            <span className="tnum font-display text-xl font-bold">{formatMoney(total, symbol)}</span>
          </div>
          <button
            onClick={onReview}
            className="mt-3 w-full rounded-lg bg-ember-500 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-ember-600"
          >
            Review order · <span className="tnum">{formatMoney(total, symbol)}</span>
          </button>
        </div>
      )}
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-xs text-ink-soft">
      <span>{label}</span>
      <span className="tnum font-semibold text-ink">{value}</span>
    </div>
  );
}
