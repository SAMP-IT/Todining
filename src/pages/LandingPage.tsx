import { Link } from 'react-router-dom';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { menuService, restaurantService, tableService } from '@/data/services';
import { ImageWithFallback } from '@/components/ui';
import { formatMoney } from '@/lib/format';

/** A dim dining room, used behind the hero and the closing panel. */
const ROOM_PHOTO = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1100&q=70&auto=format&fit=crop';
const ROOM_PHOTO_2 = 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=70&auto=format&fit=crop';

/** The visit, as a set sequence rather than pills joined by arrows. */
const VISIT = ['Scan', 'Menu', 'Order', 'Track', 'Call a waiter', 'Pay', 'Feedback'];

/**
 * What the room gets. Rendered as a numbered editorial list: an identical
 * icon-card grid is the single loudest "a template made this" tell, and it is on
 * the DESIGN.md ban list.
 */
const FEATURES = [
  { title: 'QR table ordering', desc: "A table's code opens its own menu. No app, no account, under 30 seconds." },
  { title: 'Live kitchen board', desc: 'Tickets land the second they are placed, and age on screen so nothing is forgotten.' },
  { title: 'Smart reservations', desc: 'Requests arrive with the covers and the slot, ready to approve in one tap.' },
  { title: 'Waiter call system', desc: 'Guests ask for water, the bill or a hand. Staff see it live on the floor.' },
  { title: 'Gentle upselling', desc: 'Rule-based add-on suggestions that lift an order without nagging the guest.' },
  { title: 'Owner analytics', desc: 'Revenue, peak hours, and the dishes that actually sell.' },
];

