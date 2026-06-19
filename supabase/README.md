# ToDining — Supabase backend

The app currently runs on a swappable in-memory data layer (`src/data/mock` +
`src/data/services`). This folder contains everything needed to move to a real
Supabase backend **without changing any UI code** — only the service
implementations are repointed.

## 1. Create the database

In the Supabase SQL editor, run in order:

1. `schema.sql` — tables, enums, indexes, triggers
2. `policies.sql` — Row Level Security for multi-tenant isolation
3. `seed.sql` — (optional) demo data for Spice Garden & Café Aroma

## 2. Configure the app

Copy `.env.example` → `.env` and fill in your project values:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

## 3. Repoint the services

Each file in `src/data/services/*` exposes the same interface the UI consumes.
To go live, swap the in-memory bodies for Supabase queries (see
`src/data/supabase/client.ts`) and replace the realtime bus subscription with
`supabase.channel(...).on('postgres_changes', ...)`. Because the UI only ever
imports from `src/data/services`, nothing else changes.

## Multi-tenancy

Every table carries `restaurant_id`. RLS guarantees:

- **Staff** (authenticated) can only read/write rows for their own restaurant
  (resolved from the `staff.auth_uid → restaurant_id` link).
- **Customers** (anonymous QR users) can read the public catalog (menu, tables,
  restaurant) and insert orders / reservations / service requests / feedback —
  but can never read another tenant's data.
