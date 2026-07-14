import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, ChefHat, ConciergeBell, ShieldCheck } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { ROLE_CONFIG } from '@/lib/roles';
import type { Role, Staff } from '@/types';
import { staffService } from '@/data/services';

// Quick-access team roles. Owner is intentionally NOT here — owners sign in with
// their hotel-isolated username + password via the form above. Manager / Waiter /
// Kitchen are password-less for now, so tapping a card opens that board directly.
// (Per-role authentication for these three arrives in a later update.)
const ROLES: { role: Role; icon: typeof ShieldCheck }[] = [
  { role: 'manager', icon: ShieldCheck },
  { role: 'waiter', icon: ConciergeBell },
  { role: 'kitchen', icon: ChefHat },
];

// A monogram "seal" — the editorial brand lockup used on both panels.
function Seal({ className = '' }: { className?: string }) {
  return (
    <span
      className={
        'grid place-items-center rounded-full border font-display font-semibold ' + className
      }
    >
      T
    </span>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { setRestaurantById, restaurantId } = useTenant();
  const navigate = useNavigate();

  // Live team for the active restaurant. Each role card binds to the matching
  // staff member, and re-reads on every `data:changed` event — so adding,
  // renaming, re-roling or removing staff in the Admin Panel updates these
  // cards automatically, no reload.
  const staff = useLiveQuery<Staff[]>(
    () => (restaurantId ? staffService.list(restaurantId) : []),
    { types: ['data:changed'] },
  );
  const memberFor = (role: Role) => staff.find((s) => s.role === role);

  function signIn(value: string, pwd?: string) {
    // Resolve the login within the workspace the user picked, so an owner email
    // shared across hotels signs into the SELECTED hotel — not an arbitrary one.
    const user = login(value, pwd, restaurantId);
    if (!user) {
      toast.error('Invalid login. Check your email/username and password.');
      return;
    }
    setRestaurantById(user.restaurantId);
    toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    navigate(ROLE_CONFIG[user.role].home);
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Brand panel ---------- */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#1b130c] p-8 text-cream lg:flex xl:p-14">
        {/* dim restaurant atmosphere */}
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1100&q=70&auto=format&fit=crop"
          alt=""
          aria-hidden
          onError={(e) => (e.currentTarget.style.opacity = '0')}
          className="absolute inset-0 h-full w-full object-cover [filter:grayscale(0.35)_contrast(1.02)]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, oklch(0.18 0.02 40 / .62), oklch(0.15 0.016 38 / .86) 62%, oklch(0.13 0.014 36 / .95)), radial-gradient(90% 60% at 85% 8%, oklch(0.55 0.185 37 / .32), transparent 60%)',
          }}
        />
        <div className="pointer-events-none absolute inset-4 rounded-2xl border border-cream/15" />

        <div className="relative z-10 flex items-center gap-3">
          <Seal className="h-9 w-9 border-cream text-lg" />
          <span className="font-display text-2xl font-semibold tracking-tight">ToDining</span>
        </div>

        <div className="relative z-10 max-w-[20ch]">
          <span className="flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.3em] text-cream/70">
            <span className="h-px w-8 bg-gold-400" />
            For the people who run the room
          </span>
          <h1 className="mt-5 font-display text-[clamp(3rem,5vw,4.7rem)] font-semibold leading-[0.98] tracking-[-0.02em] text-cream">
            Every table, every plate, in one <em className="italic text-ember-300">calm</em> place.
          </h1>
          <div className="mt-9 flex flex-wrap gap-x-4 gap-y-2 border-t border-cream/15 pt-6">
            {['QR ordering', 'Kitchen & waiter boards', 'Reservations', 'Billing', 'Inventory', 'Analytics'].map(
              (f) => (
                <span
                  key={f}
                  className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-cream/60 before:mr-4 before:text-gold-400 before:content-['·'] first:before:hidden first:before:mr-0"
                >
                  {f}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/50">Scan · Order · Dine</span>
          <span className="font-display text-xl italic text-cream/30">Est. 2019</span>
        </div>
      </aside>

      {/* ---------- Login form ---------- */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Seal className="h-8 w-8 border-ink text-base text-ink" />
            <span className="font-display text-xl font-semibold tracking-tight">ToDining</span>
          </div>

          <span className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-ember-600">Welcome back</span>
          <h2 className="mt-2 text-[2.4rem] font-semibold leading-none tracking-tight">Staff sign in</h2>
          <p className="mt-2 text-sm text-ink-muted">Sign in to reach your board and today's service.</p>

          <form
            className="mt-7 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email, password || undefined);
            }}
          >
            <Input
              label="Email or username"
              type="text"
              placeholder="you@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" fullWidth size="lg" className="group mt-1">
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink/10" />
            <span className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-ink-muted">
              Or continue as a team member
            </span>
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {ROLES.map(({ role, icon: Icon }) => {
              const member = memberFor(role);
              return (
                <button
                  key={role}
                  type="button"
                  disabled={!member}
                  onClick={() => member && signIn(member.email)}
                  className="group flex flex-col items-start gap-2.5 rounded-2xl border border-ink/10 bg-white p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-ember-400 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-ink/10 disabled:hover:shadow-none"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-ember-100 text-ember-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-display text-lg font-semibold leading-none">{ROLE_CONFIG[role].label}</span>
                  {/* Do NOT render staff email here — this page is pre-auth/public,
                      and exposing staff contact details invites targeted attacks. */}
                  {member ? (
                    <span className="w-full truncate text-xs font-semibold text-ink-muted">{member.name}</span>
                  ) : (
                    <span className="text-xs text-ink-muted">Not added yet</span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Are you a guest?{' '}
            <Link to="/site" className="font-bold text-ember-600 hover:underline">
              Scan a table to order
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
