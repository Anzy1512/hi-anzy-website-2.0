# LAUNCH STATE

## CURRENT BRANCH
`launch/step-1`, cut from `origin/perf/launch-loading-pass-1`. `main` is untouched.

## CURRENT COMMIT
`defd3da` — "fix(search): allow retry after a failed command-index load"

## REPOSITORY DECISION (resolved)
`hi-anzy-website-2.0` is authoritative. A prior `hi-anzy-platform` checkout was
treated only as a source of verified components/fixes, never merged wholesale.
See PORTING RESULTS below for what was actually brought in and why.

## ARCHITECTURE
- Frontend: Vite 7 + React 18, vitest, eslint 9. `build` → `build/`. `prebuild`
  = check:opacity + check:seo + sitemap. `postbuild` = `prerender-metadata.cjs`
  (generates 56 static HTML pages, one per real route, with real meta tags —
  this is the site's SEO/crawlability mechanism, not client-side-only SPA).
  Extra CI gate: `test:build` (6 sitemap-generation tests).
- Backend: FastAPI, `APIRouter(prefix="/api")`, Motor/Mongo, module-level
  `AsyncIOMotorClient` (correct for serverless warm-container reuse — no
  change needed for Vercel). `backend/manage.py` is a local operations CLI
  (enquiry review, notification retry); `backend/operations.py` implements
  lease-based durable delivery with exponential backoff, up to 5 attempts.
- CI: `.github/workflows/check.yml` — pytest + Mongo 7 service, then frontend
  lint/test/test:build/build. Real and already passing.
- Local dev/serving: Docker + nginx, two origins (web :8080, api :8010).

## VERCEL STATE
No `vercel.json` existed in this repo before this session. Added on this
branch (not yet committed — see COMMITS). Uses the standard documented
`@vercel/python` (ASGI, detects the module-level `app = FastAPI(...)`) +
`@vercel/static-build` monorepo pattern — not invented syntax.

**Not deployed and not fully verified.** `vercel build` requires linking to a
real Vercel project (`vercel pull`), which needs the owner's account —
correctly out of scope for me to do. Verified instead: JSON is syntactically
valid, and every path the config references (`backend/server.py`,
`backend/requirements.txt`, `frontend/package.json`) exists.

**REACT_APP_BACKEND_URL decision**: leave it unset in the Vercel build.
`frontend/src/lib/api.js` already does
`(import.meta.env.REACT_APP_BACKEND_URL || "")` → `/api` when unset, so this
makes the frontend same-origin with zero frontend code changes. Local Docker
dev is unaffected — it keeps setting it explicitly, since nginx there is a
genuinely separate origin (`:8080` web / `:8010` api) by design.

## DEPLOYMENT BLOCKERS
- `vercel.json` needs a real deploy to confirm the Python ASGI build and the
  clean-URL/prerendered-HTML routing actually resolve as configured. This is
  the single largest remaining unknown for today's launch.
- Vercel project/env vars have not been created (owner action, see below).

## P0 BUGS
None found by execution.

## P1 BUGS
**Fixed this session** (commit `defd3da`): CommandPalette could not retry a
failed command-index load. `close()` now also resets `indexFailed`.

## P2 BUGS
Anonymous visitors 401 on `/api/auth/me` on every load (auth wiring points at
a third-party scaffold host). Product decision, not a launch blocker.

## PORTING RESULTS (this session)

### LAB FEATURES FOUND
| Feature | Source | Current status (pre-session) | Port required? | Dependencies | Risk | Action |
|---|---|---|---|---|---|---|
| Experience Lab static build (71 files: modes, brand assets, self-hosted fonts) | `hi-anzy-platform` commit `dba09cf` | Missing entirely from `hi-anzy-website-2.0` | Yes | Dockerfile COPY step, two nginx `location` blocks | Low — self-contained static artifact, does not touch `frontend/src` | **PORTED** (`6f68021`) |

### LAB FEATURES PORTED
- The Lab directory itself (`frontend/lab/`, 71 files) — copied verbatim, it's
  a build output, not source to diff.
- `frontend/Dockerfile` — one `COPY lab/ ...` line added after the commercial
  build stage.
- `frontend/nginx.conf.template` — two new `location ^~ /lab/...` blocks
  (assets: immutable cache; app: SPA fallback to `/lab/index.html`), placed
  before the SPA catch-all so they can't be shadowed by it. `^~` specifically
  because 2.0 added a generic extension-match `location` block since the Lab
  was last integrated, which would otherwise win for the Lab's own hashed
  `.js`/`.css` and cache them for an hour instead of forever.

### LAB FEATURES ALREADY PRESENT
None — the Lab was fully absent before this session.

### LAB FEATURES DEFERRED
None identified. No new Lab redesign work was started, per instruction.

### OLD FIXES REUSED
| Fix | Classification | Reasoning |
|---|---|---|
| WorkPreview forced-reflow (scroll-driven `getBoundingClientRect`/`scrollWidth` moved out of the hot path into a cached `measure()`) | PORT | Diffed first: file was byte-identical between platform-pre-fix and 2.0-current, so this is an isolated bug fix on unchanged code, not an overwrite of newer work. Commit `cf0e236`. |
| Hero SystemCore backdrop (CSS-only glow behind the transparent canvas) | PORT | Same reasoning; `.hero-core-backdrop` added to App.css as one new rule, nothing existing edited. Commit `cf0e236`. |
| `isDarkUnderNav` throttle (rAF-coalesced call was still ~60/s during scroll; now capped to ~8/s) | ADAPT | The exact affected code block was byte-identical between repos, so the throttle itself ported cleanly. Commit `687908c`. |

### OLD FIXES REJECTED
| Fix (platform repo) | Reason rejected |
|---|---|
| Nav breakpoint dead-zone fix (1360/1320/1400 disagreement, unified at 1400) | The bug doesn't exist in 2.0. It was self-introduced in the platform repo by a "Join the Network" nav CTA feature that 2.0 never received — 2.0 has one consistent `1180px` breakpoint with nothing to conflict. Nothing to port. |
| "Join the Network" nav CTA itself | A design/feature addition, not a fix. Out of scope for launch hardening (GLOBAL LOCK: no design changes). Available on request, not silently added. |
| Two-plate halftone background redesign | Visual design change, not a fix. Out of scope, same reasoning. |

### CONFLICTS RESOLVED
None — every ported/adapted item touched code that was either identical
between the two repos pre-fix, or (for the throttle) an isolated block that
matched byte-for-byte. No case arose where an older platform fix conflicted
with newer 2.0 work.

### NEW FIX (not from platform, 2.0's own code)
CommandPalette retry defect (P1, above). Confirmed missing by inspection,
fixed directly on 2.0.

## CONTENT REGRESSION STATUS
Checked directly against 2.0's own `backend/seed_data.py` and live API (Docker
containers, this session): 5 case studies, 35 network resources, 10 insights,
8 portfolio groups, `ECOSYSTEM_ITEMS` derived (35 items across 6 categories:
built_here 3, built_together 2, collaborator 7, creator 10, partner 10,
venue 3). All routes in `App.js` for Work/Work-detail/Built-Here/
Built-Together/Network/Network-detail/ecosystem categories present and
correctly wired. **No regression found — nothing to restore.**

