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

## VERCEL STATE — RE-AUDITED, ARCHITECTURE CORRECTED

The first `vercel.json` (committed `545a134`) used the legacy `builds`/`routes`
config (`@vercel/python` + `@vercel/static-build`). On re-audit against
current official Vercel documentation (fetched live, dated 2026-08-10 for the
primary page), that config is **REPLACED**, not kept:

- **Vercel Services** (`services` key) is a real, current, documented
  architecture — confirmed via `vercel.com/docs/services`,
  `/docs/services/routing`, `/docs/services/config-reference` — specifically
  intended for "a polyglot monorepo: a JavaScript frontend and a Python
  backend in the same repository," which is exactly this repo's shape. It
  supersedes the legacy `builds`/`routes` model for this use case.
- It is marked **Beta** and requires the account permission "Services
  (Beta)," plus the project's dashboard Framework Preset set to **Services**.
  Both are owner actions — see OWNER ACTIONS.
- The owner independently reported their real Vercel project UI identifying
  this repo as multi-service and requesting a root-level `vercel.json`,
  which corroborates that this account/project already has Services access.

**Current `vercel.json`** (services model):
```json
{
  "services": {
    "frontend": { "root": "frontend/", "framework": "vite",
                  "outputDirectory": "build",
                  "buildCommand": "npm run build && node -e \"require('fs').cpSync('lab','build/lab',{recursive:true})\"",
                  "cleanUrls": true },
    "backend":  { "root": "backend/", "framework": "fastapi", "entrypoint": "server:app" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)",     "destination": { "service": "frontend" } }
  ]
}
```

