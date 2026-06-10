import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Bell, CalendarCheck, ChefHat, QrCode, ScanLine, Sparkles, Star, Utensils,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Wordmark } from '@/components/layout/Brand';
import { restaurantService } from '@/data/services';

const FEATURES = [
  { icon: QrCode, title: 'QR table ordering', desc: 'Scan, browse, order. No app, no login, under 30 seconds.' },
  { icon: ChefHat, title: 'Live kitchen board', desc: 'Orders hit the kitchen instantly and sync across every screen.' },
  { icon: CalendarCheck, title: 'Smart reservations', desc: 'Take bookings online with one-tap confirm & WhatsApp alerts.' },
  { icon: Bell, title: 'Waiter call system', desc: 'Guests request water, the bill or help — staff see it live.' },
  { icon: Sparkles, title: 'AI upselling', desc: 'Gentle add-on suggestions that lift every order value.' },
  { icon: BarChart3, title: 'Owner analytics', desc: 'Revenue, peak hours, top dishes and ratings at a glance.' },
];

export function LandingPage() {
  const demo = restaurantService.getBySlug('spice-garden');
  const demoTable = demo ? `/r/${demo.slug}/t/tbl_rest_spice_1` : '/login';

  return (
    <div className="min-h-[100dvh]">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Staff login</Button>
          </Link>
          <Link to={demoTable}>
            <Button size="sm">Try demo</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-16">
        <div className="absolute -top-10 right-0 -z-10 h-72 w-72 rounded-full bg-ember-200/40 blur-3xl" />
        <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink-soft">
          <ScanLine className="h-3.5 w-3.5 text-ember-500" /> The 30-second dining experience
        </span>
        <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Run your whole restaurant from <span className="text-ember-500">one simple</span> platform.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          SmartDine turns a QR code into a full ordering, kitchen, reservation, billing and
          analytics system — clean enough that guests of all ages just get it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={demoTable}>
            <Button size="lg" className="gap-2">
              Scan a demo table <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={demo ? `/reserve/${demo.slug}` : '/login'}>
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
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(30rem 30rem at 80% 120%, rgba(217,82,31,0.6), transparent 60%)' }} />
          <div className="relative flex items-center gap-2 text-gold-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <h2 className="relative mt-4 max-w-2xl font-display text-3xl font-semibold text-cream sm:text-4xl">
            Built for cafes, food courts and restaurant chains alike.
          </h2>
          <p className="relative mt-3 max-w-xl text-cream/70">
            Multi-restaurant ready with isolated menus, orders and staff. Explore the live demo from a guest's phone or a staff dashboard.
          </p>
          <div className="relative mt-7 flex flex-wrap gap-3">
            <Link to={demoTable}>
              <Button size="lg" className="gap-2">
                <Utensils className="h-4 w-4" /> Open the demo menu
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
        <p className="mt-3">Scan · Order · Dine — © {new Date().getFullYear()} SmartDine</p>
      </footer>
    </div>
  );
}