## ENV VARIABLES DISCOVERED
Full sweep of `backend/server.py` + `backend/manage.py` + frontend
`import.meta.env`/`process.env` usage. No values recorded here.

**Frontend (build-time, Vite):**
| Var | Required? | Notes |
|---|---|---|
| `REACT_APP_BACKEND_URL` | No — leave unset on Vercel | See VERCEL STATE above. Docker dev still sets it. |
| `VITE_AUTH_LOGIN_URL` | Depends on auth product decision | Used by `lib/auth.js`; the P2 bug's auth host. |

**Backend (runtime):**
| Var | Required? | Notes |
|---|---|---|
| `MONGO_URL` | **Yes, hard failure if unset** | `required_setting()` raises at import time. |
| `DB_NAME` | **Yes, hard failure if unset** | Same. |
| `ENVIRONMENT` | No (defaults `production`) | Anything but `development`/`dev`/`local` disables `/docs`, `/redoc`, `/openapi.json`, enables HSTS. |
| `CORS_ORIGINS` | Yes for any cross-origin frontend | Comma-separated, wildcard explicitly refused (logged + stripped). Empty in production → CORS effectively denies all cross-origin (logged as an error). **Same-origin Vercel traffic doesn't need this for the frontend↔API calls at all** — only needed if something calls the API from a different origin. |
| `COOKIE_SECURE` | No (defaults to `IS_PRODUCTION`) | Must be exactly `true`/`false` if set — anything else raises at import. |
| `COOKIE_SAMESITE` | No (defaults `none` if secure, else `lax`) | Must be `none`/`lax`/`strict`; `none` requires `COOKIE_SECURE=true` or raises. |
| `RESEND_API_KEY` | No | Preferred email path if set. |
| `RESEND_FROM` | No | Needed alongside `RESEND_API_KEY` for `mail_configured()` to be true. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | No | Fallback email path if Resend isn't configured. |
| `CONTACT_NOTIFY_EMAIL` | No | Default notification recipient; email silently no-ops without it (`send_email` returns `False`, logs, never throws). |
| `ADMIN_EMAILS` | No | Comma-separated, gates contact-submission read access. |
| `SITE_URL` | No (defaults `https://hianzy.com`) | Confirms intended production domain — **owner should verify this is correct.** |
| `PUBLIC_API_URL` | No (defaults to `SITE_URL`) | |
| `AUTH_SESSION_DATA_URL` | Depends on auth product decision | |

