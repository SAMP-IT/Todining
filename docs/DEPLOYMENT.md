# ToDining — Deployment (Dokploy + CI/CD)

ToDining is a **static Vite SPA** (no server of its own; Supabase is the only backend).
Deploying = building the bundle and serving `dist/` with an SPA fallback. This repo ships:

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage: `node:22` builds the SPA → `nginx:1.27` serves it. Verified: `docker build` + container serve test pass. |
| `deploy/nginx.conf` | SPA routing (`try_files … /index.html`), asset caching, gzip, security headers. |
| `.dockerignore` | Keeps the build context lean; never bakes `.env` secrets into the image. |
| `.github/workflows/ci.yml` | CI gate — `npm run lint` (real `tsc -b`) + `npm run build` on every push/PR to `main`. |

The pipeline is: **push to `main` → GitHub Actions CI (type-check + build) → Dokploy auto-deploy webhook rebuilds the Dockerfile and ships it.**

---

## ⚠️ Two decisions to make BEFORE the first public deploy

### 1. Demo mode vs. real (Supabase) mode — this is a security decision
- **Demo mode (no `VITE_SUPABASE_*` set):** the app runs on its localStorage backend. Each
  visitor gets their own seeded demo data; **nothing real or shared is exposed.** Safe to be
  public. *(Downside: not a real multi-user product — no shared persistence.)*
- **Real mode (`VITE_SUPABASE_*` set):** the anon key ships in the public bundle (by design).
  **Until the auth + RLS migration (`docs/AUTH-RLS-MIGRATION.md`) is live and verified, this
  publishes the cross-tenant data exposure to the internet** (any visitor can read/write every
  tenant's rows via the anon key). **Do NOT set the Supabase env on the public site until RLS is on
  and the anon probe returns 0 rows.**

👉 **Recommended: deploy in demo mode now** (validates the whole pipeline + gives an HTTPS preview
URL), finish the auth + RLS work, then switch to real mode by adding the env vars and redeploying.

### 2. Use a domain + HTTPS — do not serve the login over plain HTTP
The app has a sign-in form. Serving it over `http://<ip>:<port>` sends credentials in cleartext.
Point a DNS **A record** at `51.79.254.198` and let Dokploy/Traefik issue a Let's Encrypt cert.
(No domain handy? `todining.51.79.254.198.nip.io` resolves to the IP for testing, but a real
domain is strongly preferred for a trusted cert.)

---

## Step 1 — Get these files onto GitHub
Dokploy builds from the Git repo, so the `Dockerfile`, `deploy/`, `.dockerignore`, and workflow
must be pushed (ideally via a PR so CI runs on it), then merged to `main`.

## Step 2 — Connect GitHub to Dokploy (once)
Dokploy → **Settings → Git / Providers → GitHub** → install the Dokploy GitHub App on
`SAMP-IT/Todining` (needs org access — the Manoj-V-348 account can authorize). Alternatively use
the **Git** provider with the repo URL + a deploy key / PAT for the private repo.

## Step 3 — Create the Application
1. Open the **Todining** project → **Create Service → Application** (name it e.g. `web`).
2. **Provider:** GitHub → repo `SAMP-IT/Todining`, branch `main`.
3. **Build Type:** **Dockerfile** (path `./Dockerfile`, context `.`).
4. **Environment:** leave empty for demo mode. For real mode add (they're read at **build** time —
   Dokploy passes the app env into the Docker build as args matching the `ARG` names; if they come
   through empty, put them in the **Build-time Args** field instead):
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon/publishable key>
   VITE_USE_SUPABASE_AUTH=false   # → true only after the auth migration is live
   ```
5. **Deploy** (first deploy is manual).

## Step 4 — Domain + HTTPS
Application → **Domains → Add Domain** → host = your domain, **Container Port = 80**, enable
**HTTPS (Let's Encrypt)**. Add the DNS A record → `51.79.254.198` first.

## Step 5 — Turn on CI/CD
- **CD (auto-deploy):** Application → **Auto Deploy**. With the GitHub App, just toggle it on. With
  the Git provider, copy the app's **Webhook URL** → GitHub repo → **Settings → Webhooks → Add**
  (payload = the URL, content-type `application/json`, event = *push*). Now every push to `main`
  redeploys.
- **CI (quality gate):** `.github/workflows/ci.yml` already runs type-check + build on each push/PR.
  A broken build fails CI **and** the Dokploy Dockerfile build (so it never replaces the live
  version).

## Step 6 — Verify
Open the domain → app loads over HTTPS. Refresh on a deep link (e.g. `/admin`) → no 404 (SPA
fallback). Check the Dokploy deploy logs are green.

---

## Recommended rollout
1. **Now:** push artifacts → deploy in **demo mode** with a domain + HTTPS. Pipeline proven, safe preview live.
2. **Then:** complete `docs/AUTH-RLS-MIGRATION.md` (auth + RLS), verify isolation on a cloned/backed-up project.
3. **Finally:** add `VITE_SUPABASE_*` + set `VITE_USE_SUPABASE_AUTH=true` in Dokploy → redeploy → real, secured product.

## Notes
- The `VITE_*` "secret" warnings during `docker build` are benign: the Supabase **anon key is public
  by design** (it's meant to ship in the browser bundle) — RLS, not secrecy, is what protects data.
- The main JS chunk is ~577 kB (gzip ~167 kB). Fine to launch; a `manualChunks` split is a later
  optimization (tracked in `docs/COUNCIL-REVIEW.md`).
- Secure the Dokploy panel too — it's currently on `http://51.79.254.198:3000` (cleartext). Consider
  putting it behind a domain + HTTPS as well, since it controls all your infra.
