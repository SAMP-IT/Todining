# ToDining — Implementation Plan

> Smart Restaurant Management SaaS Platform. Built from `Smart Restaurant Management SaaS Platform.doc`.
> Stack: **React 18 + TypeScript + Vite + Tailwind CSS**. Mobile-first, multi-tenant SaaS.

## 0. Decisions (locked)
- **Data layer:** Frontend-first against a typed service abstraction backed by an in-memory store + realtime event bus. Full Supabase SQL schema (tables + RLS multi-tenant policies) is delivered so going live = config change, not rewrite.
- **Integrations:** AI Upselling = rule-based engine; WhatsApp = notification service that previews/logs the exact message. Both behind interfaces ready for OpenAI / Meta WhatsApp / Twilio.
- **Brand:** "ToDining". Modern SaaS aesthetic, clean, minimal-clicks, mobile-first.

## 1. Architecture
- **Routing:** `react-router-dom` v6 with role-guarded routes.
- **State:** Zustand for global stores (cart, realtime, notifications); React Context for Tenant + Auth.
- **Forms/validation:** `react-hook-form` + `zod`.
- **Realtime:** in-app pub/sub event bus (`data/realtime`) simulating Supabase Realtime — an order placed on a phone appears instantly on Kitchen + Waiter + Admin screens.
- **Multi-tenancy:** every service call is scoped by `restaurantId`; the mock store partitions data per tenant; SQL enforces it via RLS on `restaurant_id`.
- **Libs:** `qrcode` (QR gen), `recharts` (analytics), `jspdf` + `jspdf-autotable` (bill PDF), `lucide-react` (icons), `date-fns`, `clsx`/`tailwind-merge`, `sonner` (toasts).

## 2. Folder Structure
```
src/
  app/                # App shell, router, global providers
  components/
    ui/               # Button, Card, Input, Modal, Badge, Tabs, Toast, Skeleton…
    layout/           # PublicLayout, CustomerLayout, DashboardLayout, AuthLayout, RoleGuard
  features/
    auth/  menu/  cart/  orders/  kitchen/  waiter/  service-requests/
    tables/  reservations/  billing/  feedback/  inventory/  upsell/
    notifications/  analytics/  restaurants/   # each: components/ hooks/ (logic stays here)
  data/
    services/         # menuService, orderService, reservationService, … (the abstraction)
    mock/             # seed data + in-memory store, partitioned by restaurantId
    realtime/         # event bus (subscribe/emit)
    supabase/         # live client (later) — same interface as mock services
  context/            # TenantContext, AuthContext, CartContext
  hooks/              # shared hooks (useRealtime, useDebounce, useMediaQuery…)
  lib/                # utils, formatters (currency/date), constants, role config
  types/              # domain models (single source of truth)
  pages/              # thin route components that compose features
  styles/             # tailwind layers, design tokens
supabase/
  schema.sql          # tables + indexes
  policies.sql        # RLS multi-tenant policies
  seed.sql            # sample data
```

## 3. Pages / Routes
**Customer (no login, QR-driven, mobile-first):**
- `/r/:restaurantSlug/t/:tableId` — QR landing → auto-detect table, open menu (Feat 1,2)
- Menu browse + item detail + add-to-cart with upsell (Feat 2,13)
- Cart / order review → place order (Feat 3)
- Order tracking timeline (Feat 3 status)
- Service request bar: Call Waiter / Water / Bill / Assistance (Feat 6)
- Bill view (Feat 10) → Feedback form (Feat 11)
- `/reserve/:restaurantSlug` — public reservation form (Feat 7)
- `/` — minimal SaaS landing + role entry

**Auth:** `/login` (staff/owner)

**Staff/Admin (protected, role-based):**
- `/kitchen` — Kitchen dashboard (Feat 4)
- `/waiter` — Waiter dashboard + service requests (Feat 5,6)
- `/admin` dashboard shell (Manager/Owner):
  - `/admin/analytics` (Feat 15) · `/admin/menu` (Feat 2 CRUD) · `/admin/orders` (Feat 3)
  - `/admin/tables` (Feat 9 live status + Feat 1 table/QR mgmt) · `/admin/reservations` (Feat 8)
  - `/admin/inventory` (Feat 12) · `/admin/feedback` (Feat 11) · `/admin/billing` (Feat 10 history)
  - `/admin/staff` · `/admin/notifications` (Feat 14) · `/admin/restaurants` (Feat 16 super-admin)

