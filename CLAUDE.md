# CLAUDE.md — ToDining (SmartDine)

> **ToDining** — a modern, mobile-first **Smart Restaurant Management SaaS**: QR table
> ordering, live kitchen & waiter boards, reservations, billing, inventory, rule-based
> "AI" upselling, WhatsApp-style notifications, analytics, and multi-restaurant (multi-tenant)
> isolation.
>
> The product is branded **ToDining** (`package.json`, `docs/PLAN.md`). Older docs, the
> README, and `docs/SECURITY-REMEDIATION.md` still call it **SmartDine** — same app.

---

## ⚠️ Production readiness: NOT SECURE YET — read this first

This app currently runs almost entirely **client-side against the anon Supabase key** (or a
pure localStorage fallback). Authentication and tenant isolation are **not enforced at the
database layer**. Do **not** ship to production until the items below are fixed. See
`docs/SECURITY-REMEDIATION.md` for the ordered runbook, and the **Security model** section
below for the full list.

Highest-severity, confirmed in code:

1. **`/admin` is a wide-open route.** `src/app/router.tsx` guards `/admin` with
   `<RoleGuard roles={['manager','owner']} open>`. The `open` flag lets **unauthenticated
   visitors straight through** (`src/components/layout/RoleGuard.tsx`), and
   `DashboardLayout` explicitly **treats an anonymous visitor as an owner** so the *full*
   management console (orders, billing, staff, inventory, analytics, restaurants) renders
   for anyone who navigates to `/admin`. The `/admin-panel` login gate is bypassed entirely.
2. **Hardcoded admin credentials in the browser bundle.** `src/data/services/adminAuthService.ts`
   ships `LOCAL_FALLBACK = { username: 'SAMP-IP(manoj)', passwordHash: '19q822l' }`, and the
   plaintext (`mavoc-2026`) is written in code comments and in `supabase/migrations/0008`.
3. **Admin password hash is world-readable.** `supabase/migrations/0008_admin_panel_credentials.sql`
   grants `anon` SELECT on `admin_users` with policy `using (true)` — anyone with the public
   anon key can read the credential row.
4. **"Password hashing" is djb2** (`src/lib/password.ts`) — a fast, non-cryptographic 32-bit
   hash. Trivially brute-forced/reversed. Real owner creds live in `supabase/migrations/0005`
   in the repo.
5. **No Supabase Auth.** Every DB request runs as role `anon`; `auth.uid()` is always NULL, so
   the RLS policies in `supabase/policies.sql` are ineffective (and are not even enabled on the
   live project). Result: full cross-tenant read/write exposure (verified live in the remediation doc).
6. **Credential/hash logging to console** in `adminAuthService.authenticate`.
7. **Public INSERT policies `with check (true)`** on `orders`, `order_items`, `service_requests`,
   `reservations`, `feedback` (`supabase/policies.sql`) — any anon client can inject rows into
   any `restaurant_id`.

---

## Tech stack

- **Build/runtime:** Vite 6, React 18, TypeScript 5.7 (`"type": "module"`, ESM).
- **Routing:** `react-router-dom` v6 (`createBrowserRouter`, route-level `lazy()` code-splitting).
- **State:** `zustand` v5 (global stores), React Context (Auth, AdminAuth, Tenant, Cart, ModuleUpdates).
- **Forms/validation:** `react-hook-form` + `zod` (`@hookform/resolvers`).
- **Backend (optional):** `@supabase/supabase-js` v2 — anon key only in the client.
- **UI/deps:** Tailwind CSS 3, `lucide-react` (icons), `recharts` (analytics), `jspdf` +
  `jspdf-autotable` (bill PDF), `qrcode` (QR generation), `date-fns`, `clsx` + `tailwind-merge`
  (`cn()`), `sonner` (toasts).
- **No test framework, no ESLint.** `npm run lint` is **type-check only** (`tsc --noEmit`).

## Commands

```bash
npm install
npm run dev       # Vite dev server → http://localhost:5173
npm run build     # tsc -b && vite build  (type-check + production build)
npm run preview   # preview the production build
npm run lint      # tsc --noEmit  (TYPE-CHECK ONLY — not eslint, no tests exist)
```

There is **no test suite**. "Bug-free" claims must be backed by manual verification or new tests.

## Environment

`.env` (optional — copy from `env.example`). When unset, the app runs on the in-memory /
localStorage fallback so dev never hard-blocks.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`isSupabaseEnabled = Boolean(url && anonKey)` (`src/data/supabase/client.ts`) selects the backend.
**Never** put the `service_role` key in any `VITE_*` var — it is bundled into the public build.

