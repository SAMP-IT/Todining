import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Boxes, Building2, CalendarCheck, FolderTree, IndianRupee, LayoutDashboard, LayoutGrid,
  LogOut, Menu as MenuIcon, MessageCircle, ReceiptText, Star, UtensilsCrossed, Users, X,
} from 'lucide-react';
import { RestaurantSwitcher } from './RestaurantSwitcher';
import { useAuth } from '@/context/AuthContext';
import { useModuleUpdates } from '@/context/ModuleUpdatesContext';
import { ADMIN_NAV, ROLE_CONFIG } from '@/lib/roles';
import { cn } from '@/lib/cn';

const ICONS: Record<string, typeof BarChart3> = {
  BarChart3, ReceiptText, LayoutGrid, UtensilsCrossed, CalendarCheck, Boxes,
  IndianRupee, Star, MessageCircle, Users, Building2, LayoutDashboard, FolderTree,
};

/** The editorial brand lockup. The seal carries it where space is tight. */
function Brandmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink font-display text-[0.8rem] font-semibold text-ink">
        T
      </span>
      <span className={cn('font-display font-semibold tracking-tight', compact ? 'text-base' : 'text-xl')}>
        ToDining
      </span>
    </span>
  );
}

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

function NavGroup({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: typeof ADMIN_NAV;
  onNavigate?: () => void;
}) {
  const { hasUpdate } = useModuleUpdates();
  if (items.length === 0) return null;

  return (
    <>
      <p className="mb-1.5 mt-4 px-1.5 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-ink-muted first:mt-0">
        {label}
      </p>
      <nav className="flex flex-col gap-0.5">
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
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.83rem] font-semibold transition-colors',
                  // Ember is the action colour; "you are here" is ink.
                  isActive ? 'bg-ink text-cream' : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-4 w-4 shrink-0 opacity-85" />
                  <span className="flex-1">{item.label}</span>
                  {/* Unseen-update indicator: a dot on the module whose data
                      changed, hidden on the page you're currently viewing. */}
                  {hasUpdate(item.to) && !isActive && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500" aria-label="New updates" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  // /admin now requires an authenticated manager/owner (RoleGuard, no `open`), so
  // `user` is present here. Fall back to the LEAST-privileged role — never owner —
  // so owner-only nav (Analytics, Restaurants, Feedback) can never leak to a
  // session without an owner role.
  const role = user?.role ?? 'manager';
  const visible = ADMIN_NAV.filter((i) => !i.ownerOnly || role === 'owner');

  return (
    <>
      <NavGroup label="Operations" items={visible.filter((i) => !i.ownerOnly)} onNavigate={onNavigate} />
      <NavGroup label="Owner" items={visible.filter((i) => i.ownerOnly)} onNavigate={onNavigate} />
    </>
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
        className="flex items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white p-2.5 text-xs font-bold text-ink-soft transition-colors hover:border-ember-400 hover:text-ember-600"
      >
        Staff sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-ink/10 bg-white p-2">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-extrabold text-cream"
        style={{ background: user.avatarColor ?? '#c0451c' }}
      >
        {user.name.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[0.8rem] font-bold leading-tight">{user.name}</div>
        <div className="text-[0.66rem] text-ink-muted">{ROLE_CONFIG[user.role].label}</div>
      </div>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-ember-100 hover:text-ember-600"
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
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[15.5rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-ink/10 bg-cream-deep/40 p-3.5 lg:flex lg:flex-col">
        <Link to="/site" className="px-1.5 py-1">
          <Brandmark />
        </Link>
        <div className="mt-3">
          <RestaurantSwitcher />
        </div>
        <div className="mt-1 flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <div className="pt-3">
          <UserChip />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-cream/92 px-4 py-2.5 backdrop-blur lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-md border border-ink/10 bg-white p-1.5 text-ink-soft transition-colors hover:text-ink"
          aria-label="Open menu"
        >
          <MenuIcon className="h-4 w-4" />
        </button>
        <Brandmark compact />
        <span className="w-8" />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-cream p-3.5 shadow-lift animate-[scale-in_0.2s]">
            <div className="flex items-center justify-between">
              <Brandmark compact />
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <RestaurantSwitcher />
            </div>
            <div className="mt-1 flex-1 overflow-y-auto">
              <NavItems onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="pt-3">
              <UserChip />
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
