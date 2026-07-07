import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Staff } from '@/types';
import { staffService } from '@/data/services';

interface AuthValue {
  user: Staff | null;
  /** Sign in by email/username. Password is required for credentialed accounts
   *  (hotel owners) and ignored for password-less demo staff. `preferRestaurantId`
   *  resolves a login that exists in multiple workspaces to the active one. */
  login: (identifier: string, password?: string, preferRestaurantId?: string | null) => Staff | null;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const AUTH_KEY = 'todining_auth_staff';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Staff | null>(() => {
    if (typeof window === 'undefined') return null;
    const id = window.localStorage.getItem(AUTH_KEY);
    return id ? staffService.getById(id) ?? null : null;
  });

  const login = useCallback((identifier: string, password?: string, preferRestaurantId?: string | null) => {
    const found = staffService.authenticate(identifier, password, preferRestaurantId);
    if (found) {
      setUser(found);
      window.localStorage.setItem(AUTH_KEY, found.id);
      return found;
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(AUTH_KEY);
  }, []);

  const value = useMemo<AuthValue>(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
