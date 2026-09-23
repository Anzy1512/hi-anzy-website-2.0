# ADR-002: AWS production architecture for the hiAnzy Agency Website

## Status

Proposed — nothing provisioned, nothing deployed. This document records a
decision for review; no AWS resource, DNS record, database, or credential
exists as a result of it. `AWS_PREP.md` (repo root) remains the working notes
from the preparation phase; where the two differ, this ADR is the intended
state and `AWS_PREP.md` is to be aligned to it in a follow-up commit. Aligned
versions of `amplify.yml`, `customHttp.yml`, `backend/.env.aws.example` and
`AWS_PREP.md` were drafted alongside this ADR but have not been applied.

## Date

2026-09-23

## Context

hiAnzy is one brand with two products in this repository (ADR-001). This ADR
concerns the Agency Website only; the Experience Lab is a pre-built static
bundle at `frontend/lab/` that every option below must serve verbatim at
`/lab/` (`amplify.yml:29` does `cp -r lab build/lab`; `vercel.json:8` does the
equivalent `fs.cpSync`).

What actually has to be hosted — verified against the code, not the docs:

- **Static tier.** `frontend/` is a Vite 7 + React 18 SPA
  (`frontend/package.json:18-19, 36`). `npm run build` runs `prebuild`
  (opacity check, SEO test, sitemap — `package.json:44`), `vite build`
  (`:41`), then `postbuild` = `scripts/prerender-metadata.cjs` (`:49`), which
  rewrites the `<head>` of `build/index.html` once per public route and writes
  **76 prerendered HTML files** plus `build/404.html` and
  `build/route-metadata.json` (`prerender-metadata.cjs:82-89`; verified:
  `route-metadata.json` holds 76 routes, `build/` holds 77 `.html` files
  outside `lab/`). The 76 are 13 static pages + 6 service categories + 16
  disciplines + 6 Orbit routes + 5 case studies + 30 insights. Every older
  document in the repo says 56 (`amplify.yml:25`, `AWS_PREP.md:28,64,76`,
  `CLAUDE.md:47`, `docs/operations.md:79`, `LAUNCH_STATE.md` throughout); that
  count predates the 20 knowledge articles and is stale.
- **Serving semantics the prerender depends on.** A request for `/work` must
  be answered with the file `work.html`, and only a path with no file may fall
  back to the shell. nginx does this with `try_files $uri $uri.html $uri/ =404`
  (`frontend/nginx.conf.template:104`); Vercel with `cleanUrls: true`
  (`vercel.json:9`). Any host that answers `/work` with `index.html` keeps the
  site visually intact and silently discards its SEO.
- **Cross-origin API.** The bundle calls the API at the origin baked in at
  build time: `import.meta.env.REACT_APP_BACKEND_URL` (`frontend/src/lib/api.js:3-4`),
  with credentialed fetches for auth (`frontend/src/lib/auth.js:18, 47, 82-86`).
- **Build-time API dependency.** `prerender-metadata.cjs:9` fetches
  `/api/case-studies` and `/api/insights` from
  `LOCAL_API_URL || REACT_APP_BACKEND_URL || http://127.0.0.1:8111` with a 4 s
  timeout (`:19-30`) and, on any failure, falls back to the checked-in
  `frontend/scripts/content-snapshot.json` with nothing but a `console.warn`
  (`:27`). `generate-sitemap.js:25` reads the same two variables in the
  **opposite** order (`REACT_APP_BACKEND_URL || LOCAL_API_URL`), and when an
  endpoint fails it preserves that family's URLs from the previous
  `public/sitemap.xml` (`:147-166`), failing only if no previous sitemap exists
  (`:167-169`).
- **API tier.** `backend/server.py` is FastAPI 0.141 + Motor 3.7
  (`backend/requirements.txt`). `MONGO_URL` and `DB_NAME` are required at
  import (`server.py:37-45`). `IS_SERVERLESS = bool(os.environ.get("VERCEL"))`
  (`:52`) gates three behaviours (see "Serverless gate"). When it is false, the
  lifespan (`:68-97`) seeds content on every start — 113 documents across five
  collections at the time of writing, upserted by natural key
  (`:868-908`) — and starts two `while True` workers: the rate-limit pruner
  (`:374-381`) and the notification retry loop
  (`backend/operations.py:61-70`, 30 s interval, lease-based, 5 attempts with
  exponential backoff). Contact and subscribe write to Mongo first and attempt
  delivery inline (`server.py:491-493, 546-548`); only the *retry* depends on
  the loop. The rate limiter is a per-process dict keyed on `client_ip()`
  (`:357-371`; contact and subscribe 5 per 10 min, newsletter actions 20 per
  10 min, analytics 60 per min). `/api/health` pings the database (`:389-396`).
  CORS is an explicit list with credentials (`:929-960`); cookie flags are
  validated at import (`:717-725`).
- **Container.** `backend/Dockerfile` is `python:3.12-slim`, non-root, port
  8000, `uvicorn server:app`. The frontend image (`frontend/Dockerfile`) is
  nginx and is not used by any AWS option below except D.
