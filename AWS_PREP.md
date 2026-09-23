# AWS Architecture Preparation

Branch: `launch/step-1`  
Post-merge (2026-09-23): merged into `main` via PR #2 (`0208378`); the branch name above is historical.  
Scope: repo-side work only — no AWS resources created, no DNS touched, no deployment yet.

Decision record: `docs/ADR-002-aws-production-architecture.md` (Proposed, 2026-09-23). Where this file and the ADR differ, the ADR is the intended state; this file is the working notes, aligned to it.

---

## B1 — Vercel-specific code classification

| Item | Classification | Rationale |
|---|---|---|
| `vercel.json` | **VERCEL ONLY — RETIRE before AWS deploy** | Vercel Services routing config. Not read by Amplify or App Runner. Can be deleted once the team commits to AWS. Keep in the branch for now since Vercel is still the fallback. |
| `IS_SERVERLESS = bool(os.environ.get("VERCEL"))` in `backend/server.py:52` | **KEEP — platform-independent** | On App Runner `VERCEL` is unset → `IS_SERVERLESS=False` → seeding + background workers run normally. This is correct and desired; no change to the gate. **One related change is required:** `client_ip()` (`server.py:340-354`) trusts `x-forwarded-for` only when `IS_SERVERLESS` is true, and on App Runner the container's socket peer is App Runner's own request router, so every visitor would share one rate-limit bucket (the A3 bug from LAUNCH_STATE.md, back again). Landed: with `TRUSTED_PROXY=apprunner` the service trusts the **rightmost** `x-forwarded-for` hop (the one App Runner appends), tested in `tests/test_api.py` — see ADR-002, "Security notes". |
| `REACT_APP_BACKEND_URL` (frontend build var) | **KEEP — set value changes per platform** | On Vercel: unset (same-origin). On AWS Amplify: `https://api.hianzy.com`. The Vite `envPrefix` already handles this var. No code change needed. |
| `backend/Dockerfile` | **KEEP — already App Runner compatible** | Python 3.12-slim, non-root user, port 8000, `uvicorn server:app --host 0.0.0.0 --port 8000`. Satisfies App Runner requirements. |
| `/api/health` endpoint | **KEEP — already suitable for App Runner health check** | Pings DB, returns `{"status":"ok","db":"connected"}` (200) or raises 503 with body `{"detail":"Database unavailable"}`. App Runner checks `/api/health` on port 8000. |
| `backend/.env.example` | **KEEP as local/Docker reference** | Created `backend/.env.aws.example` for production AWS values. |

---

## B2 — Amplify Hosting build spec

File created: `amplify.yml` (repo root).

Key points:
- Uses Amplify's monorepo `applications` / `appRoot: frontend` format, because the app lives in `frontend/` rather than the repo root. Amplify then runs every command from inside `frontend/` and resolves artifact paths relative to it, so each path matches `vercel.json`'s frontend service 1:1.
- Installs Node 22 via `nvm install 22` before `npm ci`.
- `npm run build` triggers all npm lifecycle hooks automatically: `prebuild` (opacity/SEO/sitemap checks), `build` (Vite), `postbuild` (67 prerendered HTML pages plus `404.html` via `prerender-metadata.cjs`; the count follows the content — 10 static pages, 6 service categories, 16 disciplines, 5 case studies, 30 insights; the six Orbit routes became hub sections in the 2026-09-23 consolidation).
- No Experiment Lab step. Superseded on 2026-09-23: earlier revisions copied `lab/` → `build/lab/` here and in `vercel.json`; the Lab is a separate product and is not deployed from this repository (root `CLAUDE.md`, "Product boundary").
- `baseDirectory: build` — relative to `appRoot`, so Amplify serves `frontend/build/`.

> **Why not `cd frontend` in each command:** within an Amplify phase the working directory persists between commands, so a `cd frontend` in the build phase followed by a root-relative path would resolve against `frontend/` and break. `appRoot` removes the ambiguity entirely.

**Amplify build environment variables (set in Amplify Console, not committed):**
```
AMPLIFY_MONOREPO_APP_ROOT=frontend      # REQUIRED — must equal appRoot
REACT_APP_BACKEND_URL=https://api.hianzy.com   # the App Runner service's public origin (see B4 and B14 for the order)
SITE_URL=https://hianzy.com             # optional — already the default in both build scripts
# LOCAL_API_URL must NOT be set: prerender-metadata.cjs prefers it over REACT_APP_BACKEND_URL
```

