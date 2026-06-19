-- ============================================================================
-- ToDining — Supabase setup for the LIVE DEMO backend.
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New query → Run.
--
-- Differences vs schema.sql / policies.sql (the production target):
--   • Primary keys are TEXT (the app generates string ids like `mi_…`, `ord_…`).
--   • RLS is permissive (anon can read AND write) because the app currently uses
--     a mock staff login, not Supabase Auth. This is DEMO-GRADE.
--     >>> Before production: enable Supabase Auth and replace the permissive
--         policies below with the auth-scoped ones in policies.sql. <<<
--   • Realtime is enabled so menu/order/table changes propagate to every device.
-- The app self-seeds demo data on first load, so no INSERTs are needed here.
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

-- ── Tables (TEXT primary keys) ────────────────────────────────────────────────
create table if not exists restaurants (
  id                  text primary key,
  name                text not null,
  slug                text not null unique,
  tagline             text,
  logo_color          text default '#d9521f',
  tax_rate            numeric(5,4) not null default 0.05,
  service_charge_rate numeric(5,4) not null default 0.10,
  currency            text not null default 'INR',
  currency_symbol     text not null default '₹',
  created_at          timestamptz not null default now()
);

create table if not exists staff (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name          text not null,
  email         text not null,
  role          staff_role not null default 'waiter',
  avatar_color  text,
  active         boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_staff_restaurant on staff(restaurant_id);

create table if not exists menu_categories (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name          text not null,
  sort          int not null default 0
);
create index if not exists idx_categories_restaurant on menu_categories(restaurant_id);

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
create index if not exists idx_menu_restaurant on menu_items(restaurant_id);

create table if not exists tables (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  number        int not null,
  seats         int not null default 4,
  status        table_status not null default 'available'
);
create index if not exists idx_tables_restaurant on tables(restaurant_id);

create table if not exists qr_codes (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  table_id      text not null references tables(id) on delete cascade,
  token         text not null,
  url           text not null
);

create table if not exists inventory_items (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name          text not null,
  unit          text not null default 'unit',
  stock_qty     numeric(12,2) not null default 0,
  low_threshold numeric(12,2) not null default 0
);
create index if not exists idx_inventory_restaurant on inventory_items(restaurant_id);

create table if not exists upsell_rules (
  id                text primary key,
  restaurant_id     text not null references restaurants(id) on delete cascade,
  trigger_item_id   text references menu_items(id) on delete cascade,
  suggested_item_id text references menu_items(id) on delete cascade,
  message           text not null
);

create table if not exists customers (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name          text not null,
  mobile        text not null,
  email         text
);

create table if not exists orders (
  id             text primary key,
  restaurant_id  text not null references restaurants(id) on delete cascade,
  table_id       text references tables(id) on delete set null,
  table_number   int not null,
  status         order_status not null default 'pending',
  subtotal       numeric(10,2) not null default 0,
  tax            numeric(10,2) not null default 0,
  service_charge numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_orders_restaurant on orders(restaurant_id);

create table if not exists order_items (
  id           text primary key,
  order_id     text not null references orders(id) on delete cascade,
  menu_item_id text references menu_items(id) on delete set null,
  name         text not null,
  qty          int not null default 1,
  unit_price   numeric(10,2) not null default 0
);
create index if not exists idx_order_items_order on order_items(order_id);

create table if not exists service_requests (
  id            text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  table_id      text references tables(id) on delete set null,
  table_number  int not null,
  type          service_req_type not null,
  status        service_req_status not null default 'open',
  created_at    timestamptz not null default now()
);
create index if not exists idx_service_restaurant on service_requests(restaurant_id, status);

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
create index if not exists idx_reservations_restaurant on reservations(restaurant_id, status);

create table if not exists bills (
  id             text primary key,
  restaurant_id  text not null references restaurants(id) on delete cascade,
  order_id       text not null references orders(id) on delete cascade,
  table_number   int not null,
  subtotal       numeric(10,2) not null,
  tax            numeric(10,2) not null,
  service_charge numeric(10,2) not null,
  grand_total    numeric(10,2) not null,
  created_at     timestamptz not null default now(),
  unique (order_id)
);
create index if not exists idx_bills_restaurant on bills(restaurant_id);

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
create index if not exists idx_feedback_restaurant on feedback(restaurant_id);

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
create index if not exists idx_notifications_restaurant on notifications(restaurant_id);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

-- ── DEMO-GRADE RLS: anon may read + write everything ───────────────────────────
-- Replace with policies.sql (auth-scoped) before going to production.
do $$
declare t text;
begin
  foreach t in array array[
    'restaurants','staff','menu_categories','menu_items','tables','qr_codes',
    'inventory_items','upsell_rules','customers','orders','order_items',
    'service_requests','reservations','bills','feedback','notifications'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_demo_all', t);
    execute format('create policy %I on %I for all to anon, authenticated using (true) with check (true)', t || '_demo_all', t);
  end loop;
end $$;

-- ── Realtime: broadcast row changes to connected devices ───────────────────────
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
