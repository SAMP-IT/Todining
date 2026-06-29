-- ─────────────────────────────────────────────────────────────────────────────
-- Branch Management — per-hotel branches.
--
-- A branch is a `restaurants` row whose `parent_id` points at its parent hotel
-- (a hotel has parent_id = null). Branches reuse the entire per-restaurant_id
-- data model (menu, orders, tables, qr, reservations, staff, inventory, billing,
-- feedback, notifications, settings), so isolation and realtime come for free.
--
-- This migration adds the branch-identity columns the branch form captures. Run
-- once in the Supabase SQL Editor (or `supabase db push`). Idempotent — safe to
-- re-run and safe on top of 0001/0002.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.restaurants add column if not exists code     text;
alter table public.restaurants add column if not exists address  text;
alter table public.restaurants add column if not exists phone    text;
alter table public.restaurants add column if not exists email    text;
alter table public.restaurants add column if not exists manager  text;
alter table public.restaurants add column if not exists status   text default 'active';

-- Fast lookup of a hotel's branches.
create index if not exists idx_restaurants_parent_status on public.restaurants (parent_id, status);