---

## Architecture

### Data layer (the core idea)
Every screen imports **only** from `src/data/services/*` (a typed service abstraction). Services
read/write a **synchronous in-memory store** (`src/data/mock/store.ts`) that:
- is **hydrated on boot** by `bootstrapStore()` (gated by `DataGate` in `src/app/App.tsx`),
- persists to **localStorage**,
- **write-throughs to Supabase** when configured (`src/data/supabase/*`, `mappers.ts`),
- broadcasts changes over an in-app **realtime event bus** (`src/data/realtime/bus.ts`), which
  Supabase `postgres_changes` also feeds. UI subscribes via `useLiveQuery` / `useRealtime`.

Because the UI only knows the service interface, swapping mock↔Supabase requires **no UI changes**.

```
UI (pages/features)  →  data/services/*  →  data/mock/store (sync cache)  →  localStorage
                                                     │
                                                     └── (optional) Supabase write-through + realtime → bus → useLiveQuery
```

### Directory map
```
src/
  app/            App shell (App.tsx = providers + DataGate), router.tsx
  components/
    ui/           Design-system primitives: Button, Card, Input, Modal, Badge, StatusBadge, ...
    layout/       DashboardLayout, StaffLayout, RoleGuard, AdminPanelGuard, RestaurantSwitcher, Brand
  context/        AuthContext (staff), AdminAuthContext (/admin-panel), TenantContext, CartContext, ModuleUpdatesContext
  data/
    services/     menuService, orderService, reservationService, billingService, staffService, adminAuthService, ...
    mock/         seed.ts (demo data), store.ts (in-memory cache + localStorage + Supabase write-through)
    realtime/     bus.ts (subscribe/emit event bus)
    supabase/     client.ts (anon client), mappers.ts (row ↔ domain)
  features/       feature modules (menu, cart, orders, kitchen, waiter, reservations, billing, feedback, inventory, tables, service-requests, staff, customer, upsell)
  hooks/          useLiveQuery, useRealtime
  lib/            cn, format, id, password (DEMO djb2), roles
  pages/          thin route components: LandingPage, LoginPage, AdminPanel*, NotFoundPage, admin/*, customer/*, staff/*
  styles/         index.css (Tailwind layers + design tokens)
supabase/         schema.sql, policies.sql (RLS), setup.sql, migrations/0001–0008, README.md
docs/             PLAN.md (roadmap/feature map), SUPABASE.md, SECURITY-REMEDIATION.md, superpowers/specs/*
remotion/         separate Remotion project for explainer/how-to videos (own package.json)
scripts/          cleanup-supabase.mjs, backup JSON
```

### Path alias
`@/` → `src/` (used throughout; configured in `vite.config.ts` / `tsconfig`).

---

## Routing & roles

Routes (`src/app/router.tsx`):
- `/` and `/login` → **LoginPage** (production default entry).
- `/site`, `/landing` → public **LandingPage** (preserved, no longer default).
- `/admin-panel` → **AdminPanelEntry**, wrapped by `AdminPanelGuard` (username/password against
  Supabase `admin_users`; see AdminAuthContext). Card-based launcher into `/admin`.
- `/admin/*` → **DashboardLayout**, `RoleGuard roles={['manager','owner']} open` ⚠️ (see security note).
  Children: index Dashboard, analytics, categories, orders, tables, menu, reservations, inventory,
  billing, feedback, notifications, staff, restaurants.
- `/kitchen` → `RoleGuard ['kitchen','manager','owner']` → StaffLayout → KitchenPage.
- `/waiter` → `RoleGuard ['waiter','manager','owner']` → StaffLayout → WaiterPage.
- Customer (QR, no auth): `/r/:slug/t/:tableId` (menu) → `cart` → `order/:orderId` (track); `/reserve/:slug`.
- `*` → NotFoundPage.

Roles: `owner | manager | waiter | kitchen` (`src/lib/roles.ts`). `ROLE_CONFIG` sets each role's
`home` and allowed route prefixes; `canAccess()` and `RoleGuard` enforce client-side only.
`ADMIN_NAV` drives the sidebar (some items `ownerOnly`).

---

## Security model (current) & what "going to production" requires

**Two separate auth surfaces, both client-trust only today:**
- **Staff** (`AuthContext` + `staffService`): login by email/username; owners require a password
  (djb2), other roles are password-less demo cards. Session = staff **id string in localStorage**
  (`todining_auth_staff`) → forgeable. No server verification.