export function LandingPage() {
  // The active workspace is chosen in the Admin Panel workspace manager and
  // persisted in TenantContext (localStorage), so it stays selected across the
  // whole site. The public site always reflects ONLY this active branch — no
  // sibling-branch picker or cross-branch switching is surfaced here.
  const { restaurantId } = useTenant();

  // Live snapshot of the active hotel. Re-reads on any data change, so an admin
  // edit (rename, re-theme, a new dish, a table freeing up) is reflected on the
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
          <h1 className="font-display text-3xl font-semibold">ToDining</h1>
          <p className="mt-3 text-ink-soft">No hotel is set up yet.</p>
        </div>
      </div>
    );
  }

  const { restaurant: hotel, featured, menuCount, tableCount, availableTables, firstTableId } = data;
  const brand = hotel.logoColor || '#c0451c';
  const symbol = hotel.settings.currencySymbol;
  const menuLink = firstTableId ? `/r/${hotel.slug}/t/${firstTableId}` : '/login';
  const reserveLink = `/reserve/${hotel.slug}`;

  return (
    <div className="min-h-[100dvh]">
      {/* ── Nav ── */}
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/site" className="flex items-center gap-2.5" title={hotel.name}>
            {/* The hotel's own mark carries its tenant colour; ember stays the
                action colour everywhere else on the page. */}
            <span
              className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-bold text-cream"
              style={{ background: brand }}
            >
              {hotel.logoUrl ? (
                <img src={hotel.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                hotel.name.charAt(0)
              )}
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">{hotel.name}</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-xs font-bold text-ink-soft transition-colors hover:text-ink"
            >
              Staff login
            </Link>
            <Link
              to={menuLink}
              className="rounded-lg bg-ember-500 px-3.5 py-2 text-xs font-bold text-cream transition-colors hover:bg-ember-600"
            >
              Try the demo
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero: type against the real room. No decorative blur. ── */}
      <section className="border-b border-ink/10">
        <div className="mx-auto grid max-w-6xl items-stretch lg:grid-cols-[1.05fr_.95fr]">
          <div className="px-5 py-10 sm:px-8 sm:py-14">
            <span className="flex items-center gap-3 text-[0.66rem] font-bold uppercase tracking-[0.3em] text-ink-muted">
              <span className="h-px w-8 bg-gold-400" />
              The 30-second dining experience
            </span>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,5vw,4.2rem)] font-semibold leading-[0.98] tracking-[-0.025em]">
              Welcome to <em className="italic text-ember-600">{hotel.name}</em>.
            </h1>
            <p className="mt-5 max-w-[46ch] leading-relaxed text-ink-soft">
              {hotel.tagline ??
                hotel.description ??
                'Scan the table, read the menu, order, watch it cook, settle up. All from your phone, without waving at anyone.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link
                to={menuLink}
                className="rounded-lg bg-ember-500 px-5 py-3 text-sm font-bold text-cream transition-colors hover:bg-ember-600"
              >
                Scan a demo table →
              </Link>
              <Link
                to={reserveLink}
                className="rounded-lg border border-ink/12 bg-white px-5 py-3 text-sm font-bold text-ink transition-colors hover:border-ink-soft"
              >
                Make a reservation
              </Link>
            </div>
          </div>
          <div className="relative min-h-[240px] overflow-hidden bg-[#1b130c] lg:min-h-0">
            <img
              src={ROOM_PHOTO}
              alt=""
              aria-hidden
              onError={(e) => (e.currentTarget.style.opacity = '0')}
              className="h-full w-full object-cover [filter:grayscale(0.25)]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cream/50 to-transparent to-40%" />
          </div>
        </div>
      </section>

      {/* ── The visit ── */}
      <section className="border-b border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-8 gap-y-3 px-5 py-6 sm:px-8">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-ink-muted">The visit</span>
          <ol className="flex flex-1 flex-wrap gap-x-6 gap-y-2">
            {VISIT.map((step, i) => (
              <li key={step} className="flex items-baseline gap-1.5 text-sm font-semibold text-ink-soft">
                <span className="font-display text-sm italic text-ember-600">{String(i + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Live index for the active hotel ── */}
      <section className="border-b border-ink/10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 sm:px-3 lg:grid-cols-4">
          {[
            { label: 'Menu items', value: String(menuCount) },
            { label: 'Tables free', value: `${availableTables}/${tableCount}` },
            {
              label: 'Tax · Service',
              value: `${Math.round(hotel.settings.taxRate * 100)}% · ${Math.round(hotel.settings.serviceChargeRate * 100)}%`,
            },
            { label: 'Currency', value: `${hotel.settings.currency} ${symbol}` },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`px-5 py-5 sm:px-6 ${i < 3 ? 'lg:border-r lg:border-ink/10' : ''} ${i % 2 === 0 ? 'border-r border-ink/10 lg:border-r' : ''}`}
            >
              <div className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ink-muted">{s.label}</div>
              <div className="tnum mt-1.5 font-display text-2xl font-semibold leading-none">{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured menu ── */}
      {featured.length > 0 && (
        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
            <div className="mb-6 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[clamp(1.7rem,2.6vw,2.2rem)] font-semibold">
                From the <em className="italic text-ember-600">{hotel.name}</em> menu
              </h2>
              <Link to={menuLink} className="shrink-0 text-xs font-bold text-ember-600 hover:text-ember-700">
                See the full menu →
              </Link>
            </div>
            <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((item) => (
                <div key={item.id} className="grid grid-cols-[5rem_1fr] items-center gap-4 border-b border-ink/10 py-4">
                  <div className="h-20 w-20 overflow-hidden rounded-xl bg-cream-deep">
                    <ImageWithFallback src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-[1.05rem] font-semibold leading-tight">{item.name}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">{item.description}</p>
                    <span className="tnum mt-1.5 block font-display text-lg font-semibold">
                      {formatMoney(item.price, symbol)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── What the room gets. A numbered list, not a card farm. ── */}
      <section className="border-b border-ink/10">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <h2 className="mb-5 font-display text-[clamp(1.7rem,2.6vw,2.2rem)] font-semibold">
            Everything the room needs
          </h2>
          <div className="grid gap-x-14 md:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="grid grid-cols-[2.2rem_1fr] items-baseline gap-4 border-b border-ink/10 py-4">
                <span className="font-display text-2xl font-medium italic leading-none text-ink/15">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1 max-w-[44ch] text-xs leading-relaxed text-ink-muted">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing panel ── */}
      <section className="relative overflow-hidden bg-[#1b130c] text-cream">
        <img
          src={ROOM_PHOTO_2}
          alt=""
          aria-hidden
          onError={(e) => (e.currentTarget.style.opacity = '0')}
          className="absolute inset-0 h-full w-full object-cover opacity-50 [filter:grayscale(0.4)]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, oklch(0.16 0.02 40 / .75), oklch(0.14 0.015 38 / .93))',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <span className="flex items-center gap-3 text-[0.64rem] font-bold uppercase tracking-[0.3em] text-cream/60">
            <span className="h-px w-8 bg-gold-400" />
            Ready when you are
          </span>
          <h2 className="mt-5 max-w-[18ch] font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[1.02] text-cream">
            Scan the table. The rest <em className="italic text-ember-300">takes care of itself.</em>
          </h2>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              to={menuLink}
              className="rounded-lg bg-cream px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-cream-deep"
            >
              Open the menu →
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-cream/30 px-5 py-3 text-sm font-bold text-cream transition-colors hover:border-cream"
            >
              Staff dashboard
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-xs font-semibold text-ink-muted sm:px-8">
        <span>ToDining · Scan · Order · Dine</span>
        <span>
          {hotel.name} · © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