## 4. Reusable Components
**UI primitives:** Button, IconButton, Card, StatusBadge, Input, Select, Textarea, Switch, Modal, Drawer/Sheet, Tabs, Toast, Spinner, Skeleton, EmptyState, Avatar, Tooltip, Pagination, SearchBar, ConfirmDialog, KPICard, DataTable, RatingStars, QuantityStepper, PriceTag, CategoryPill, QRDisplay.
**Layout:** PublicLayout, CustomerLayout (bottom nav), DashboardLayout (sidebar+topbar), AuthLayout, RestaurantSwitcher, RoleGuard/ProtectedRoute.
**Domain:** MenuItemCard, MenuCategoryNav, CartSheet, CartItemRow, UpsellSuggestion, OrderStatusTimeline, ServiceRequestBar, KitchenOrderTicket, WaiterOrderCard, TableStatusGrid, TableCard, ReservationForm, ReservationCard, BillSummary, FeedbackForm, InventoryRow, LowStockAlert, RevenueChart, TopFoodsChart, PeakHoursChart, NotificationItem, MenuItemForm, StaffForm.

## 5. Database Plan (14 doc modules → tables)
All tables carry `restaurant_id` (except `restaurants`) for tenant isolation + RLS.
- **restaurants** (id, name, slug, settings: tax%, service_charge%, currency)
- **staff** (id, restaurant_id, name, email, role[owner|manager|waiter|kitchen], auth_uid)
- **tables** (id, restaurant_id, number, seats, status[available|reserved|occupied])
- **qr_codes** (id, restaurant_id, table_id, token, url)
- **menu_categories** (id, restaurant_id, name, sort)
- **menu_items** (id, restaurant_id, category_id, name, description, price, image_url, is_available)
- **orders** (id, restaurant_id, table_id, status[pending|preparing|ready|served|completed], subtotal, tax, service_charge, total, created_at)
- **order_items** (id, order_id, menu_item_id, name, qty, unit_price)
- **reservations** (id, restaurant_id, name, mobile, email, date, time, guests, notes, status[pending|confirmed|cancelled|completed])
- **inventory_items** (id, restaurant_id, name, unit, stock_qty, low_threshold) + optional `item_ingredients` link for auto-deduct
- **customers** (id, restaurant_id, name, mobile, email)
- **feedback** (id, restaurant_id, order_id, food_rating, service_rating, experience_rating, comment)
- **billing** (id, restaurant_id, order_id, breakdown json, grand_total, created_at)
- **notifications** (id, restaurant_id, channel[whatsapp], type, recipient, payload, status, created_at)
- **service_requests** (id, restaurant_id, table_id, type[waiter|water|bill|assistance], status, created_at)
- **upsell_rules** (id, restaurant_id, trigger_item_id, suggested_item_id, message)

## 6. Roadmap (each phase ends with a written summary before proceeding)
- **Phase 0 — Foundation:** scaffold (Vite+TS+Tailwind), design tokens, router, layouts, UI primitives, types, mock store + service layer + realtime bus, Tenant/Auth/Cart contexts, seed data.
- **Phase 1 — Customer QR Ordering:** QR landing + table detect (Feat 1), digital menu (Feat 2), cart + upsell (Feat 13), place order (Feat 3).
- **Phase 2 — Order lifecycle + realtime dashboards:** Kitchen (Feat 4), Waiter (Feat 5), Admin orders (Feat 3), live cross-screen status.
- **Phase 3 — Service & Tables:** Waiter call system (Feat 6), live table status (Feat 9), table/QR management + QR generation (Feat 1).
- **Phase 4 — Reservations:** customer form (Feat 7) + management dashboard (Feat 8).
- **Phase 5 — Billing & Feedback:** auto bill, tax/service charge, print + PDF + history (Feat 10), feedback (Feat 11).
- **Phase 6 — Inventory:** stock, auto-deduct on order, low-stock alerts (Feat 12).
- **Phase 7 — Notifications & Analytics:** WhatsApp message previews/log (Feat 14), analytics dashboard (Feat 15).
- **Phase 8 — Multi-restaurant SaaS:** tenant isolation UI, restaurant switcher, super-admin (Feat 16); deliver `supabase/*.sql`; responsive QA + README + Vercel deploy notes.

## 7. Feature → Phase Coverage (no feature skipped)
1 QR Ordering→P1/P3 · 2 Menu→P1 · 3 Orders→P1/P2 · 4 Kitchen→P2 · 5 Waiter→P2 · 6 Waiter Call→P3 ·
7 Reservation→P4 · 8 Reservation Mgmt→P4 · 9 Table Status→P3 · 10 Billing→P5 · 11 Feedback→P5 ·
12 Inventory→P6 · 13 Upselling→P1 · 14 WhatsApp→P7 · 15 Analytics→P7 · 16 Multi-Restaurant→P8.
Roles (Customer/Waiter/Kitchen/Manager/Owner) enforced via RoleGuard from Phase 0.
