# AWS Architecture Preparation

Branch: `launch/step-1`  
Scope: repo-side work only — no AWS resources created, no DNS touched, no deployment yet.

---

## B1 — Vercel-specific code classification

| Item | Classification | Rationale |
|---|---|---|
| `vercel.json` | **VERCEL ONLY — RETIRE before AWS deploy** | Vercel Services routing config. Not read by Amplify or App Runner. Can be deleted once the team commits to AWS. Keep in the branch for now since Vercel is still the fallback. |
| `IS_SERVERLESS = bool(os.environ.get("VERCEL"))` in `backend/server.py:52` | **KEEP — platform-independent** | On App Runner `VERCEL` is unset → `IS_SERVERLESS=False` → seeding + background workers run normally. This is correct and desired. No code change needed. |
| `REACT_APP_BACKEND_URL` (frontend build var) | **KEEP — set value changes per platform** | On Vercel: unset (same-origin). On AWS Amplify: `https://api.hianzy.com`. The Vite `envPrefix` already handles this var. No code change needed. |
| `backend/Dockerfile` | **KEEP — already App Runner compatible** | Python 3.12-slim, non-root user, port 8000, `uvicorn server:app --host 0.0.0.0 --port 8000`. Satisfies App Runner requirements. |
| `/api/health` endpoint | **KEEP — already suitable for App Runner health check** | Pings DB, returns `{"status":"ok","db":"connected"}` or 503. App Runner checks `/api/health` on port 8000. |
| `backend/.env.example` | **KEEP as local/Docker reference** | Created `backend/.env.aws.example` for production AWS values. |

---

## B2 — Amplify Hosting build spec

File created: `amplify.yml` (repo root).

Key points:
- Uses Amplify's monorepo `applications` / `appRoot: frontend` format, because the app lives in `frontend/` rather than the repo root. Amplify then runs every command from inside `frontend/` and resolves artifact paths relative to it, so each path matches `vercel.json`'s frontend service 1:1.
- Installs Node 22 via `nvm install 22` before `npm ci`.
- `npm run build` triggers all npm lifecycle hooks automatically: `prebuild` (opacity/SEO/sitemap checks), `build` (Vite), `postbuild` (56 prerendered HTML pages via `prerender-metadata.cjs`).
- Copies `lab/` → `build/lab/` explicitly (Vercel handled this in its `buildCommand`).
- `baseDirectory: build` — relative to `appRoot`, so Amplify serves `frontend/build/`.

> **Why not `cd frontend` in each command:** within an Amplify phase the working directory persists between commands, so a `cd frontend` in the build phase followed by a root-relative path would resolve against `frontend/` and break. `appRoot` removes the ambiguity entirely.

**Amplify build environment variables (set in Amplify Console, not committed):**
```
AMPLIFY_MONOREPO_APP_ROOT=frontend      # REQUIRED — must equal appRoot
REACT_APP_BACKEND_URL=https://api.hianzy.com
```

> **`AMPLIFY_MONOREPO_APP_ROOT` is not optional.** AWS requires it to hold the
> same value as `appRoot`. The Console sets it for you when you specify the app
> root while first connecting the repository, but you must set it by hand for
> an app that already exists or is created through CloudFormation. **The build
> fails without it.**

### Custom headers and the monorepo format

`customHttp.yml` lives at the repo root, is read automatically, and overrides
anything configured in the Console's Custom headers section.

Because `amplify.yml` uses the monorepo `applications` format, each entry in
`customHttp.yml` also carries an `appRoot: frontend` key matching the build
spec. AWS documents that monorepo custom headers use a specific YAML format.

> **Verify at setup:** download the canonical `customHttp.yml` from the Amplify
> Console once during setup and confirm the committed file's shape matches. If
> `appRoot` is wrong the headers silently fail to apply — which would drop the
> CSP and every other protection in that file without any build error.

---

## B3 — SPA + prerender routing on Amplify

The site generates 56 prerendered `.html` files at build time (e.g. `build/work.html`, `build/network/strategy.html`). Amplify must serve these at their clean URLs (e.g. `/work` → `build/work.html`).

**Required Amplify Console configuration (Owner Action):**
Navigate to Amplify Console → App → Rewrites and redirects → Add rule:

| Source | Target | Type |
|---|---|---|
| `</^[^.]+$|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp\|avif)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

This catch-all rewrite serves `index.html` for paths that don't match a file extension.  
Prerendered pages are served directly as files first (Amplify's native behavior); this rule only applies to any unrecognized path.

**Note on `/lab/` subdirectory:** The `cp -r frontend/lab frontend/build/lab` in `amplify.yml` ensures the Experience Lab static bundle is in the artifact. Amplify serves it as a normal subdirectory.

---

## B4 — API URL architecture

**No code change needed.**

Current code: `const BASE = import.meta.env.REACT_APP_BACKEND_URL || ""` (in `frontend/src/lib/api.js`).

- Vercel: `REACT_APP_BACKEND_URL` unset → `BASE=""` → all calls go to `/api/...` (same-origin via Vercel Services routing).
- AWS Amplify + App Runner: set `REACT_APP_BACKEND_URL=https://api.hianzy.com` in the Amplify build environment → `BASE="https://api.hianzy.com"` → calls go to `https://api.hianzy.com/api/...`.

