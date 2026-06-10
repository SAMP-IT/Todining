-- ============================================================================
-- SmartDine — Row Level Security (multi-tenant isolation)
-- Run AFTER schema.sql.
--
-- Model:
--  • Staff authenticate via Supabase Auth; their row in `staff` links auth_uid
--    → restaurant_id. Staff may only read/write rows for THEIR restaurant.
--  • Customers are anonymous (QR ordering). They may read the public menu/tables
--    and INSERT orders, order_items, reservations, service_requests, feedback.
--    They cannot read other tenants' data or mutate staff/menu/etc.
-- ============================================================================

-- Helper: the restaurant_id of the currently authenticated staff member.
create or replace function auth_restaurant_id() returns uuid as $$
  select restaurant_id from staff where auth_uid = auth.uid() limit 1;
$$ language sql stable security definer;

-- Helper: is the current user an owner/manager of the given restaurant?
create or replace function is_manager_of(rid uuid) returns boolean as $$
  select exists (
    select 1 from staff
    where auth_uid = auth.uid() and restaurant_id = rid and role in ('owner','manager')
  );
$$ language sql stable security definer;

-- Enable RLS on every table.
alter table restaurants            enable row level security;
alter table staff                  enable row level security;
alter table tables                 enable row level security;
alter table qr_codes               enable row level security;
alter table menu_categories        enable row level security;
alter table menu_items             enable row level security;
alter table inventory_items        enable row level security;
alter table menu_item_ingredients  enable row level security;
alter table orders                 enable row level security;
alter table order_items            enable row level security;
alter table service_requests       enable row level security;
alter table reservations           enable row level security;
alter table customers              enable row level security;
alter table bills                  enable row level security;
alter table feedback               enable row level security;
alter table upsell_rules           enable row level security;
alter table notifications          enable row level security;

-- ── Restaurants ───────────────────────────────────────────────────────────────
-- Public can read restaurant info (needed to render the customer menu by slug).
create policy restaurants_read_public on restaurants for select using (true);
create policy restaurants_manage on restaurants for all
  using (is_manager_of(id)) with check (is_manager_of(id));

-- ── Staff ─────────────────────────────────────────────────────────────────────
create policy staff_read_own on staff for select using (restaurant_id = auth_restaurant_id());
create policy staff_manage on staff for all
  using (is_manager_of(restaurant_id)) with check (is_manager_of(restaurant_id));

-- ── Public-readable catalog (menu, categories, tables, qr, upsell) ─────────────
-- Customers need to read these to browse + order. Staff manage their own.
create policy menu_cat_read   on menu_categories for select using (true);
create policy menu_cat_write  on menu_categories for all using (is_manager_of(restaurant_id)) with check (is_manager_of(restaurant_id));

create policy menu_read       on menu_items for select using (true);
create policy menu_write      on menu_items for all using (is_manager_of(restaurant_id)) with check (is_manager_of(restaurant_id));

create policy tables_read     on tables for select using (true);
create policy tables_write    on tables for all using (auth_restaurant_id() = restaurant_id) with check (auth_restaurant_id() = restaurant_id);

create policy qr_read         on qr_codes for select using (true);
create policy qr_write        on qr_codes for all using (is_manager_of(restaurant_id)) with check (is_manager_of(restaurant_id));

create policy upsell_read     on upsell_rules for select using (true);
create policy upsell_write    on upsell_rules for all using (is_manager_of(restaurant_id)) with check (is_manager_of(restaurant_id));

-- ── Inventory (staff-only) ──────────────────────────────────────────────────────
create policy inventory_all  on inventory_items for all
  using (auth_restaurant_id() = restaurant_id) with check (auth_restaurant_id() = restaurant_id);
create policy ingredients_all on menu_item_ingredients for all
  using (exists (select 1 from menu_items m where m.id = menu_item_id and m.restaurant_id = auth_restaurant_id()))
  with check (exists (select 1 from menu_items m where m.id = menu_item_id and m.restaurant_id = auth_restaurant_id()));

-- ── Orders (customers insert; staff read/update their restaurant's) ────────────
create policy orders_insert_public on orders for insert with check (true);
create policy orders_staff_read    on orders for select using (auth_restaurant_id() = restaurant_id);
create policy orders_staff_update  on orders for update using (auth_restaurant_id() = restaurant_id) with check (auth_restaurant_id() = restaurant_id);

create policy order_items_insert_public on order_items for insert with check (true);
create policy order_items_staff_read on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.restaurant_id = auth_restaurant_id()));

-- ── Service requests (customers insert; staff manage) ──────────────────────────
create policy svc_insert_public on service_requests for insert with check (true);
create policy svc_staff_rw on service_requests for all
  using (auth_restaurant_id() = restaurant_id) with check (auth_restaurant_id() = restaurant_id);

-- ── Reservations (customers insert; staff manage) ──────────────────────────────
create policy res_insert_public on reservations for insert with check (true);
create policy res_staff_rw on reservations for all
  using (auth_restaurant_id() = restaurant_id) with check (auth_restaurant_id() = restaurant_id);

-- ── Feedback (customers insert; staff read) ────────────────────────────────────
create policy fb_insert_public on feedback for insert with check (true);
create policy fb_staff_read on feedback for select using (auth_restaurant_id() = restaurant_id);

-- ── Bills, customers, notifications (staff-only) ───────────────────────────────
create policy bills_all on bills for all
  using (auth_restaurant_id() = restaurant_id) with check (auth_restaurant_id() = restaurant_id);
create policy customers_all on customers for all
  using (auth_restaurant_id() = restaurant_id) with check (auth_restaurant_id() = restaurant_id);
create policy notifications_all on notifications for all
  using (auth_restaurant_id() = restaurant_id) with check (auth_restaurant_id() = restaurant_id);
