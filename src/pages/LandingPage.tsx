import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Bell, CalendarCheck, ChefHat, Home, LayoutGrid, MapPin, QrCode,
  ScanLine, Sparkles, Star, Utensils,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { Wordmark } from '@/components/layout/Brand';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { menuService, restaurantService, tableService } from '@/data/services';

const FEATURES = [
  { icon: QrCode, title: 'QR table ordering', desc: 'Scan, browse, order. No app, no login, under 30 seconds.' },
  { icon: ChefHat, title: 'Live kitchen board', desc: 'Orders hit the kitchen instantly and sync across every screen.' },
  { icon: CalendarCheck, title: 'Smart reservations', desc: 'Take bookings online with one-tap confirm & WhatsApp alerts.' },
  { icon: Bell, title: 'Waiter call system', desc: 'Guests request water, the bill or help — staff see it live.' },
  { icon: Sparkles, title: 'AI upselling', desc: 'Gentle add-on suggestions that lift every order value.' },
  { icon: BarChart3, title: 'Owner analytics', desc: 'Revenue, peak hours, top dishes and ratings at a glance.' },
];

export function LandingPage() {
  // The active workspace is chosen in the Admin Panel workspace manager and
  // persisted in TenantContext (localStorage), so it stays selected across the
  // whole site. branchesOf/setRestaurantById drive the branch selection screen.
  const { restaurantId, branchesOf, setRestaurantById } = useTenant();
  // Whether the visitor has chosen a branch for the active hotel this session.
  // A hotel with branches shows a "Select Branch" screen until one is picked.
  const [branchPicked, setBranchPicked] = useState(false);

  // Live snapshot of the active hotel. Re-reads on any data change, so an admin
  // edit — rename, re-theme, a new dish, a table freeing up — is reflected on the
  // public site instantly without a reload. Falls back to the first hotel so the
  // page never dead-ends when nothing has been selected yet.
  const data = useLiveQuery(
    () => {
      // Resolve the ACTIVE workspace exactly. When a workspace (hotel or branch)
      // is selected we honour that id and NEVER fall back to another restaurant —
      // so "Try demo" always opens the selected branch's own site, identical to
      // the customer website's slug-based resolution. Only when nothing is
      // selected at all do we default to the first hotel so the public landing
      // never dead-ends. (Previously this `?? listHotels()[0]` fired even when a
      // branch WAS active but momentarily unresolved, making Try demo show the
      // first hotel's menu instead of the branch's.)
      const restaurant = restaurantId
        ? restaurantService.getById(restaurantId) ?? null
        : restaurantService.listHotels()[0] ?? null;
      if (!restaurant) return null;
      const items = menuService.items(restaurant.id);
      const tables = tableService.list(restaurant.id);
      // [DEBUG-MENU] temporary — trace the restaurantId the website queries with.
      console.debug('[DEBUG-MENU] LandingPage menuQuery', {
        activeRestaurantId: restaurant.id, name: restaurant.name,
        parentId: restaurant.parentId ?? null, kind: restaurant.parentId ? 'BRANCH' : 'HOTEL',
        itemCount: items.length,
        itemRestaurantIds: [...new Set(items.map((i) => i.restaurantId))],
        availableNames: items.filter((i) => i.isAvailable).map((i) => i.name),
      });
      return {
        restaurant,
        featured: items.filter((i) => i.isAvailable).slice(0, 6),
        menuCount: items.length,
        tableCount: tables.length,
        availableTables: tables.filter((t) => t.status === 'available').length,
        firstTableId: tables[0]?.id,
      };
    },
    { types: ['data:changed'] },
  );

  if (!data) {
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6 text-center">
        <div>
          <Wordmark className="justify-center" />
          <p className="mt-4 text-ink-soft">No hotel is set up yet.</p>
          <Link to="/admin-panel" className="mt-4 inline-block">
            <Button>Open the workspace manager</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Branch selection: when the active workspace is a hotel that HAS branches,
  // present a "Select Branch" screen (Main Branch + children). Picking one
  // activates that branch and loads only its data. A hotel with no branches —
  // or an already-active branch — skips straight to the site (unchanged UX).
  const active = data.restaurant;
  const childBranches = !active.parentId ? branchesOf(active.id) : [];
  if (!active.parentId && childBranches.length > 0 && !branchPicked) {
    const options = [{ r: active, isMain: true }, ...childBranches.map((r) => ({ r, isMain: false }))];
    const hotelBrand = active.logoColor || '#d9521f';
    return (
      <div className="min-h-[100dvh]">
        <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
          <Link to="/admin-panel" className="flex items-center gap-2.5" title="Workspace manager">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl text-base font-bold text-white"
              style={{ background: hotelBrand }}
            >
              {active.logoUrl ? <img src={active.logoUrl} alt="" className="h-full w-full object-cover" /> : active.name.charAt(0)}
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">{active.name}</span>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm">Staff login</Button>
          </Link>
        </header>

        <main className="mx-auto max-w-3xl px-5 pb-16 pt-6 sm:pt-12">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink-soft">
              <MapPin className="h-3.5 w-3.5" style={{ color: hotelBrand }} /> Select a branch
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Welcome to <span style={{ color: hotelBrand }}>{active.name}</span>
            </h1>
            <p className="mt-3 text-ink-soft">Choose a branch to view its menu, tables and live data.</p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {options.map(({ r, isMain }) => (
              <button
                key={r.id}
                disabled={r.status === 'inactive'}
                onClick={() => { setRestaurantById(r.id); setBranchPicked(true); }}
                className="group flex flex-col rounded-2xl border border-ink/8 bg-white p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: r.logoColor }}>
                    {isMain ? <Home className="h-5 w-5" /> : r.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-base font-semibold leading-tight">
                      {isMain ? 'Main Branch' : r.name}
                    </h2>
                    {!isMain && r.code ? <p className="truncate text-xs text-ink-muted">{r.code}</p> : null}
                  </div>
                  <Badge tone={r.status === 'inactive' ? 'neutral' : 'sage'}>
                    {r.status === 'inactive' ? 'Inactive' : 'Active'}
                  </Badge>
                </div>
                {(r.address || r.manager) && (
                  <p className="mt-3 truncate text-xs text-ink-muted">
                    {[r.address, r.manager && `Manager: ${r.manager}`].filter(Boolean).join(' · ')}
                  </p>
                )}
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ember-600">
                  View branch <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const { restaurant: hotel, featured, menuCount, tableCount, availableTables, firstTableId } = data;
  // "Switch branch" affordance: present when the active workspace belongs to a
  // hotel that has branches (whether we're on the Main Branch or a child).
  const parentHotelId = hotel.parentId ?? hotel.id;
  const hasBranches = branchesOf(parentHotelId).length > 0;
  const switchBranch = () => { setRestaurantById(parentHotelId); setBranchPicked(false); };
  const brand = hotel.logoColor || '#d9521f';
  const symbol = hotel.settings.currencySymbol;
  const menuLink = firstTableId ? `/r/${hotel.slug}/t/${firstTableId}` : '/login';
  const reserveLink = `/reserve/${hotel.slug}`;

  return (
    <div className="min-h-[100dvh]">
      {/* Nav — branded to the active hotel */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/admin-panel" className="flex items-center gap-2.5" title="Switch hotel">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl text-base font-bold text-white"
            style={{ background: brand }}
          >
            {hotel.logoUrl ? (
              <img src={hotel.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              hotel.name.charAt(0)
            )}
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">{hotel.name}</span>
        </Link>
        <div className="flex items-center gap-2">
          {hasBranches && (
            <Button variant="ghost" size="sm" onClick={switchBranch}>
              <MapPin className="h-4 w-4" /> Branches
            </Button>
          )}
          <Link to="/login">
            <Button variant="ghost" size="sm">Staff login</Button>
          </Link>
          <Link to={menuLink}>
            <Button size="sm" style={{ background: brand, borderColor: brand }}>Try demo</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-16">
        <div
          className="absolute -top-10 right-0 -z-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: brand }}
        />
        <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink-soft">
          <ScanLine className="h-3.5 w-3.5" style={{ color: brand }} /> The 30-second dining experience
        </span>
        <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Welcome to <span style={{ color: brand }}>{hotel.name}</span>.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          {hotel.tagline ??
            hotel.description ??
            `Scan a table to browse the ${hotel.name} menu, order, track your food, pay and leave feedback — all from your phone.`}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={menuLink}>
            <Button size="lg" className="gap-2" style={{ background: brand, borderColor: brand }}>
              Scan a demo table <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={reserveLink}>
            <Button size="lg" variant="outline">Make a reservation</Button>
          </Link>
        </div>

        {/* Flow strip */}
        <div className="mt-12 flex flex-wrap items-center gap-2 text-sm font-medium text-ink-muted">
          {['Scan QR', 'View Menu', 'Order', 'Track', 'Request Service', 'Pay', 'Feedback'].map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 shadow-soft">{step}</span>
              {i < 6 && <ArrowRight className="h-3.5 w-3.5" />}
            </span>
          ))}
        </div>
      </section>

      {/* Live hotel snapshot — menu / tables / settings for the active hotel */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Utensils, label: 'Menu items', value: menuCount },
            { icon: LayoutGrid, label: 'Tables available', value: `${availableTables}/${tableCount}` },
            { icon: BarChart3, label: 'Tax · Service', value: `${Math.round(hotel.settings.taxRate * 100)}% · ${Math.round(hotel.settings.serviceChargeRate * 100)}%` },
            { icon: Star, label: 'Currency', value: `${hotel.settings.currency} ${symbol}` },
          ].map((s) => (
            <div key={s.label} className="card-surface flex items-center gap-3 p-5">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                style={{ background: brand }}
              >
                <s.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="font-display text-xl font-semibold leading-tight">{s.value}</div>
                <div className="text-xs uppercase tracking-wide text-ink-muted">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured menu from the active hotel */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold">From the {hotel.name} menu</h2>
            <Link to={menuLink} className="text-sm font-semibold" style={{ color: brand }}>
              See full menu →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <div key={item.id} className="card-surface overflow-hidden">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="h-36 w-full object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold leading-tight">{item.name}</h3>
                    <span className="shrink-0 font-display font-semibold" style={{ color: brand }}>
                      {symbol}{item.price}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-surface p-6 transition-transform hover:-translate-y-0.5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ember-100 text-ember-600">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-cream sm:p-14">
          <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(30rem 30rem at 80% 120%, ${brand}, transparent 60%)` }} />
          <div className="relative flex items-center gap-2 text-gold-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <h2 className="relative mt-4 max-w-2xl font-display text-3xl font-semibold text-cream sm:text-4xl">
            Dine at {hotel.name} the smart way.
          </h2>
          <p className="relative mt-3 max-w-xl text-cream/70">
            Scan a table to order, track and pay — or book ahead. Everything you see here is {hotel.name}'s
            own live menu, tables and settings.
          </p>
          <div className="relative mt-7 flex flex-wrap gap-3">
            <Link to={menuLink}>
              <Button size="lg" className="gap-2" style={{ background: brand, borderColor: brand }}>
                <Utensils className="h-4 w-4" /> Open the menu
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="bg-cream text-ink hover:bg-cream-deep">
                Staff dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/8 py-8 text-center text-sm text-ink-muted">
        <Wordmark className="justify-center" />
        <p className="mt-3">{hotel.name} · Powered by ToDining · © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