> `REACT_APP_BACKEND_URL` is read twice: Vite bakes it into the bundle, and
> `scripts/prerender-metadata.cjs` / `scripts/generate-sitemap.js` fetch
> `/api/case-studies` and `/api/insights` from it at build time. The API must
> therefore be deployed, public and healthy **before** the site is built, and the
> build log must show `metadata: generated 67 public HTML pages` (the number
> follows the content) and must not show
> `using the checked-in public content snapshot` — otherwise the build silently
> prerendered from the checked-in snapshot (ADR-002, "Build-time content
> dependency").

> **`AMPLIFY_MONOREPO_APP_ROOT` is not optional.** AWS requires it to hold the
> same value as `appRoot`. The Console sets it for you when you specify the app
> root while first connecting the repository, but you must set it by hand for
> an app that already exists or is created through CloudFormation. **The build
> fails without it.**

### Custom headers and the monorepo format

`customHttp.yml` lives at the repo root, is read automatically, and overrides
anything configured in the Console's Custom headers section.

Because `amplify.yml` uses the monorepo `applications` format, `customHttp.yml`
uses the matching nesting — `applications:` → `appRoot: frontend` →
`customHeaders:` — with the same `appRoot` as the build spec and as the
`AMPLIFY_MONOREPO_APP_ROOT` variable. (An earlier revision put `appRoot` on
each `customHeaders` entry, which is the CDK construct's property shape rather
than the file format.) AWS documents that monorepo custom headers use a
specific YAML format.

> **Verify at setup:** download the canonical `customHttp.yml` from the Amplify
> Console once during setup and confirm the committed file's shape matches. If
> `appRoot` is wrong the headers silently fail to apply — which would drop the
> CSP and every other protection in that file without any build error.

---

## B3 — SPA + prerender routing on Amplify

The site generates 67 prerendered `.html` files at build time (e.g. `build/work.html`, `build/network/strategy.html`, `build/insights/<slug>.html`) plus `build/404.html`; the number follows the content. Amplify must serve these at their clean URLs (e.g. `/work` → `build/work.html`) and fall back to the SPA shell only for a path that has no file — a database-only article published between builds, for example.

> ### ⚠ HIGH RISK — Amplify's documented SPA catch-all silently destroys the prerendering
>
> The usual Amplify SPA rule rewrites every extensionless path to `/index.html`
> with a 200 — source
> `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|avif)$)([^.]+$)/>`,
> target `/index.html`, type `200`. It matches `/work` and serves the generic SPA
> shell **instead of the prerendered `work.html`**. The page still looks correct
> to a human — React hydrates and renders — but crawlers get the shell's generic
> `<title>` and meta tags. All 76 prerendered pages would lose their SEO
> metadata, with no error anywhere to signal it. **Do not add that rule.**

**Owner Action — Amplify Console → App → Rewrites and redirects.**

Ten rules, in this order (delete anything Amplify pre-populated): nine permanent
redirects for the legacy URLs of the pages absorbed into their hubs
(docs/IA_CONSOLIDATION_AUDIT.md), then the single SPA fallback.

| # | Source | Target | Type | Purpose |
|---|---|---|---|---|
| 1 | `/work/built-here` | `/work#built-here` | `301` | Legacy URL of the Built Here roster, now a section of the Work hub |
| 2 | `/work/built-together` | `/work#built-together` | `301` | Legacy URL of the Built Together roster, now a section of the Work hub |
| 3 | `/network/collaborators` | `/network#collaborators` | `301` | Legacy URL of the collaborators roster, now a Network hub section |
| 4 | `/network/artists-creators` | `/network#creators` | `301` | Legacy URL of the creators roster, now a Network hub section |
| 5 | `/network/venue-partners` | `/network#venues` | `301` | Legacy URL of the venues roster, now a Network hub section |
| 6 | `/network/partners` | `/network#partners` | `301` | Legacy URL of the partners roster, now a Network hub section |
| 7 | `/collaborate` | `/network#collaborate` | `301` | Legacy URL of Collaborate, now the Network hub's participation track |
| 8 | `/careers` | `/network#careers` | `301` | Legacy URL of Careers, now the Network hub's permanent-seat track |
| 9 | `/who-we-work-with` | `/why-hi-anzy#who-we-work-with` | `301` | Legacy URL of Who We Work With, now a Why hiAnzy section |
| 10 | `/<*>` | `/index.html` | `404-200` | Rewrite only when no real file exists — the prerendered pages, `sitemap.xml`, `robots.txt` and hashed assets are served first; a genuinely unknown path gets the SPA shell |

Type `404-200` is what makes this safe: unlike a type `200` catch-all it is
applied only after Amplify fails to find a file, so it cannot shadow anything
that was built. A plain `404` → `/404.html` rule is deliberately *not* used:
an insight or case study published only in the database between builds has no
prerendered file yet and must still load as a 200 through the shell until the
next build.

> **AMPLIFY HASH REDIRECT — REQUIRES LIVE AWS VERIFICATION.** Rules 1–9 carry a
> `#section` fragment in their target. nginx (the Docker image) and the in-app
> router are verified to keep it; whether Amplify's redirect engine passes the
> fragment through in `Location` is not proven anywhere in this repository. On
> the temporary Amplify hostname, request each of the nine legacy URLs and
> confirm a 301 whose `Location` ends with the fragment. If Amplify drops the
> fragment, do not leave the rules as 301s to the bare hub path: replace rules
> 1–9 with type `200` rewrites to `/index.html` for exactly those nine paths,
> so the shell loads at the old URL and the in-app `LegacyRedirect` lands the
> visitor on the section (with `replace`, so Back still works). That fallback
> keeps visitors whole but leaves the old URLs answering 200, so it is a
> stopgap to record, not the intended end state.

**Verify empirically at setup — this is a launch gate.** The rule above relies
on Amplify answering the clean URL `/work` with the file `work.html` before the
fallback runs. Test it rather than assuming it:

1. Deploy to the temporary Amplify URL with only rule 1 configured.
2. Request a prerendered deep link directly, e.g. `/work`, and **view source**
   (not DevTools' rendered DOM, which shows post-hydration output either way).
3. The raw HTML must contain the page's own prerendered `<title>` —
   `Work | Proof, With Context | hiAnzy`. If it shows the generic shell title
   instead, the fallback is answering before the file; the fix is not a regex
   rule but moving the static tier to S3 + CloudFront with a CloudFront
   Function that reproduces nginx's `try_files $uri $uri.html $uri/`
   (ADR-002, Option B).
4. Re-test a nested route (`/network/strategy`), a database-backed route
   (`/insights/<slug>` taken from `build/route-metadata.json`), `/sitemap.xml`
   (must come back as XML, not HTML), and an unknown path (must render the
   not-found page).
5. Run `python scripts/check_raw_metadata.py --base https://<amplify-url>` —
   the same check CI runs against `vite preview`, for every route in
   `build/route-metadata.json`.
6. Check `Cache-Control` on the `/work` response: `customHttp.yml`'s
   `**/*.html` pattern is written for the file name, and the request is a clean
   URL; if the header is missing, move the HTML cache rule into the `**/*` entry.

This check is the difference between shipping working SEO and silently losing
it on every page, so treat it as a launch gate, not a nice-to-have.

**Superseded (2026-09-23):** earlier revisions copied the Experience Lab bundle into the artifact and checked `/lab/` in step 4. The Lab is a separate product now and is not deployed from this repository; `/lab/` is an unknown path on the Agency origin (root `CLAUDE.md`, "Product boundary").

---

## B4 — API URL architecture

**No code change needed.**

Current code: `const BASE = import.meta.env.REACT_APP_BACKEND_URL || ""` (in `frontend/src/lib/api.js`).

- Vercel: `REACT_APP_BACKEND_URL` unset → `BASE=""` → all calls go to `/api/...` (same-origin via Vercel Services routing).
- AWS Amplify + App Runner: set `REACT_APP_BACKEND_URL=https://api.hianzy.com` in the Amplify build environment → `BASE="https://api.hianzy.com"` → calls go to `https://api.hianzy.com/api/...`. The same variable feeds `scripts/prerender-metadata.cjs` and `scripts/generate-sitemap.js` at build time (B2), so the API must be live at that origin before the site builds.

The `vite.config.mjs` already has `envPrefix: ['VITE_', 'REACT_APP_']` so the existing variable name is forwarded to the bundle. No migration to `VITE_API_BASE_URL` is needed.

---

## B5 — FastAPI / App Runner readiness

`backend/Dockerfile` is already App Runner-compatible:
- Base image: `python:3.12-slim` ✓
- Non-root user (`appuser`, uid 10001) ✓
- `EXPOSE 8000` ✓
- CMD: `uvicorn server:app --host 0.0.0.0 --port 8000` ✓
- Health check wired to `/api/health` in Dockerfile ✓

App Runner configuration (Owner Action — set in the App Runner Console; no `apprunner.yaml` is committed because the service deploys from an ECR image, not from source):
```
Port: 8000
Health check: HTTP /api/health — interval 10 s, timeout 5 s, unhealthy threshold 5, healthy threshold 1
Instance: 1 vCPU / 2 GB; auto scaling min 1, max 1 at launch (per-process rate limiter, single notification worker)
Outbound: VPC connector → NAT Gateway with an Elastic IP (the address on the Atlas allow-list, see B15)
Environment variables: see backend/.env.aws.example (secrets referenced from Secrets Manager)
```

> App Runner does not act on the image's `HEALTHCHECK` instruction; the health
> check configured on the service is the one that matters. App Runner throttles
> the CPU of an idle instance, so the 30 s notification retry loop only
> progresses while requests are in flight — delivery state is durable in Mongo,
> so nothing is lost, a retry just waits for the next visitor.

---

## B6 — Container audit

`backend/Dockerfile` passes App Runner requirements without modification:

| Check | Status |
|---|---|
| Base image is a standard Linux distribution | ✓ python:3.12-slim |
| Listens on a single well-known port | ✓ 8000 |
| Process runs as non-root | ✓ appuser (uid 10001) |
| Entrypoint is a single long-running process | ✓ uvicorn (ASGI server, stays alive) |
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
- Raises `HTTPException(503, detail="Database unavailable")` → HTTP 503 with body `{"detail":"Database unavailable"}` when MongoDB is down (after the 5 s server-selection timeout).
- No auth required (public endpoint). `GET /api/` answers without touching the database and is the liveness probe for uptime monitors.

App Runner will mark the service unhealthy if health checks fail for the configured threshold — with interval 10 s and unhealthy threshold 5 that is ≈ 50 s of database unavailability before an instance is replaced. This is the desired behavior (don't serve traffic if DB is unreachable), with one accepted cost: seeding is on the startup path, so a replacement started during a database outage fails to start and App Runner keeps retrying until Atlas returns (ADR-002, "Health and readiness").

---

## B11 — Database seeding

Seeding is already correct for App Runner. No change needed.

`IS_SERVERLESS` is `False` on App Runner → `seed()` runs in the `lifespan` startup context → idempotent upserts (113 documents across five collections at the time of writing) on every container start — every deployment and every instance replacement included.

For explicit re-seeding (e.g. after adding new content to `seed_data.py`) there is no App Runner "task" and `aws apprunner start-deployment` takes no command override — it only redeploys the service. Either redeploy (the new container seeds itself on start), or run
```bash
python backend/manage.py seed
```
from an operator machine whose address is on the Atlas allow-list, with `MONGO_URL` / `DB_NAME` pointed at the production database. Do NOT set up automatic seeding on every deploy as a CI step — the container's own startup handles it.

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
3. Set build environment variables: `AMPLIFY_MONOREPO_APP_ROOT=frontend`, `REACT_APP_BACKEND_URL=https://api.hianzy.com` — the API must already be live at that origin (B14 order) — and, optionally, `SITE_URL=https://hianzy.com`. Never `LOCAL_API_URL`.
4. Every push to `main` triggers an Amplify build and deploy.
5. Custom domain: connect `hianzy.com` and `www.hianzy.com` in Amplify Console (see B14).

### Backend (App Runner)
1. App Runner Console → Create service → Source: **Container registry (ECR)**.
   - The image is built from `backend/Dockerfile` by `.github/workflows/deploy-api.yml` (GitHub OIDC → IAM role `hianzy-github-deploy` → ECR) and pushed as `hianzy-api:<git-sha>` only: the ECR repository uses immutable tags, App Runner automatic deployments stay off, and the workflow points the service at the exact SHA and waits for `/api/health`. Rollback is the same workflow run with a previous SHA as `image_tag`. Templates and the full plan: `deploy/aws/` and `docs/AWS_STAGING_EXECUTION_PLAN.md` (2026-09-24; this replaces the earlier `:prod`-tag idea).
   - App Runner's "source code repository" option is **not** a Dockerfile deploy: it builds with a managed runtime from an `apprunner.yaml`, which would replace the CI-tested `python:3.12-slim` image with whatever Python the managed runtime offers. Not used.
2. Set all env vars from `backend/.env.aws.example` (secrets referenced from Secrets Manager; the instance role needs `secretsmanager:GetSecretValue` on them).
3. Health check: HTTP, path `/api/health`, port `8000` (thresholds in B5).
4. Outbound traffic through the VPC connector + NAT Gateway (B15).
5. Custom domain: `api.hianzy.com` (see B14).

### CI check (existing `.github/workflows/check.yml`)
Existing GitHub Actions pipeline runs on push: pytest + frontend lint/test/build.
This pipeline continues to run as a gate before any merge to `main`.
No AWS-specific CI step is needed for the Amplify flow. The ECR image build and the App Runner update for the API live in `.github/workflows/deploy-api.yml` (added 2026-09-24 on `deploy/aws-staging`): its build and deploy jobs skip themselves until the `AWS_DEPLOY_ROLE_ARN` repository variable exists, and `tests/test_deploy_config.py` guards its shape (OIDC only, immutable commit tags, queued deploys, placeholder-only templates, no Experiment Lab coupling).

> Post-merge (2026-09-23): the paragraph below is historical; resolved in `14a6392` (lock regenerated from the reviewed tree, 236 files verified) and CI was green at the PR #2 merge.

**Currently red (historical):** `scripts/check_frontend_lock.py` fails against the stale `docs/frontend-source-lock.json` (LAUNCH_STATE.md, FINAL INDEPENDENT AUDIT, B-1/B-2). Until the lock is reviewed and regenerated — and generated files such as `frontend/public/sitemap.xml` and `frontend/scripts/content-snapshot.json` are excluded from it — CI is not a gate.

---

## B14 — Domain plan (Owner Action)

This section documents what the owner must configure after AWS resources exist.

| Domain | Target | Amplify/App Runner action |
|---|---|---|
| `hianzy.com` | Amplify Hosting | Amplify Console → Domain management → Add `hianzy.com` → verify via DNS |
| `www.hianzy.com` | Amplify Hosting (redirect or alias) | Add `www` subdomain in the same Amplify domain config |
| `api.hianzy.com` | App Runner | App Runner Console → Custom domain → Add `api.hianzy.com` → validate via CNAME |

**DNS records to add (at your registrar or Route 53):**
- App Runner provides a CNAME target plus certificate-validation CNAMEs for `api.hianzy.com`.
- Amplify provides specific CNAME/ANAME records during the domain verification flow for `hianzy.com` and `www`.

**Order (ADR-002) — the API record goes first, the visitor-facing records last:**
1. App Runner service is healthy on its default `*.awsapprunner.com` URL (`/api/health` returns 200).
2. Attach `api.hianzy.com` to App Runner. This record is not visitor-facing, so it can go before the smoke test; it lets the Amplify build bake the final API origin and lets `customHttp.yml`'s `connect-src` stay `https://api.hianzy.com` with no temporary origin.
3. Amplify build succeeds and the Amplify-provided URL renders the site with real content (the B3 gate passes) while `CORS_ORIGINS` temporarily also lists the `*.amplifyapp.com` origin.
4. End-to-end smoke test passes against the Amplify URL (contact form, subscribe confirmation, `/lab/`, `/sitemap.xml`).
5. Only then attach `hianzy.com` and `www.hianzy.com` to Amplify, remove the temporary origin from `CORS_ORIGINS`, and disconnect Vercel so both platforms do not build the same pushes.

---

## B15 — MongoDB Atlas (Owner Action)

A production MongoDB Atlas cluster is required. The local Docker Mongo is for development only.

**Steps (all Owner Actions):**
1. Create a MongoDB Atlas account (or use the existing one).
2. Create a new project: `hianzy-production`.
3. Create a cluster in the same region as App Runner (M0 or Flex only for the smoke test; a dedicated tier such as M10 for production reliability — verify current Atlas pricing).
4. Create a database user with read/write access to the `hianzy` database.
5. Network access: App Runner's default public egress has **no static IP**, so an allow-list is impossible without VPC egress. ADR-002 routes the service through a VPC connector and a NAT Gateway with an Elastic IP; allow only that address. Do not allow `0.0.0.0/0`.
6. Get the Atlas connection string: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/`
7. Store it in AWS Secrets Manager as `hianzy/prod/MONGO_URL`.
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
| `docs/ADR-002-aws-production-architecture.md` | Created (later) | Decision record: options, decision, env contract, owner actions |

**No code changes to `backend/server.py`, `frontend/` source, or any existing env files in this phase.**
The existing architecture is AWS-compatible with configuration-only changes, plus one small backend change required before launch — `client_ip()` behind App Runner (B1) — which landed after this phase, in the post-FABLE delta (`TRUSTED_PROXY`, tests in `tests/test_api.py`).
