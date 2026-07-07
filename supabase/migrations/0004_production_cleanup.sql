-- ─────────────────────────────────────────────────────────────────────────────
-- 0004_production_cleanup.sql
--
-- Reduce the live workspace to EXACTLY the two production hotels and set the
-- required owner credentials. Run this in the Supabase SQL editor (service_role).
-- It is transactional — either the whole cleanup applies or nothing does.
--
-- KEEP:
--   rest_aroma        → Cafe Aroma   (owner login: cafe-aroma2026 / cafe@2026)
--   rest_mqsdcm6ort   → Velans       (owner login: velans-main01  / velans@2026)
--
-- REMOVE (and all of their child rows): Spice Garden, QA Verify Branch,
--   FlowTest Hotel, FlowBranch One, C3, Eswari Nagar — i.e. every hotel that is
--   not one of the two kept ids above.
--
-- Safety: take a Supabase backup / point-in-time snapshot before running.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Child rows first (FK-safe). order_items is keyed via its parent order.
delete from order_items where order_id in (
  select id from orders where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort')
);

-- Only needed if your project has the (unused-by-the-app) recipe table.
-- Uncomment if `menu_item_ingredients` exists:
-- delete from menu_item_ingredients where menu_item_id in (
--   select id from menu_items where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort')
-- );

delete from feedback         where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from bills            where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from notifications    where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from reservations     where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from service_requests where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from orders           where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from customers        where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from upsell_rules     where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from inventory_items  where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from qr_codes         where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from tables           where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from menu_items       where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from menu_categories  where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from staff            where restaurant_id not in ('rest_aroma','rest_mqsdcm6ort');
delete from restaurants      where id            not in ('rest_aroma','rest_mqsdcm6ort');

-- Normalise the two hotels' display names.
update restaurants set name = 'Cafe Aroma' where id = 'rest_aroma';
update restaurants set name = 'Velans'     where id = 'rest_mqsdcm6ort';

-- Owner credentials. password_hash uses the app's demo djb2 hash
-- (src/lib/password.ts): cafe@2026 → ywtfmv, velans@2026 → 1je3sn9.
-- Distinct emails guarantee zero cross-hotel login ambiguity.
update staff
   set username = 'cafe-aroma2026', password_hash = 'ywtfmv', email = 'owner@cafe-aroma.com'
 where id = 'stf_owner_b';        -- Cafe Aroma owner

update staff
   set username = 'velans-main01', password_hash = '1je3sn9', email = 'owner@velans.com'
 where id = 'stf_mqsdcm6oru';     -- Velans owner

commit;

-- Verify (run after commit):
--   select id, name, slug, parent_id from restaurants order by name;      -- expect 2 rows
--   select restaurant_id, role, username, email from staff where role = 'owner';
