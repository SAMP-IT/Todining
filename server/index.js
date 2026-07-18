// ─────────────────────────────────────────────────────────────────────────────
// ToDining API — a thin, generic layer over PostgreSQL.
//
// The SPA's data layer (src/data/mock/store.ts) hydrates by reading every table
// and persists by pushing per-table diffs (upserts + deletes). This server mirrors
// exactly those two operations, so the frontend swap is minimal:
//   GET  /api/bootstrap  → { restaurants:[…], staff:[…], …, orderItems:[…] }
//   POST /api/sync       → { table, upserts:[row…], deletes:[id…] }
//
// Rows are snake_case (produced by the app's mappers) and are stored verbatim.
// Security note: like the old demo RLS, this is open — real auth is a later pass.
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const { Pool } = pg;
// Postgres DATE (oid 1082) → keep the raw 'YYYY-MM-DD' string. Otherwise node-pg
// returns a JS Date that JSON-serializes to a timezone-shifted timestamp, drifting
// a reservation's date by a day. (Supabase/PostgREST returned plain date strings.)
pg.types.setTypeParser(1082, (v) => v);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
});

// Whitelisted tables (also the FK-safe order used for bootstrap/insert).
const TABLES = [
  'restaurants', 'staff', 'menu_categories', 'menu_items', 'tables', 'qr_codes',
  'inventory_items', 'upsell_rules', 'customers', 'orders', 'order_items',
  'service_requests', 'reservations', 'bills', 'feedback', 'notifications',
  'admin_users',
];
// db table → the key the frontend store expects in the bootstrap payload.
const KEY_BY_TABLE = {
  restaurants: 'restaurants', staff: 'staff', menu_categories: 'categories',
  menu_items: 'menuItems', tables: 'tables', qr_codes: 'qrCodes',
  inventory_items: 'inventory', upsell_rules: 'upsellRules', customers: 'customers',
  orders: 'orders', order_items: 'orderItems', service_requests: 'serviceRequests',
  reservations: 'reservations', bills: 'bills', feedback: 'feedback',
  notifications: 'notifications', admin_users: 'adminUsers',
};
const isIdent = (s) => typeof s === 'string' && /^[a-z_][a-z0-9_]*$/.test(s);

const app = express();
// Restrict CORS to the frontend origin(s) when configured (set FRONTEND_ORIGIN,
// comma-separated, e.g. "https://todining.com,https://www.todining.com" in prod).
// Falls back to permissive for local/demo use so nothing breaks unconfigured.
const CORS_ORIGINS = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors(CORS_ORIGINS.length ? { origin: CORS_ORIGINS } : {}));
app.use(express.json({ limit: '10mb' }));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Full hydrate — every table, in the shape the store expects.
app.get('/api/bootstrap', async (_req, res) => {
  try {
    const out = {};
    for (const t of TABLES) {
      const { rows } = await pool.query(`select * from ${t}`);
      out[KEY_BY_TABLE[t]] = rows;
    }
    res.json(out);
  } catch (e) {
    console.error('bootstrap failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Persist one table's changes: upsert changed/new rows, delete removed ids.
app.post('/api/sync', async (req, res) => {
  const { table, upserts = [], deletes = [] } = req.body || {};
  if (!TABLES.includes(table)) return res.status(400).json({ error: `unknown table: ${table}` });

  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const row of upserts) {
      const cols = Object.keys(row).filter(isIdent);
      if (!cols.length || !cols.includes('id')) continue;
      const values = cols.map((c) => row[c]);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      const updates = cols.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`);
      const sql =
        `insert into ${table} (${cols.join(', ')}) values (${placeholders.join(', ')}) ` +
        `on conflict (id) do update set ${updates.length ? updates.join(', ') : 'id = excluded.id'}`;
      await client.query(sql, values);
    }
    if (Array.isArray(deletes) && deletes.length) {
      await client.query(`delete from ${table} where id = any($1::text[])`, [deletes]);
    }
    await client.query('commit');
    res.json({ ok: true, table, upserted: upserts.length, deleted: deletes.length });
  } catch (e) {
    await client.query('rollback');
    console.error(`sync ${table} failed:`, e.message);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ── Demo requests (public marketing lead capture) ────────────────────────────
// The Book-a-demo form on the public site posts here. This is deliberately its
// own endpoint, not /api/sync: the id and created_at are generated server-side
// so a public visitor never supplies a primary key or spoofs a timestamp, and
// only the known lead columns are ever written.
app.post('/api/demo-requests', async (req, res) => {
  const b = req.body || {};
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const email = typeof b.email === 'string' ? b.email.trim() : '';
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'invalid email' });

  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : null);
  const id = `dreq_${randomUUID().slice(0, 12)}`;
  try {
    await pool.query(
      `insert into demo_requests (id, name, restaurant_name, email, phone, locations, message)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name.slice(0, 200), str(b.restaurantName, 200), email.slice(0, 200),
       str(b.phone, 60), str(b.locations, 40), str(b.message, 4000)],
    );
    res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error('demo-request insert failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// List captured leads. Unlike the write path (a public form), READING leads
// exposes prospect PII (names, emails, phones), so this is NOT open like the rest
// of the demo API: it is disabled unless ADMIN_API_TOKEN is set, and then requires
// that token in the x-admin-token header. This is a stopgap until the real
// server-side auth pass; direct psql access remains the primary way to read leads.
app.get('/api/demo-requests', async (req, res) => {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) return res.status(404).json({ error: 'not found' });
  if (req.get('x-admin-token') !== token) return res.status(403).json({ error: 'forbidden' });
  try {
    const { rows } = await pool.query('select * from demo_requests order by created_at desc');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ensure the schema exists on boot (idempotent — every statement is
// `create ... if not exists`), so a freshly-created Postgres self-initializes
// with no manual SQL step. schema.sql ships next to this file in the image.
async function migrate() {
  const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('[todining-api] schema ensured');
}

const port = Number(process.env.PORT || 8080);
migrate()
  .then(() => app.listen(port, () => console.log(`[todining-api] listening on :${port}`)))
  .catch((e) => {
    console.error('[todining-api] startup migration failed:', e.message);
    process.exit(1);
  });
