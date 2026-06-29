// ─────────────────────────────────────────────────────────────────────────────
// Password hashing — DEMO-GRADE ONLY.
//
// This is a fast, synchronous, NON-cryptographic one-way hash (djb2 + a salt).
// It exists so login passwords for hotel-owner accounts are not stored in plain
// text in the in-memory/localStorage cache or in the Supabase `password_hash`
// column. It is NOT a substitute for real authentication.
//
// PRODUCTION: replace credential checks with Supabase Auth (bcrypt/argon2 on the
// server, JWTs, RLS keyed on the authenticated user). See the multi-hotel design
// doc for the migration path.
// ─────────────────────────────────────────────────────────────────────────────

const SALT = 'todining::v1';

/** One-way hash of a plaintext password. Returns a short hex-ish string. */
export function hashPassword(plain: string): string {
  const input = `${SALT}:${plain}`;
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  // Force unsigned 32-bit and base36 for a compact, stable representation.
  return (h >>> 0).toString(36);
}

/** Constant-shape comparison of a candidate password against a stored hash. */
export function verifyPassword(plain: string, hash: string | undefined): boolean {
  if (!hash) return false;
  return hashPassword(plain) === hash;
}
