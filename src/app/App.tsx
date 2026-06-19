import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router';
import { TenantProvider } from '@/context/TenantContext';
import { AuthProvider } from '@/context/AuthContext';
import { Button, Spinner } from '@/components/ui';
import { bootstrapStore } from '@/data/mock/store';

function RouteLoader() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

/** Gates the app on the initial data hydration (Supabase or local fallback).
 *  The Auth/Tenant providers read the store synchronously on mount, so the
 *  cache must be populated before they render. */
function DataGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    bootstrapStore()
      .then(() => active && setStatus('ready'))
      .catch((err: unknown) => {
        if (!active) return;
        setMessage(err instanceof Error ? err.message : 'Failed to load data.');
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="grid min-h-[100dvh] place-items-center gap-3 text-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-7 w-7" />
          <p className="text-sm text-ink-muted">Loading ToDining…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6">
        <div className="max-w-sm space-y-3 text-center">
          <h1 className="font-display text-2xl font-semibold">Couldn't connect</h1>
          <p className="text-sm text-ink-muted">{message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  return (
    <DataGate>
      <AuthProvider>
        <TenantProvider>
          <RouterProvider router={router} fallbackElement={<RouteLoader />} />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: '0.875rem',
                border: '1px solid rgba(28,23,20,0.08)',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              },
            }}
          />
        </TenantProvider>
      </AuthProvider>
    </DataGate>
  );
}