## DATABASE
MongoDB via Motor, module-level client (Vercel-serverless-safe as-is — no
code change needed). Local: docker-compose `hianzy-mongo`, verified healthy
this session with real seeded content. **Production Mongo URI is an owner
action** — not fabricated, not guessed.

## EMAIL
Resend preferred, SMTP fallback, no-op (not a crash) if neither configured —
already exactly matches "operational or its exact external credential
blocker is known." The blocker, precisely: `RESEND_API_KEY`+`RESEND_FROM`, or
`SMTP_HOST`+`SMTP_USER`+`SMTP_PASS`, whichever the owner prefers.

## SECURITY
Reviewed `backend/server.py`'s security middleware directly (not just
grepped): `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Resource-Policy`,
conditional HSTS — all already present and correct. CORS wildcard is actively
refused with a log line, not just "not configured to allow it." Cookie
security settings validate themselves at import time (invalid combinations
raise rather than silently deploying insecurely). **No secrets in this file
or committed anywhere in this session's work** — verified `git status`
before every commit.

## PERFORMANCE BASELINE
Not re-measured against 2.0 specifically this session (the platform-repo
trace that found the `isDarkUnderNav` cost predates this repo's involvement).
The fix itself is adapted and present; a fresh trace against 2.0 is a
reasonable post-launch follow-up, not a blocker (same code, same fix).

## SEO STATUS
`prerender-metadata.cjs` generates 56 real static HTML pages at build time —
already a working prerender mechanism, confirmed by running the actual build
this session. Per-route metadata content not manually audited page-by-page
this session (Step 4's job).

## TEST BASELINE (all executed this session, this repo)
| Check | Result |
|---|---|
| `npm run build` | PASS |
| `npm test` (vitest) | PASS — 8/8, 3 files |
| `npm run lint` | PASS — clean |
| `npm run test:build` | PASS — 6/6 |
| `pytest tests/test_api.py` (real Mongo 7 container, port 27117, matching CI exactly) | 58/59 PASS. The 1 error is `PermissionError` on a Windows-only pytest temp directory — not a code defect, doesn't reproduce on CI (Ubuntu). |
| Docker `web`+`api`+`mongo` build & health | PASS — all three healthy |
| `/`, `/lab/`, `/api/health`, `/api/insights` over the built containers | PASS — all 200 |
| `vercel build` | **NOT RUN** — needs the owner's Vercel account (`vercel pull`) |

## FILES CURRENTLY MODIFIED
None uncommitted except `LAUNCH_STATE.md`/`LAUNCH_TESTS.md`/`vercel.json`
themselves (about to be committed).

## COMMITS MADE
- `6f68021` fix(lab): restore approved Experience Lab, mounted at /lab/
- `cf0e236` fix(perf): port verified forced-reflow fixes for WorkPreview and Hero
- `687908c` fix(perf): throttle isDarkUnderNav, adapted from platform fix
- `defd3da` fix(search): allow retry after a failed command-index load
- (pending) docs + vercel.json

## OWNER ACTIONS
1. **Link the real Vercel project** (`vercel link`) and run `vercel build` /
   a preview deploy to confirm `vercel.json` actually resolves — I cannot do
   this without your account.
2. **Set the backend env vars** listed above in the Vercel dashboard. At
   minimum for the app to boot at all: `MONGO_URL`, `DB_NAME`. For
   production posture: `ENVIRONMENT=production`, `COOKIE_SECURE=true`,
   `CORS_ORIGINS` (only needed if anything calls the API cross-origin).
3. **Provide a production Mongo URI** (Atlas or equivalent) — not fabricated.
4. **Choose an email path** and provide those credentials (Resend recommended:
   `RESEND_API_KEY` + `RESEND_FROM`), or explicitly confirm contact-form email
   stays off for launch.
5. **Confirm `SITE_URL`** — code defaults to `https://hianzy.com`; confirm
   this is correct or override it.
6. Decide the auth product question (P2) — keep, fix, or remove sign-in —
   at your convenience, not a launch blocker.

## DO NOT TOUCH
- 3D visual output — untouched this session (verified: no diff in
  `components/three/`, `SystemCore.js`, or GSAP/ScrollTrigger/Lenis config).
- Animation choreography, GSAP timings, Lenis feel — untouched.
- Approved layout/brand — untouched. The only visual-adjacent change is the
  Hero backdrop, which is additive CSS behind an already-transparent canvas,
  not a change to the canvas, scene, or motion itself.
