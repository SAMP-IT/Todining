// ─────────────────────────────────────────────────────────────────────────────
// Admin Panel authentication.
//
// Gates /admin-panel by username + password. Until the server-side auth pass
// lands (verify credentials in `server/` against `admin_users` and issue a
// session token), this validates against a local DEMO credential. The stored
// value is a one-way djb2 hash (src/lib/password.ts), not the plaintext — but it
// is DEMO-GRADE and MUST be replaced with real server-side auth before production.
// ─────────────────────────────────────────────────────────────────────────────
import { verifyPassword } from '@/lib/password';

// DEMO-GRADE credential (djb2 hash). TODO(auth pass): move admin auth server-side
// (a login endpoint in `server/`), delete this hardcoded value, and rotate creds.
const DEMO_ADMIN = {
  username: 'SAMP-IP(manoj)',
  passwordHash: '19q822l', // djb2(mavoc-2026)
};

export const adminAuthService = {
  /**
   * Validate an Admin Panel sign-in attempt. Returns true only on an exact
   * username match with a correct password. Never throws.
   */
  async authenticate(username: string, password: string): Promise<boolean> {
    const uname = username.trim();
    if (!uname || !password) return false;
    return uname === DEMO_ADMIN.username && verifyPassword(password, DEMO_ADMIN.passwordHash);
  },
};
