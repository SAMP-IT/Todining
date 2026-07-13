import type { ReactNode } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { AdminPanelLogin } from '@/pages/AdminPanelLogin';

/**
 * Protects every /admin-panel route. Until the operator has signed in with the
 * Supabase-stored admin credential, the login form is shown in place of the
 * panel — so the Admin Panel can never be reached directly by URL. Once
 * authenticated the wrapped panel renders, and the session persists (12h) until
 * an explicit log out or expiry.
 */
export function AdminPanelGuard({ children }: { children: ReactNode }) {
  const { authenticated } = useAdminAuth();
  if (!authenticated) return <AdminPanelLogin />;
  return <>{children}</>;
}
