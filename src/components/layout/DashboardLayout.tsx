import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Boxes, Building2, CalendarCheck, FolderTree, IndianRupee, LayoutDashboard, LayoutGrid,
  LogOut, Menu as MenuIcon, MessageCircle, ReceiptText, Star, UtensilsCrossed, Users, X,
} from 'lucide-react';
import { Wordmark } from './Brand';
import { RestaurantSwitcher } from './RestaurantSwitcher';
import { useAuth } from '@/context/AuthContext';
import { useModuleUpdates } from '@/context/ModuleUpdatesContext';
import { ADMIN_NAV, ROLE_CONFIG } from '@/lib/roles';
import { cn } from '@/lib/cn';

const ICONS: Record<string, typeof BarChart3> = {
  BarChart3, ReceiptText, LayoutGrid, UtensilsCrossed, CalendarCheck, Boxes,
  IndianRupee, Star, MessageCircle, Users, Building2, LayoutDashboard, FolderTree,
};

/** Resolve the current pathname to the sidebar module (route) it belongs to. */
function currentModuleKey(pathname: string): string | null {
  // Longest route first so '/admin/orders' wins over '/admin'.
  const items = [...ADMIN_NAV].sort((a, b) => b.to.length - a.to.length);
  for (const it of items) {
    const match = it.end ? pathname === it.to : pathname === it.to || pathname.startsWith(`${it.to}/`);
    if (match) return it.to;
  }
  return null;
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { hasUpdate } = useModuleUpdates();
  // /admin now requires an authenticated manager/owner (RoleGuard, no `open`), so
  // `user` is present here. Fall back to the LEAST-privileged role — never owner —
  // so owner-only nav (Analytics, Restaurants, Feedback) can never leak to a
  // session without an owner role.
  const role = user?.role ?? 'manager';
  const items = ADMIN_NAV.filter((i) => !i.ownerOnly || role === 'owner');
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-ember-500 text-white shadow-soft' : 'text-ink-soft hover:bg-ink/5',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{item.label}</span>
                {/* Unseen-update indicator: a green dot on the module whose data
                    changed, hidden on the page you're currently viewing. */}
                {hasUpdate(item.to) && !isActive && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    aria-label="New updates"
                  />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function UserChip() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // No session (Admin Panel opened without login): offer a sign-in affordance so
  // staff can still authenticate from inside the panel.
  if (!user) {
    return (
      <Link
        to="/login"
        className="flex items-center justify-center gap-2 rounded-xl border border-ink/8 bg-white p-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/5"
      >
        Staff sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink/8 bg-white p-2.5">
      <span
        className="grid h-9 w-9 place-items-center rounded-lg text-sm font-bold text-white"
        style={{ background: user.avatarColor ?? '#d9521f' }}
      >
        {user.name.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{user.name}</div>
        <div className="text-xs text-ink-muted">{ROLE_CONFIG[user.role].label}</div>
      </div>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="rounded-lg p-2 text-ink-muted hover:bg-ink/5 hover:text-red-500"
        aria-label="Log out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const { hasUpdate, markViewed } = useModuleUpdates();

  // Visiting a module marks it viewed (clears its dot). This also fires when an
  // update lands while you're already on that page, so live viewing counts as
  // seen — a fresh update after you leave will light the dot again.
  const current = currentModuleKey(pathname);
  const currentHasUpdate = current ? hasUpdate(current) : false;
  useEffect(() => {
    if (current && currentHasUpdate) markViewed(current);
  }, [current, currentHasUpdate, markViewed]);

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-ink/8 bg-cream/60 p-4 lg:flex lg:flex-col">
        <Link to="/site" className="px-2 py-2">
          <Wordmark />
        </Link>
        <div className="mt-4 px-1">
          <RestaurantSwitcher />
        </div>
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <UserChip />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/8 bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setDrawerOpen(true)} className="rounded-lg p-2 hover:bg-ink/5" aria-label="Open menu">
          <MenuIcon className="h-5 w-5" />
        </button>
        <Wordmark />
        <div className="w-9" />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-cream p-4 shadow-lift animate-[scale-in_0.2s]">
            <div className="flex items-center justify-between">
              <Wordmark />
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 hover:bg-ink/5" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <RestaurantSwitcher />
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <NavItems onNavigate={() => setDrawerOpen(false)} />
            </div>
            <UserChip />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
