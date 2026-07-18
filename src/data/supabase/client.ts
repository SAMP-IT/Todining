// ─────────────────────────────────────────────────────────────────────────────
// Backend client — the ToDining API (server/) over our own PostgreSQL.
//
// The app keeps a synchronous in-memory cache (src/data/mock/store.ts) that is
// hydrated from GET /api/bootstrap and written through via POST /api/sync. The UI
// imports only from src/data/services, so no screen changes are needed to go live.
//
// Set VITE_API_URL to the deployed API (e.g. https://api.todining.com). Unset →
// the app runs on the local in-memory/localStorage fallback so dev never blocks.
// (This file previously held the Supabase client; the app has moved to plain
// PostgreSQL + our own API — see CLAUDE.md "Backend pivot".)
// ─────────────────────────────────────────────────────────────────────────────

const apiBase = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? '';

/** Whether a live API backend is configured. When false, the app runs on the
 *  localStorage fallback so development never hard-blocks. */
export const isApiEnabled = Boolean(apiBase);

/** JSON rows keyed by the store's camelCase table keys (restaurants, menuItems,
 *  …, orderItems). Values are raw snake_case DB rows (mapped by `mappers.ts`). */
export type BootstrapPayload = Record<string, Record<string, unknown>[]>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = ((await res.json()) as { error?: string })?.error ?? '';
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`API ${path} → ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /** Hydrate the whole cache: every table, in the shape the store expects. */
  bootstrap: () => request<BootstrapPayload>('/api/bootstrap'),
  /** Persist one table's diff (upsert changed/new rows, delete removed ids). */
  sync: (table: string, upserts: Record<string, unknown>[], deletes: string[]) =>
    request<{ ok: boolean }>('/api/sync', {
      method: 'POST',
      body: JSON.stringify({ table, upserts, deletes }),
    }),
};

// Make the active backend obvious in the console (stripped from prod builds).
if (isApiEnabled) {
  console.info('[ToDining] Data backend: API →', apiBase);
} else {
  console.warn(
    '[ToDining] Data backend: localStorage fallback. Set VITE_API_URL (then restart ' +
      'the dev server) to use the PostgreSQL API.',
  );
}
