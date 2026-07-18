import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { AdminPanelEntry } from '@/pages/AdminPanelEntry';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { AdminPanelGuard } from '@/components/layout/AdminPanelGuard';

// Code-splitting: heavy/route-specific screens load on demand via route.lazy, so
// the customer ordering path never ships recharts/jsPDF/admin code. Landing +
// Login stay eager for instant first paint.
export const router = createBrowserRouter([
  // ── Default entry point: the public marketing website ───────────────────────
  // Opening the app lands on the multi-page product site (Home, Features + the
  // three product pages, Pricing, Book a demo). MarketingLayout renders the shared
  // nav/footer/grain once; each page renders only its own <main> through the
  // Outlet. Pages are lazy so the marketing bundle never ships app/admin code.
  //
  // The app itself is untouched and lives at /login (staff sign-in), the QR flow,
  // /admin, /kitchen, /waiter, /admin-panel. The original single-page LandingPage
  // is preserved at /site (and /landing).
  {
    path: '/',
    lazy: () => import('@/pages/site/MarketingLayout').then((m) => ({ Component: m.MarketingLayout })),
    children: [
      { index: true, lazy: () => import('@/pages/site/HomePage').then((m) => ({ Component: m.HomePage })) },
      { path: 'features', lazy: () => import('@/pages/site/FeaturesPage').then((m) => ({ Component: m.FeaturesPage })) },
      { path: 'features/guest', lazy: () => import('@/pages/site/GuestPage').then((m) => ({ Component: m.GuestPage })) },
      { path: 'features/kitchen', lazy: () => import('@/pages/site/KitchenFeaturePage').then((m) => ({ Component: m.KitchenFeaturePage })) },
      { path: 'features/office', lazy: () => import('@/pages/site/OfficePage').then((m) => ({ Component: m.OfficePage })) },
      { path: 'pricing', lazy: () => import('@/pages/site/PricingPage').then((m) => ({ Component: m.PricingPage })) },
      { path: 'demo', lazy: () => import('@/pages/site/DemoPage').then((m) => ({ Component: m.DemoPage })) },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/site', element: <LandingPage /> },
  { path: '/landing', element: <LandingPage /> },

  // Private entry point for the Admin Panel — a card-based landing page. Not
  // linked from the public website; reachable only via the explicit /admin-panel
  // URL. Guarded: an AdminPanelGuard shows a login form (credentials validated
  // against Supabase) before the panel renders, so /admin-panel cannot be reached
  // directly without signing in. Clicking a card navigates to /admin, which
  // renders the full dashboard (RoleGuard + all admin routes unchanged).
  {
    path: '/admin-panel',
    element: (
      <AdminPanelGuard>
        <AdminPanelEntry />
      </AdminPanelGuard>
    ),
  },

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

  // Admin — requires an authenticated manager/owner. (Previously `open`, which let
  // ANY anonymous visitor reach the full management console; that bypass is closed.
  // The /admin-panel platform admin reaches a hotel's console by signing in as its
  // owner/manager — a proper elevated hand-off is part of the auth migration.)
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
