-- ─────────────────────────────────────────────────────────────────────────────
-- Dining Sessions — one bill per table visit.
--
-- A dining session groups every order placed on the same table during one visit
-- (customer scans a QR, orders one or more times, then presses "Complete Dining"
-- to close the table and generate a single final bill). Sessions are DERIVED
-- from orders in the app rather than stored as their own table, so this migration
-- only adds a shared `session_id` to `orders` and `bills`:
--
--   • orders.session_id — every order in the same visit shares this id.
--   • bills.session_id  — the session a bill settles (one bill per session).
--
-- Fully additive and idempotent. Legacy rows keep session_id = null; the app
-- falls back to each order's own id, so every pre-session order remains its own
-- single-order session and nothing breaks. Run once in the Supabase SQL Editor
-- (or `supabase db push`). Safe to re-run and safe on top of 0001–0005.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.orders add column if not exists session_id text;
alter table public.bills  add column if not exists session_id text;

-- Backfill existing rows so each legacy order/bill is its own session, matching
-- the app's runtime fallback (session_id defaults to the order id).
update public.orders set session_id = id       where session_id is null;
update public.bills  set session_id = order_id where session_id is null;

-- Fast lookup of a session's orders and its bill.
create index if not exists idx_orders_session on public.orders (restaurant_id, session_id);
create index if not exists idx_bills_session  on public.bills  (restaurant_id, session_id);
