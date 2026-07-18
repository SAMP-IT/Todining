// Thin client for the ToDining Node/Express API (the new PostgreSQL backend in
// `server/`). Base URL comes from VITE_API_URL at build time; when it is unset
// the app is running on its localStorage/demo fallback and there is no server to
// talk to. Keep this tiny and dependency-free.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export const isApiEnabled = Boolean(API_URL);

export interface DemoRequestInput {
  name: string;
  restaurantName?: string;
  email: string;
  phone?: string;
  locations?: string;
  message?: string;
}

export type DemoRequestResult =
  | { ok: true; id?: string; persisted: boolean }
  | { ok: false; error: string };

/**
 * Submit a Book-a-demo lead to `POST /api/demo-requests` (the public marketing
 * endpoint on our own Postgres API). When no API is configured (local/demo
 * build) we can't persist, so we resolve as a non-persisted success to match the
 * rest of the app's fallback posture rather than block the visitor.
 */
export async function submitDemoRequest(input: DemoRequestInput): Promise<DemoRequestResult> {
  if (!isApiEnabled) return { ok: true, persisted: false };
  try {
    const res = await fetch(`${API_URL}/api/demo-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok) return { ok: false, error: data.error || `Request failed (${res.status})` };
    return { ok: true, id: data.id, persisted: true };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection and try again.' };
  }
}
