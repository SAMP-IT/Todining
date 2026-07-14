# ToDining — Auth + RLS Migration Runbook (Batch 3)

> Goal: make tenant isolation **real at the database layer** by authenticating staff
> with Supabase Auth and enabling the RLS policies that already exist in
> [`supabase/policies.sql`](../supabase/policies.sql), **without breaking the anonymous
> customer QR ordering flow**.
>
> This operationalizes [`docs/SECURITY-REMEDIATION.md`](./SECURITY-REMEDIATION.md) into an
> ordered, reversible runbook. It closes criticals **C2, C3, C4** and highs **H1, H12** from
> [`docs/COUNCIL-REVIEW.md`](./COUNCIL-REVIEW.md).

---

## ⛔ STOP — read before touching the live project

You told me there is **only the live/production project** (no staging). Enabling RLS in the
wrong order, or with a policy bug, returns **0 rows to everyone** — a total outage. Before the
RLS flip (Step 5) you **must** do at least one of:

1. **Clone a staging project** (Supabase → *Create project* → restore a backup of prod into it),
   run Steps 3–6 there first, and only then repeat on prod. *(Strongly recommended.)*
2. At minimum: take a **full database backup** (Supabase → Database → Backups, or `pg_dump`),
   pick a **low-traffic maintenance window**, and keep the **rollback command** (Step 7) open in
   another tab.

The code changes (Steps 1–2 below) are safe to ship ahead of time — they change nothing until
Supabase Auth users exist and RLS is turned on.

---

## The model (why this is safe for customers)

| Actor | How they're identified | What they can touch |
|---|---|---|
| **Customer** (QR guest) | anonymous (`anon` key, no login) | **read** public catalog (`restaurants`, `menu_items`, `menu_categories`, `tables`, `qr_codes`, `upsell_rules`); **insert** `orders`, `order_items`, `service_requests`, `reservations`, `feedback` (validated) |
| **Staff** (owner/manager/waiter/kitchen) | Supabase Auth user → `staff.auth_uid = auth.uid()` | read/write **only their own** `restaurant_id`'s rows (RLS via `auth_restaurant_id()`) |
| **Platform admin** (`/admin-panel`) | Supabase Auth user flagged as platform admin | create/list hotels |

`policies.sql` already encodes exactly this. The only reason it isn't working is that the app
never signs anyone in, so `auth.uid()` is always NULL — which is why RLS was left off and the
anon key can currently read everything.

---

## Steps (ordered — do NOT reorder; auth must exist before RLS or everyone is locked out)

### Step 1 — Client code: Supabase Auth wiring  *(Me — in progress)*
- [x] `src/data/supabase/client.ts`: enable session persistence (`persistSession: true`).
- [ ] `AuthContext` + `LoginPage`: `supabase.auth.signInWithPassword`; resolve the `Staff` row
      from `auth.uid()` (`staff.auth_uid`) instead of a client-writable `localStorage` id (fixes **C4**).
      Keeps the current localStorage path as a **DEV-only** fallback when no Supabase is configured.
- [ ] `logout()` → `supabase.auth.signOut()`.

### Step 2 — Client code: auth-aware data loading + realtime scoping  *(Me)*
- [ ] Store boots by hydrating **public catalog only** (works as `anon`); after a staff session
      exists, **re-hydrate** to pull that tenant's now-visible rows (orders, bills, staff, …).
      On logout, drop tenant rows back to public-only.
- [ ] Scope the realtime channel + refetch to the active `restaurant_id` (fixes cross-tenant
      fan-out **and** the multi-device alert misses, **H8**).
- [ ] Move `/admin-panel` auth off the anon-readable `admin_users` table onto a Supabase Auth
      platform-admin user; then the `anon` SELECT grant can be revoked (**C3**).

### Step 3 — Provision Supabase Auth users for existing staff  *(You — needs `service_role`)*
Run the script I provide (`scripts/provision-auth-users.mjs`) **with `--dry-run` first**:
```bash
# Never commit these. Set in your shell only.
export SUPABASE_URL="https://<ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service_role key>"
node scripts/provision-auth-users.mjs --dry-run   # preview: which staff → which auth users
node scripts/provision-auth-users.mjs             # create auth.users, set staff.auth_uid
```
It creates an `auth.users` row (email + a temporary password you rotate) for every `staff` row,
sets `staff.auth_uid`, and provisions the platform-admin user.
> ⚠️ **Open item — duplicate emails.** `staff.auth_uid` is `UNIQUE`, and `auth.users.email` is
> unique, so an email reused across hotels (the app currently allows this) can only bind to **one**
> staff row. The dry run lists any collisions; those owners need distinct emails (or we relax the
> model). Resolve before the real run.

### Step 4 — Apply schema/policy hardening  *(You — SQL editor)*
Apply `supabase/migrations/0009_auth_rls_hardening.sql` (I provide): tightens the public INSERT
policies from `with check (true)` to validate a real `restaurant_id`, and revokes the `anon`
SELECT on `admin_users`. (Run **after** Step 2's admin-auth change is deployed, or admin-panel
login breaks.)

### Step 5 — Enable RLS + apply policies  *(You — staging first, then prod)*
```sql
-- policies.sql already runs `alter table … enable row level security;` and defines every policy.
-- Apply it in full:
\i supabase/policies.sql
```

### Step 6 — Verify isolation is real  *(You)*
With **only the anon key**, these MUST now return `0` (were returning all rows):
```bash
curl -s -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Prefer: count=exact" -H "Range: 0-0" -i \
  "$SUPABASE_URL/rest/v1/orders?select=id" | grep -i content-range   # expect 0-0/0
```
Repeat for `staff`, `bills`, `reservations`, `feedback`, `inventory_items`, `notifications`,
`customers`, `admin_users`. Then in the app:
- Sign in as an owner of Hotel A → confirm you see **only** Hotel A's data.
- Scan a table QR as a guest → confirm the menu loads and you can place an order (public flow intact).

### Step 7 — Rollback (if anything is wrong)
```sql
-- Immediately restores the pre-migration behavior (app works, isolation off again):
alter table restaurants, staff, tables, qr_codes, menu_categories, menu_items,
  inventory_items, menu_item_ingredients, orders, order_items, service_requests,
  reservations, customers, bills, feedback, upsell_rules, notifications, admin_users
  disable row level security;
```
If data was altered, restore the Step‑0 backup.

---

## Status
- **Done:** Step 1 session persistence.
- **Next (me):** Step 1 auth wiring → Step 2 hydration/realtime → the `0009` SQL + provisioning script.
- **Waiting on you (when code lands):** clone/backup, then Steps 3–6.