The `vite.config.mjs` already has `envPrefix: ['VITE_', 'REACT_APP_']` so the existing variable name is forwarded to the bundle. No migration to `VITE_API_BASE_URL` is needed.

---

## B5 — FastAPI / App Runner readiness

`backend/Dockerfile` is already App Runner-compatible:
- Base image: `python:3.12-slim` ✓
- Non-root user (`appuser`, uid 10001) ✓
- `EXPOSE 8000` ✓
- CMD: `uvicorn server:app --host 0.0.0.0 --port 8000` ✓
- Health check wired to `/api/health` in Dockerfile ✓

App Runner configuration (Owner Action — set in App Runner Console or `apprunner.yaml`):
```
Port: 8000
Health check: /api/health
Health check protocol: HTTP
Environment variables: see backend/.env.aws.example
```

---

## B6 — Container audit

`backend/Dockerfile` passes App Runner requirements without modification:

| Check | Status |
|---|---|
| Base image is a standard Linux distribution | ✓ python:3.12-slim |
| Listens on a single well-known port | ✓ 8000 |
| Process runs as non-root | ✓ appuser (uid 10001) |
| Entrypoint is a single long-running process | ✓ uvicorn (WSGI gateway, stays alive) |
| Health check endpoint exists | ✓ /api/health → 200 or 503 |
| No build-time secrets | ✓ secrets are runtime env vars |

No changes needed.

---

## B7 — Production .env.example with AWS placeholders

File created: `backend/.env.aws.example`

Covers every required variable with correct values for AWS production:
- `CORS_ORIGINS=https://hianzy.com,https://www.hianzy.com`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`
- `PUBLIC_API_URL=https://api.hianzy.com`
- Secrets (MONGO_URL, RESEND_API_KEY) annotated as Secrets Manager references.

---

## B8 — CORS for cross-subdomain

**No code change needed.** The existing `CORS_ORIGINS` env var mechanism is correct.

For AWS production (frontend on `hianzy.com`, backend on `api.hianzy.com`):
```
CORS_ORIGINS=https://hianzy.com,https://www.hianzy.com
```

Current code in `backend/server.py`:
- Reads `CORS_ORIGINS`, splits on `,`, strips each entry.
- Wildcard (`*`) is actively refused with a logged error.
- Empty list logs an error and effectively denies all cross-origin requests.
- `allow_credentials=True` is already set (required for cookie delivery across subdomains).

---

## B9 — Cookie / auth for cross-subdomain

**No code change needed.** The `COOKIE_SECURE` / `COOKIE_SAMESITE` env vars control this.

On Vercel (same-origin): `COOKIE_SAMESITE=lax` works because browser and API share a domain.  
On AWS (cross-subdomain: `hianzy.com` → `api.hianzy.com`): cookies must be `SameSite=None; Secure` to be sent cross-origin.

Required for AWS production:
```
COOKIE_SECURE=true
COOKIE_SAMESITE=none
```

`server.py` validates these at import time: `none` without `COOKIE_SECURE=true` raises `ValueError` and refuses to start — so a misconfiguration fails loudly rather than silently insecure.

**Auth note (P2 bug, pre-existing):** `VITE_AUTH_LOGIN_URL` / `AUTH_SESSION_DATA_URL` point at a third-party scaffold host. This is unresolved regardless of hosting platform and is not a new concern for AWS. Tracked in LAUNCH_STATE.md as P2.

---

## B10 — Health check

`GET /api/health` is already implemented and correct for App Runner:
- Returns `{"status":"ok","db":"connected"}` → HTTP 200 when MongoDB is reachable.
- Returns `{"status":"error","db":"unreachable"}` → HTTP 503 when MongoDB is down.
- No auth required (public endpoint).

