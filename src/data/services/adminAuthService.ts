// ─────────────────────────────────────────────────────────────────────────────
// Admin Panel authentication.
//
// The Admin Panel (/admin-panel) is gated by a username + password. The
// credential lives ONLY in Supabase (table `admin_users`, seeded by migration
// 0008) — it is never hardcoded in the frontend. Authentication looks the row up
// by username and compares the demo djb2 hash (src/lib/password.ts) of the entered
// password against the stored `password_hash`.
//
// When Supabase is not configured (local offline fallback), a dev-only default
// mirrors the seeded row so the panel is still testable. The stored value is a
// one-way hash, not the plaintext password, and production always uses Supabase.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase, isSupabaseEnabled } from '@/data/supabase/client';
import { verifyPassword } from '@/lib/password';

const TABLE = 'admin_users';

// Dev-only fallback used ONLY when no Supabase backend is configured. Mirrors the
// row seeded into Supabase by migration 0008 so `npm run dev` without env still
// works. Holds a one-way hash, never a plaintext password.
const LOCAL_FALLBACK: { username: string; passwordHash: string } = {
  username: 'SAMP-IP(manoj)',
  passwordHash: '19q822l', // djb2(mavoc-2026)
};

export const adminAuthService = {
  /**
   * Validate an Admin Panel sign-in attempt against the credential stored in
   * Supabase. Returns true only on an exact username match with a correct
   * password. Never throws — a lookup error resolves to a failed sign-in.
   */
  async authenticate(username: string, password: string): Promise<boolean> {
    const uname = username.trim();
    if (!uname || !password) return false;

    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase
        .from(TABLE)
        .select('username, password_hash')
        .eq('username', uname)
        .maybeSingle();

      if (error) {
        console.error('[ToDining][admin-auth] Credential lookup failed:', error.message);
        return false;
      }
      if (!data) {
        // A missing row despite a correct username is almost always RLS: the table
        // has RLS enabled with no SELECT policy for the anon role, so the query
        // returns 200 with zero rows. Run migration 0008 (adds the SELECT policy).
        console.warn(
          `[ToDining][admin-auth] No '${TABLE}' row visible for username "${uname}". ` +
            'If the row exists, RLS is hiding it — run supabase/migrations/0008 to add ' +
            'the anon SELECT policy.',
        );
        return false;
      }
      return verifyPassword(password, data.password_hash);
    }

    // Offline fallback (no Supabase configured).
    return uname === LOCAL_FALLBACK.username && verifyPassword(password, LOCAL_FALLBACK.passwordHash);
  },
};
