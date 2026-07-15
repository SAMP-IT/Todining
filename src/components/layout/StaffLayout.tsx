import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { RestaurantSwitcher } from './RestaurantSwitcher';
import { useAuth } from '@/context/AuthContext';
import { ROLE_CONFIG } from '@/lib/roles';

/** Focused full-width shell for operational boards (Kitchen, Waiter). */
export function StaffLayout({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-ink/10 bg-cream/92 px-4 py-3 backdrop-blur sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link to="/site" className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink font-display text-sm font-semibold text-ink">
              T
            </span>
            {/* The wordmark costs ~85px the phone header cannot afford; the seal carries it. */}
            <span className="hidden font-display text-xl font-semibold leading-none tracking-tight sm:inline">
              ToDining
            </span>
          </Link>
          <span className="shrink-0 rounded-md border border-ember-200 bg-ember-100 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ember-700">
            {title}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RestaurantSwitcher />
          {user && (
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-2 rounded-lg border border-ink/12 bg-white px-3 py-2 text-xs font-bold text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
            >
              <span className="hidden sm:inline">{ROLE_CONFIG[user.role].label}</span>
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
