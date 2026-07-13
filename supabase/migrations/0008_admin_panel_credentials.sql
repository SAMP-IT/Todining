-- ─────────────────────────────────────────────────────────────────────────────
-- 0008_admin_panel_credentials.sql
--
-- Secure the Admin Panel (/admin-panel) behind a login. Credentials live ONLY in
-- Supabase — the frontend never hardcodes them; it authenticates by looking up
-- this table (see src/data/services/adminAuthService.ts).
--
-- password_hash uses the app's djb2 demo hash (src/lib/password.ts):
--   mavoc-2026 → 19q822l
--
-- Idempotent: safe to re-run. Re-running refreshes the password hash in place.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

create table if not exists public.admin_users (
  id            text primary key,
  username      text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- The frontend reads with the anon/publishable key. Grant table-level read access…
grant select on public.admin_users to anon, authenticated;

-- …and — because a UI-created table has RLS ENABLED by default, which silently
-- hides every row from anon (PostgREST returns 200 []), so login always fails —
-- add an explicit SELECT-only policy. RLS stays ON here (unlike the other tables)
-- so anon can READ the credential to authenticate but can NEVER insert/update/
-- delete it. Idempotent: safe to re-run.
alter table public.admin_users enable row level security;
drop policy if exists admin_users_anon_read on public.admin_users;
create policy admin_users_anon_read on public.admin_users
  for select to anon, authenticated
  using (true);

-- Seed / refresh the single Admin Panel credential.
--   username: SAMP-IP(manoj)
--   password: mavoc-2026  (stored as djb2 hash 19q822l)
insert into public.admin_users (id, username, password_hash)
values ('admin_samp_ip', 'SAMP-IP(manoj)', '19q822l')
on conflict (username) do update
  set password_hash = excluded.password_hash,
      updated_at    = now();

commit;

-- Verify:
--   select id, username, password_hash from admin_users;
