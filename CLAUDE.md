# CLAUDE.md — ToDining (SmartDine)

> **ToDining** — a modern, mobile-first **Smart Restaurant Management SaaS**: QR table
> ordering, live kitchen & waiter boards, reservations, billing, inventory, rule-based
> "AI" upselling, WhatsApp-style notifications, analytics, and multi-restaurant (multi-tenant)
> isolation.
>
> The product is branded **ToDining** (`package.json`, `docs/PLAN.md`). Older docs, the
> README, and `docs/SECURITY-REMEDIATION.md` still call it **SmartDine** — same app.

---

## 🔀 Backend pivot: Supabase → plain PostgreSQL + our own API (read this first)

**As of 2026-07-17 we are ABANDONING Supabase.** The self-hosted Supabase stack (Kong gateway on
Dokploy's Swarm overlay) hit unfixable networking failures (`gateway endpoint not found`,
`name resolution failed`). The replacement is **plain PostgreSQL + a thin Node/Express API** in
**`server/`** — it deploys exactly like the WEB app (Dockerfile → Dokploy Application), sidestepping
all the Supabase/overlay pain.

- `server/schema.sql` — 17 tables, TEXT PKs, **no RLS / no realtime** (those were Supabase concepts).
- `server/index.js` — the API: `GET /api/bootstrap` (hydrate all tables) + `POST /api/sync`
  (`{table, upserts, deletes}`). Built + **verified end-to-end** on a throwaway Postgres.
- `server/Dockerfile` — deploys as its own Dokploy **Application** at `https://api.todining.com`.

