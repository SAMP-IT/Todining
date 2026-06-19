import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { RoleGuard } from '@/components/layout/RoleGuard';

// Code-splitting: heavy/route-specific screens load on demand via route.lazy, so
// the customer ordering path never ships recharts/jsPDF/admin code. Landing +
// Login stay eager for instant first paint.
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },

  // Public entry point for the Admin Panel. RoleGuard on /admin redirects
  // unauthenticated/non-admin users appropriately.
  { path: '/admin-panel', element: <Navigate to="/admin" replace /> },

  // Customer (QR) — no auth.
  {
    path: '/r/:slug/t/:tableId',
    lazy: () => import('@/features/customer/CustomerLayout').then((m) => ({ Component: m.CustomerLayout })),
    children: [
      { index: true, lazy: () => import('@/pages/customer/MenuPage').then((m) => ({ Component: m.MenuPage })) },
      { path: 'cart', lazy: () => import('@/pages/customer/CartPage').then((m) => ({ Component: m.CartPage })) },
      { path: 'order/:orderId', lazy: () => import('@/pages/customer/TrackPage').then((m) => ({ Component: m.TrackPage })) },
    ],
  },
  { path: '/reserve/:slug', lazy: () => import('@/pages/customer/ReservePage').then((m) => ({ Component: m.ReservePage })) },

  // Kitchen board
  {
    path: '/kitchen',
    element: (
      <RoleGuard roles={['kitchen', 'manager', 'owner']}>
        <StaffLayout title="Kitchen" />
      </RoleGuard>
    ),
    children: [{ index: true, lazy: () => import('@/pages/staff/KitchenPage').then((m) => ({ Component: m.KitchenPage })) }],
  },

  // Waiter board
  {
    path: '/waiter',
    element: (
      <RoleGuard roles={['waiter', 'manager', 'owner']}>
        <StaffLayout title="Waiter" />
      </RoleGuard>
    ),
    children: [{ index: true, lazy: () => import('@/pages/staff/WaiterPage').then((m) => ({ Component: m.WaiterPage })) }],
  },

  // Admin
  {
    path: '/admin',
    element: (
      <RoleGuard roles={['manager', 'owner']}>
        <DashboardLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, lazy: () => import('@/pages/admin/DashboardPage').then((m) => ({ Component: m.DashboardPage })) },
      { path: 'analytics', lazy: () => import('@/pages/admin/AnalyticsPage').then((m) => ({ Component: m.AnalyticsPage })) },
      { path: 'categories', lazy: () => import('@/pages/admin/CategoriesPage').then((m) => ({ Component: m.CategoriesPage })) },
      { path: 'orders', lazy: () => import('@/pages/admin/OrdersPage').then((m) => ({ Component: m.OrdersPage })) },
      { path: 'tables', lazy: () => import('@/pages/admin/TablesPage').then((m) => ({ Component: m.TablesPage })) },
      { path: 'menu', lazy: () => import('@/pages/admin/MenuManagePage').then((m) => ({ Component: m.MenuManagePage })) },
      { path: 'reservations', lazy: () => import('@/pages/admin/ReservationsPage').then((m) => ({ Component: m.ReservationsPage })) },
      { path: 'inventory', lazy: () => import('@/pages/admin/InventoryPage').then((m) => ({ Component: m.InventoryPage })) },
      { path: 'billing', lazy: () => import('@/pages/admin/BillingPage').then((m) => ({ Component: m.BillingPage })) },
      { path: 'feedback', lazy: () => import('@/pages/admin/FeedbackPage').then((m) => ({ Component: m.FeedbackPage })) },
      { path: 'notifications', lazy: () => import('@/pages/admin/NotificationsPage').then((m) => ({ Component: m.NotificationsPage })) },
      { path: 'staff', lazy: () => import('@/pages/admin/StaffPage').then((m) => ({ Component: m.StaffPage })) },
      { path: 'restaurants', lazy: () => import('@/pages/admin/RestaurantsPage').then((m) => ({ Component: m.RestaurantsPage })) },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
