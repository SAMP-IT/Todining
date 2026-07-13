import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';
import { Wordmark } from '@/components/layout/Brand';
import { useAdminAuth } from '@/context/AdminAuthContext';

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
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-5 py-10">
      <div className="absolute -top-16 right-0 -z-10 h-80 w-80 rounded-full bg-ember-200/40 blur-3xl" />
      <div className="absolute bottom-0 -left-16 -z-10 h-72 w-72 rounded-full bg-sage-100/50 blur-3xl" />

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Wordmark />
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink-soft">
            <ShieldCheck className="h-3.5 w-3.5 text-ember-500" /> Admin Panel
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Secure sign in</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Enter your admin credentials to access the panel.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-3xl border border-ink/8 bg-white p-6 shadow-soft"
        >
          <Input
            label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError('');
            }}
            placeholder="Username"
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
            placeholder="Password"
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

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner className="h-4 w-4" /> Signing in…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Sign in
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">
          <Link to="/site" className="font-semibold text-ember-600 hover:underline">
            Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
