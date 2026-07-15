# CLAUDE.md — ToDining (SmartDine)

> **ToDining** — a modern, mobile-first **Smart Restaurant Management SaaS**: QR table
> ordering, live kitchen & waiter boards, reservations, billing, inventory, rule-based
> "AI" upselling, WhatsApp-style notifications, analytics, and multi-restaurant (multi-tenant)
> isolation.
>
> The product is branded **ToDining** (`package.json`, `docs/PLAN.md`). Older docs, the
> README, and `docs/SECURITY-REMEDIATION.md` still call it **SmartDine** — same app.

---

## ⚠️ Production readiness: security status (read this first)

**As of 2026-07-15 the app is DEPLOYED and public** (see **Deployment** below), running on a
**self-hosted Supabase** whose schema (`supabase/setup-selfhost.sql`) ships **demo-grade permissive
RLS — anon can read AND write every table.** So tenant isolation is **not enforced yet**: fine for a
demo, but it's a live cross-tenant exposure. The **auth + RLS hardening (Batch 3)** in
`docs/AUTH-RLS-MIGRATION.md` closes it.

Status of the council-review criticals (`docs/COUNCIL-REVIEW.md`, an adversarial multi-agent audit):

- ✅ **FIXED — `/admin` open bypass.** The `open` flag is gone; `/admin` now requires an
  authenticated manager/owner (`src/app/router.tsx`), and `DashboardLayout` defaults to
  least-privilege, never owner. RoleGuard now redirects unauthorized staff to their own home.
- ✅ **FIXED — console credential/PII logging.** Removed the hash-logging block in
  `adminAuthService`, the `[DEBUG-MENU]` tenant-data log in `MenuPage`, and configured esbuild to
  **drop all `console.*`/`debugger` from production builds** (`vite.config.ts`).
- ✅ **FIXED — no real lint gate.** `npm run lint` now actually type-checks (see Commands).
- ⚠️ **PENDING — no real auth / RLS not enforced (the big one).** No Supabase Auth yet; every DB
  call runs as `anon`; the schema's demo RLS is permissive. Full cross-tenant read/write. → **Batch 3.**
- ⚠️ **PENDING — hardcoded admin creds + world-readable hash.** `adminAuthService.LOCAL_FALLBACK`
  (`SAMP-IP(manoj)`/`mavoc-2026`) and the `admin_users` anon-readable djb2 hash still ship. → Batch 3.
- ⚠️ **PENDING — djb2 "hashing"** (`src/lib/password.ts`) + committed creds (`migrations/0005`).
- ⚠️ **PENDING — permissive INSERT** (demo RLS / `with check (true)`) lets anon inject any row.

Also: the repo (`SAMP-IT/Todining`) is currently **public** — `docs/COUNCIL-REVIEW.md` (the full
vuln list) and the demo credential hashes are visible. Consider making it private before Batch 3.

---

## Tech stack

- **Build/runtime:** Vite 6, React 18, TypeScript 5.7 (`"type": "module"`, ESM).
- **Routing:** `react-router-dom` v6 (`createBrowserRouter`, route-level `lazy()` code-splitting).
- **State:** `zustand` v5 is a **dependency but unused**; state is React Context (Auth, AdminAuth,
  Tenant, Cart, ModuleUpdates) + the in-memory store.
- **Forms/validation:** `react-hook-form` + `zod` (`@hookform/resolvers`).
- **Backend:** `@supabase/supabase-js` v2 — **anon key only** in the client (public by design).
- **UI/deps:** Tailwind CSS 3, `lucide-react`, `recharts` (analytics), `jspdf` + `jspdf-autotable`
  (bill PDF), `qrcode`, `date-fns`, `clsx` + `tailwind-merge` (`cn()`), `sonner` (toasts).
- **No test framework, no ESLint.** `npm run lint` is a **real type-check gate** (`tsc -b --noEmit`)
  — it honors the project references and checks the source. (It previously ran `tsc --noEmit` against
  the references-only root `tsconfig.json`, which checked **zero files** and always passed.)

## Commands

