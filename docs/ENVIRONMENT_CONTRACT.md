# Environment contract (hiAnzy Agency Website)

One table per tier, read from the code that consumes each variable (not from
older documents). Values are never recorded here; only names, consumers and
where each value comes from in each environment. `docs/ADR-002-aws-production-architecture.md`
("Runtime environment contract") is the decision record this table serves.

The variable the code reads for the database is `MONGO_URL` (not `MONGO_URI`).

## Backend (`backend/server.py`)

| Variable | Required | Consumer | Local (Docker compose / `backend/.env`) | Staging (App Runner `hianzy-api-staging`) | Production (App Runner `hianzy-api-prod`) |
|---|---|---|---|---|---|
| `MONGO_URL` | yes, import-time error if empty | `server.py` `required_setting` | compose Mongo / local Mongo (`backend/.env.example`) | **runtime secret** ← Secrets Manager `hianzy/staging/MONGO_URL` | **runtime secret** ← Secrets Manager `hianzy/prod/MONGO_URL` |
| `DB_NAME` | yes | `server.py` | `hianzy` | `hianzy_staging` | `hianzy` |
| `ENVIRONMENT` | no (default `production`) | `IS_PRODUCTION = value not in {development, dev, local}` → hides `/docs`, sends HSTS, defaults cookies to secure | `development` for local HTTP | `production` (staging is production-like: docs closed, HSTS on; the environment is distinguished by `DB_NAME`, `CORS_ORIGINS` and the URLs) | `production` |
| `CORS_ORIGINS` | yes for a cross-origin site; empty denies every cross-origin request; `*` refused | CORS middleware | `http://localhost:8080` (compose default) | the Amplify staging origin (`https://<branch>.<app-id>.amplifyapp.com`) | `https://hianzy.com,https://www.hianzy.com` (plus the Amplify default origin only during the pre-cutover smoke test) |
| `SITE_URL` | no (default `https://hianzy.com`) | links back to the site in mail | `http://localhost:8080` | the Amplify staging origin | `https://hianzy.com` |
| `PUBLIC_API_URL` | no (default `SITE_URL`); on AWS it must be the API origin because confirm/unsubscribe links are `/api/newsletter/...` on the API | newsletter links | unset | the App Runner staging origin (`https://<service-id>.<region>.awsapprunner.com`) | `https://api.hianzy.com` |
| `TRUSTED_PROXY` | yes on App Runner; refused unless unset, `vercel` or `apprunner` | `client_ip()` (rate limiting) | unset | `apprunner` | `apprunner` |
| `COOKIE_SECURE` | no (default = `IS_PRODUCTION`); must be `true`/`false` | session cookie | `false` for local HTTP | `true` | `true` |
| `COOKIE_SAMESITE` | no (default `none` when secure) | session cookie; `none` requires `COOKIE_SECURE=true` at import | `lax` | `none` (site and API on different default domains) | `none` until the sign-in decision; `lax` is valid once both hosts sit under `hianzy.com` |
| `RESEND_API_KEY` | no; preferred mail path | mail delivery | optional | **runtime secret** ← `hianzy/staging/RESEND_API_KEY` (or unset: mail no-ops) | **runtime secret** ← `hianzy/prod/RESEND_API_KEY` |
| `RESEND_FROM` | with the key | `mail_configured()` | optional | sender address | sender address |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | no; fallback mail path | mail delivery | optional | only if SMTP is chosen (`SMTP_PASS` as a secret) | same |
| `CONTACT_NOTIFY_EMAIL` | no; notifications no-op without it | enquiry notification | optional | a staging inbox | the real inbox |
| `ADMIN_EMAILS` | no; empty denies the admin routes | admin routes | optional | owner address(es) | owner address(es) |
| `AUTH_SESSION_DATA_URL` | no (default: third-party scaffold host) | sign-in (open decision P2-1) | unset | unset | unset until the sign-in decision |
| `VERCEL` | must be **unset** off Vercel | `IS_SERVERLESS` gate | unset | unset | unset |
| `TEST_MONGO_URL` | tests only | `tests/test_api.py` | `mongodb://127.0.0.1:27117` | CI only | CI only |

Secrets are never committed. Only `backend/.env.example`, `backend/.env.aws.example`,
`.env.example`, `.env.docker.example` and `frontend/.env.example` are tracked.

## Frontend build (Vite; read at build time only, inlined into the bundle)

| Variable | Required | Consumer | Local | Staging (Amplify branch `deploy/aws-staging`) | Production (Amplify branch `main`) |
|---|---|---|---|---|---|
| `REACT_APP_BACKEND_URL` | yes on AWS (unset only for same-origin hosting) | `src/lib/api.js`, `scripts/prerender-metadata.cjs`, `scripts/generate-sitemap.js`, `scripts/link-graph.cjs`, `frontend/Dockerfile` | `http://localhost:8010` (Docker build arg) | the App Runner staging origin | `https://api.hianzy.com` |
| `SITE_URL` | no (default `https://hianzy.com`) | canonical / `og:url` origin and sitemap host | `http://localhost:8080` (Docker) | leave at the default: staging is access-controlled and its canonical tags point at the production host on purpose | default |
| `AMPLIFY_MONOREPO_APP_ROOT` | yes on Amplify; must equal `appRoot: frontend` | Amplify | n/a | `frontend` | `frontend` |
| `LOCAL_API_URL` | dev only; **must be unset** on Amplify (prerender prefers it over `REACT_APP_BACKEND_URL`) | prerender, sitemap, dev proxy | `http://127.0.0.1:8010` when building against the Docker API | unset | unset |
| `VITE_AUTH_LOGIN_URL` | no | `src/lib/auth.js` | unset | unset | unset until the sign-in decision |
| `CSP_CONNECT_SRC` | Docker only (nginx `envsubst`) | `nginx.conf.template` | `REACT_APP_BACKEND_URL` | n/a (`customHttp.yml` carries the CSP on Amplify) | n/a |

`customHttp.yml` is static per branch: its `connect-src` must name the API
origin the bundle calls. On the staging branch that is the App Runner staging
origin (set in one commit on `deploy/aws-staging` once the service exists,
reverted before the branch merges); on `main` it is `https://api.hianzy.com`.

## GitHub Actions (`.github/workflows/deploy-api.yml`)

| Variable | Level | Purpose |
|---|---|---|
| `AWS_DEPLOY_ROLE_ARN` | repository variable | the OIDC role the workflow assumes; while empty the build and deploy jobs skip themselves |
| `AWS_REGION` | repository variable | the region of ECR and App Runner |
| `ECR_REPOSITORY` | repository variable (default `hianzy-api`) | image repository name |
| `APP_RUNNER_SERVICE_ARN` | environment variable, one per GitHub environment (`staging`, `production`) | the service the deploy job updates; while empty the image is pushed and no service is touched |

No GitHub secret holds an AWS credential. The `production` GitHub environment
carries required reviewers, so a push to `main` builds the image but waits for
a person before the service is updated.
