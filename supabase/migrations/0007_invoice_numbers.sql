-- ─────────────────────────────────────────────────────────────────────────────
-- Invoice Numbers — permanent, immutable, per-restaurant invoice identifiers.
--
-- Adds a stored `invoice_number` to `bills` (format INV-<year>-<0000>) so every
-- invoice keeps ONE number for life, independent of the internal `bills.id`.
-- Numbers are sequential per restaurant + calendar year (both restaurants may
-- have INV-2026-0001), assigned chronologically to existing bills and, going
-- forward, once at generation time by the app.
--
-- Fully additive and idempotent:
--   • ADD COLUMN IF NOT EXISTS — never drops or alters existing columns.
--   • Backfill only fills NULLs and continues from each restaurant/year's current
--     max, so re-running never renumbers or duplicates an already-numbered bill.
--   • UNIQUE index is per (restaurant_id, invoice_number) and IF NOT EXISTS.
--   • `bills.id`, foreign keys and every other column are untouched.
--
-- Run once in the Supabase SQL Editor (or `supabase db push`). Safe to re-run and
-- safe on top of 0001–0006.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add the column (nullable; no table rewrite).
alter table public.bills add column if not exists invoice_number text;

-- 2. Backfill existing bills. Number them oldest-first, per restaurant + year,
--    continuing from any numbers that already exist (keeps re-runs correct).
with maxes as (
  select restaurant_id,
         substr(created_at::text, 1, 4)                                   as yr,
         coalesce(max((regexp_replace(invoice_number, '^.*-', ''))::int), 0) as max_seq
  from public.bills
  where invoice_number is not null
  group by restaurant_id, substr(created_at::text, 1, 4)
),
to_number as (
  select b.id,
         b.restaurant_id,
         substr(b.created_at::text, 1, 4) as yr,
         row_number() over (
           partition by b.restaurant_id, substr(b.created_at::text, 1, 4)
           order by b.created_at asc, b.id asc
         ) as rn
  from public.bills b
  where b.invoice_number is null
)
update public.bills b
set invoice_number =
  'INV-' || t.yr || '-' || lpad((coalesce(m.max_seq, 0) + t.rn)::text, 4, '0')
from to_number t
left join maxes m on m.restaurant_id = t.restaurant_id and m.yr = t.yr
where b.id = t.id
  and b.invoice_number is null;

-- 3. Enforce uniqueness per restaurant (so numbers can never collide, even across
--    devices generating bills at the same moment).
create unique index if not exists idx_bills_restaurant_invoice_number
  on public.bills (restaurant_id, invoice_number);