**Verified this session (real, not assumed):**
- `vercel dev -L` (local mode, no account link, per Vercel's own docs) ran
  against this exact file and printed `Detected services: frontend [Vite],
  backend [FastAPI]` — the CLI parsed the config and correctly identified
  both framework slugs (`vite`, `fastapi`) as valid.
- Full local boot then failed on `[DEV_SERVICE_START_FAILED]`: the CLI's own
  `vercel-runtime==0.23.0` package requires Python≥3.12, and this machine's
  local Python (3.11.16) was what the CLI's venv-creation step picked up.
  **This is a local-machine tooling limitation, not a config defect** — it
  failed while trying to build a local dev venv, after already successfully
  detecting and validating both services from the config. Vercel's actual
  cloud build environment specifies its own Python version independently of
  this machine's. Flagged for the owner to confirm on their real deploy, not
  treated as a blocker here.
- JSON syntax valid; every referenced path (`frontend/`, `backend/`,
  `backend/server.py`, `backend/requirements.txt`) exists.

**API routing traced, not assumed**: per `/docs/services/routing`'s own
documented example table, "the service receives the original request path —
`GET /api/users` reaches the backend as `/api/users`, not `/users`." So
`GET /api/insights` reaches the backend service as `/api/insights`, which is
exactly what `APIRouter(prefix="/api")` already expects. **Zero backend code
changes needed; no `/api/api` duplication risk.**

**SPA/prerendered routing**: deliberately did *not* use the generic
"Vite-on-Vercel SPA" advice (a catch-all rewrite to `/index.html`) — that
would have overridden this project's 56 real prerendered per-route HTML
pages with the generic shell on every direct load, silently regressing the
site's actual SEO mechanism. `cleanUrls: true` on the frontend service is
the documented equivalent of nginx's existing `try_files $uri $uri.html
$uri/ =404;`: a request for `/insights/foo` resolves to the real prerendered
`build/insights/foo.html` if present, and a genuinely unmatched path falls
through to `build/404.html` (already generated by the postbuild script) —
matching current behavior exactly, not a redesign.

**Experience Lab on Vercel — traced, not assumed**: on Vercel, only a
service's own `outputDirectory` is served; nothing else copies files in
after the framework build the way Docker's separate `COPY lab/ ...` layer
does. `frontend/lab/` sits outside Vite's `public/` convention (which *is*
copied automatically), so **without a build step, the Lab would be present
in the repo but absent from what Vercel actually serves** — currently
reachable only because nginx mounts it as a separate filesystem layer.
Fixed with the smallest safe mechanism: the frontend service's
`buildCommand` runs the existing `npm run build` unchanged, then copies
`lab/` → `build/lab/` verbatim (`fs.cpSync`, recursive, no file rewritten).
Scoped only to this Vercel `buildCommand` override — `package.json`'s own
`build` script, local dev, and Docker are all untouched. The Lab's own pages
already reference `/lab/...` absolute paths (built with `LAB_BASE=/lab/`
originally, confirmed in the platform-repo commit that first added it), and
copying the directory to `build/lab/` (the frontend service's own root once
served) preserves that path exactly — no path rewriting needed or done.

**REACT_APP_BACKEND_URL decision (unchanged from first audit, re-confirmed
under Services)**: leave it unset in the Vercel build.
`frontend/src/lib/api.js` already does
`(import.meta.env.REACT_APP_BACKEND_URL || "")` → `/api` when unset, so the
frontend is same-origin with zero frontend code changes. No separate
backend public hostname is introduced — Services' own same-project routing
makes that unnecessary. Local Docker dev is unaffected.

## DEPLOYMENT BLOCKERS
- Owner must have "Services (Beta)" enabled on the Vercel account and set
  the project's Framework Preset to **Services** in the dashboard — without
  either, this config will not build as configured.
- A real deploy is still needed to confirm the Python ASGI build and the
  clean-URL/prerendered-HTML routing resolve exactly as configured. This is
  the single largest remaining unknown for today's launch.
- Vercel project/env vars have not been created (owner action, see below).

## P0 BUGS
None found by execution.

## P1 BUGS
**Fixed, Step 1** (`defd3da`): CommandPalette's `close()` reset `indexFailed`
so the load effect's guard would clear on next open.

**Found AND fixed, Step 2** (`fe783da`): the Step 1 fix was necessary but not
sufficient. Verified live with a real forced failure (renamed the served
chunk on disk to get a genuine 404, confirmed the error UI, restored the
file): reopening still showed the same failure. Root cause, confirmed with
an isolated test outside React: a browser's ES module registry caches a
*rejected* dynamic import against its exact URL for the life of the page —
a second `import()` for that same URL rejects immediately from the cache,
with zero network request, even once the file is genuinely available again.
No React-state reset can undo that. Fixed by having `close()` do a real
`window.location.reload()` specifically when closing a failed state (the
industry-standard recovery for a failed chunk load, and also what actually
fixes the more common real-world trigger this stands in for — a new deploy
shipping mid-session, where no in-page retry can produce a chunk hash the
loaded bundle doesn't know about). Re-verified end to end with the same
forced-404 technique: after the reload, reopening returns real, correctly
filtered search results.

## P2 BUGS
Anonymous visitors 401 on `/api/auth/me` on every load (auth wiring points at
a third-party scaffold host). Product decision, not a launch blocker.

## P3 (polish, not fixed — logged only, per scope)
- `GET /favicon.ico` → 404 on every page load.
- Nav sits perfectly flush (0px gap) against the logo and the action cluster
  at exactly its 1180px breakpoint — no overlap, no dead zone, resolves to a
  comfortable 116px by 1440px. Pre-existing, untouched by any Step 1/2
  change (Step 1 correctly classified the platform repo's breakpoint fix as
  not applicable to this repo — see PORTING RESULTS). Not fixed: cosmetic
  only, and GLOBAL LOCK excludes redesign of untouched, working behavior.

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

**Re-verified in a live browser, Step 2** (real slugs pulled from the running
API, not guessed): `/work/the-storefront-was-never-the-problem` — full case
study, 19 detail sections, real content. `/work/built-here` — 3 cards.
`/work/built-together` — 2 cards. `/network/strategy` — real discipline page.
`/insights/why-we-package-services` — full article, correct title. All real,
rendered content — no placeholders, no empty states, nothing invented.

## STEP 2 — PRODUCTION BUG SWEEP + REGRESSION QA (this session)

Full route matrix, client-side + hard-refresh navigation, mobile sweep,
Command Palette (including a real forced failure), `isDarkUnderNav`,
WorkPreview, and Contact/API all exercised live against the Docker stack.
Full results in `LAUNCH_TESTS.md`. Headline findings:

- **CommandPalette retry — found genuinely broken, then fixed for real.**
  See P1 above. The Step 1 fix was code-correct but incomplete; Step 2's
  live re-verification (a real forced 404, not a design review) is what
  caught it.
- **`isDarkUnderNav` throttle** — verified against ground truth, not just
  "still runs": ran the exact untouched detection logic directly (bypassing
  the throttle entirely) at 12 points across the homepage's full 13,702px
  height, and it returned `dark:true` at every single one. The throttled,
  live version matched exactly. The homepage's nav literally never left the
  dark state across its whole length — that's the page's actual design
  (dark base ground, light content sits in inset panels), not a detection
  failure. Confirmed the throttle changes call *frequency* only, never the
  result.
- **WorkPreview** — scroll-linked row: correct card order, `scrollLeft`
  advances monotonically with scroll fraction (0→0→5→9 of a 15px max),
  matching the pre-fix behavior's contract exactly.
- **Contact/API** — valid (200), invalid email (422), missing field (422),
  too-short message (422), honeypot (200 fake-success, no record created),
  rate limit (5 hits/10min, then real 429) — all correct, all intentional.
  No production email sent, no production data touched (local Docker Mongo
  only).
- **Mobile/breakpoint sweep** — no horizontal overflow at 320/375/390/430.
  1391/1400 (the values named in the Step 2 brief) show no dead zone in
  2.0 — expected, since 2.0's nav breakpoint is 1180, untouched by any
  session change (see PORTING RESULTS: the platform repo's 1400 fix was
  correctly classified SKIP here). The *actual* relevant boundary, 1180,
  also has no dead zone, though it is flush (0px gap) exactly at the
  threshold — logged as P3, not fixed (pre-existing, cosmetic, no redesign).
- Full client-side navigation chain (5 routes, no reload) — no console
  errors, no stale state, homepage remounts correctly on return. One benign
  `console.log` (not error/warn) from Three.js's own "Context Lost" WebGL
  lifecycle logging on canvas unmount — normal, not a defect.

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
- `545a134` feat(deploy): add Vercel config (legacy builds/routes — since replaced)
- `ba34322` fix(deploy): replace legacy Vercel builds/routes with Services architecture
- `fe783da` fix(search): retry a failed command-index load with a real reload (Step 2 — the Step 1 retry fix was incomplete; see P1 above)

## OWNER ACTIONS
1. **Confirm "Services (Beta)" is enabled** on the Vercel account, and set
   the project's Framework Preset to **Services** in the dashboard. Your own
   dashboard already suggested this, which is a good sign it's available —
   but I can't confirm the toggle is actually set without your account.
2. **Link the real Vercel project** (`vercel link`, no `-L`) and run a real
   build/preview deploy to confirm the config resolves end-to-end — local
   `vercel dev -L` validated both services are detected correctly from the
   config, but a full local boot hit a local Python version issue unrelated
   to the config (see VERCEL STATE).
3. **Set the backend env vars** listed above in the Vercel dashboard. At
   minimum for the app to boot at all: `MONGO_URL`, `DB_NAME`. For
   production posture: `ENVIRONMENT=production`, `COOKIE_SECURE=true`,
   `CORS_ORIGINS` (only needed if anything calls the API cross-origin —
   same-origin Services traffic doesn't need it).
4. **Provide a production Mongo URI** (Atlas or equivalent) — not fabricated.
5. **Choose an email path** and provide those credentials (Resend recommended:
   `RESEND_API_KEY` + `RESEND_FROM`), or explicitly confirm contact-form email
   stays off for launch.
6. **Confirm `SITE_URL`** — code defaults to `https://hianzy.com`; confirm
   this is correct or override it.
7. Decide the auth product question (P2) — keep, fix, or remove sign-in —
   at your convenience, not a launch blocker.

## DO NOT TOUCH
- 3D visual output — untouched this session (verified: no diff in
  `components/three/`, `SystemCore.js`, or GSAP/ScrollTrigger/Lenis config).
- Animation choreography, GSAP timings, Lenis feel — untouched.
- Approved layout/brand — untouched. The only visual-adjacent change is the
  Hero backdrop, which is additive CSS behind an already-transparent canvas,
  not a change to the canvas, scene, or motion itself.
