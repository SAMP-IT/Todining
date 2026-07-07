# SmartDine — Multi-Tenant Security Remediation

> **Status: CRITICAL — not yet enforced.** Tenant isolation is currently
> client-side only. The public `anon` key can read *and* write every hotel's
> data. This document is the ordered runbook to make isolation real at the
> database layer. Steps 1–3 require the Supabase **service_role** key / SQL
> editor access (not available to the app, by design).

## Why it's broken today

- The app never authenticates with Supabase Auth. `AuthContext.login` →
  `staffService.authenticate()` checks the in-memory cache; the Supabase client
  (`src/data/supabase/client.ts`) uses only the anon key with
  `persistSession: false`. So **every** DB request runs as role `anon` and
  `auth.uid()` is always NULL.
- `supabase/policies.sql` gates every staff table on `auth_restaurant_id()`
  (which reads `auth.uid()`). With no auth, those policies would return 0 rows —
  yet the live DB returns all rows to anon. **Therefore RLS is not enabled on
  the live project** (or the policies were never applied).

Verified live (anon key only): readable rows — staff 13, orders 20, bills 5,
reservations 9, feedback 5, inventory 8, notifications 7, customers 1, across 6
tenants. That is full cross-tenant read/write exposure.

## The fix must ship in this order (RLS-first without auth = total lockout)

### Step 1 — Provision Supabase Auth users for existing staff (service_role)
For every row in `staff`, create an `auth.users` entry (email + password) and
capture its UUID. Requires the Admin API / service_role:

```
// server-side, service_role key — NEVER in the browser bundle
const { data, error } = await admin.auth.admin.createUser({
  email: staff.email,
  password: <temp or migrated>,
  email_confirm: true,
});
// then: UPDATE staff SET auth_uid = data.user.id WHERE id = staff.id;
```

Add the column if missing: `alter table staff add column if not exists auth_uid uuid;`

### Step 2 — Wire the app to Supabase Auth (code change)
- On login: `await supabase.auth.signInWithPassword({ email, password })`, then
  keep the local `staffService` lookup for role/profile.
- Move `bootstrapStore()` hydration to run **after** a session exists, so the
  initial `SELECT *` is made as the authenticated user (RLS then scopes it).
- On hotel/branch creation, create the owner's auth user too.

### Step 3 — Enable RLS (service_role / SQL editor)
Only after Steps 1–2 are live and tested on staging:

```
-- policies.sql already defines the policies; ensure RLS is actually ON:
alter table restaurants, staff, tables, qr_codes, menu_categories, menu_items,
  inventory_items, menu_item_ingredients, orders, order_items, service_requests,
  reservations, customers, bills, feedback, upsell_rules, notifications
  enable row level security;
-- then (re)apply supabase/policies.sql
```

### Step 4 — Verify isolation is real (re-run the anon probe)
With the anon key, these MUST now return 0 rows (or only public catalog):

```
curl -s -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Prefer: count=exact" -H "Range: 0-0" -i \
  "$URL/rest/v1/orders?select=id" | grep -i content-range
# expect: 0-0/0  (was 0-0/20)
```

Repeat for staff, bills, reservations, feedback, inventory_items,
notifications, customers. Log in as a staff member of Hotel A and confirm you
see only Hotel A's rows.

## Defense-in-depth (after the above)
- Scope realtime: `src/data/mock/store.ts` subscribes to ALL `postgres_changes`
  in `public` and refetches with `SELECT *`. Once RLS is on, refetches are
  auto-scoped, but consider filtering the channel by the active `restaurant_id`
  to cut cross-tenant fan-out and re-renders.
- Review `tableService.ensure()` — it inserts `tables`/`qr_codes` from the
  customer QR path as anon; under RLS this needs a dedicated public insert
  policy or a server function.
