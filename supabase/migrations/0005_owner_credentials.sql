-- ─────────────────────────────────────────────────────────────────────────────
-- 0005_owner_credentials.sql
--
-- Update ONLY the two existing owner rows to the required login credentials.
-- No rows are created or deleted. Managers/waiters/kitchen are untouched.
-- Restaurant ids are unchanged. password_hash uses the app's djb2 demo hash
-- (src/lib/password.ts): cafe@2026 → ywtfmv, velans@2026 → 1je3sn9.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Cafe Aroma owner (existing row stf_owner_b, restaurant rest_aroma)
update staff
   set username      = 'cafe-aroma2026',
       password_hash = 'ywtfmv',
       role          = 'owner',
       active        = true
 where id = 'stf_owner_b'
   and role = 'owner';          -- guard: only touch the owner row

-- Velans owner (existing row stf_mqsdcm6oru, restaurant rest_mqsdcm6ort)
update staff
   set username      = 'velans-main01',
       password_hash = '1je3sn9',
       role          = 'owner',
       active        = true
 where id = 'stf_mqsdcm6oru'
   and role = 'owner';          -- guard: only touch the owner row

commit;

-- Verify (expect exactly these two rows, each with its username + hash):
--   select id, restaurant_id, role, username, active, password_hash
--     from staff
--    where id in ('stf_owner_b','stf_mqsdcm6oru');
