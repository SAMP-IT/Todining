import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';
import { useAdminAuth } from '@/context/AdminAuthContext';

/** A dim, empty dining room. The gate looks onto the estate it protects. */
const ROOM_PHOTO = 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=900&q=70&auto=format&fit=crop';

// A monogram "seal" — the editorial brand lockup, matching the staff LoginPage so
// the two gates read as siblings.
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

/**
 * Login gate for the Admin Panel. Shown by AdminPanelGuard whenever the operator
 * is not authenticated. Validates the entered username/password against the
 * credential stored in Supabase (via AdminAuthContext → adminAuthService).
 */
export function AdminPanelLogin() {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const ok = await login(username, password);
      if (!ok) {
        setError('Invalid username or password');
      }
      // On success AdminPanelGuard re-renders and mounts the Admin Panel.
    } catch {
      setError('Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* ---------- Room panel ---------- */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#1b130c] p-8 text-cream lg:flex xl:p-14">
        {/* The photo is decorative: if it fails to load the veil alone still
            carries the panel, so the caption never lands on a broken image. */}
        <img
          src={ROOM_PHOTO}
          alt=""
          aria-hidden
          onError={(e) => (e.currentTarget.style.opacity = '0')}
          className="absolute inset-0 h-full w-full object-cover [filter:grayscale(0.35)_contrast(1.02)]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, oklch(0.18 0.02 40 / .58), oklch(0.15 0.016 38 / .84) 60%, oklch(0.13 0.014 36 / .96)), radial-gradient(90% 60% at 85% 8%, oklch(0.55 0.185 37 / .28), transparent 60%)',
          }}
        />
        <div className="pointer-events-none absolute inset-4 rounded-2xl border border-cream/15" />

        <div className="relative z-10 flex items-center gap-3">
          <Seal className="h-9 w-9 border-cream text-lg" />
          <span className="font-display text-2xl font-semibold tracking-tight">ToDining</span>
        </div>

        <div className="relative z-10 max-w-[18ch]">
          <span className="flex items-center gap-3 text-[0.62rem] font-bold uppercase tracking-[0.28em] text-cream/70">
            <span className="h-px w-8 bg-gold-400" />
            ToDining · Admin Panel
          </span>
          <h1 className="mt-5 font-display text-[clamp(2.6rem,4.4vw,4rem)] font-semibold leading-[1] tracking-[-0.02em] text-cream">
            The whole estate, <em className="italic text-ember-300">one key.</em>
          </h1>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/50">
            Restricted access
          </span>
          <span className="font-display text-xl italic text-cream/30">Est. 2019</span>
        </div>
      </aside>

      {/* ---------- Sign-in form ---------- */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Seal className="h-8 w-8 border-ink text-base text-ink" />
            <span className="font-display text-xl font-semibold tracking-tight">ToDining</span>
          </div>

          <span className="text-[0.66rem] font-bold uppercase tracking-[0.28em] text-ember-600">Restricted</span>
          <h2 className="mt-2 font-display text-[2.4rem] font-semibold leading-none tracking-tight">
            Admin Panel
          </h2>
          <p className="mt-2.5 text-sm text-ink-muted">Sign in to manage every workspace.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              placeholder="your-admin-username"
              autoComplete="username"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
              >
                {error}
              </p>
            )}

            <Button type="submit" fullWidth size="lg" disabled={submitting} className="group mt-1">
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" /> Signing in…
                </>
              ) : (
                <>
                  Unlock the panel
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 border-t border-ink/10 pt-5 text-center text-xs text-ink-muted">
            Sessions expire automatically. Staff sign in is separate.
          </p>
          <p className="mt-3 text-center text-xs text-ink-muted">
            <Link to="/site" className="font-bold text-ember-600 hover:underline">
              Back to website
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