```bash
npm install
npm run dev       # Vite dev server → http://localhost:5173
npm run build     # tsc -b && vite build   (type-check + production build)
npm run preview   # preview the production build
npm run lint      # tsc -b --noEmit        (REAL type-check gate; honors project refs)
```

There is **no test suite**. "Bug-free" claims must be backed by manual verification or new tests.
The Docker build (`Dockerfile`) also runs `npm run build`, so a type/build error fails the deploy.

## Environment

`VITE_*` vars are read at **build time** (Vite inlines them). Unset → the app runs on the
localStorage fallback (each browser isolated, no shared data). Currently pointed at the self-hosted
Supabase in the Dokploy **WEB** app's build args:

```
VITE_SUPABASE_URL=https://todining-supabase-ef0c6e-51-79-254-198.traefik.me
VITE_SUPABASE_ANON_KEY=<anon JWT — public; matches the self-hosted stack's JWT_SECRET>
# VITE_USE_SUPABASE_AUTH — reserved build flag for the Batch 3 auth cutover (not wired yet)
```

`isSupabaseEnabled = Boolean(url && anonKey)` (`src/data/supabase/client.ts`) selects the backend;
the client now uses `persistSession: true` (prep for Batch 3 auth). **Never** put the `service_role`
key in any `VITE_*` var — it would ship in the public bundle.

---

## Deployment & Infrastructure (live)

Hosted on the user's **self-managed Dokploy server** (`51.79.254.198`), not a managed PaaS. Moved
**off Supabase Cloud (~$25/mo) to fully self-hosted** on 2026-07-15. Full runbook: `docs/DEPLOYMENT.md`.

- **Frontend (WEB app):** `http://todining-web.51.79.254.198.nip.io` — Dokploy *Application* built
  from this repo's `Dockerfile` (node:22 build → nginx:1.27 serve; SPA fallback + caching in
  `deploy/nginx.conf`). Source: GitHub `SAMP-IT/Todining` `main` via the **Git provider** (public
  repo). `VITE_*` passed as Docker **build args**.
- **Backend (self-hosted Supabase):** `https://todining-supabase-ef0c6e-51-79-254-198.traefik.me`
  — Dokploy *Compose* service from the Supabase template, **trimmed**: removed `vector`, `analytics`
  (logflare), `functions` (edge runtime), and decoupled `db`/`kong`/`studio` from them. **Reason:**
  the stock template has `db depends_on vector (healthy)`, so a flaky `vector` deadlocks first boot.
  10 services run: `db, kong (gateway :8000), auth, rest, realtime, storage, imgproxy, meta, studio,
  supavisor`. Secrets are Dokploy-generated; `traefik.me` gives free wildcard TLS to the IP. Studio
  login is `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD` from the service's Environment tab.
- **Schema:** run `supabase/setup-selfhost.sql` once in Studio → SQL Editor (see **Data model**).
- **CI/CD:** one workflow, `.github/workflows/ci.yml`:
  - `ci` job — `npm run lint` + `npm run build` on every push/PR to `main`.
  - `deploy` job — `needs: ci` (so a red build can **never** ship) and only on a push to `main`;
    POSTs to the Dokploy WEB app's deploy webhook, read from the repo secret **`DOKPLOY_DEPLOY_URL`**
    (Settings → Secrets and variables → Actions). Dokploy then clones `main` and rebuilds.
  - Deliberately *not* wired as a raw GitHub→Dokploy webhook: that redeploys on every push even when
    CI is red, and gives no deploy visibility in the Actions tab. Don't add one — you'd double-deploy.
  - The Supabase compose service has its own separate webhook; never point repo pushes at it.
- **Git:** push with the **Manoj-V-348** GitHub account (`gh auth switch --user Manoj-V-348`).

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

