import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { canAccess } from '@/lib/roles';

/**
 * Gate a route by authentication and (optionally) role-based path access.
 * Unauthenticated → /login; authenticated-but-unauthorized → their own home.
 */
export function RoleGuard({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  if (!canAccess(user.role, location.pathname)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
