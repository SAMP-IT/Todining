-- ─────────────────────────────────────────────────────────────────────────────
-- Multi-Hotel Workspace Platform — multi-tenant hardening
--
-- Run this against your single Supabase project (SQL Editor or `supabase db push`).
-- It is idempotent: every statement uses IF NOT EXISTS / IF EXISTS guards so it is
-- safe to re-run.
--
-- Tenancy model: every tenant-scoped table already carries `restaurant_id`
-- (this IS the spec's `hotel_id`). This migration:
--   1. Adds the audit columns the spec requires (created_by/created_at/updated_at).
--   2. Adds the new workspace columns (restaurants.description/logo_url/parent_id,
--      staff.username/password_hash).
--   3. Indexes every restaurant_id for scale (thousands of hotels/orders).
--   4. Ships Row Level Security policies (see the RLS section — read its notes
--      before enabling, because the public customer ordering flow uses the anon
--      key and must keep working).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New workspace columns ────────────────────────────────────────────────
alter table public.restaurants add column if not exists description     text;
alter table public.restaurants add column if not exists logo_url        text;
alter table public.restaurants add column if not exists parent_id       text references public.restaurants(id);
alter table public.restaurants add column if not exists created_by      text;
alter table public.restaurants add column if not exists created_at      timestamptz default now();
alter table public.restaurants add column if not exists updated_at      timestamptz default now();

alter table public.staff add column if not exists username       text;
alter table public.staff add column if not exists password_hash  text;

-- ── 2. Audit columns on every tenant-scoped table ───────────────────────────
-- (orders/service_requests/reservations/bills/feedback/notifications already
--  have created_at; this only adds what's missing.)
do $$
declare
  t text;
  tenant_tables text[] := array[
    'staff','menu_categories','menu_items','tables','qr_codes','inventory_items',
    'upsell_rules','customers','orders','service_requests','reservations','bills',
    'feedback','notifications'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table public.%I add column if not exists created_by text', t);
    execute format('alter table public.%I add column if not exists created_at timestamptz default now()', t);
    execute format('alter table public.%I add column if not exists updated_at timestamptz default now()', t);
  end loop;
end $$;

-- ── 3. Indexes on restaurant_id (tenant filtering at scale) ──────────────────
do $$
declare
  t text;
  tenant_tables text[] := array[
    'staff','menu_categories','menu_items','tables','qr_codes','inventory_items',
    'upsell_rules','customers','orders','service_requests','reservations','bills',
    'feedback','notifications'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('create index if not exists idx_%I_restaurant on public.%I (restaurant_id)', t, t);
  end loop;
end $$;

create index if not exists idx_restaurants_parent on public.restaurants (parent_id);
create index if not exists idx_staff_username      on public.staff (username);

-- updated_at maintenance trigger (keeps the audit column honest on every UPDATE).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare
  t text;
  all_tables text[] := array[
    'restaurants','staff','menu_categories','menu_items','tables','qr_codes',
    'inventory_items','upsell_rules','customers','orders','service_requests',
    'reservations','bills','feedback','notifications'
  ];
begin
  foreach t in array all_tables loop
    execute format('drop trigger if exists trg_touch_%I on public.%I', t, t);
    execute format(
      'create trigger trg_touch_%I before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY  (READ THIS BEFORE ENABLING)
--
-- The current frontend uses ONLY the anon key and has no authenticated Supabase
-- session (login is application-level). The public customer ordering flow
-- (/r/:slug/t/:id) therefore reads with the anon role. If you enable strict
-- per-hotel RLS now, those anonymous reads will be blocked and the customer site
-- will break.
--
-- TWO SUPPORTED MODES — pick one:
--
-- ── MODE A (current app, recommended until you adopt Supabase Auth) ──
-- Keep tenant isolation enforced in the application service layer (every query
-- already filters by restaurant_id). Enable RLS with permissive anon policies so
-- the running app keeps working while RLS is "on" (defense for service-role only
-- writes). Uncomment to apply:
--
--   do $$ declare t text; all_tables text[] := array[
--     'restaurants','staff','menu_categories','menu_items','tables','qr_codes',
--     'inventory_items','upsell_rules','customers','orders','order_items',
--     'service_requests','reservations','bills','feedback','notifications'];
--   begin
--     foreach t in array all_tables loop
--       execute format('alter table public.%I enable row level security', t);
--       execute format('drop policy if exists anon_all on public.%I', t);
--       execute format('create policy anon_all on public.%I for all to anon using (true) with check (true)', t);
--     end loop;
--   end $$;
--
-- ── MODE B (true DB-level isolation — requires Supabase Auth) ──
-- Once each hotel owner/staff logs in via Supabase Auth and their JWT carries a
-- `hotel_id` claim (set with a custom access-token hook or app_metadata), replace
-- the permissive policy with a tenant-scoped one. Example for menu_items:
--
--   alter table public.menu_items enable row level security;
--   drop policy if exists tenant_isolation on public.menu_items;
--   create policy tenant_isolation on public.menu_items
--     for all to authenticated
--     using  (restaurant_id = (auth.jwt() ->> 'hotel_id'))
--     with check (restaurant_id = (auth.jwt() ->> 'hotel_id'));
--
-- Repeat per tenant table. For the public customer menu, add a separate read-only
-- anon policy scoped to the slug being viewed, or serve it through a SECURITY
-- DEFINER RPC. See docs/superpowers/specs/2026-06-23-multi-hotel-workspace-design.md.
-- ─────────────────────────────────────────────────────────────────────────────
