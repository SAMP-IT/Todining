import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react';
import { adminAuthService } from '@/data/services';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Panel session. Separate from staff AuthContext: this gates ONLY the
// /admin-panel workspace manager. The session is a signed-in flag + expiry kept
// in localStorage, so the operator stays logged in across reloads until they log
// out explicitly or the session expires. Credentials are validated against
// Supabase (adminAuthService) — never hardcoded here.
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = 'todining_admin_panel_session';
// Keep the operator signed in for 12 hours of inactivity before requiring re-auth.
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

interface StoredSession {
  username: string;
  expiresAt: number;
}

function readSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.expiresAt || parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

interface AdminAuthValue {
  authenticated: boolean;
  username: string | null;
  /** Validate credentials against Supabase and open a session. Returns true on success. */
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readSession());

  const login = useCallback(async (username: string, password: string) => {
    const ok = await adminAuthService.authenticate(username, password);
    if (!ok) return false;
    const next: StoredSession = {
      username: username.trim(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    return true;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({ authenticated: !!session, username: session?.username ?? null, login, logout }),
    [session, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