### Directory map
```
Dockerfile, .dockerignore   Production image (Vite build → nginx). deploy/nginx.conf = SPA config.
.github/workflows/ci.yml    CI/CD: lint + build, then a deploy gated on a green build.
src/
  app/            App shell (App.tsx = providers + DataGate), router.tsx
  components/ui/  Design-system primitives: Button, Card, Input, Modal, Badge, StatusBadge, ...
  components/layout/  DashboardLayout, StaffLayout, RoleGuard, AdminPanelGuard, RestaurantSwitcher, Brand
  context/        AuthContext (staff), AdminAuthContext (/admin-panel), TenantContext, CartContext, ModuleUpdatesContext
  data/services/  menuService, orderService, billingService, staffService, adminAuthService, ...
  data/mock/      seed.ts (demo data), store.ts (in-memory cache + localStorage + Supabase write-through)
  data/realtime/  bus.ts (subscribe/emit event bus)
  data/supabase/  client.ts (anon client), mappers.ts (row ↔ domain — SOURCE OF TRUTH for columns)
  features/       menu, cart, orders, kitchen, waiter, reservations, billing, feedback, inventory, tables, service-requests, staff, customer, upsell
  hooks/          useLiveQuery, useRealtime
  lib/            cn, format, id (string ids), password (DEMO djb2), roles
  pages/          thin route components: LandingPage, LoginPage, AdminPanel*, admin/*, customer/*, staff/*
  styles/         index.css (Tailwind layers + design tokens)
supabase/         setup-selfhost.sql (the schema actually run), schema.sql (UUID variant — NOT used),
                  policies.sql (auth-scoped RLS for Batch 3), setup.sql, migrations/0001–0008, README.md
docs/             PLAN.md, COUNCIL-REVIEW.md (audit), AUTH-RLS-MIGRATION.md, DEPLOYMENT.md,
                  SECURITY-REMEDIATION.md, SUPABASE.md, superpowers/specs/*
remotion/         independent Remotion project (explainer videos); NOT part of the app build
```

### Path alias
`@/` → `src/` (configured in `vite.config.ts` / `tsconfig`).

---

## Routing & roles

Routes (`src/app/router.tsx`):
- `/` and `/login` → **LoginPage** (default entry).
- `/site`, `/landing` → public **LandingPage**.
- `/admin-panel` → **AdminPanelEntry**, wrapped by `AdminPanelGuard` (username/password vs Supabase
  `admin_users`). Card-based workspace launcher.
- `/admin/*` → **DashboardLayout**, `RoleGuard roles={['manager','owner']}` (now auth-required — the
  `open` bypass was removed). Children: Dashboard, analytics, categories, orders, tables, menu,
  reservations, inventory, billing, feedback, notifications, staff, restaurants.
- `/kitchen` → `RoleGuard ['kitchen','manager','owner']` → StaffLayout → KitchenPage.
- `/waiter` → `RoleGuard ['waiter','manager','owner']` → StaffLayout → WaiterPage.
- Customer (QR, no auth): `/r/:slug/t/:tableId` (menu) → `cart` → `order/:orderId` (track); `/reserve/:slug`.
- `*` → NotFoundPage.

Roles: `owner | manager | waiter | kitchen` (`src/lib/roles.ts`). `ROLE_CONFIG` sets each role's
`home` + allowed prefixes; `RoleGuard` enforces **client-side only** (real enforcement = RLS, Batch 3).

---

## Security model & the pending Batch 3 (auth + RLS)

**Two client-trust auth surfaces today:**
- **Staff** (`AuthContext` + `staffService`): login by email/username; owners need a djb2 password,
  other roles are password-less demo cards. Session = staff **id in localStorage** → forgeable.
- **Admin Panel** (`AdminAuthContext` + `adminAuthService`): username/password vs `admin_users`
  (or the hardcoded `LOCAL_FALLBACK`); session = `{username, expiresAt}` in localStorage.

