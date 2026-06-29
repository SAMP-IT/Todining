import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChefHat, ConciergeBell, Crown, ShieldCheck } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { Wordmark } from '@/components/layout/Brand';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { ROLE_CONFIG } from '@/lib/roles';
import type { Role, Staff } from '@/types';
import { staffService } from '@/data/services';

// The four primary roles, in display order — restores the original fixed-card UI.
const ROLES: { role: Role; icon: typeof Crown }[] = [
  { role: 'owner', icon: Crown },
  { role: 'manager', icon: ShieldCheck },
  { role: 'waiter', icon: ConciergeBell },
  { role: 'kitchen', icon: ChefHat },
];

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
    const user = login(value, pwd);
    if (!user) {
      toast.error('Invalid login — check your email/username and password.');
      return;
    }
    setRestaurantById(user.restaurantId);
    toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    navigate(ROLE_CONFIG[user.role].home);
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-cream lg:flex">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(40rem 40rem at 20% 0%, rgba(217,82,31,0.5), transparent 60%)' }} />
        <Wordmark className="relative [&_span]:text-cream" />
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight text-cream">
            The restaurant operating system your team will actually enjoy.
          </h1>
          <p className="mt-4 text-cream/70">
            QR ordering, kitchen & waiter boards, reservations, billing, inventory and analytics — in one clean platform.
          </p>
        </div>
        <p className="relative text-sm text-cream/50">Scan · Order · Dine</p>
      </div>

      {/* Login form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>
          <h2 className="text-2xl font-semibold">Staff sign in</h2>
          <p className="mt-1 text-sm text-ink-muted">Sign in to access your dashboard.</p>

          <form
            className="mt-6 space-y-4"
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
            <Button type="submit" fullWidth size="lg">
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-ink-muted">
            <span className="h-px flex-1 bg-ink/10" /> Sign in as a team member <span className="h-px flex-1 bg-ink/10" />
          </div>

          <Card className="grid grid-cols-2 gap-2 p-2">
            {ROLES.map(({ role, icon: Icon }) => {
              const member = memberFor(role);
              return (
                <button
                  key={role}
                  type="button"
                  disabled={!member}
                  onClick={() => member && signIn(member.email)}
                  className="flex flex-col items-start gap-1 rounded-xl p-3 text-left hover:bg-cream-deep disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                >
                  <Icon className="h-5 w-5 text-ember-500" />
                  <span className="text-sm font-semibold">{ROLE_CONFIG[role].label}</span>
                  {member ? (
                    <>
                      <span className="w-full truncate text-xs font-medium text-ink">{member.name}</span>
                      <span className="w-full truncate text-[11px] text-ink-muted">{member.email}</span>
                    </>
                  ) : (
                    <span className="text-xs text-ink-muted">Not added yet</span>
                  )}
                </button>
              );
            })}
          </Card>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Are you a guest?{' '}
            <Link to="/site" className="font-semibold text-ember-600 hover:underline">
              Scan a table to order
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
