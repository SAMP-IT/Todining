import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChefHat, ConciergeBell, Crown, ShieldCheck } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { Wordmark } from '@/components/layout/Brand';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { ROLE_CONFIG } from '@/lib/roles';
import type { Role } from '@/types';
import { staffService } from '@/data/services';

const DEMO: { role: Role; email: string; icon: typeof Crown }[] = [
  { role: 'owner', email: 'owner@spice.test', icon: Crown },
  { role: 'manager', email: 'manager@spice.test', icon: ShieldCheck },
  { role: 'waiter', email: 'waiter@spice.test', icon: ConciergeBell },
  { role: 'kitchen', email: 'kitchen@spice.test', icon: ChefHat },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const { setRestaurantById } = useTenant();
  const navigate = useNavigate();

  function signIn(value: string) {
    const user = login(value);
    if (!user) {
      toast.error('No staff account found for that email.');
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
              signIn(email);
            }}
          >
            <Input
              label="Work email"
              type="email"
              placeholder="you@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Button type="submit" fullWidth size="lg">
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-ink-muted">
            <span className="h-px flex-1 bg-ink/10" /> Quick demo login <span className="h-px flex-1 bg-ink/10" />
          </div>

          <Card className="grid grid-cols-2 gap-2 p-2">
            {DEMO.map(({ role, email: e, icon: Icon }) => (
              <button
                key={role}
                onClick={() => signIn(e)}
                className="flex flex-col items-start gap-1 rounded-xl p-3 text-left hover:bg-cream-deep"
              >
                <Icon className="h-5 w-5 text-ember-500" />
                <span className="text-sm font-semibold">{ROLE_CONFIG[role].label}</span>
                <span className="text-xs text-ink-muted">{staffService.findByEmail(e)?.name}</span>
              </button>
            ))}
          </Card>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Are you a guest?{' '}
            <Link to="/" className="font-semibold text-ember-600 hover:underline">
              Scan a table to order
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
