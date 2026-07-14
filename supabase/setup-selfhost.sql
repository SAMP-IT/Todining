-- ============================================================================
-- ToDining — ONE-SHOT setup for a FRESH self-hosted Supabase (Dokploy).
--
-- Run ONCE in: Studio → SQL Editor → paste → Run.
-- Idempotent & re-runnable. Creates every table the current app reads/writes
-- (source of truth: src/data/supabase/mappers.ts), folding in migrations 0001-0008.
--
-- KEY POINTS:
--   • Primary keys are TEXT — the app generates string ids (rest_…, ord_…, stf_…).
--     (Do NOT use the UUID schema.sql; the app's inserts would fail.)
--   • RLS is DEMO-GRADE here: anon can read AND write (the app has no Supabase
--     Auth yet). This makes the app work the moment you point it here.
--     >>> Batch 3 (docs/AUTH-RLS-MIGRATION.md) replaces these with auth-scoped
--         policies before real production use. <<<
--   • Realtime is enabled so changes propagate across devices.
--   • No data INSERTs needed — the app self-seeds demo restaurants on first load.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type staff_role         as enum ('owner','manager','waiter','kitchen');
  create type table_status       as enum ('available','reserved','occupied');
  create type order_status       as enum ('pending','preparing','ready','served','completed');
  create type reservation_status as enum ('pending','confirmed','cancelled','completed');
  create type service_req_type   as enum ('waiter','water','bill','assistance');
  create type service_req_status as enum ('open','resolved');
  create type notif_channel      as enum ('whatsapp');
  create type notif_type         as enum ('reservation_confirmed','reservation_reminder','order_status','promotional');
  create type notif_status       as enum ('queued','sent');
exception when duplicate_object then null; end $$;

-- ── Restaurants (tenants + branches via parent_id) ───────────────────────────
create table if not exists restaurants (
  id                  text primary key,
  name                text not null,
  slug                text not null unique,
  tagline             text,
  description         text,
  logo_color          text default '#d9521f',
  logo_url            text,
  parent_id           text references restaurants(id),
  created_by          text,
  code                text,
  address             text,
  phone               text,
  email               text,
  manager             text,
  status              text default 'active',
  tax_rate            numeric(5,4) not null default 0.05,
  service_charge_rate numeric(5,4) not null default 0.10,
  currency            text not null default 'INR',
  currency_symbol     text not null default '₹',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz default now()
);
create index if not exists idx_restaurants_parent on restaurants (parent_id, status);

-- ── Staff (owner login credentials live here for the current app) ─────────────
create table if not exists staff (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name          text not null,
  email         text not null,
  username      text,
  password_hash text,
  role          staff_role not null default 'waiter',
  avatar_color  text,
  active         boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_staff_restaurant on staff (restaurant_id);
create index if not exists idx_staff_username    on staff (username);

-- ── Menu ─────────────────────────────────────────────────────────────────────
create table if not exists menu_categories (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name          text not null,
  sort          int not null default 0
);
create index if not exists idx_categories_restaurant on menu_categories (restaurant_id);

create table if not exists menu_items (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  category_id   text references menu_categories(id) on delete set null,
  name          text not null,
  description   text default '',
  price         numeric(10,2) not null default 0,
  image_url     text,
  is_available  boolean not null default true,
  tags          text[] default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists idx_menu_restaurant on menu_items (restaurant_id);

-- ── Tables & QR ──────────────────────────────────────────────────────────────
create table if not exists tables (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  number        int not null,
  seats         int not null default 4,
  status        table_status not null default 'available'
);
create index if not exists idx_tables_restaurant on tables (restaurant_id);

create table if not exists qr_codes (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  table_id      text not null references tables(id) on delete cascade,
  token         text not null,
  url           text not null
);

-- ── Inventory ────────────────────────────────────────────────────────────────
create table if not exists inventory_items (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name          text not null,
  unit          text not null default 'unit',
  stock_qty     numeric(12,2) not null default 0,
  low_threshold numeric(12,2) not null default 0
);
create index if not exists idx_inventory_restaurant on inventory_items (restaurant_id);

-- ── Upsell rules ─────────────────────────────────────────────────────────────
create table if not exists upsell_rules (
  id                text primary key,
  restaurant_id     text not null references restaurants(id) on delete cascade,
  trigger_item_id   text references menu_items(id) on delete cascade,
  suggested_item_id text references menu_items(id) on delete cascade,
  message           text not null
);

-- ── Customers ────────────────────────────────────────────────────────────────
create table if not exists customers (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name          text not null,
  mobile        text not null,
  email         text
);

-- ── Orders + items (session_id groups a table visit → one bill) ──────────────
create table if not exists orders (
  id             text primary key,
  restaurant_id  text not null references restaurants(id) on delete cascade,
  table_id       text references tables(id) on delete set null,
  table_number   int not null,
  session_id     text,
  status         order_status not null default 'pending',
  subtotal       numeric(10,2) not null default 0,
  tax            numeric(10,2) not null default 0,
  service_charge numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_orders_restaurant on orders (restaurant_id);
create index if not exists idx_orders_session    on orders (restaurant_id, session_id);

create table if not exists order_items (
  id           text primary key,
  order_id     text not null references orders(id) on delete cascade,
  menu_item_id text references menu_items(id) on delete set null,
  name         text not null,
  qty          int not null default 1,
  unit_price   numeric(10,2) not null default 0
);
create index if not exists idx_order_items_order on order_items (order_id);

-- ── Service requests (waiter call system) ────────────────────────────────────
create table if not exists service_requests (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  table_id      text references tables(id) on delete set null,
  table_number  int not null,
  type          service_req_type not null,
  status        service_req_status not null default 'open',
  created_at    timestamptz not null default now()
);
create index if not exists idx_service_restaurant on service_requests (restaurant_id, status);

-- ── Reservations ─────────────────────────────────────────────────────────────
create table if not exists reservations (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name          text not null,
  mobile        text not null,
  email         text not null,
  date          date not null,
  time          time not null,
  guests        int not null default 1,
  notes         text,
  status        reservation_status not null default 'pending',
  created_at    timestamptz not null default now()
);
create index if not exists idx_reservations_restaurant on reservations (restaurant_id, status);

-- ── Bills (permanent invoice_number per restaurant/year) ─────────────────────
create table if not exists bills (
  id             text primary key,
  restaurant_id  text not null references restaurants(id) on delete cascade,
  invoice_number text,
  session_id     text,
  order_id       text not null references orders(id) on delete cascade,
  table_number   int not null,
  subtotal       numeric(10,2) not null,
  tax            numeric(10,2) not null,
  service_charge numeric(10,2) not null,
  grand_total    numeric(10,2) not null,
  created_at     timestamptz not null default now(),
  unique (order_id)
);
create index if not exists idx_bills_restaurant on bills (restaurant_id);
create index if not exists idx_bills_session    on bills (restaurant_id, session_id);
create unique index if not exists idx_bills_restaurant_invoice_number
  on bills (restaurant_id, invoice_number);

-- ── Feedback ─────────────────────────────────────────────────────────────────
create table if not exists feedback (
  id                text primary key,
  restaurant_id     text not null references restaurants(id) on delete cascade,
  order_id          text references orders(id) on delete set null,
  table_number      int,
  food_rating       int not null check (food_rating between 1 and 5),
  service_rating    int not null check (service_rating between 1 and 5),
  experience_rating int not null check (experience_rating between 1 and 5),
  comment           text,
  created_at        timestamptz not null default now()
);
create index if not exists idx_feedback_restaurant on feedback (restaurant_id);

-- ── Notifications (WhatsApp previews/log) ────────────────────────────────────
create table if not exists notifications (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  channel       notif_channel not null default 'whatsapp',
  type          notif_type not null,
  recipient     text not null,
  message       text not null,
  status        notif_status not null default 'sent',
  created_at    timestamptz not null default now()
);
create index if not exists idx_notifications_restaurant on notifications (restaurant_id);

-- ── Admin Panel credential (gates /admin-panel; read by the anon client) ─────
-- DEMO-GRADE djb2 hash (src/lib/password.ts). Rotate + move server-side in Batch 3.
create table if not exists admin_users (
  id            text primary key,
  username      text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
insert into admin_users (id, username, password_hash)
values ('admin_samp_ip', 'SAMP-IP(manoj)', '19q822l')      -- password: mavoc-2026
on conflict (username) do update
  set password_hash = excluded.password_hash, updated_at = now();

-- ── updated_at trigger for orders ────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

-- ── DEMO-GRADE RLS: anon may read + write everything ─────────────────────────
-- Lets the current app (anon key, no Supabase Auth) work immediately.
-- Batch 3 replaces these with the auth-scoped policies in supabase/policies.sql.
do $$
declare t text;
begin
  foreach t in array array[
    'restaurants','staff','menu_categories','menu_items','tables','qr_codes',
    'inventory_items','upsell_rules','customers','orders','order_items',
    'service_requests','reservations','bills','feedback','notifications','admin_users'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_demo_all', t);
    execute format('create policy %I on %I for all to anon, authenticated using (true) with check (true)', t || '_demo_all', t);
  end loop;
end $$;

-- ── Realtime: broadcast row changes to every connected device ────────────────
do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'restaurants','staff','menu_categories','menu_items','tables','qr_codes',
    'inventory_items','upsell_rules','customers','orders','order_items',
    'service_requests','reservations','bills','feedback','notifications'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null; end;
  end loop;
end $$;

-- Done. Point the frontend's VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY here and
-- rebuild; the app self-seeds demo data on first load.
