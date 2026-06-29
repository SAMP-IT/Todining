# Branch Management — Design

Date: 2026-06-26
Status: Approved (user approved direction and requested implementation)

## 1. Context & key finding

The multi-hotel platform is already multi-tenant at the data layer: every domain
entity carries `restaurantId`, every service filters by it, `TenantContext`
tracks the active tenant, and the Supabase write-through store hydrates a
synchronous cache and syncs mutations + realtime. The original multi-hotel design
([[2026-06-23-multi-hotel-workspace-design]]) deliberately added a nullable
`parentId`/`parent_id` hook to `Restaurant`/`restaurants` and deferred branch
CRUD as a non-goal.

**Key finding:** a branch is simply a `Restaurant` whose `parentId` points at its
parent hotel. A hotel is a restaurant with `parentId === null`, and its own data
serves as its **Main Branch**. This reuses 100% of the per-`restaurantId`
infrastructure (menu, categories, tables, QR, orders, reservations, staff,
inventory, billing, feedback, notifications, settings), so **data isolation,
real-time sync, and per-branch workspaces come for free** with no new per-table
plumbing.

## 2. Decisions

| Topic | Decision | Why |
|------|----------|-----|
| Hotel/branch model | **Model B — hotel is its own Main Branch; branches are child restaurants (additive)** | Backward-compatible: the 2 existing hotels keep their data untouched as their Main Branch. No data migration. |
| Branch UX | **Expand the hotel card in `/admin-panel`** to reveal branches + Create Branch | Matches "Create Branch appears only after selecting a hotel". |
| Branch identity fields | New columns on `restaurants`: `code, address, phone, email, manager, status` | A branch IS a restaurant; these just describe it. Consistent with existing pattern. |
| Branch provisioning | New branch gets default categories/tables/QRs + inherits hotel branding & settings; no separate owner login (manager is free text) | Mirrors hotel provisioning; branch staff added later via the Staff page. |
| Website branch selection | `/site` shows a "Select Branch" screen when the active hotel has ≥1 branch; picking one activates that branch | Requirement #4. |

## 3. Scope — what we build

1. **Migration** `supabase/migrations/0003_branches.sql` — idempotent; adds the 6
   columns + a `(parent_id, status)` index.
2. **Types** — `Restaurant` gains optional `code, address, phone, email, manager,
   status: 'active'|'inactive'`.
3. **Mappers** — `restaurants` `toRow`/`fromRow` map the 6 new columns.
4. **restaurantService** — `listHotels()` (parentId null), `listBranches(hotelId)`,
   `createBranch(input)` (provisions a child restaurant), and a shared
   `provisionDefaults()` helper reused by `create()`.
5. **TenantContext** — `hotels` and `branchesOf(hotelId)` helpers.
6. **AdminPanelEntry** — cards from `listHotels()`; each card expands to Main
   Branch + child branches (each enters that workspace) + a Create Branch modal
   with the 8 form fields.
7. **LandingPage (`/site`)** — branch-selection screen for a hotel with branches;
   a "Branches" switch affordance on the rendered site; fallback uses first hotel.

## 4. Non-goals (YAGNI)

- Branch deletion (cascading delete across 15 tables is risky; not requested).
- Regrouping the admin `RestaurantSwitcher` by hotel (keeps the flat list).
- Per-branch RLS / Supabase Auth (tracked as the production follow-up).

## 5. Isolation & realtime guarantee

Every read already funnels through a service filtered by `restaurantId`;
`createBranch` scopes all default data to the new branch id and emits
`data:changed {entity:'all'}`, so the workspace manager, switcher and live site
re-read immediately. Main Branch never sees Anna Nagar's data because they are
different `restaurantId`s.

## 6. Risks

- `restaurants.toRow` now always writes the 6 new columns, so an **un-migrated DB
  rejects writes to `restaurants`** (hotels AND branches). Mitigation: `0003`
  ships in-repo and must be applied; `fromRow` tolerates missing columns
  (`?? undefined`) so hydrating an old DB still works; the store re-hydrates on a
  write failure so the UI never shows a phantom card.
