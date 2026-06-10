-- ============================================================================
-- SmartDine — PostgreSQL schema for Supabase
-- Multi-tenant: every domain table carries restaurant_id. Isolation is enforced
-- by Row Level Security (see policies.sql). Run schema.sql first, then policies.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type staff_role        as enum ('owner','manager','waiter','kitchen');
  create type table_status      as enum ('available','reserved','occupied');
  create type order_status      as enum ('pending','preparing','ready','served','completed');
  create type reservation_status as enum ('pending','confirmed','cancelled','completed');
  create type service_req_type  as enum ('waiter','water','bill','assistance');
  create type service_req_status as enum ('open','resolved');
  create type notif_channel     as enum ('whatsapp');
  create type notif_type        as enum ('reservation_confirmed','reservation_reminder','order_status','promotional');
  create type notif_status      as enum ('queued','sent');
exception when duplicate_object then null; end $$;

-- ── Restaurants (tenants) ─────────────────────────────────────────────────────
create table if not exists restaurants (
  id                  uuid primary key default gen_random_uuid(),
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

-- ── Staff (linked to Supabase auth users) ─────────────────────────────────────
create table if not exists staff (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  auth_uid      uuid unique references auth.users(id) on delete set null,
  name          text not null,
  email         text not null,
  role          staff_role not null default 'waiter',
  avatar_color  text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_staff_restaurant on staff(restaurant_id);
create index if not exists idx_staff_auth on staff(auth_uid);

-- ── Tables & QR ────────────────────────────────────────────────────────────────
create table if not exists tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  number        int not null,
  seats         int not null default 4,
  status        table_status not null default 'available',
  unique (restaurant_id, number)
);
create index if not exists idx_tables_restaurant on tables(restaurant_id);

create table if not exists qr_codes (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id      uuid not null references tables(id) on delete cascade,
  token         text not null unique,
  url           text not null
);

-- ── Menu ─────────────────────────────────────────────────────────────────────
create table if not exists menu_categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  sort          int not null default 0
);
create index if not exists idx_categories_restaurant on menu_categories(restaurant_id);

create table if not exists menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id   uuid references menu_categories(id) on delete set null,
  name          text not null,
  description   text default '',
  price         numeric(10,2) not null default 0,
  image_url     text,
  is_available  boolean not null default true,
  tags          text[] default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists idx_menu_restaurant on menu_items(restaurant_id);

-- ── Inventory (+ recipe link for auto-deduct) ─────────────────────────────────
create table if not exists inventory_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  unit          text not null default 'unit',
  stock_qty     numeric(12,2) not null default 0,
  low_threshold numeric(12,2) not null default 0
);
create index if not exists idx_inventory_restaurant on inventory_items(restaurant_id);

create table if not exists menu_item_ingredients (
  menu_item_id      uuid not null references menu_items(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  qty               numeric(12,4) not null default 0,
  primary key (menu_item_id, inventory_item_id)
);

-- ── Orders ─────────────────────────────────────────────────────────────────────
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  table_id       uuid references tables(id) on delete set null,
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
create index if not exists idx_orders_status on orders(restaurant_id, status);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name         text not null,
  qty          int not null default 1,
  unit_price   numeric(10,2) not null default 0
);
create index if not exists idx_order_items_order on order_items(order_id);

-- ── Service requests (Waiter Call System) ───────────────────────────────────────
create table if not exists service_requests (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id      uuid references tables(id) on delete set null,
  table_number  int not null,
  type          service_req_type not null,
  status        service_req_status not null default 'open',
  created_at    timestamptz not null default now()
);
create index if not exists idx_service_restaurant on service_requests(restaurant_id, status);

-- ── Reservations ────────────────────────────────────────────────────────────────
create table if not exists reservations (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
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

-- ── Customers ────────────────────────────────────────────────────────────────────
create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  mobile        text not null,
  email         text
);

-- ── Billing ──────────────────────────────────────────────────────────────────────
create table if not exists bills (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  order_id       uuid not null references orders(id) on delete cascade,
  table_number   int not null,
  subtotal       numeric(10,2) not null,
  tax            numeric(10,2) not null,
  service_charge numeric(10,2) not null,
  grand_total    numeric(10,2) not null,
  created_at     timestamptz not null default now(),
  unique (order_id)
);
create index if not exists idx_bills_restaurant on bills(restaurant_id);

-- ── Feedback ──────────────────────────────────────────────────────────────────────
create table if not exists feedback (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  order_id          uuid references orders(id) on delete set null,
  table_number      int,
  food_rating       int not null check (food_rating between 1 and 5),
  service_rating    int not null check (service_rating between 1 and 5),
  experience_rating int not null check (experience_rating between 1 and 5),
  comment           text,
  created_at        timestamptz not null default now()
);
create index if not exists idx_feedback_restaurant on feedback(restaurant_id);

-- ── Upsell rules (AI-based suggestions) ──────────────────────────────────────────
create table if not exists upsell_rules (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  trigger_item_id   uuid references menu_items(id) on delete cascade,
  suggested_item_id uuid references menu_items(id) on delete cascade,
  message           text not null
);

-- ── Notifications (WhatsApp etc.) ─────────────────────────────────────────────────
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  channel       notif_channel not null default 'whatsapp',
  type          notif_type not null,
  recipient     text not null,
  message       text not null,
  status        notif_status not null default 'sent',
  created_at    timestamptz not null default now()
);
create index if not exists idx_notifications_restaurant on notifications(restaurant_id);

-- ── updated_at trigger for orders ────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();