**State:** the WEB app is **LIVE at `https://todining.com`** (real domain + Let's Encrypt), but still
runs on its **localStorage fallback** — the frontend data-layer rewire (Supabase client → `fetch()`
the `server/` API) is **the next task**. The old `supabase/*` + the Dokploy `supabase` service are
**legacy / being deleted**.

## ⚠️ Production readiness: security status

Council-review criticals (`docs/COUNCIL-REVIEW.md`, an adversarial multi-agent audit):

- ✅ **FIXED — `/admin` open bypass.** The `open` flag is gone; `/admin` now requires an
  authenticated manager/owner (`src/app/router.tsx`); `DashboardLayout` defaults to least-privilege.
- ✅ **FIXED — console credential/PII logging.** Removed the hash-logging block in `adminAuthService`,
  the `[DEBUG-MENU]` log in `MenuPage`, and set esbuild to **drop all `console.*`/`debugger` from
  production builds** (`vite.config.ts`).
- ✅ **FIXED — no real lint gate.** `npm run lint` now actually type-checks (see Commands).
- ⚠️ **PENDING — no real auth (the big one).** Auth is client-trust only (forgeable localStorage).
  With the new architecture, real auth = a **server-side pass in `server/`** (scope every query by the
  caller's `restaurant_id` — the replacement for Supabase RLS). The API is currently **OPEN**.
- ⚠️ **PENDING — `/api/sync` is unauthenticated** — accepts any table/row from anyone (matches the
  app's current demo posture; lock down in the auth pass).
- ⚠️ **PENDING — hardcoded admin creds + weak hashing.** `adminAuthService.LOCAL_FALLBACK`
  (`SAMP-IP(manoj)`/`mavoc-2026`) still ships; djb2 "hashing" (`src/lib/password.ts`) + committed creds
  in `supabase/migrations/0005`.

Also: the repo (`SAMP-IT/Todining`) is currently **public** — `docs/COUNCIL-REVIEW.md` (the vuln list)
and the demo credential hashes are visible. Consider making it private before real production.

---

## Tech stack

- **Build/runtime:** Vite 6, React 18, TypeScript 5.7 (`"type": "module"`, ESM).
- **Routing:** `react-router-dom` v6 (`createBrowserRouter`, route-level `lazy()` code-splitting).
- **State:** `zustand` v5 is a **dependency but unused**; state is React Context (Auth, AdminAuth,
  Tenant, Cart, ModuleUpdates) + the in-memory store.
- **Forms/validation:** `react-hook-form` + `zod` (`@hookform/resolvers`).
- **Backend:** **our own Node/Express API over PostgreSQL** (`server/`). The frontend still imports
  `@supabase/supabase-js` until the data-layer rewire lands (see Backend pivot above).
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
localStorage fallback (each browser isolated, no shared data).

Target env once the API rewire lands (set as Docker build args on the Dokploy **WEB** app):
```
VITE_API_URL=https://api.todining.com    # the new Node API in server/
```
Legacy (being removed): `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` selected the Supabase backend
via `isSupabaseEnabled` (`src/data/supabase/client.ts`). Never ship a DB password in any `VITE_*` var
— it lands in the public bundle.

---

## Deployment & Infrastructure (live)

Hosted on the user's **self-managed Dokploy server** (`51.79.254.198`), not a managed PaaS. Full
runbook: `docs/DEPLOYMENT.md` (its Supabase sections are now legacy). Domains are on **GoDaddy**
(A records → the server IP; `todining.com`, `www`, `api` all resolve). TLS is Let's Encrypt via
Dokploy/Traefik.

- **Frontend (WEB app):** **`https://todining.com`** (+ `www`) — Dokploy *Application* built from this
  repo's root `Dockerfile` (node:22 build → nginx:1.27 serve; SPA fallback + caching in
  `deploy/nginx.conf`). Source: GitHub `SAMP-IT/Todining` `main` via the **Git provider** (public
  repo). `VITE_*` passed as Docker **build args**.
- **Backend (PostgreSQL + own API — replacing Supabase):**
  - **Postgres** → a Dokploy native **Database** (one click, auto-backups). Run `server/schema.sql`.
  - **API** → `server/` deployed as a Dokploy **Application** from `server/Dockerfile` (like the WEB
    app) → `https://api.todining.com`. Endpoints: `GET /api/bootstrap`, `POST /api/sync`. Cross-device
    realtime (live boards) = a WebSocket in the same `server/` (fast follow).
  - **Why the switch:** the self-hosted Supabase Compose stack (Kong + Swarm overlay) had unfixable
    networking. A plain app+DB uses Dokploy's normal networking — the path the WEB app + the user's
    other projects already use. The old `supabase` Dokploy service is being **deleted**.
- **CI/CD:** one workflow, `.github/workflows/ci.yml`:
  - `ci` job — `npm run lint` + `npm run build` on every push/PR to `main`.
  - `deploy` job — `needs: ci` (so a red build can **never** ship) and only on a push to `main`;
    POSTs the Dokploy WEB app's deploy webhook, read from repo secret **`DOKPLOY_DEPLOY_URL`**
    (Settings → Secrets and variables → Actions), with a GitHub-shaped `{"ref":"$GITHUB_REF"}` body
    (Dokploy validates the branch from the payload). Dokploy then clones `main` and rebuilds.
  - Deliberately *not* a raw GitHub→Dokploy webhook: that redeploys on every push even when CI is red.
  - Each Dokploy service has its own deploy webhook; CI triggers only the **WEB** app's.
- **Git:** push with the **Manoj-V-348** GitHub account (`gh auth switch --user Manoj-V-348`). It has
  push (not admin), so it **cannot** create repo secrets/webhooks or re-run Actions — the user does those.

---

## Architecture

### Data layer (the core idea)
Every screen imports **only** from `src/data/services/*` (a typed service abstraction). Services
read/write a **synchronous in-memory store** (`src/data/mock/store.ts`) that:
- is **hydrated on boot** by `bootstrapStore()` (gated by `DataGate` in `src/app/App.tsx`),
- persists to **localStorage**,
- **write-throughs to the backend** — currently `src/data/supabase/*` (being replaced by `fetch()` to
  the `server/` API: hydrate via `/api/bootstrap`, persist diffs via `/api/sync`); `mappers.ts`
  (row ↔ domain, snake_case) is kept.
- broadcasts changes over an in-app **realtime event bus** (`src/data/realtime/bus.ts`); cross-device
  realtime will come from the API WebSocket. UI subscribes via `useLiveQuery` / `useRealtime`.

Because the UI only knows the service interface, **swapping the backend requires no UI changes**.

### Directory map
```
Dockerfile, .dockerignore   Production image for the FRONTEND (Vite build → nginx). deploy/nginx.conf.
.github/workflows/ci.yml    CI/CD: lint + build, then a deploy gated on a green build.
server/                     NEW backend: schema.sql (plain Postgres, 17 tables), index.js (Node/Express
                            API: /api/bootstrap + /api/sync), Dockerfile. Its own Dokploy Application.
src/
  app/            App shell (App.tsx = providers + DataGate), router.tsx
  components/ui/  Design-system primitives: Button, Card, Input, Modal, Badge, StatusBadge, ...
  components/layout/  DashboardLayout, StaffLayout, RoleGuard, AdminPanelGuard, RestaurantSwitcher, Brand
  context/        AuthContext (staff), AdminAuthContext (/admin-panel), TenantContext, CartContext, ModuleUpdatesContext
  data/services/  menuService, orderService, billingService, staffService, adminAuthService, ...
  data/mock/      seed.ts (demo data), store.ts (in-memory cache + localStorage + backend write-through)
  data/realtime/  bus.ts (subscribe/emit event bus)
  data/supabase/  client.ts, mappers.ts (row ↔ domain — SOURCE OF TRUTH for columns; mappers stay,
                  client.ts is being replaced by API fetches)
  features/       menu, cart, orders, kitchen, waiter, reservations, billing, feedback, inventory, tables, service-requests, staff, customer, upsell
  hooks/          useLiveQuery, useRealtime
  lib/            cn, format, id (string ids), password (DEMO djb2), roles
  pages/          thin route components: LandingPage, LoginPage, AdminPanel*, admin/*, customer/*, staff/*
  styles/         index.css (Tailwind layers + design tokens)
supabase/         LEGACY (being removed): setup-selfhost.sql, schema.sql, policies.sql, migrations/*, README.md
docs/             PLAN.md, COUNCIL-REVIEW.md (audit), DEPLOYMENT.md, AUTH-RLS-MIGRATION.md (Supabase-
                  specific, OBSOLETE), SECURITY-REMEDIATION.md, SUPABASE.md (legacy), superpowers/specs/*
remotion/         independent Remotion project (explainer videos); NOT part of the app build
```

### Path alias
`@/` → `src/` (configured in `vite.config.ts` / `tsconfig`).

---

## Routing & roles

Routes (`src/app/router.tsx`):
- `/` and `/login` → **LoginPage** (default entry).
- `/site`, `/landing` → public **LandingPage**.
- `/admin-panel` → **AdminPanelEntry**, wrapped by `AdminPanelGuard` (username/password vs `admin_users`).
  Card-based workspace launcher.
- `/admin/*` → **DashboardLayout**, `RoleGuard roles={['manager','owner']}` (now auth-required — the
  `open` bypass was removed). Children: Dashboard, analytics, categories, orders, tables, menu,
  reservations, inventory, billing, feedback, notifications, staff, restaurants.
- `/kitchen` → `RoleGuard ['kitchen','manager','owner']` → StaffLayout → KitchenPage.
- `/waiter` → `RoleGuard ['waiter','manager','owner']` → StaffLayout → WaiterPage.
- Customer (QR, no auth): `/r/:slug/t/:tableId` (menu) → `cart` → `order/:orderId` (track); `/reserve/:slug`.
- `*` → NotFoundPage.

Roles: `owner | manager | waiter | kitchen` (`src/lib/roles.ts`). `ROLE_CONFIG` sets each role's
`home` + allowed prefixes; `RoleGuard` enforces **client-side only** (real enforcement will live in
the `server/` API).

---

## Security model & the pending auth pass (now server-side, not Supabase RLS)

**Two client-trust auth surfaces today:**
- **Staff** (`AuthContext` + `staffService`): login by email/username; owners need a djb2 password,
  other roles are password-less demo cards. Session = staff **id in localStorage** → forgeable.
- **Admin Panel** (`AdminAuthContext` + `adminAuthService`): username/password vs `admin_users`
  (or the hardcoded `LOCAL_FALLBACK`); session = `{username, expiresAt}` in localStorage.

**The auth pass (reframed for the Postgres + own-API architecture — `docs/AUTH-RLS-MIGRATION.md` is now
obsolete; it was Supabase-specific):**
1. Add real auth **in `server/`**: sign-in endpoint (bcrypt/argon2), issue a signed session token/JWT.
2. Frontend sends the token with `/api/bootstrap` + `/api/sync`; the API scopes every query to the
   caller's `restaurant_id` **server-side** (the replacement for RLS).
3. Gate `/api/sync` writes by role; remove `adminAuthService.LOCAL_FALLBACK`; replace djb2; rotate creds.
Already done in earlier batches: `/admin` open bypass removed, console credential/PII logging stripped,
real lint gate.

---

## Feature modules (16, per `docs/PLAN.md`)

QR ordering · digital menu · cart + rule-based upsell · orders/lifecycle · kitchen board · waiter
board · waiter-call service requests · tables + QR management · reservations · billing (tax/service
charge, jsPDF export, history, per-year `invoice_number`) · feedback (food/service/experience) ·
inventory (stock + low-stock alerts; note: recipe auto-deduct is NOT persisted to the DB — see
`docs/COUNCIL-REVIEW.md` H6) · WhatsApp notifications (preview/log only) · analytics (recharts) ·
multi-restaurant + branches (`parent_id`) · staff & categories management.

Integrations are **stubbed behind interfaces**: "AI upselling" = rule-based `upsellService`;
"WhatsApp" = `notificationService` (logs the message, no real send).

## Data model

**The app uses TEXT primary keys** — it generates string ids (`rest_…`, `ord_…`, `stf_…`, via
`src/lib/id.ts`). The schema to run on the new Postgres is **`server/schema.sql`** (17 tables incl.
`admin_users`, TEXT PKs, no RLS/realtime — those were Supabase concepts). The legacy
`supabase/setup-selfhost.sql` has the same tables but with Supabase RLS/publication cruft. The
**source of truth for columns is `src/data/supabase/mappers.ts`** (snake_case rows).

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
- Keep the **service interface stable** — the mock store and the backend path must stay swap-compatible.
- Existing code is **densely commented** with rationale; match that voice when editing.
- Realtime: components re-query via `useLiveQuery(fn, { types: [...] })` on bus events; mutations must
  `realtimeBus.emit(...)`. Cross-device realtime will come from the `server/` API WebSocket (the old
  Supabase `postgres_changes` subscription is being removed).
- When editing the DB-facing shape, `mappers.ts` and `server/schema.sql` must stay in sync.
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
- `server/` — the **new PostgreSQL + Node API** backend (schema, API, Dockerfile).
- `docs/COUNCIL-REVIEW.md` — adversarial audit: 83 confirmed findings, ranked. The fix backlog.
- `docs/DEPLOYMENT.md` — Dokploy + CI/CD runbook (Supabase sections now legacy).
- `docs/AUTH-RLS-MIGRATION.md` — OBSOLETE (Supabase auth+RLS; superseded by server-side auth in `server/`).
- `docs/PLAN.md` — roadmap / feature→phase coverage.
- `docs/SECURITY-REMEDIATION.md`, `docs/SUPABASE.md`, `supabase/README.md` — legacy Supabase background.
- `docs/superpowers/specs/*` — multi-hotel workspace + branch design specs.
