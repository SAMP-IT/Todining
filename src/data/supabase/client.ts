// ─────────────────────────────────────────────────────────────────────────────
// Supabase client (swap path).
//
// The app ships on the in-memory data layer (src/data/mock + src/data/services).
// To go live: `npm i @supabase/supabase-js`, set VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY, uncomment below, and reimplement the service functions
// using this client. The UI imports only from `src/data/services`, so no screen
// changes are required.
//
// import { createClient } from '@supabase/supabase-js';
//
// const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
//
// export const supabase = url && anonKey ? createClient(url, anonKey) : null;
// export const isSupabaseEnabled = Boolean(supabase);

export const isSupabaseEnabled = false;
