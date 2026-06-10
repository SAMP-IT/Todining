import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3, Boxes, Building2, CalendarCheck, IndianRupee, LayoutGrid, LogOut, Menu as MenuIcon,
  MessageCircle, ReceiptText, Star, UtensilsCrossed, Users, X,
} from 'lucide-react';
import { Wordmark } from './Brand';
import { RestaurantSwitcher } from './RestaurantSwitcher';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_NAV, ROLE_CONFIG } from '@/lib/roles';
import { cn } from '@/lib/cn';

const ICONS: Record<string, typeof BarChart3> = {
  BarChart3, ReceiptText, LayoutGrid, UtensilsCrossed, CalendarCheck, Boxes,
  IndianRupee, Star, MessageCircle, Users, Building2,
};

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const items = ADMIN_NAV.filter((i) => !i.ownerOnly || user?.role === 'owner');
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-ember-500 text-white shadow-soft' : 'text-ink-soft hover:bg-ink/5',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function UserChip() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
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

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-ink/8 bg-cream/60 p-4 lg:flex lg:flex-col">
        <Link to="/" className="px-2 py-2">
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