- **CI.** `.github/workflows/check.yml` runs pytest against a Mongo 7 service,
  then lint / vitest / `test:build` / `build`, the frontend lock check and
  `scripts/check_raw_metadata.py` against `vite preview`. The lock check was
  red when this ADR was drafted (`LAUNCH_STATE.md`, "FINAL INDEPENDENT
  AUDIT", B-1 and B-2) and was repaired in the same phase: every drift was
  traced in `FRONTEND_FREEZE_AUDIT.md`, the generated outputs were made
  deterministic (`generate-sitemap.js` fingerprints content instead of
  stamping the build date), and the lock was regenerated from the reviewed
  tree with `scripts/check_frontend_lock.py --write`.
- **Existing AWS preparation.** `amplify.yml` (monorepo `applications` /
  `appRoot: frontend`), `customHttp.yml` (security headers and a CSP whose
  `connect-src` names the API origin), `backend/.env.aws.example`, and
  `AWS_PREP.md` at the repo root. They were written for Option A below and
  are broadly right; the specific errors found while writing this ADR are
  listed under "Consequences" and corrected in the drafted aligned versions.
- **Database.** MongoDB Atlas is the intended production database
  (`AWS_PREP.md` §B15). No cluster exists.
- **Content snapshot.** The knowledge articles (`backend/knowledge_articles.py`,
  30 insights) and the regenerated `frontend/scripts/content-snapshot.json`
  are committed together (`98a7c8b`), and `tests/test_api.py` fails when the
  snapshot and the seed disagree. That test is the guard behind the
  snapshot-staleness rule below.
- **Constraints.** One owner, Windows workstation, small launch traffic, no
  operations team, a frontend design freeze (`AGENTS.md`), and a hard rule
  that no credential or production data ever enters the repository.

## Options considered

### A — Amplify Hosting (static) + App Runner (API, from ECR) + Atlas

Amplify builds `frontend/` from GitHub on push using the committed
`amplify.yml` (monorepo `appRoot: frontend`, which requires the app
environment variable `AMPLIFY_MONOREPO_APP_ROOT=frontend`), serves the 76
prerendered pages plus `/lab/` from its CDN, applies `customHttp.yml`, and
manages TLS and the custom domain. App Runner runs the existing backend image
from ECR as a provisioned 1 vCPU / 2 GB instance with an HTTP health check on
`/api/health`; Atlas holds the data. Routing on Amplify must use the single
rewrite `/<*>` → `/index.html` of type `404-200` (rewrite only when no real
file exists). Amplify's documented SPA catch-all
(`</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|avif)$)([^.]+$)/>`
→ `/index.html`, type 200) matches every extensionless path and would shadow
all 76 prerendered files. Atlas connectivity needs a decision: App Runner's
default egress has no static IP, so an Atlas allow-list is either `0.0.0.0/0`
or a VPC connector + NAT Gateway with an Elastic IP (roughly $32/month plus
per-GB), or Atlas PrivateLink (dedicated cluster tier).

### B — S3 + CloudFront (static) + App Runner (API) + Atlas

The frontend is built in GitHub Actions (which already builds it in
`check.yml`) and synced to a private S3 bucket behind CloudFront with Origin
Access Control. A CloudFront Function reproduces nginx's `try_files`
(`/work` → `/work.html`, `/lab/` → `/lab/index.html`), a custom error
response maps 404 to `/404.html`, and a response-headers policy carries the
security headers. Full control over routing and headers, no monorepo quirks,
at the cost of writing and owning the deploy pipeline (OIDC role, `aws s3
sync` with per-type `Cache-Control`, invalidations) and more objects to
provision. API tier identical to A.

### C — S3 + CloudFront (static) + Lambda via Mangum (API) + Atlas

The FastAPI app is wrapped with Mangum behind a Lambda Function URL or API
Gateway HTTP API, fronted by CloudFront. Near-zero cost at launch traffic, but
it is not a configuration change: `IS_SERVERLESS` is gated on `VERCEL` only,
so on Lambda the lifespan would seed on every cold start and start the two
`while True` workers inside a frozen execution environment, and `client_ip()`
would fall back to the socket peer. The gate must be generalised in code, the
retry loop replaced by an EventBridge Scheduler invocation, and the per-IP
limiter accepted as ineffective or moved to a shared store. Cold starts of a
few seconds on a Python + Motor function are visible on the contact form.

### D — One ECS Fargate task or EC2 host running the docker-compose stack behind an ALB

The three compose services (nginx web, API, Mongo) run as-is on a single
host. nginx's proven routing and headers are used unchanged, and an EC2
instance with an Elastic IP gives Atlas a free static address (or Mongo stays
on the host, with no managed backups). Everything else is owned by the
operator: OS and Docker patching, TLS (ALB + ACM, or a reverse proxy on the
host), deploys over SSM/SSH, a single availability zone, and a per-push build
pipeline that A provides out of the box.

### Comparison

Assumed launch traffic: ≤ 10k page views and ≤ 10 GB of egress per month,
≤ 20 site builds per month. App Runner unit prices and the NAT Gateway
figure are verified against AWS documentation (September 2026); every other
price is an estimate to confirm on the pricing pages before the budget alarm
is set. Atlas is common to all four and is excluded from the totals (M0 free
for the smoke test; a dedicated tier for production is a separate line).

| Criterion | A — Amplify + App Runner | B — S3/CloudFront + App Runner | C — S3/CloudFront + Lambda (Mangum) | D — Single host (compose) + ALB |
|---|---|---|---|---|
| Estimated monthly cost at launch traffic | App Runner ≈ $11–14 (2 GB × $0.007/GB-h continuously ≈ $10.2, plus $0.064/vCPU-h while active) + Amplify ≈ $2–4 → **≈ $14–19**; **+ ≈ $32–35 with NAT** for a static egress IP | App Runner ≈ $11–14 + S3/CloudFront ≈ $1–3 → **≈ $13–18**; + NAT as A | Lambda + Function URL ≈ $0–2 + S3/CloudFront ≈ $1–3 → **≈ $2–5**; + NAT as A if an allow-list is required | EC2 t4g.small + EBS + public IPv4 ≈ $18, ALB ≈ $16–22 → **≈ $18–40**; Fargate variant ≈ $35–40 |
| Ops burden | Low: push-to-deploy for both tiers, managed TLS/DNS, no servers; one CI job to build/push the API image | Medium: own the S3 sync + invalidation pipeline, CloudFront Function, headers policy, OAC, ACM in us-east-1 | Medium–high: code change to the gate, Mangum handler, scheduler, IAM, two CloudFront origins | High: patching, TLS, backups, deploys, single AZ, capacity |
| Fit for the background notification loop (30 s) | Runs (`IS_SERVERLESS` false). App Runner bills vCPU only while requests are being served and memory continuously, i.e. an idle instance has its CPU throttled, so retries progress only while requests are in flight; delivery state is durable in Mongo, so nothing is lost — a failed notification waits for the next visitor | Same as A | Does not run: the environment is frozen between invocations. Needs an EventBridge Scheduler → Lambda that calls `process_pending`, or accept manual `manage.py retry` | Runs continuously, exactly as in Docker |
| Fit for the in-memory rate limiter | Per instance; exact with max 1 instance, N× the limit with N instances. **Requires the `client_ip()` change** (see Security notes) or every visitor shares one bucket | Same as A | Per execution environment: effectively no limit under concurrency; the same `client_ip()` problem | Exact (one process), socket peer is the ALB → also needs the `client_ip()` change |
| Startup seeding | Runs on every instance start and deploy; ~113 upserts against Atlas over the VPC/NAT path; a DB outage during start fails the instance and App Runner retries | Same as A | Runs on every cold start unless the gate is generalised — unacceptable as-is | Runs on container start |
| Static egress IP / Atlas allow-list | None by default. VPC connector routes **all** outbound through the VPC → NAT Gateway with an EIP (≈ $32/month + per-GB) or Atlas PrivateLink (dedicated tier). Otherwise the allow-list is `0.0.0.0/0` | Same as A | Same as A (Lambda in a VPC + NAT) | EC2 with an Elastic IP: free static address (public IPv4 charge only). Fargate: no |
| Build-time API dependency (prerender + sitemap) | Amplify's build container must reach the API over the public internet; API must be deployed and healthy before the site builds; fallback to the snapshot is silent | GitHub Actions runner reaches the public API; same silent fallback | Same as B, plus a cold start inside the 4 s fetch timeout can trigger the fallback | Image build in CI or on the host; same fallback |
| Cold starts | None (provisioned instance; idle CPU throttling only) | None | 1–3 s on cold invocations, plus the first Mongo connection | None |
| TLS / DNS handling | Amplify: managed certificate and domain flow for `hianzy.com` / `www`. App Runner: managed certificate for `api.hianzy.com` via validation CNAMEs | ACM certificate (us-east-1) on CloudFront + Route 53/registrar records; App Runner as A | ACM on CloudFront + API Gateway custom domain, or CloudFront path routing to the function | ALB + ACM, or Caddy/certbot on the host |
| Rollback | Amplify: redeploy a previous build from the Console. App Runner: redeploy the previous image tag; failed health checks during a deploy roll back automatically | Re-sync the previous build artifact + invalidate; App Runner as A | Lambda alias → previous version; CloudFront as B | `docker compose` with the previous image tags |
| Prerender routing risk | Depends on the `404-200` rule and Amplify's clean-URL resolution — must be proven by the view-source gate | Fully controlled by the CloudFront Function; reproduces nginx exactly | As B | Zero: nginx config already tested |

## Decision

**Option A: Amplify Hosting for the static site, App Runner (from an ECR
image) for the API, MongoDB Atlas for data — with the mitigations below as
conditions of the decision, not optional extras.**

Why A. The repository was prepared for it, and the preparation is
substantially correct: the backend container is App Runner-ready unchanged,
`REACT_APP_BACKEND_URL` already reaches the bundle and both build scripts,
`CORS_ORIGINS` and the cookie flags are configuration values, and
`IS_SERVERLESS` is false on App Runner so seeding and both workers behave as
they do in Docker. For a single owner with no operations team, "push to
`main`, both tiers deploy, TLS and DNS are managed" is worth more than the
few dollars B saves, and B's advantage — full control of routing — only
matters if Amplify's `404-200` rule fails the view-source gate. C is cheapest
but is a code change to a backend whose serverless gate was deliberately
scoped to Vercel, and it sacrifices the durable-retry loop that the
operations design (`docs/operations.md`) relies on. D reproduces the tested
nginx routing exactly and solves the Atlas allow-list for free, but it hands
the owner a server to keep alive, which is the one thing this project cannot
staff.

Conditions:

1. **Routing.** Exactly one Amplify rewrite: `/<*>` → `/index.html`, type
   `404-200`. Amplify's regex SPA catch-all is never added. A plain
   `/<*>` → `/404.html` (type 404) rule is *not* used either: an insight or
   case study published only in the database between builds has no
   prerendered file yet and must still load as a 200 through the shell. The
   view-source test in `AWS_PREP.md` §B3 is a launch gate: `/work`,
   `/network/strategy`, one `/insights/<slug>`, `/lab/`, `/sitemap.xml` and an
   unknown path, checked on the raw response, plus
   `scripts/check_raw_metadata.py --base <amplify-url>` for all 76 routes.
2. **Atlas connectivity.** App Runner egress goes through a VPC connector and
   a NAT Gateway with an Elastic IP; the Atlas network access list contains
   that one address. `0.0.0.0/0` is not used. This is the single largest
   avoidable cost in the design (≈ $32/month plus per-GB) and is accepted
   because the alternative exposes the production database to the internet
   behind credentials alone.
3. **Sizing.** One provisioned instance (1 vCPU / 2 GB, auto scaling min 1
   / max 1) at launch, so the per-process rate limiter and the notification
   loop have exactly one worker. Scaling out later requires moving the limiter
   to a shared store first.
4. **Client IP.** Before launch, `server.py`'s `client_ip()` is extended to
   trust the rightmost `x-forwarded-for` hop when an explicit environment
   variable says the service is behind App Runner (see Security notes). This
   is a small, tested code change of the same shape as the Vercel fix
   (`LAUNCH_STATE.md`, A3); without it the limiter is one global bucket.
5. **Image path.** App Runner deploys from ECR (`hianzy-api`), built from
   `backend/Dockerfile`. App Runner's "source code repository" mode is not a
   Dockerfile deploy — it uses a managed runtime and `apprunner.yaml` — and
   would replace the CI-tested `python:3.12-slim` image. A GitHub Actions
   workflow to build and push the image is a follow-up; the first image may be
   pushed from a workstation.
6. **Build order and cutover.** API first: App Runner healthy on its default
   domain → `api.hianzy.com` attached to App Runner (an API-only record, not
   visitor-facing) → Amplify built with `REACT_APP_BACKEND_URL=https://api.hianzy.com`
   → smoke test on the Amplify default URL with the `*.amplifyapp.com` origin
   temporarily in `CORS_ORIGINS` → `hianzy.com` / `www` attached → temporary
   origin removed → Vercel disconnected. This keeps `customHttp.yml`'s
   `connect-src` at the final origin and avoids a second build. It refines
   `AWS_PREP.md` §B14's blanket "no DNS until the smoke test passes" to "no
   visitor-facing DNS until then".
7. **Headers.** `customHttp.yml` is verified against the Console-exported
   file and against live responses before launch; the CSP is kept as it is
   (audited against the built site — see Security notes).
8. **Build-time content rule** (own section below) is enforced by reading the
   build log until a code-level guard exists.

What would change the decision:

- The view-source gate fails and no `404-200` configuration serves
  `work.html` for `/work` → move the static tier to B (CloudFront Function
  reproducing `try_files`), keep the API tier unchanged.
- The owner rejects the NAT cost → either accept `0.0.0.0/0` with
  compensating controls (unique DB user scoped to the `hianzy` database, long
  random password, rotation, Atlas alerting) recorded as an explicit risk
  acceptance, or move the API to D on EC2 with an Elastic IP.
- Traffic stays near zero for months and the ≈ $10/month App Runner floor
  matters more than delayed notification retries → C, after the gate refactor
  and a scheduler for `process_pending`.
- The auth question (P2) is resolved with a provider that needs a
  same-origin API → B with CloudFront path routing (`/api/*` → App Runner),
  which also removes the need for `SameSite=None`.
- `customHttp.yml` cannot be made to apply on a monorepo app → B, where the
  headers are a CloudFront response-headers policy.

## Consequences

Positive:

- No backend code change is needed for the platform itself; the one change
  (client IP behind a proxy) is small, testable, and platform-agnostic.
- Both tiers deploy from `main` without a hand-written pipeline for the site;
  preview branches are available on Amplify if wanted later.
- The durable notification design keeps working; the Lab boundary (ADR-001)
  is preserved by the same `cp -r lab build/lab` step.
- TLS, certificates and domain validation are managed for both hostnames.
- Rollback is a Console action on both tiers.

Negative:

- A fixed ≈ $10/month App Runner floor even at zero traffic, and ≈ $32/month
  more for the NAT Gateway that the allow-list decision requires.
- Prerender routing on Amplify is a documented rule plus an empirical gate,
  not something the repository can test in CI as it does for nginx.
- The build depends on a public, healthy API at build time and falls back
  silently to the snapshot — a process rule until a guard is coded.
- Two more Console-side facts must be verified at setup and are not in the
  repo: the monorepo `customHttp.yml` shape, and whether the `**/*.html`
  cache pattern applies to clean-URL responses.
- `AMPLIFY_MONOREPO_APP_ROOT=frontend` is required Console state; a
  misconfigured app fails to build rather than silently misbehaving, which is
  the better failure mode.
- Errors found in the current AWS files that this ADR corrects (line numbers
  from the current files): the shadowing regex catch-all presented as the
  fallback rule (`AWS_PREP.md:89`); the 56-page count (`amplify.yml:25`,
  `AWS_PREP.md:28,64,76`); App Runner "GitHub source" described as building
  the Dockerfile (`AWS_PREP.md:267`); App Runner egress IPs described as
  "announced at deploy time" (`AWS_PREP.md:310`); re-seeding via an "App
  Runner task or `start-deployment` with an override command", neither of
  which exists (`AWS_PREP.md:232`); the 503 body given as
  `{"status":"error","db":"unreachable"}` when the code raises
  `HTTPException(503, detail="Database unavailable")` (`AWS_PREP.md:215` vs
  `server.py:395`); "uvicorn (WSGI gateway)" (`AWS_PREP.md:154`; it is an ASGI
  server); `COOKIE_SAMESITE=none` described as required for
  `hianzy.com → api.hianzy.com` (`backend/.env.aws.example:12-13, 29`; those
  are same-site, so `lax` would also work — `none` is required only while the
  site and API sit on different default domains); and `customHttp.yml`
  carrying `appRoot` on each entry rather than under an `applications` list
  (`customHttp.yml:24, 39, 46`) — unverified either way and flagged as a
  setup gate.

## Build-time content dependency

Rule, stated once so the build log can be read against it:

1. **Which URL the Amplify build uses.** `REACT_APP_BACKEND_URL`, and only
   that. `LOCAL_API_URL` must not exist in the Amplify environment, because
   `prerender-metadata.cjs:9` prefers it and `generate-sitemap.js:25` prefers
   the other, so a stray value would prerender and sitemap from two different
   APIs. No `frontend/.env` file is present in the repository, and none may be
   added to the build (`prerender-metadata.cjs:7` and `generate-sitemap.js:23`
   would load it).
2. **When the checked-in snapshot is the source.** Whenever the fetch of
   `/api/case-studies` or `/api/insights` fails within 4 s, returns non-2xx,
   or returns records without `slug` and `title` (`prerender-metadata.cjs:19-30`).
   The build still succeeds and still writes 76 pages; the only signal is the
   line `metadata: <endpoint> unavailable; using the checked-in public content
   snapshot` in the log. The sitemap keeps the previous `/insights/` and
   `/work/` URLs for a failed family and logs `[API unreachable —
   database-backed pages omitted]` only when both families are empty
   (`generate-sitemap.js:185-190`).
3. **A stale snapshot silently prerenders stale metadata.** Titles,
   descriptions, `og:image` and the sitemap for case studies and insights
   come from whatever the snapshot holds. Today `HEAD`'s snapshot has 10
   insights and the working tree's has 30: a build of `HEAD` with the API
   unreachable would ship 56 pages and a sitemap missing 20 articles, green.
   `tests/test_api.py::test_public_metadata_snapshot_matches_seed_content`
   keeps the snapshot equal to `seed_data.py` at commit time, so the snapshot
   is only ever as stale as the last commit — never fresher than the seed, and
   never aware of database-only editorial edits.
4. **Operational consequence.** The API is deployed and healthy before every
   site build; the build log must contain `metadata: generated 76 public HTML
   pages` (the number changes with content) and must not contain the snapshot
   or "API unreachable" lines. Content published only in the database (not in
   `seed_data.py`) needs a site rebuild to get a prerendered page and a
   sitemap entry, and that rebuild must run with the API up. Recommended
   follow-up (code, out of scope here): an environment flag that turns the
   snapshot fallback into a build failure on Amplify.

## Runtime environment contract

Every variable read by the backend and the frontend build, from a grep of the
code (not the docs). Values are never recorded here.

Backend (App Runner service `hianzy-api-prod`):

| Name | Required? | Consumer | Production source (placeholder) |
|---|---|---|---|
| `MONGO_URL` | Yes — import-time `RuntimeError` if empty | `server.py:44` | App Runner runtime secret ← Secrets Manager `hianzy/prod/MONGO_URL` |
| `DB_NAME` | Yes — same | `server.py:45` | App Runner env var (plain), `hianzy` |
| `VERCEL` | Must be **unset** | `server.py:52` (`IS_SERVERLESS`) | Not set anywhere on AWS |
| `ENVIRONMENT` | No (default `production`) | `server.py:65-66`, `:103-105`, `:924-925` | App Runner env var, `production` |
| `CORS_ORIGINS` | Yes for the cross-origin site (empty in production denies all) | `server.py:929-951` | App Runner env var (plain): site origins; temporarily plus the Amplify default origin during the smoke test |
| `COOKIE_SECURE` | No (default = `IS_PRODUCTION`; must be `true`/`false`) | `server.py:717-720` | App Runner env var, `true` |
| `COOKIE_SAMESITE` | No (default `none` when secure) | `server.py:721-725` | App Runner env var, `none` pre-cutover (cross-site default domains); `lax` is valid once both hosts are under `hianzy.com` |
| `RESEND_API_KEY` | No — preferred mail path when set | `server.py:254, 311` | App Runner runtime secret ← Secrets Manager `hianzy/prod/RESEND_API_KEY` |
| `RESEND_FROM` | No — needed with the key for `mail_configured()` | `server.py:296, 310` | App Runner env var (plain) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` | No — fallback mail path | `server.py:271-275, 296, 310` | App Runner env vars (plain), only if SMTP is chosen |
| `SMTP_PASS` | No | `server.py:276` | App Runner runtime secret ← Secrets Manager `hianzy/prod/SMTP_PASS`, only if SMTP is chosen |
| `CONTACT_NOTIFY_EMAIL` | No — notifications no-op without it | `server.py:295, 632`; `manage.py:32` | App Runner env var (plain) |
| `ADMIN_EMAILS` | No — empty denies the admin routes | `server.py:561`; `manage.py:31` | App Runner env var (plain) |
| `SITE_URL` | No (default `https://hianzy.com`) | `server.py:315` | App Runner env var (plain) |
| `PUBLIC_API_URL` | No (default `SITE_URL`) — on AWS it must be the API origin, because confirm/unsubscribe links are `/api/newsletter/...` on the API | `server.py:319, 334`; `manage.py:81` | App Runner env var (plain): the API origin |
| `AUTH_SESSION_DATA_URL` | No (default: third-party scaffold host) | `server.py:714` | App Runner env var (plain) — P2 decision |
| *(proposed)* proxy-trust flag for `client_ip()` | Required once the code change lands | `server.py:340-354` (to be extended) | App Runner env var (plain) |
| `TEST_MONGO_URL` | Tests only | `tests/test_api.py:12` | CI only |

Not variables but part of the contract: `server.py:35` loads `backend/.env`
if present — no such file exists in the image (`backend/.dockerignore`
excludes `.env*` except `.env.example`); `backend/Dockerfile:5-7` sets
`PYTHONUNBUFFERED`, `PYTHONDONTWRITEBYTECODE`, `PIP_NO_CACHE_DIR`, which the
application does not read; the port is fixed at 8000 by the `CMD`.

Frontend build (Amplify app `hianzy-website`, build-time only — nothing is
read at runtime in the browser except what Vite inlined):

| Name | Required? | Consumer | Production source (placeholder) |
|---|---|---|---|
| `AMPLIFY_MONOREPO_APP_ROOT` | Yes — must equal `appRoot` in `amplify.yml:9` | Amplify itself | Amplify app env var, `frontend` |
| `REACT_APP_BACKEND_URL` | Yes on AWS (unset only for same-origin hosting) | `frontend/src/lib/api.js:3` (bundle); `scripts/prerender-metadata.cjs:9`; `scripts/generate-sitemap.js:25`; `scripts/link-graph.cjs:24`; `frontend/Dockerfile:8` | Amplify app env var: the API origin, no path, no trailing slash |
| `LOCAL_API_URL` | Must be **unset** on Amplify | `scripts/prerender-metadata.cjs:9` (takes precedence); `scripts/generate-sitemap.js:25`; `vite.config.mjs:7` (dev proxy); `scripts/link-graph.cjs:24` | Local development only |
| `SITE_URL` | No (default `https://hianzy.com`) — canonical/`og:url` origin and sitemap host | `scripts/prerender-metadata.cjs:8`; `scripts/generate-sitemap.js:24`; `frontend/Dockerfile:7` | Amplify app env var (optional) |
| `VITE_AUTH_LOGIN_URL` | No (default: third-party auth host) | `frontend/src/lib/auth.js:40` | Amplify app env var — P2 decision |
| `CI` | No — set by `frontend/Dockerfile:10` only; not read by repo code | — | Not needed on Amplify |
| `CSP_CONNECT_SRC` | Docker only — nginx `envsubst` | `frontend/nginx.conf.template:40,54,78,88,102`; `frontend/Dockerfile:21`; `docker-compose.yml:82` | Not used on Amplify; `customHttp.yml` carries the CSP |
| `NODE_PATH` | Tests only | `scripts/build.test.cjs:35` | — |

Vite's `envPrefix: ['VITE_', 'REACT_APP_']` (`vite.config.mjs:9`) is what lets
`REACT_APP_BACKEND_URL` reach the bundle; any other variable with those
prefixes set in the Amplify environment would be inlined too, so nothing
sensitive may ever carry those prefixes.

## Serverless gate

`IS_SERVERLESS = bool(os.environ.get("VERCEL"))` (`server.py:52`) is true
only where Vercel sets `VERCEL=1`. It disables or changes exactly three
things:

1. **Connection pool** — `maxPoolSize=10` is applied to the Motor client
   (`server.py:59-62`); otherwise the driver default (100) is used.
2. **Lifespan startup** (`server.py:72-89`) — `seed()` is skipped, and
   neither `_prune_rate_limiter_loop()` nor `notification_loop(...)` is
   started. Contact and subscribe still persist first and attempt delivery
   inline; only delayed retries are lost, to be driven by `manage.py retry`.
3. **Client IP** (`server.py:350-353`) — the first hop of `x-forwarded-for`
   is trusted, because Vercel overwrites that header. Everywhere else the
   socket peer is used.

On App Runner (Options A, B) and on a host (D), `VERCEL` is unset, so all
three revert to the Docker behaviour, which is what the durable-delivery
design expects.

Why it matters for Option C: on Lambda `VERCEL` is also unset, so none of the
three protections apply. Mangum runs the lifespan on every cold start, which
would perform ~113 upserts and 9 index creations against Atlas before the
first request, would start two `while True` tasks inside an execution
environment that is frozen between invocations, and would leave
`client_ip()` reading the socket peer — the AWS front, the same address for
every visitor. Option C therefore requires generalising the gate (for
example on `AWS_LAMBDA_FUNCTION_NAME`) and revisiting which
`x-forwarded-for` hop the AWS front makes trustworthy. Setting `VERCEL=1` on
Lambda to force the gate would be wrong: it would also switch the client-IP
logic to Vercel's header semantics.

## Health and readiness

- `GET /api/health` (`server.py:389-396`) runs `db.command("ping")`. Success
  returns HTTP 200 `{"status":"ok","db":"connected"}`. Failure raises
  `HTTPException(503, detail="Database unavailable")`, so the body is
  `{"detail":"Database unavailable"}` (not the shape `AWS_PREP.md:215`
  describes). Server selection times out after 5 s
  (`serverSelectionTimeoutMS`, `server.py:59`). No authentication; the
  security-headers middleware applies.
- `GET /api/` (`server.py:384-386`) returns `{"service":"hiAnzy API","status":"ok"}`
  without touching the database — a liveness probe for uptime monitors that
  should not page on an Atlas blip.
- Recommended App Runner health check: protocol **HTTP**, path
  **`/api/health`**, port 8000, interval **10 s**, timeout **5 s**, unhealthy
  threshold **5**, healthy threshold **1**. That tolerates ≈ 50 s of database
  unavailability before App Runner replaces the instance. App Runner runs its
  own health check from the service configuration; do not rely on the image's
  `HEALTHCHECK` instruction (`backend/Dockerfile:22-23`) being evaluated —
  confirm in the Console that the service-level check is the one configured.
- Readiness is coupled to the database by design: every public endpoint
  reads Mongo, so an instance without a database is correctly unhealthy. The
  cost is that a database outage during a deployment or an instance
  replacement fails startup (seeding is on the startup path) and App Runner
  retries until Atlas returns. Accepted for launch; revisit if Atlas
  maintenance windows cause restart churn.
- External monitoring: an HTTP check on `https://api.hianzy.com/api/health`
  every 1–5 minutes, alerting on 503 or timeout, plus `manage.py status`
  daily for `failedNotifications` (`docs/operations.md`).

## Security notes

- **CORS.** `CORS_ORIGINS` is an explicit, comma-separated list; `*` is
  stripped with an error log (`server.py:941-945`); an empty list in
  production denies every cross-origin request (`:947-949`);
  `allow_credentials=True`, methods `GET, POST, OPTIONS`, headers
  `Content-Type, Authorization, X-Session-ID` (`:953-960`). Production value:
  `https://hianzy.com,https://www.hianzy.com`; during the smoke test also the
  Amplify default origin, removed at cutover.
- **Rate limiter multiplies per instance, and is currently blind on App
  Runner.** The limiter is per process (`server.py:357-371`); with N
  instances the effective ceiling is N× each limit, which is why the decision
  pins max instances to 1. More importantly, `client_ip()` (`:340-354`) trusts
  `x-forwarded-for` only when `IS_SERVERLESS` is true. On App Runner the
  container's socket peer is App Runner's request router, so `request.client.host`
  is the same value for every visitor: five contact submissions by anyone in
  ten minutes would return 429 to everyone, and analytics would drop
  everything after the first 60 events per minute site-wide (`:703-704`). The
  same failure applies behind an ALB (D) and API Gateway (C). Required change
  before launch: when an explicit environment flag says the service is behind
  App Runner, use the **rightmost** `x-forwarded-for` entry — the hop appended
  by the platform — never the leftmost, which a client can supply. Cover it
  with a test in both directions, as A3 did. Do not "fix" it with uvicorn's
  `--forwarded-allow-ips='*'`: with a wildcard uvicorn trusts the leftmost
  entry, which reintroduces spoofing.
- **Secrets never in the repo.** Only `.example` files are tracked
  (`.gitignore:2-8` ignores `.env*` and un-ignores the three examples);
  `backend/.dockerignore` keeps `.env*` out of the image. Production secrets
  live in Secrets Manager and are injected by App Runner as runtime secrets;
  the instance role gets `secretsmanager:GetSecretValue` on those ARNs only.
  The Atlas user is scoped to `readWrite` on the `hianzy` database. Nothing
  with a `VITE_` or `REACT_APP_` prefix may be secret (it is inlined into the
  public bundle).
- **CSP audit (customHttp.yml:36) against the built site.** Fonts are
  self-hosted (`/fonts/*.woff2`, `/lab/fonts/*.woff2`; `frontend/index.html:24-25`,
  `frontend/lab/index.html:30-43`), so `font-src 'self' data:` holds. The 3D
  scenes (`@react-three/fiber`, `@react-three/drei` `Html` and
  `QuadraticBezierLine` in `frontend/src/components/three/*.js`) are
  procedural: no textures, models, HDRIs, workers or WebAssembly are fetched
  or instantiated (grep of `frontend/src` and `frontend/build/assets`). The
  Lab bundle makes no cross-origin fetches and uses no workers or WebAssembly
  (grep of `frontend/lab/assets`); its inline `<style>` block
  (`frontend/lab/index.html:46-51`) is covered by `style-src 'unsafe-inline'`,
  which GSAP and React need anyway. `theme-boot.js` is external, so
  `script-src 'self'` without `'unsafe-inline'` holds. `connect-src` must
  name the API origin (`api.js`, `auth.js` use `axios`/`fetch`); the sign-in
  redirect to the auth host is a navigation, which CSP does not govern. One
  known, pre-existing gap on every platform: a signed-in user's avatar
  (`Nav.js:188` renders `user.picture` from the provider) is blocked by
  `img-src 'self' data: blob:`; auth is the unresolved P2 item, so the policy
  is kept rather than widened. The nginx template still lists
  `https://images.unsplash.com` in `img-src` (`nginx.conf.template:40`);
  nothing references it and it is correctly absent from `customHttp.yml`.
- **HSTS.** The API sends it in production (`server.py:924-925`, with
  `includeSubDomains`). The static site does not set it in `customHttp.yml`;
  Amplify serves HTTPS only. Adding `Strict-Transport-Security` on the apex
  is an owner decision because `includeSubDomains` there would bind every
  `hianzy.com` subdomain; it is left out until the owner confirms no
  plain-HTTP subdomain exists.
- **Cookies across sites.** `SameSite=None; Secure` is required only while
  the site and the API are on different sites (`*.amplifyapp.com` versus
  `*.awsapprunner.com` / `api.hianzy.com`). `hianzy.com` and `api.hianzy.com`
  are the same site, so `lax` is acceptable after cutover; the auth flow is
  P2 either way.
- **Surface reduction.** `ENVIRONMENT=production` removes `/docs`, `/redoc`,
  `/openapi.json` (`server.py:103-105`); admin routes require a session plus
  `ADMIN_EMAILS`; `X-Frame-Options: DENY` on the API, `SAMEORIGIN` on the
  site; Amplify connects only `main`, with auto-branch creation off; Vercel is
  disconnected at cutover so two platforms do not build the same pushes.

## STOP GATE / Non-goals

This ADR authorises nothing operational. Explicitly out of scope until the
owner accepts it and acts:

- No provisioning of any AWS resource (no VPC, NAT, ECR, App Runner, Amplify,
  IAM, Secrets Manager, budgets).
- No DNS changes and no attachment of `hianzy.com`, `www.hianzy.com` or
  `api.hianzy.com` to anything.
- No production MongoDB data: no Atlas cluster, no seeding, no restore, no
  copy of the local database.
- No credentials, account IDs, ARNs with account numbers, connection strings
  or keys anywhere in the repository, in this document, or in the drafted
  aligned files.
- No code changes in this step — the `client_ip()` change, the snapshot
  guard and the CI image workflow are named follow-ups, not part of this ADR.
- No edits to `amplify.yml`, `customHttp.yml`, `backend/.env.aws.example` or
  `AWS_PREP.md` in this step; their aligned versions are drafted separately
  for review.
- No retirement of `vercel.json` yet; Vercel remains the fallback until
  cutover.

## Owner actions

In order. Names are placeholders to reuse consistently; nothing below has been
done.

Repository prerequisites (before any AWS work):

1. Done in this phase: the frontend lock drift was traced
   (`FRONTEND_FREEZE_AUDIT.md`), the sitemap generator was made deterministic
   so a build cannot dirty the lock, and the lock was regenerated from the
   reviewed tree, so the CI lock step passes again.
2. Done in this phase: the knowledge-article work is committed (`98a7c8b`),
   so `HEAD`'s snapshot matches the seed.
3. Adopt the aligned `amplify.yml`, `customHttp.yml`, `backend/.env.aws.example`
   and `AWS_PREP.md`; update the "56 pages" references in `CLAUDE.md:47` and
   `docs/operations.md:79` to 76.
4. Land the `client_ip()` proxy-trust change with tests (Security notes).
5. Add `.github/workflows/deploy-api.yml`: build `backend/Dockerfile`, push
   to ECR `hianzy-api` as `:<git-sha>` and `:prod` via an OIDC role
   `hianzy-github-deploy`, on push to `main` after `check.yml` is green.

AWS account and network:

6. Use a dedicated account or OU for production; sign in through IAM
   Identity Center with MFA; create budget `hianzy-prod-monthly-budget` with
   an alert at the agreed ceiling; choose one region `<region>` where App
   Runner is available and create the Atlas cluster in the same region.
7. VPC `hianzy-prod-vpc`: two private subnets `hianzy-prod-private-a/b`, one
   public subnet `hianzy-prod-public-a`, NAT Gateway `hianzy-prod-nat` with
   Elastic IP `hianzy-prod-egress`, security group `hianzy-prod-apprunner-sg`
   (all egress, no ingress), App Runner VPC connector
   `hianzy-prod-vpc-connector` on the private subnets.

Database and secrets:

8. Atlas project `hianzy-production`, cluster `hianzy-prod` (M0/Flex for the
   smoke test; a dedicated tier for production — verify current pricing),
   database user `hianzy_api` with `readWrite` on `hianzy` only, network
   access list = the `hianzy-prod-egress` address only, backups enabled.
9. Secrets Manager: `hianzy/prod/MONGO_URL` (the Atlas SRV URI),
   `hianzy/prod/RESEND_API_KEY` (or `hianzy/prod/SMTP_PASS`). Create the
   Resend sender/domain verification for `RESEND_FROM` separately.

API:

10. ECR repository `hianzy-api`; push the first image (`:prod`) from a
    workstation or step 5.
11. IAM: access role `AppRunnerECRAccessRole` (pull from ECR); instance role
    `hianzy-apprunner-instance-role` with `secretsmanager:GetSecretValue` on
    the two secrets.
12. App Runner service `hianzy-api-prod`: source ECR `hianzy-api:prod` with
    automatic deployments, port 8000, 1 vCPU / 2 GB, auto scaling
    configuration `hianzy-api-prod-scaling` (min 1, max 1, concurrency 100),
    outgoing traffic via `hianzy-prod-vpc-connector`, health check HTTP
    `/api/health` (10 s / 5 s / unhealthy 5 / healthy 1), environment per
    `backend/.env.aws.example` with `MONGO_URL` and `RESEND_API_KEY` as
    runtime secrets, `CORS_ORIGINS` including the Amplify default origin for
    now. Verify `https://<service>.<region>.awsapprunner.com/api/health` → 200
    and that the log shows the seed and both workers started.
13. Attach custom domain `api.hianzy.com` to `hianzy-api-prod` and add the
    validation and target records it provides (API-only DNS). Set
    `PUBLIC_API_URL=https://api.hianzy.com`.

Site:

14. Amplify app `hianzy-website` connected to the GitHub repo, branch `main`
    only, monorepo root `frontend`, auto-branch creation off. Environment
    variables: `AMPLIFY_MONOREPO_APP_ROOT=frontend`,
    `REACT_APP_BACKEND_URL=https://api.hianzy.com`, optionally
    `SITE_URL=https://hianzy.com`; nothing else, in particular no
    `LOCAL_API_URL`.
15. Rewrites and redirects: delete any pre-populated rule; add exactly
    `/<*>` → `/index.html`, type `404-200`.
16. Build. Read the log: `metadata: generated 76 public HTML pages` present;
    no `using the checked-in public content snapshot`; no `API unreachable`.
17. Headers gate: download the Console's canonical `customHttp.yml`, diff the
    nesting against the committed file; request `/` and one
    `/assets/<hash>.js` on the Amplify URL and confirm the CSP,
    `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
    `Permissions-Policy` and `Cache-Control` values are present.
18. Routing gate (view source, not DevTools): `/work` shows
    `Work | Proof, With Context | hiAnzy`; `/network/strategy`, one
    `/insights/<slug>` from `build/route-metadata.json`, `/lab/`,
    `/sitemap.xml` (XML, not HTML), and an unknown path (not-found page);
    then `python scripts/check_raw_metadata.py --base https://<amplify-url>`.
19. Smoke test on the Amplify URL: contact form (a record appears via
    `manage.py enquiries --status new` and a notification arrives), subscribe
    → confirmation link on `api.hianzy.com` works, `/lab/` interactive, no
    CSP violations in the console other than the documented `auth/me` 401.

Cutover:

20. Attach `hianzy.com` and `www.hianzy.com` to `hianzy-website` and add the
    records Amplify provides; remove the Amplify default origin from
    `CORS_ORIGINS`; disconnect the Vercel project so it stops building `main`;
    retire `vercel.json` in a follow-up commit.
21. Post-launch: uptime check on `https://api.hianzy.com/api/health`;
    CloudWatch alarm on App Runner 5xx and unhealthy-instance events; log
    retention set; Atlas backup and restore rehearsed into a staging database
    (`docs/operations.md`, "Database backup and restore"); secret rotation
    dates recorded; revisit max instances and the shared rate-limit store only
    when traffic warrants.

## Related

- [`ADR-001-experience-lab-separation.md`](ADR-001-experience-lab-separation.md)
  — the Lab boundary every option preserves.
- [`../AWS_PREP.md`](../AWS_PREP.md) — preparation notes B1–B15 (repo root,
  not `docs/`); to be aligned to this ADR.
- [`../amplify.yml`](../amplify.yml) — Amplify build spec (monorepo
  `appRoot: frontend`).
- [`../customHttp.yml`](../customHttp.yml) — Amplify response headers and
  CSP.
- [`../backend/.env.aws.example`](../backend/.env.aws.example) — App Runner
  environment template.
- [`../LAUNCH_STATE.md`](../LAUNCH_STATE.md) — Phase B summary and the
  FINAL INDEPENDENT AUDIT (B-1/B-2, H-1–H-3, M-1–M-3).
- [`operations.md`](operations.md) — enquiry, newsletter and backup
  procedures the API tier must keep working.
