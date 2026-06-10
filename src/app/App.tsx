import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router';
import { TenantProvider } from '@/context/TenantContext';
import { AuthProvider } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';

function RouteLoader() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

export function App() {
  return (
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
  );
}
