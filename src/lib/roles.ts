import type { Role } from '@/types';

export interface RoleConfig {
  label: string;
  /** Landing route after login. */
  home: string;
  /** Route prefixes this role may access (besides public). */
  allows: string[];
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  owner: {
    label: 'Owner',
    home: '/admin/analytics',
    allows: ['/admin', '/kitchen', '/waiter'],
  },
  manager: {
    label: 'Manager',
    home: '/admin/orders',
    allows: ['/admin', '/kitchen', '/waiter'],
  },
  waiter: {
    label: 'Waiter',
    home: '/waiter',
    allows: ['/waiter'],
  },
  kitchen: {
    label: 'Kitchen',
    home: '/kitchen',
    allows: ['/kitchen'],
  },
};

/** Admin nav items gated by role (owner sees everything incl. revenue/analytics). */
export const ADMIN_NAV: { to: string; label: string; icon: string; ownerOnly?: boolean; end?: boolean }[] = [
  { to: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/admin/analytics', label: 'Analytics', icon: 'BarChart3', ownerOnly: true },
  { to: '/admin/orders', label: 'Orders', icon: 'ReceiptText' },
  { to: '/admin/tables', label: 'Tables & QR', icon: 'LayoutGrid' },
  { to: '/admin/menu', label: 'Menu', icon: 'UtensilsCrossed' },
  { to: '/admin/categories', label: 'Categories', icon: 'FolderTree' },
  { to: '/admin/reservations', label: 'Reservations', icon: 'CalendarCheck' },
  { to: '/admin/inventory', label: 'Inventory', icon: 'Boxes' },
  { to: '/admin/billing', label: 'Billing', icon: 'IndianRupee' },
  { to: '/admin/feedback', label: 'Feedback', icon: 'Star' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'MessageCircle' },
  { to: '/admin/staff', label: 'Staff', icon: 'Users' },
  { to: '/admin/restaurants', label: 'Restaurants', icon: 'Building2', ownerOnly: true },
];

export function canAccess(role: Role, pathname: string): boolean {
  return ROLE_CONFIG[role].allows.some((prefix) => pathname.startsWith(prefix));
}
