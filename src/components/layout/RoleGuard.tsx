import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { canAccess } from '@/lib/roles';

/**
 * Gate a route by authentication and (optionally) role-based path access.
 * Unauthenticated → /login; authenticated-but-unauthorized → their own home.
 *
 * `open` makes the route publicly reachable: an unauthenticated visitor is let
 * through instead of being bounced to /login (the Admin Panel uses this so it
 * opens directly from its URL). A user who IS logged in but lacks the required
 * role is still redirected home.
 */
export function RoleGuard({
  children,
  roles,
  open = false,
}: {
  children: React.ReactNode;
  roles?: Role[];
  open?: boolean;
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    if (open) return <>{children}</>;
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/site" replace />;
  }
  if (!canAccess(user.role, location.pathname)) {
    return <Navigate to="/site" replace />;
  }
  return <>{children}</>;
}