- **Admin Panel** (`AdminAuthContext` + `adminAuthService`): username/password vs Supabase
  `admin_users` (or hardcoded fallback); session = `{username, expiresAt}` in localStorage.

**To go to production (ordered — RLS-first without auth = total lockout):**
1. Provision **Supabase Auth** users for staff (service_role, server-side); set `staff.auth_uid`.
2. Wire the app to `supabase.auth.signInWithPassword`; hydrate the store **after** a session exists.
3. **Enable RLS** on all tables and (re)apply `supabase/policies.sql`.
4. **Remove** the `/admin` `open` bypass and the "anon = owner" treatment in `DashboardLayout`.
5. **Delete** hardcoded admin creds from the bundle; move admin auth server-side; **revoke** the
   `anon` SELECT on `admin_users`.
6. Replace **djb2** with real hashing (handled by Supabase Auth / server), rotate the committed creds.
7. Tighten public INSERT policies (validate `restaurant_id`, rate-limit, captcha where relevant).
8. Remove credential/hash `console.*` logging.

---

## Feature modules (16, per `docs/PLAN.md`)

QR ordering · digital menu · cart + rule-based upsell · orders/lifecycle · kitchen board · waiter
board · waiter-call service requests · tables + QR management · reservations (customer form + admin
mgmt) · billing (tax/service charge, print, jsPDF export, history) · feedback (food/service/experience
ratings) · inventory (stock + auto-deduct via `menu_item_ingredients` + low-stock alerts) · WhatsApp
notifications (preview/log only — no real send) · analytics (recharts) · multi-restaurant SaaS
(tenant switcher, super-admin) · staff & categories management.

Integrations are **stubbed behind interfaces**: "AI upselling" is a rule-based engine
(`upsellService`); "WhatsApp" only previews/logs the message (`notificationService`). Ready to swap
for OpenAI / Meta WhatsApp / Twilio.

## Data model
Postgres schema in `supabase/schema.sql`. Tenant tables: `restaurants` (tenant root) + `staff`,
`tables`, `qr_codes`, `menu_categories`, `menu_items`, `inventory_items`, `menu_item_ingredients`,
`orders`, `order_items`, `service_requests`, `reservations`, `customers`, `bills`, `feedback`,
`upsell_rules`, `notifications`, `admin_users`. Every domain table carries `restaurant_id` (except
`restaurants`). Enums for roles/statuses. `orders.updated_at` maintained by a trigger. Domain types
live in `src/types` (single source of truth); `src/data/supabase/mappers.ts` maps rows ↔ domain.

---

## Design system

- **Fonts:** `Fraunces` (display / headings, `font-display`), `Plus Jakarta Sans` (body, `font-sans`).
- **Palette** (`tailwind.config.js`): warm "modern dining" — `ink` (near-black text), `cream`
  (backgrounds), **`ember`** primary accent (`ember-500 = #d9521f`), `sage` (green), `gold`.
- **Tokens:** radii `xl/2xl/3xl`; shadows `soft/lift/glow`; animations `fade-up`, `scale-in`,
  `pulse-ring`. Utility `card-surface` and `.pb-safe` (mobile safe-area) in `src/styles/index.css`.
- **Light mode only** — `:root { color-scheme: light }`; there is **no dark theme**.
- **Primitives:** `src/components/ui/*` (barrel `index.ts`). Compose with `cn()` (`src/lib/cn.ts`).
- Mobile-first; customer flow is bottom-nav; admin/staff use sidebar + mobile drawer.

## Conventions & gotchas

- Feature-first structure; **pages are thin**, logic lives in `features/*` and `data/services/*`.
- Keep the **service interface stable** — the mock store and Supabase path must stay swap-compatible.
- Existing code is **densely commented** with rationale; match that voice when editing.
- Realtime: components re-query via `useLiveQuery(fn, { types: [...] })` on bus events
  (`data:changed`, etc.) — mutations must `realtimeBus.emit(...)` so other screens update live.
- The store subscribes to **all** `postgres_changes` in `public` and refetches with `SELECT *` —
  scope this per active `restaurant_id` for production (see remediation doc, defense-in-depth).
- `remotion/` is an independent sub-project (video generation); not part of the app build.

## Key references
- `docs/PLAN.md` — full roadmap, phase plan, feature→phase coverage.
- `docs/SECURITY-REMEDIATION.md` — ordered runbook to make tenant isolation real. **Read before prod.**
- `docs/SUPABASE.md`, `supabase/README.md` — backend setup.
- `docs/superpowers/specs/2026-06-23-multi-hotel-workspace-design.md`, `...2026-06-26-branch-management-design.md` — design specs.
