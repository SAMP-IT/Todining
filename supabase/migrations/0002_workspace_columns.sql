-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: new hotel workspaces disappear after reload.
--
-- Root cause: the workspace-manager feature writes columns the live database
-- never received, so every INSERT/UPSERT of a new hotel is rejected by Postgres
-- (error 42703 / PGRST204 "column ... does not exist"). The hotel lives only in
-- the browser's in-memory cache until the next reload, then vanishes.
--
-- This migration adds the exact columns the app's row mappers
-- (src/data/supabase/mappers.ts) now write. Run it once in the Supabase SQL
-- Editor (or via `supabase db push`). Every statement is idempotent, so it is
-- safe to re-run and safe to apply on top of 0001_multi_tenant.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- restaurants: workspace identity + audit columns the create flow writes.
alter table public.restaurants add column if not exists description  text;
alter table public.restaurants add column if not exists logo_url     text;
alter table public.restaurants add column if not exists parent_id    text references public.restaurants(id);
alter table public.restaurants add column if not exists created_by   text;
alter table public.restaurants add column if not exists updated_at   timestamptz default now();

-- staff: owner login credentials written when a workspace is provisioned.
alter table public.staff add column if not exists username       text;
alter table public.staff add column if not exists password_hash  text;
