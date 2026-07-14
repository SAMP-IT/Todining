// ─────────────────────────────────────────────────────────────────────────────
// Supabase client — the single source of truth for the live backend.
//
// The app keeps a synchronous in-memory cache (src/data/mock/store.ts) that is
// hydrated from, and written through to, Supabase. The UI imports only from
// `src/data/services`, so no screen changes are required to go live.
//
// Frontend uses ONLY the anon/publishable key. The service_role key must never
// appear here — VITE_* variables are bundled into the public browser build.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Whether a live Supabase backend is configured. When false, the app runs on
 *  the local in-memory/localStorage fallback so development never hard-blocks. */
export const isSupabaseEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(url!, anonKey!, {
      // Persist + auto-refresh the Supabase Auth session so a signed-in staff
      // member stays authenticated across reloads. This is what makes RLS keyed
      // on auth.uid() work (see docs/AUTH-RLS-MIGRATION.md). Harmless until sign-in
      // is wired up: with no session, requests still run as anon.
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      // Cap realtime throughput so a burst of writes can't flood the client.
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

// Make the active backend obvious in the console — prevents silently running on
// the localStorage fallback (which never writes to Supabase) without noticing.
if (isSupabaseEnabled) {
  console.info('[ToDining] Data backend: Supabase →', url);
} else {
  console.warn(
    '[ToDining] Data backend: localStorage fallback. Set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY in .env (then restart the dev server) to use Supabase.',
  );
}