App Runner will mark the service unhealthy if health checks return 503 for the configured threshold — this is the desired behavior (don't serve traffic if DB is unreachable).

---

## B11 — Database seeding

Seeding is already correct for App Runner. No change needed.

`IS_SERVERLESS` is `False` on App Runner → `seed()` runs in the `lifespan` startup context → idempotent upserts on every container start.

For explicit re-seeding (e.g. after adding new content to `seed_data.py`):
```bash
python backend/manage.py seed
```
This can be run as an App Runner task or a one-off `aws apprunner start-deployment` with an override command. Do NOT set up automatic seeding on every deploy as a CI step — the container's own startup handles it.

---

## B12 — Secrets classification for AWS Secrets Manager

| Secret | Secrets Manager? | Notes |
|---|---|---|
| `MONGO_URL` | **Yes — required** | Atlas connection string with embedded credentials |
| `RESEND_API_KEY` | **Yes — if using Resend** | API key for transactional email |
| `SMTP_PASS` | **Yes — if using SMTP fallback** | Email auth password |
| `COOKIE_SECURE`, `COOKIE_SAMESITE` | No — plain env var | Security config, not a credential |
| `CORS_ORIGINS`, `ENVIRONMENT`, `DB_NAME` | No — plain env var | Configuration, not sensitive |
| `CONTACT_NOTIFY_EMAIL`, `ADMIN_EMAILS` | No — plain env var | Email addresses, not credentials |
| `SITE_URL`, `PUBLIC_API_URL` | No — plain env var | Public URLs |
| `RESEND_FROM` | No — plain env var | Sender address, not a credential |

**Owner Action:** Create secrets in AWS Secrets Manager → reference them in the App Runner service definition as environment variables. App Runner natively supports Secrets Manager secret injection.

---

## B13 — GitHub → AWS deployment flow

**Source:** GitHub repo, branch `main` (post-launch merge target).

### Frontend (Amplify Hosting)
1. Amplify Console → Connect repository → GitHub → select `main` branch.
2. Amplify detects `amplify.yml` at the repo root and uses it automatically.
3. Set build environment variable: `REACT_APP_BACKEND_URL=https://api.hianzy.com`.
4. Every push to `main` triggers an Amplify build and deploy.
5. Custom domain: connect `hianzy.com` and `www.hianzy.com` in Amplify Console (see B14).

### Backend (App Runner)
1. App Runner Console → Create service → Source: Container registry OR GitHub source.
   - **Option A (recommended):** ECR — build Docker image in CI, push to ECR, App Runner pulls from ECR.
   - **Option B:** App Runner GitHub source — App Runner builds and runs the Dockerfile directly from the `backend/` directory.
2. Set all env vars from `backend/.env.aws.example` (secrets via Secrets Manager).
3. Health check path: `/api/health`, port `8000`.
4. Custom domain: `api.hianzy.com` (see B14).

### CI check (existing `.github/workflows/check.yml`)
Existing GitHub Actions pipeline runs on push: pytest + frontend lint/test/build.  
This pipeline continues to run as a gate before any merge to `main`.  
No AWS-specific CI steps are needed for the source-based deploy flows above.

---

## B14 — Domain plan (Owner Action)

This section documents what the owner must configure after AWS resources exist.

| Domain | Target | Amplify/App Runner action |
|---|---|---|
| `hianzy.com` | Amplify Hosting | Amplify Console → Domain management → Add `hianzy.com` → verify via DNS |
| `www.hianzy.com` | Amplify Hosting (redirect or alias) | Add `www` subdomain in the same Amplify domain config |
| `api.hianzy.com` | App Runner | App Runner Console → Custom domain → Add `api.hianzy.com` → validate via CNAME |

**DNS records to add (at your registrar or Route 53):**
- Amplify provides specific CNAME/ANAME records during the domain verification flow.
- App Runner provides a CNAME target for `api.hianzy.com`.
- Do not set these until Amplify and App Runner services are live and healthy.

**Do NOT touch DNS until:**
1. Amplify build succeeds and the Amplify-provided URL renders the site correctly.
2. App Runner service is healthy (`/api/health` returns 200 from the App Runner URL).
3. End-to-end smoke test passes against the temporary URLs.

---

## B15 — MongoDB Atlas (Owner Action)

A production MongoDB Atlas cluster is required. The local Docker Mongo is for development only.

**Steps (all Owner Actions):**
1. Create a MongoDB Atlas account (or use the existing one).
2. Create a new project: `hianzy-production`.
3. Create a cluster (M10 minimum for production reliability; M0/M2 free tier for staging).
4. Create a database user with read/write access to the `hianzy` database.
5. Allow App Runner egress IP ranges in the Atlas network access list. (App Runner's egress IPs are announced at deploy time; use a VPC + NAT Gateway with static IPs for a stable allowlist, or allow the App Runner service's outbound IPs from the console.)
6. Get the Atlas connection string: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/`
7. Store it in AWS Secrets Manager as `hianzy/mongo-url`.
8. Reference the secret in the App Runner service definition.
9. On first deploy, verify `/api/health` returns `{"status":"ok","db":"connected"}`.
10. Atlas data — the first App Runner startup seeds the database automatically via `seed()` in the lifespan hook.

**IMPORTANT:** Do NOT fabricate or guess the Atlas connection string. It is generated by Atlas and contains real credentials.

---

## Summary of file changes in this phase

| File | Action | Purpose |
|---|---|---|
| `amplify.yml` | Created | B2 — Amplify Hosting build spec |
| `customHttp.yml` | Created | B2 — Security headers for Amplify (replaces vercel.json headers, updates CSP connect-src) |
| `backend/.env.aws.example` | Created | B7 — Production env variable reference for App Runner |
| `AWS_PREP.md` | Created | B1–B15 documentation |

**No code changes to `backend/server.py`, `frontend/` source, or any existing env files.**  
The existing architecture is AWS-compatible without modification; only configuration values change.
