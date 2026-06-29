# Multi-Hotel Workspace Platform — Design

Date: 2026-06-23
Status: Approved for implementation (user requested completion without further questions)

## 1. Context & key finding

The codebase (ToDining, React + Vite + TS) is **already multi-tenant at the data
layer**. Every domain entity carries `restaurantId`, and every service filters by
it (`menuService.items(restaurantId)`, `staffService.list(restaurantId)`, …). A
`TenantContext` tracks the active tenant; `RestaurantSwitcher` and
`RestaurantsPage` already render tenants as cards with isolated stats. A Supabase
write-through store (`src/data/mock/store.ts`) hydrates an in-memory cache and
syncs mutations.

So the spec's `hotel_id` **maps directly onto the existing `restaurantId`**. We do
NOT rename columns (high-risk, no functional gain) — "hotel" in the UI === the
existing restaurant tenant. The genuinely new work is narrower than the 11 steps
imply.

## 2. Decisions (safe defaults, chosen without blocking the user)

| Topic | Decision | Why |
|------|----------|-----|
| Isolation model | **App-level filtering enforced now (already exists) + RLS-ready schema + a migration that ships RLS policies** | Customer QR site uses the anon key with no auth; turning on hard RLS today would break the public ordering flow. Full Supabase Auth is large/risky and out of safe scope. We harden the schema and ship policies that can be enabled when real auth lands. |
| Admin tiers | Single open platform admin sees/creates all hotels at `/admin-panel`; each created hotel gets an **owner login (email/username + password)** that lands in that hotel | Closest to today's open `/admin`; delivers every visible spec feature without standing up a new auth tier. |
| Terminology | UI says "Hotel Workspace"; internal field stays `restaurantId` | Avoids a risky mass rename of schema + 20 files. |
| Sequencing | One pass, but logically grouped | User asked to complete now. |
| Branch support (Step 8) | Add nullable `parentId` to `Restaurant` + `parent_id` column | Cheapest forward-compatible hook; no behavior change. |
| Passwords | One-way non-crypto hash (`src/lib/password.ts`), stored as `password_hash` | Avoids plaintext-at-rest while keeping services synchronous. **Documented as demo-grade — production must use Supabase Auth.** |

## 3. Scope — what we build

1. **Hotel Workspace Dashboard** (`/admin-panel`, rewrite of `AdminPanelEntry`):
   grid of one card per hotel + "Create New Hotel Workspace". Clicking a card →
   confirm dialog "Switch to <name> Workspace?" → sets active tenant → navigates
   to `/admin`. (Steps 1, 3, 4.)
2. **Create-workspace flow**: `restaurantService.create()` provisions a hotel +
   default settings + 5 default categories + 4 tables/QRs + an owner staff with
   credentials, then the card appears live. Form: name, owner email/username,
   password, logo color, description, tagline. (Step 2.)
3. **Credential auth**: `staffService.authenticate(identifier, password)` matches
   by email OR username; `AuthContext.login` gains an optional password; demo
   seeded staff (no password) still log in via role quick-cards. `LoginPage` gets
   a password field.
4. **Data isolation** (Steps 5–7): already enforced via `restaurantId` filtering;
   the create flow scopes all default data to the new hotel id. Verified, not
   rebuilt.
5. **Website sync** (Step 6): already correct — customer site resolves by `:slug`
   (per-hotel URLs); admin/website identity flows from `TenantContext`, persisted
   across reloads via `localStorage`. No change needed.
6. **DB hardening** (Steps 8–10): `supabase/migrations/0001_multi_tenant.sql`
   adds `created_by`, `created_at`, `updated_at`, `restaurant_id` indexes to every
   tenant table; `restaurants.description/logo_url/parent_id`; `staff.username/
   password_hash`; and RLS policies (shipped, with notes on enabling them).
   Mappers updated to read/write the new restaurant/staff columns.

## 4. Non-goals (YAGNI)

- No full Supabase Auth / JWT migration (documented as the production follow-up).
- No hotel deletion (cascading delete across 15 tables is risky; not in spec).
- No column rename `restaurant_id` → `hotel_id`.
- No actual branch CRUD — only the schema/`parentId` hook.

## 5. Data isolation guarantee

Every read path already funnels through a service that filters by `restaurantId`;
the workspace dashboard and create flow introduce no global reads of tenant data.
The migration adds DB-level indexes and RLS scaffolding so isolation can be moved
into Postgres when real auth is added. See [[realtime-sync-contract]] — services
continue to emit `data:changed` so the live customer site and admin stay in sync
after a workspace is created or switched.

## 6. Risks

- Adding columns to `toRow` means an **un-migrated Supabase DB will reject writes**
  to `restaurants`/`staff`. Mitigation: migration ships in-repo; `fromRow` tolerates
  missing columns (`?? undefined`) so hydration of an old DB still works.
- localStorage fallback (no Supabase env) is unaffected.