**Batch 3 (ordered — auth must land before RLS or it's a total lockout; runbook: `docs/AUTH-RLS-MIGRATION.md`):**
1. Provision **Supabase Auth** users for staff (service_role); set `staff.auth_uid`.
2. Wire `supabase.auth.signInWithPassword`; resolve the staff row from `auth.uid()`; re-hydrate the
   store after a session exists; scope realtime to the active `restaurant_id`.
3. Move admin-panel auth server-side; **revoke** the `anon` SELECT on `admin_users`.
4. Enable RLS and swap the demo permissive policies for `supabase/policies.sql` (auth-scoped) +
   tightened public INSERTs. Replace djb2, rotate committed creds.
Already done in earlier batches: `/admin` open bypass removed, console credential/PII logging
stripped, real lint gate, session persistence enabled.

---

## Feature modules (16, per `docs/PLAN.md`)

QR ordering · digital menu · cart + rule-based upsell · orders/lifecycle · kitchen board · waiter
board · waiter-call service requests · tables + QR management · reservations · billing (tax/service
charge, jsPDF export, history, per-year `invoice_number`) · feedback (food/service/experience) ·
inventory (stock + low-stock alerts; note: recipe auto-deduct is NOT persisted to Supabase — see
`docs/COUNCIL-REVIEW.md` H6) · WhatsApp notifications (preview/log only) · analytics (recharts) ·
multi-restaurant + branches (`parent_id`) · staff & categories management.

Integrations are **stubbed behind interfaces**: "AI upselling" = rule-based `upsellService`;
"WhatsApp" = `notificationService` (logs the message, no real send).

## Data model

**The app uses TEXT primary keys** — it generates string ids (`rest_…`, `ord_…`, `stf_…`, via
`src/lib/id.ts`). So the schema actually run is **`supabase/setup-selfhost.sql`** (or `setup.sql`),
**NOT** the UUID `schema.sql` (that variant would reject every insert). `setup-selfhost.sql` is the
consolidated current schema (folds in migrations 0001–0008): 16 tenant tables + `admin_users`,
**demo-grade permissive RLS** ("Mode A": anon read+write), and the realtime publication. The **source
of truth for columns is `src/data/supabase/mappers.ts`**.

Tenant tables (all carry `restaurant_id`): `restaurants` (root; `parent_id` → branches), `staff`,
`menu_categories`, `menu_items`, `tables`, `qr_codes`, `inventory_items`, `upsell_rules`, `customers`,
`orders`, `order_items`, `service_requests`, `reservations`, `bills`, `feedback`, `notifications`.
`orders`/`bills` carry `session_id` (dining session = one bill per table visit); `bills` carry
`invoice_number`. `admin_users` gates `/admin-panel`. `orders.updated_at` maintained by a trigger.

---

## Design system — **Warm Editorial** (shipped across all 26 screens)

Full spec is **`DESIGN.md`** (visual) + **`PRODUCT.md`** (strategy) at repo root — read both before
any UI work. Editorial "printed fine-dining menu" direction: paper, warm ink, one drop of ember.
Every screen (customer flow, staff boards, all 13 admin screens, landing, 404, admin panel) is
done; match the existing screens rather than inventing a new look.

- **Fonts:** `Cormorant Garamond` (display, `font-display`; runs light/airy — default headings to
  `font-semibold` 600, size up so it reads substantial), `Plus Jakarta Sans` (body, `font-sans`).
  Loaded in `index.html` (incl. italic axis, used for accents).
- **Palette** (`tailwind.config.js`): `ink` (warm near-black `#2a211b`), `cream` (paper `#faf6ef`),
  **`ember`** primary action (`ember-500 = #c0451c`), `sage` (deep bottle green = "live/served"),
  `gold` (antique, signatures). **Light mode only** (`:root { color-scheme: light }`).
- **Token strategy:** token *names* (`ember/sage/gold/ink/cream`) are **frozen** — only values are
  retuned, so 350+ existing classNames inherit the new look with no edits. Restyle primitives but
  keep their exact prop APIs (barrel `src/components/ui/index.ts`).
- **Tokens:** radii `xl/2xl/3xl`; shadows `soft/lift/glow`; `body::before` is **paper grain** (SVG
  noise, `multiply`) — the old radial-gradient atmosphere was removed as generic. `.tnum` = tabular
  numerals for money. Utility `card-surface`, `.pb-safe` in `src/styles/index.css`.
- **Copy:** **no em dashes** (use `·`, comma, colon, or period). No gradient text / side-stripe
  borders / glassmorphism / identical icon-card grids (see DESIGN.md anti-slop list).
- **Primitives:** `src/components/ui/*` (barrel `index.ts`). Compose with `cn()` (`src/lib/cn.ts`).
- Mobile-first; customer flow = bottom-nav; admin/staff = sidebar + mobile drawer.

### UI redesign workflow (per screen)
1. Build a self-contained **HTML prototype in `design-samples/screens/*.html`** first; get approval.
2. Then implement into React, preserving all data/service wiring and primitive APIs.
3. Screenshots/renders go to `design-samples/renders/` (keep repo root clean).
- **Playwright MCP blocks `file://`** — serve prototypes over HTTP first (`python -m http.server 8823`
  from `design-samples/`), then navigate to `http://localhost:8823/...`.

## Conventions & gotchas

- Feature-first; **pages are thin**, logic lives in `features/*` and `data/services/*`.
- Keep the **service interface stable** — the mock store and Supabase path must stay swap-compatible.
- Existing code is **densely commented** with rationale; match that voice when editing.
- Realtime: components re-query via `useLiveQuery(fn, { types: [...] })` on bus events; mutations must
  `realtimeBus.emit(...)`. The store subscribes to **all** `postgres_changes` and refetches with
  `SELECT *` — scope per `restaurant_id` in Batch 3 (fixes cross-tenant fan-out + multi-device alerts).
- When editing the Supabase-facing shape, `mappers.ts` and `setup-selfhost.sql` must stay in sync.
- **`tailwind.config.js` / `index.html` font changes do NOT hot-reload** — the Vite dev server keeps
  serving stale CSS (e.g. a removed font silently falls back to Georgia). After such edits, **restart
  `npm run dev`** (and `rm -rf node_modules/.vite`). The production build is always correct.
- **Verify fonts/tokens by measurement, not by eye** — a serif fallback (Georgia) looks "close enough"
  in a screenshot. Check via Playwright: `getComputedStyle(el).fontFamily` + `document.fonts.check('600 40px "Cormorant Garamond"')`.
- **Cormorant ships OLDSTYLE figures and `tabular-nums` does NOT override them** — money rendered
  `₹80` as `₹8o` and `1` as `I`. `src/styles/index.css` forces `lining-nums` on `.font-display` +
  headings (base layer) and `.tnum` = `tabular-nums lining-nums` (components layer, so it wins).
  **Put `.tnum` on every money/count/time value.** Never add `.tnum` to a "Table 12" heading —
  Cormorant's tabular figures gap it into "Table I 2".
- **Charts have their own colour rules.** Our sage (OKLCH C 0.071) and ink-muted (0.026) are under the
  chart chroma floor (C ≥ 0.10) and read *gray* as fills, so `AnalyticsPage` uses a chroma-lifted data
  green (`#2f9159`). Validate any new categorical palette with the `dataviz` skill's
  `validate_palette.js` rather than eyeballing CVD. Colour must key off the **entity**, never an array
  index — the pie repainted "Confirmed" gold whenever "Pending" filtered out.
- **Checking `document.scrollWidth` alone misses clipped content** — a table can scroll inside its own
  `overflow-x-auto` while the page reports zero overflow. Assert on inner scrollers too.
- `remotion/` is an independent sub-project; not part of the app build.

## Key references
- **`DESIGN.md`** — Warm Editorial visual spec (color/type/motion/components). Read before UI work.
- **`PRODUCT.md`** — register, users, brand voice, anti-references. Read before UI work.
- `design-samples/` — approved HTML prototypes (`2-warm-editorial.html`, `screens/*`) + `renders/`.
- `docs/COUNCIL-REVIEW.md` — adversarial audit: 83 confirmed findings, ranked. The fix backlog.
- `docs/AUTH-RLS-MIGRATION.md` — **Batch 3** runbook (auth + RLS). **Do before real production.**
- `docs/DEPLOYMENT.md` — Dokploy + self-hosted Supabase + CI/CD runbook.
- `docs/PLAN.md` — roadmap / feature→phase coverage.
- `docs/SECURITY-REMEDIATION.md`, `docs/SUPABASE.md`, `supabase/README.md` — backend background.
- `docs/superpowers/specs/*` — multi-hotel workspace + branch design specs.
