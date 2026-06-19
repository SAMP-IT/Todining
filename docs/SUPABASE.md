# ToDining — Supabase backend

The app reads through a synchronous in-memory cache that is **hydrated from**,
and **written through to**, Supabase. Postgres realtime keeps every device in
sync. The UI imports only from `src/data/services`, so no screens changed.

## Architecture

```
UI (pages/components)
   │  (unchanged — synchronous reads/writes)
src/data/services/*          ← business logic, calls getDb()/mutate()
   │
src/data/mock/store.ts       ← in-memory cache + Supabase sync engine
   ├─ bootstrapStore()       ← hydrate cache on startup (self-seeds an empty DB)
   ├─ mutate(fn)             ← diff cache before/after → write-through to Supabase
   └─ realtime subscription  ← Postgres change → refetch table → emit bus → re-render
   │
src/data/supabase/client.ts  ← createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
src/data/supabase/mappers.ts ← camelCase ⇄ snake_case row mappers (one per table)
```

**Fallback:** if the env vars are absent, the app runs entirely on `localStorage`
exactly as before — useful for offline dev.

## Environment variables (`.env`)

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
```

Only the **anon/publishable** key belongs here. The **service_role** key must
never be used in the frontend — `VITE_*` vars are bundled into the public build.

## One-time setup

1. Supabase Dashboard → **SQL Editor** → paste **`supabase/setup.sql`** → **Run**.
   Creates the tables (TEXT primary keys), demo RLS, and the realtime publication.
2. `npm run dev`. On first load the app self-seeds the demo data into Supabase.

## Tables

`restaurants`, `staff`, `menu_categories`, `menu_items`, `tables`, `qr_codes`,
`inventory_items`, `upsell_rules`, `customers`, `orders`, `order_items`,
`service_requests`, `reservations`, `bills`, `feedback`, `notifications`.

Every tenant-scoped table carries `restaurant_id`. Primary keys are `TEXT`
(the app generates ids like `mi_…`, `ord_…`).

## Security posture

`setup.sql` ships **demo-grade RLS** (anon can read + write) because the app
currently uses a mock staff login. **Before production:** wire Supabase Auth and
replace those policies with the auth-scoped ones in `supabase/policies.sql`
(`is_manager_of()` / `auth_restaurant_id()`).

## Known limitations (demo scope)

- `menu_items.recipe` (inventory auto-deduct) and `bills.items` are not yet
  round-tripped to their child tables — core menu/order/table flows are complete.
- Demo RLS is permissive; tighten with Supabase Auth for production.
