import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Wordmark } from './Brand';
import { RestaurantSwitcher } from './RestaurantSwitcher';
import { Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ROLE_CONFIG } from '@/lib/roles';

/** Focused full-width shell for operational boards (Kitchen, Waiter). */
export function StaffLayout({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink/8 bg-cream/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Wordmark />
          </Link>
          <Badge tone="ember">{title}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <RestaurantSwitcher />
          {user && (
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-cream-deep"
            >
              <span className="hidden sm:inline">{ROLE_CONFIG[user.role].label}</span>
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
