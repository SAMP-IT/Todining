// ─────────────────────────────────────────────────────────────────────────────
// One-shot live-Supabase production cleanup (alternative to the SQL migration
// supabase/migrations/0004_production_cleanup.sql — use whichever you prefer).
//
//   • Backs up the removed hotels' rows to scripts/backup-purge-<ts>.json.
//   • Deletes ONLY the 6 unwanted hotels + their child rows (scoped by id).
//   • Keeps Cafe Aroma (rest_aroma) + Velans (rest_mqsdcm6ort) and sets the
//     required owner credentials.
//
// Run from the project root:   node scripts/cleanup-supabase.mjs
// Uses the anon key from .env via PostgREST. Prints no secrets.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';

function readEnv() {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const i = line.indexOf('='); if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}
const env = readEnv();
const B = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!B || !KEY) { console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env'); process.exit(2); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const J = { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

const KEEP = ['rest_aroma', 'rest_mqsdcm6ort'];
const PURGE = ['rest_spice', 'rest_mqul89chrt', 'rest_mquns209rt', 'rest_mqunszh8s8', 'rest_mr23w61rrt', 'rest_mr23xwlts8'];
const inList = `(${PURGE.join(',')})`;

// djb2 demo hashes (src/lib/password.ts): cafe@2026 → ywtfmv, velans@2026 → 1je3sn9.
const CAFE_HASH = 'ywtfmv';
const VELANS_HASH = '1je3sn9';

const CHILD_FIRST = [
  'feedback', 'bills', 'notifications', 'reservations', 'service_requests', 'orders',
  'customers', 'upsell_rules', 'inventory_items', 'qr_codes', 'tables', 'menu_items',
  'menu_categories', 'staff',
];

async function getJson(path) { const r = await fetch(`${B}/rest/v1/${path}`, { headers: H }); return r.ok ? r.json() : []; }
async function del(path) {
  const r = await fetch(`${B}/rest/v1/${path}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' } });
  if (!r.ok) throw new Error(`DELETE ${path} → ${r.status}: ${await r.text()}`);
}
async function patch(path, body) {
  const r = await fetch(`${B}/rest/v1/${path}`, { method: 'PATCH', headers: J, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`PATCH ${path} → ${r.status}: ${await r.text()}`);
}

console.log('KEEP:', KEEP.join(', '));
console.log('1) Backing up hotels being removed…');
const backup = { restaurants: await getJson(`restaurants?id=in.${inList}&select=*`) };
for (const t of CHILD_FIRST) backup[t] = await getJson(`${t}?restaurant_id=in.${inList}&select=*`);
const purgeOrderIds = backup.orders.map((o) => o.id);
backup.order_items = purgeOrderIds.length ? await getJson(`order_items?order_id=in.(${purgeOrderIds.join(',')})&select=*`) : [];
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
writeFileSync(new URL(`./backup-purge-${stamp}.json`, import.meta.url), JSON.stringify(backup, null, 2));
console.log(`   Saved ${Object.values(backup).reduce((n, a) => n + a.length, 0)} rows. Removing:`, backup.restaurants.map((r) => r.name).join(', '));

console.log('2) Deleting purged hotels (child-first)…');
if (purgeOrderIds.length) await del(`order_items?order_id=in.(${purgeOrderIds.join(',')})`);
for (const t of CHILD_FIRST) await del(`${t}?restaurant_id=in.${inList}`);
await del(`restaurants?id=in.${inList}`);

console.log('3) Setting keeper names + owner credentials…');
await patch('restaurants?id=eq.rest_aroma', { name: 'Cafe Aroma' });
await patch('restaurants?id=eq.rest_mqsdcm6ort', { name: 'Velans' });
await patch('staff?id=eq.stf_owner_b', { username: 'cafe-aroma2026', password_hash: CAFE_HASH, email: 'owner@cafe-aroma.com' });
await patch('staff?id=eq.stf_mqsdcm6oru', { username: 'velans-main01', password_hash: VELANS_HASH, email: 'owner@velans.com' });

console.log('4) Final state:');
const rs = await getJson('restaurants?select=id,name,slug&order=name.asc');
for (const r of rs) console.log(`   ${r.name.padEnd(12)} id=${r.id} slug=${r.slug}`);
console.log('Total restaurants remaining:', rs.length, rs.length === 2 ? '✓' : '✗ (expected 2)');
