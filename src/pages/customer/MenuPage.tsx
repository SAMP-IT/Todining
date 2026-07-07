import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import type { CustomerSession } from '@/features/customer/useCustomerSession';
import { menuService, sessionService } from '@/data/services';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { MenuItemCard } from '@/features/menu/MenuItemCard';
import { CategoryNav } from '@/features/menu/CategoryNav';
import { CartBar } from '@/features/cart/CartBar';
import { EmptyState } from '@/components/ui';
import { formatMoney } from '@/lib/format';

export function MenuPage() {
  const { restaurant, table } = useOutletContext<CustomerSession>();
  const symbol = restaurant.settings.currencySymbol;

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
      // [DEBUG-MENU] temporary — trace the slug-resolved restaurantId + its items.
      console.debug('[DEBUG-MENU] Customer MenuPage query', {
        slugRestaurantId: restaurant.id, name: restaurant.name,
        parentId: restaurant.parentId ?? null, kind: restaurant.parentId ? 'BRANCH' : 'HOTEL',
        availableCount: avail.length,
        itemRestaurantIds: [...new Set(avail.map((i) => i.restaurantId))],
        names: avail.map((i) => i.name),
      });
      return { categories: cats, items: avail };
    },
    { restaurantId: restaurant.id, types: ['data:changed'] },
  );

  // Only show categories that actually have items.
  const sections = useMemo(
    () =>
      categories
        .map((c) => ({ category: c, items: items.filter((i) => i.categoryId === c.id) }))
        .filter((s) => s.items.length > 0),
    [categories, items],
  );

  const [activeId, setActiveId] = useState<string | null>(sections[0]?.category.id ?? null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Scrollspy: highlight the category currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
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

  if (sections.length === 0) {
    return (
      <div className="px-4 py-10">
        <EmptyState title="Menu is being prepared" description="This restaurant hasn't published its menu yet." />
      </div>
    );
  }

  return (
    <div className="px-4 pb-28">
      {activeSession && activeSession.status === 'active' && latestOrderId && (
        <Link
          to={`/r/${restaurant.slug}/t/${table.id}/order/${latestOrderId}`}
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-ember-300 bg-ember-50 px-4 py-3 text-ember-700 shadow-soft"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Receipt className="h-4 w-4" />
            Dining session active · {activeSession.orders.length} order{activeSession.orders.length === 1 ? '' : 's'}
          </span>
          <span className="text-sm font-bold">
            {formatMoney(activeSession.total, symbol)} →
          </span>
        </Link>
      )}

      <div className="py-4">
        <h1 className="font-display text-2xl font-semibold">What are you craving?</h1>
        {restaurant.tagline && <p className="text-sm text-ink-muted">{restaurant.tagline}</p>}
      </div>

      <CategoryNav
        categories={sections.map((s) => s.category)}
        activeId={activeId}
        onSelect={scrollTo}
      />

      <div className="mt-4 space-y-8">
        {sections.map(({ category, items: secItems }) => (
          <section
            key={category.id}
            id={category.id}
            ref={(el) => (sectionRefs.current[category.id] = el)}
            className="scroll-mt-32"
          >
            <h2 className="mb-3 font-display text-lg font-semibold">{category.name}</h2>
            <div className="space-y-3">
              {secItems.map((item) => (
                <MenuItemCard key={item.id} item={item} currencySymbol={symbol} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <CartBar to="cart" symbol={symbol} />
    </div>
  );
}
