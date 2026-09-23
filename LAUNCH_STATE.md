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

---

# STEP 3 — PERFORMANCE PASS (this session, continued)

Priority order followed exactly as specified (unnecessary initial JS → data →
duplicate requests → React rerenders → route modules → search index →
non-critical global code → caching → CSS → images → fonts → deps → dead code
→ duplicated init bugs). Zero changes to Three.js/3D/GSAP/ScrollTrigger/Lenis/
Framer/visual identity/layout — every fix below is deployment/build/code-
organization/CSS/font/image/dependency/caching, per the GLOBAL LOCK.

## FIXES LANDED (measured, verified live, each its own commit)

1. **`a3e4692`** — extracted `CASE_VISUALS`/`CaseGraphic` out of
   `ConnectedStory.js` into a new `pages/home/caseVisuals.js`. Vite's own build
   warning showed `ConnectedStory.js` was both `lazy()`-imported (Home.js) and
   statically imported (`Work.js`, `WorkPreview.js`) — Vite can't split a
   file that's both, so the whole lazy chunk was shipping in the main bundle
   regardless. Splitting the shared piece out let the lazy import actually
   take effect. **Main bundle: 723.78kB → 706.71kB raw (243.31kB → 238.12kB
   gzip).** Verified live: network log shows `ConnectedStory`/
   `BusinessFlowScene` chunks only load when the homepage's model explorer
   opens, not on initial page load.
2. **`b656dc6`** — moved `story.css`'s import from the global `App.js` into
   `ConnectedStory.js` itself, so its CSS now ships in the same lazy chunk as
   its JS. `WhatWeDoGrid.js` (always rendered) needs 9 small
   `.story-mini-object` rules from the same file; rather than risk splitting a
   shared, minified, media-query-fused declaration (explicitly flagged as
   risky — "do not blindly move story.css"), those 9 rules were duplicated
   into the always-loaded `App.css`. **Initial CSS: 136.16kB → 96.84kB raw
   (27.04kB → 19.47kB gzip).** Verified live: WhatWeDoGrid's icon renders
   correctly on every route; the model explorer's own styling is intact when
   its CSS chunk loads.
3. **`16d87ce`** — `WhyHiAnzy.js` was serving a raw 128KB PNG via a bare
   `<img>` instead of the site's own `Picture` component (which already
   auto-generates AVIF/WebP with PNG fallback — a 30KB AVIF sibling existed
   and was unused), and had `loading="lazy"` on an image the code's own
   comment identifies as above the fold, which delays a likely LCP candidate
   instead of saving anything. Both fixed; swept the rest of the codebase for
   the same pattern and found no other instance. Verified live: network log
   shows `.avif` loading, screenshot pixel-identical to before.
4. **`12ec9bd`** — added one `<link rel="preload">` for
   `rajdhani-600-normal-latin.woff2`, the one font every `.font-display`
   heading site-wide (including the hero H1) uses. Without it the browser
   only discovers the `@font-face` URL after downloading and parsing
   `fonts.css` — an extra round trip before the most first-paint-critical
   font starts fetching. Deliberately not preloading the other 21 font files
   (secondary weights/styles — preloading them would compete for the same
   early bandwidth). Verified live: no "preload not used" browser warning,
   confirmed as the first font request in the network log.
5. **`98a8e40`** — removed `@tanstack/react-query` entirely (`npm uninstall`
   + removed the `QueryClientProvider` wrapper from `index.js`). Grepped for
   every hook the library exposes (`useQuery`, `useMutation`,
   `useQueryClient`, `useInfiniteQuery`) — zero real usage anywhere; every
   actual data-fetch in the app is plain axios + `useState`/`useEffect`. The
   provider was standing up a `QueryClient` (with its own online/visibility
   listeners) for no benefit. **Main bundle: 706.71kB → 681.77kB raw
   (238.12kB → 231.14kB gzip).** Verified: build/test/lint pass; live-checked
   `/`, `/work`, `/network`, `/contact` for console errors (clean except the
   pre-existing, expected anonymous-visitor 401 on `/api/auth/me`).

   Also checked `next-themes` and `class-variance-authority` on the same
   suspicion (installed but maybe unused) — an initially flawed grep pattern
   suggested they might be dead too; a corrected search found both are
   genuinely used (`next-themes`'s `useTheme` powers `sonner.jsx`'s
   `Toaster`, rendered in `App.js` and actually invoked via
   `toast.error(...)` in `lib/auth.js`/`Contact.js`; `class-variance-authority`'s
   `cva` powers `sheet.jsx`, which Nav's mobile menu depends on). Correctly
   **not** removed.
6. **`3c62216`** — `/api/auth/me`, `/api/subscribers`, `/api/contact-submissions`,
   and `/api/operations/status` returned no `Cache-Control` header at all
   (relying purely on FastAPI/Starlette defaults), leaving them exposed to
   heuristic caching by any intermediate shared cache/proxy — a real concern
   for `/auth/me` specifically, since it's cookie-scoped per-user identity
   data. Added explicit `Cache-Control: no-store` to all four. The two
   pre-existing `no-store` usages (newsletter confirm/unsubscribe pages) were
   already doing exactly this for the same reason — this extends the same
   established pattern. Public content endpoints (`/case-studies`,
   `/network`, `/ecosystem`, `/insights`, `/portfolio`) are untouched.
   Verified live: inserted a throwaway session+user directly into the local
   dev Mongo, confirmed a real 200 from `/auth/me` carries
   `cache-control: no-store`, then deleted the test rows.

## CHECKED, NO ACTION TAKEN (verified correct as-is, not a gap)

- **Three.js allowed-optimizations checklist** (duplicate asset downloads,
  cache delivery, correct URLs, memory/listener leaks, duplicate scene init):
  none of the 8 scene files under `components/three/` load any external
  texture/GLTF asset (`useLoader`/`useTexture`/`useGLTF`/`TextureLoader` —
  zero matches; all scenes are procedural geometry/shaders), so
  duplicate-download/cache/URL concerns don't apply. Every
  `addEventListener` (`SystemCore.js`, `useSceneVisibility.js`) has a paired
  `removeEventListener` in cleanup. Exactly one `<Canvas>` per scene file, no
  duplicate scene instantiation found.
- **Home.js eager (non-lazy) import**: `Home` is the one route in `App.js`
  not wrapped in `lazy()`, unlike every other route. This does mean its
  subtree (including large chunks of `data/content.js` via
  `WhatWeDoGrid`/`Diagnostic`/etc.) ships in the initial bundle regardless of
  landing route. Deliberately left as-is: `/` is this site's primary entry
  point, and making it lazy would introduce a loading-skeleton flash for the
  majority of visits — the exact failure mode the protocol names as
  unacceptable for primary content (see the ConnectedStory reasoning above).
  Not a defect; a correct, deliberate tradeoff.
- **`AuthContext.Provider` value object**: `lib/auth.js` constructs a new
  `{ user, setUser, loading, login, logout }` object on every `AuthProvider`
  render — textbook unstable-context-value shape. Checked its actual blast
  radius: exactly one consumer (`Nav.js`) via `useAuth()`, and
  `AuthProvider`'s own state changes rarely (mount resolution, login,
  logout) — not "broad," not "repeated." Per the explicit "do not blanket
  memoize" instruction, left unmemoized.
- **Lenis/GSAP ticker initialization** (`lib/motion.js`): single instance,
  created once, torn down correctly (`gsap.ticker.remove`, `lenis.destroy()`,
  `window.__lenis = null`) — no duplicated-initialization bug found.
- **ConnectedStory's unreachable render modes** (`gap`/`services`/`method`/
  `summary`/`work`/`team`/`start`): confirmed dead code (only `mode="model"`
  is ever reached, via Home.js's one `lazy()` call) — flagged, not removed;
  outside this pass's risk tolerance for a component already touched twice
  this session.

## TEST BASELINE — STEP 3
| Check | Result |
|---|---|
| `npm run build` (frontend) | PASS — 681.77kB main bundle (231.14kB gzip), 56 pages prerendered |
| `npm test` (vitest) | PASS — 8/8, 3 files |
| `pytest tests/test_api.py` (real Mongo, port 27117) | 59/59 PASS (the 1 prior Windows-tmpdir-permission flake re-ran clean with a writable `--basetemp`) |
| Docker `api` rebuild + live curl verification of `Cache-Control` headers | PASS — `/auth/me` 401 path confirmed headerless-before/no-store-after mechanism; 200 path (via throwaway test session) confirmed `cache-control: no-store`; `/case-studies` confirmed unaffected |

## COMMITS MADE (Step 3, in order)
- `a3e4692` fix(perf): extract CASE_VISUALS/CaseGraphic so ConnectedStory can actually lazy-split
- `b656dc6` fix(perf): move story.css import into ConnectedStory's own lazy chunk
- `16d87ce` fix(perf): serve WhyHiAnzy's cube-head art via Picture, drop harmful lazy-load
- `12ec9bd` fix(perf): preload the one font every heading site-wide depends on
- `98a8e40` fix(perf): remove unused @tanstack/react-query dependency
- `3c62216` perf(cache): explicitly no-store the four private/admin GET responses

## STEP 3 STATUS: COMPLETE

---

# PART A — VERCEL BACKEND RUNTIME HARDENING

The backend was written for a container it owns for its entire life. Vercel
runs it as a Vercel Function on Fluid compute instead. Three assumptions did
not survive that, and all three are now fixed and verified. Docker behaviour
is deliberately unchanged — it still seeds at startup and still runs both
background workers.

Platform facts were taken from current Vercel documentation, not assumed:
lifespan events are supported (`/docs/frameworks/backend/fastapi`), shutdown
is capped at ~500ms after SIGTERM, `VERCEL=1` is exposed at runtime
(`/docs/environment-variables/system-environment-variables`), Vercel
overwrites `x-forwarded-for` and refuses to forward a caller-supplied value
(`/docs/headers/request-headers`), HSTS is applied automatically
(`/docs/cdn-security/encryption`), and `headers` is a documented per-service
key (`/docs/services/config-reference`).

## A1 — LIFESPAN: FIXED
| Item | Before | After |
|---|---|---|
| `seed()` at startup | Ran on every startup — on Vercel that is every cold start: **93 seed documents + 9 index creations** of round trips, on a write path, before the first request is served. A transient Mongo error aborted ASGI startup, so every request to that instance would 500 rather than degrade. | Skipped when `VERCEL` is set. Content reaches a database through the new explicit `python manage.py seed` command. Docker still seeds automatically. |
| `_prune_rate_limiter_loop()` | `while True` worker started at boot | Not started on serverless — per-instance memory dies with the instance, so it has nothing to prune. |
| `notification_loop()` | `while True` retry worker started at boot | Not started on serverless. A function is not guaranteed to execute between requests, so it could not be relied on. |
| Teardown | cancelled both tasks | Same, kept cancels-only to fit the ~500ms SIGTERM budget. |

**Durability is preserved.** `/contact` and `/subscribe` still write to Mongo
first and still call `deliver_record(...)` inline on the request, so the
enquiry is saved and delivery is attempted immediately. Only the *delayed
retry* depended on the loop.

**Automatic delayed retry is POST-LAUNCH.** Durable delivery state
(`delivery.status`/`attempts`/`nextAttemptAt`/`leaseUntil`) is untouched and
still on every record, so nothing is lost and a retry mechanism can be added
later without a migration. No Celery/Redis/queue infrastructure was
introduced. In the meantime a failed notification is recoverable by hand:
`manage.py retry <id>`, and `manage.py status` reports `failedNotifications`.

## A2 — MONGODB: VERIFIED, ONE CHANGE
| Requirement | Status |
|---|---|
| Client not recreated per request | **Already correct** — module-level `AsyncIOMotorClient`, created once at import, reused by every warm invocation. |
| Reused across warm invocations | **Yes** — same instance-level client. |
| No leak | `client.close()` in lifespan teardown; no per-request clients anywhere. |
| Startup safe | Now safe on serverless: nothing blocking or failable runs at startup. |
| `MONGO_URL` / `DB_NAME` hard-required | **Unchanged** — `required_setting()` still raises at import if either is missing. |
| `/api/health` honest about DB failure | **Unchanged** — pings the DB and returns 503 on failure. |
| No hardcoded credentials | Confirmed — both come from the environment only. |
| **Changed:** pool size | `maxPoolSize=10` on serverless only. Every concurrent instance opens its own pool; the driver default of 100 multiplied by however many instances traffic spins up would exhaust a shared Atlas tier's connection cap before it exhausted the app. Docker keeps the default. |

## A3 — CLIENT IP: FIXED (this was a real, user-visible bug)
`request.client.host` behind Vercel is Vercel's own infrastructure — the same
value for every visitor. Every IP-keyed rate limit would have become **one
shared global bucket**: five contact submissions from anyone, worldwide,
would have locked the form for everyone else. That is worse than no limiter.

New `client_ip(request)` helper reads the first hop of `x-forwarded-for`
**only when `VERCEL` is set** — Vercel overwrites that header and refuses to
forward a caller-supplied value, so it is trustworthy there and nowhere else.
Off-platform it still uses the socket peer, so the header remains unspoofable
in Docker and local runs. Applied to contact, subscribe, newsletter-action
and analytics rate limits, and to the stored enquiry IP.

Covered by a regression test asserting **both** directions, because getting
it backwards fails silently in opposite ways.

## A4 — RATE LIMITING: OPTION A (kept in-process), documented
Chosen on evidence, per "prefer stability over architecture expansion":
- The A3 fix is what actually makes the limiter meaningful. It was globally
  broken on Vercel; it is now correct per instance.
- Mongo-backed limiting would add a write to **every** contact, subscribe,
  newsletter and analytics request. Analytics alone is limited at 60/60s and
  fires on ordinary user interaction, so this roughly doubles write load on
  the hottest endpoint to protect the coldest ones.
- No Redis/Upstash/Celery/queue introduced.

**Documented limitation:** limits are per instance. With N live Fluid compute
instances the effective ceiling is up to N × the configured limit. It remains
a real brake on single-source bursts, and it is not the only defence —
honeypot (`orgField`), Pydantic length/type validation, request-size caps,
and Vercel's own platform protection all sit alongside it. Revisit with a
shared store only if abuse is observed.

## A5 — SECURITY HEADERS ON VERCEL: FIXED (real gap)
nginx supplies the CSP and browser headers today; **Vercel does not run
`nginx.conf.template`**, so the HTML and static assets would have shipped
with no CSP, no `nosniff`, and no clickjacking protection. The API was never
affected — it sets its own headers in middleware.

Now declared in `vercel.json` scoped to the **frontend service**, which is
what the Services config reference documents ("Header rules scoped to the
service"). Backend left alone to avoid conflicting with its middleware.

Policy is the one nginx already ships, minus two things that do not apply:
| Directive | Decision |
|---|---|
| `connect-src` | `'self'` only — the API is same-origin behind the `/api` rewrite, so nginx's cross-origin `${CSP_CONNECT_SRC}` is unnecessary. |
| `img-src` | dropped `https://images.unsplash.com` — grepped the frontend source, backend and seed data: **nothing references it.** |
| `style-src 'self' 'unsafe-inline'` | **Kept.** GSAP animates through inline style attributes; removing `'unsafe-inline'` would break animation. |
| `script-src 'self'` | Kept, no `'unsafe-eval'` — verified Three.js, GSAP and the Lab all run without it. |
| `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN` | Kept at parity with the approved nginx config. |
| HSTS | **Deliberately absent** — Vercel applies it automatically. |

## A6 — ENVIRONMENT BEHAVIOUR: VERIFIED, NO CHANGES
Re-verified against the code; the table under ENV VARIABLES above is accurate
and unchanged. `MONGO_URL` and `DB_NAME` remain the only hard requirements.
No optional variable was promoted to required. Expected production posture is
unchanged: `SITE_URL=https://hianzy.com`, `PUBLIC_API_URL` falls back to
`SITE_URL`, `REACT_APP_BACKEND_URL` stays unset so the frontend calls
same-origin `/api`.

One addition, read-only and automatic: **`VERCEL`** is set by the platform and
is what gates all the serverless behaviour above. It is never set by hand.

## A7 — EMAIL: VERIFIED, NO CHANGES
Strategy is unchanged and already correct: Resend if configured → SMTP if
configured → otherwise save the record and skip the notification. `send_email`
returns `False` and logs rather than raising when unconfigured, and
`mail_configured()` gates delivery attempts, so **the app boots and accepts
enquiries with no email credentials at all**. No real email was sent during
testing; mail was left unconfigured throughout.

---

# PART B — STEP 4: SEO, PRERENDER, QA, CLEANUP

## B1 — PRERENDER: VERIFIED, ARCHITECTURE KEPT
`scripts/prerender-metadata.cjs` generates **56 real HTML pages**, one per
route, each with route-specific metadata. Not replaced, not migrated to
Next.js, no new prerender framework — it works.

Verified by serving the real build through a local stand-in for the Vercel
deployment (same-origin `/api`, `cleanUrls`, and the exact headers parsed out
of `vercel.json`). Every route returns its own prerendered HTML with a real
title, not a generic SPA shell — for example `/contact` gives "Say Hi |
hiAnzy" and `/work` gives "Work | Proof, With Context | hiAnzy". This is also
the confirmation that `cleanUrls: true` resolves extension-less routes to
their `.html` file correctly, which is why no SPA catch-all rewrite is used.

**`npm run build` alone does not produce `/lab/`.** Vite clears the output
directory, and the Lab is copied in by the `buildCommand` in `vercel.json`.
That is by design; noted because a bare local build leaves `/lab/` missing.

## B2 — METADATA: VERIFIED
All 19 public routes checked: unique real title, meta description, canonical
matching the route, 6 Open Graph tags, 4 Twitter tags, real H1.

**JSON-LD is present but injected client-side** by `components/Seo.js`
(`ORG_JSONLD` plus per-page schema), so it is absent from the raw HTML by
design and appears once React runs — verified in the DOM (`/contact` carries
`ProfessionalService` + `ContactPage`). Left as-is rather than duplicating it
into the prerender script.

Nothing invented: no ratings, testimonials, awards, client relationships,
addresses or business claims were added. The schema's `sameAs` block is
**already** commented out in the source with an explicit note that real
profile URLs are needed — there are no real social URLs anywhere in the
codebase, so it stays an owner action rather than a guess.

## B3 — SITEMAP: PASS
56 URLs, all on `https://hianzy.com`, no duplicates, no dead routes, correct
dynamic slugs, no Lab or internal paths, canonicals consistent with the
prerendered pages.

## B4 — ROBOTS: PASS
Correct `Sitemap: https://hianzy.com/sitemap.xml`, `Allow: /` for `*`, no
accidental global `Disallow`, no staging or debug paths exposed. The
selective bot blocks and Content-Signal policy are deliberate and documented
in the file itself; left alone.

## B5 — FAVICON: STILL OPEN — DOCUMENTED, NOT DESIGNED
`/favicon.ico` returns **404** and no `<link rel="icon">` is declared.

Not fixed, on purpose. The only brand marks in the repo are `logo-light.png`
(667x220) and `logo-dark.png` (1167x388) — both **3:1 wordmarks**. At 16px a
3:1 wordmark renders about 5px tall and is illegible, so wiring one in would
be choosing a new brand presentation, which is a design decision the GLOBAL
LOCK reserves. **Owner action:** provide a square icon. Impact is cosmetic
(P3): a 404 in logs and a blank tab icon. No SEO or functional effect.

## B6 — ROUTE QA: PASS (19 routes + Lab + 404, real slugs)
Every route below returned 200 with its own prerendered title and, where
checked in-browser, mounted and rendered real content:
`/`, `/what-we-do`, `/what-we-do/advisory-security-scale`, `/how-we-work`,
`/work`, `/work/built-here`, `/work/built-together`,
`/work/a-rebrand-that-turned-out-to-be-a-pricing-problem`, `/network`,
`/network/ai`, `/why-hi-anzy`, `/insights`,
`/insights/a-better-funnel-cannot-rescue-a-confused-offer`, `/contact`,
`/who-we-work-with`, `/collaborate`, `/careers`, `/resources`,
`/coming-soon`. `/lab/` serves the Experience Lab's own app and content.
An unknown path correctly returns **404** with the 404 page.

## B7 — STEP-3 VISUAL REGRESSION GATE: PASS
The highest-risk item was the CSS split. Verified directly:
- **Before** opening the model explorer: only `fonts.css` + `index-*.css`.
- **After** opening it: `ConnectedStory-*.css` loads, the story element is
  present **and styled** (`.story-home` computes `position: relative`, which
  only story.css sets), `.story-mini-object` present and styled, element has
  real height. **No FOUC** — the CSS arrives with the UI, not after it.
- The 4th canvas (`BusinessFlowScene`) appears only on open, confirming the
  lazy split still holds.

Home, What We Do, Work, Network, Why hiAnzy: all mounted, real H1s, **zero
broken images**, no horizontal overflow, canvases present, dark theme
applying correctly. Why hiAnzy's Step-3 image fix confirmed in this serving
model too: `art-cube-head.avif`, loaded, no `loading` attribute.

## B8 — MOBILE QA: PASS
| Width | Overflow | Nav |
|---|---|---|
| 320 | none | mobile toggle |
| 375 | none | mobile toggle |
| 390 | none | mobile toggle |
| 430 | none | mobile toggle; menu opens with all 6 items + Say Hi CTA |
| 1179 | none | mobile toggle |
| 1180 | none | desktop nav (exact switchover) |
| 1182 | none | desktop nav, 6 links |
| desktop | none | desktop nav |

**No dead zone at the 1180 boundary** — exactly one navigation is visible at
every width tested. 3D quality untouched.

## B9 — CONSOLE / NETWORK: PASS, with one honest caveat
No failed chunks, fonts, images or CSS. **No duplicate API requests** — a
clean homepage load makes exactly two calls, one each to
`/api/case-studies?featured=true` and `/api/auth/me`. No CSP violations on
any route, including `/lab/`. No CORS issues in the same-origin model. The
anonymous `/api/auth/me` 401 is expected and was not treated as a defect.

**Observed and not explained (P3, flagged for review):** a React
`NotFoundError: Failed to execute 'removeChild'` appeared intermittently in
the browser pane — on the pane's very first cold load, and once when `/lab/`
fell through to the SPA 404. It is **not** caused by the new CSP: the same
build reproduces clean in fresh tabs with the new CSP, and the error never
appeared on the no-CSP or nginx-CSP control servers. It could not be
reproduced on demand across repeated fresh loads of `/`, `/contact`, `/work`
and two 404 routes, and in every instance where mount state was measured
afterwards the app was mounted and rendering. Recorded rather than dismissed.

## B10 — CLEANUP: MINIMAL
`npm run lint` is clean, so there are no dead imports. `@tanstack/react-query`
is fully gone from `package.json` and source. `.vercel/` is gitignored and
uncommitted. `backend/requirements.txt` exists with all six dependencies
pinned, which is what Vercel's Python runtime installs from. No obsolete
config conflicting with Vercel was found — `nginx.conf.template` and the
Dockerfiles are still live for the Docker deployment and were left alone. No
refactor, restructure or migration performed.

---

# UPDATED OWNER ACTIONS (supersedes the earlier list where they overlap)

1. **Enable Services (Beta)** and set the project's Framework Preset to
   **Services**. Still owner-only, unchanged.
2. **Link the project and deploy** to confirm end-to-end. Local
   `vercel dev -L` on CLI 59.23.1 **parsed the new config and detected both
   services** (`frontend [Vite]`, `backend [FastAPI]`), so the schema —
   including the new service-scoped `headers` — is accepted. A full local
   boot still stops at a local toolchain limit, not a config error: this
   machine has Python 3.11.16 and `vercel-runtime` requires 3.12 or newer.
   Vercel builds with its own Python, so this does not affect the deployment.
3. **NEW — seed the production database once** after setting `MONGO_URL` and
   `DB_NAME`: `python backend/manage.py seed`. The API no longer seeds itself
   on Vercel (see A1). Without this the site deploys but shows no case
   studies, network, insights or ecosystem content. Safe to rerun — it
   upserts by natural key and skips unchanged documents. It prints the
   resulting counts so the result is checkable.
4. **Set the backend env vars.** Minimum to boot: `MONGO_URL`, `DB_NAME`.
   Production posture: `ENVIRONMENT=production`, `COOKIE_SECURE=true`.
   `CORS_ORIGINS` is only needed if something calls the API cross-origin.
5. **Provide a production Mongo URI** — owner action, not fabricated.
6. **Choose an email path** (`RESEND_API_KEY` + `RESEND_FROM` recommended),
   or confirm contact email stays off for launch. The app runs either way.
7. **Confirm `SITE_URL`** — defaults to `https://hianzy.com`.
8. **NEW — provide a square brand icon** for the favicon (see B5). The
   existing wordmarks are the wrong shape and designing one is out of scope.
9. **NEW — provide real LinkedIn/Instagram profile URLs** to uncomment
   `sameAs` in `components/Seo.js`. The source already flags this as the
   biggest remaining schema gap; it is left empty rather than guessed.
10. Decide the auth product question (P2) — not a launch blocker.

## PART A + B STATUS: COMPLETE

---

# STEP 6 — FINAL PRODUCT COMPLETION

Full 30-part completion pass across search, information architecture,
Insights, content, typography, Work/Network UI, scroll performance, backend
cleanliness, error states, mobile, SEO and a final independent audit. This
step was preceded by two prior turns this session that already fixed real
defects (Orbit deck overflow, Work/Network CSS restoration, search coverage,
Insights URL-synced filtering) — this step verifies those, then finds and
fixes the remainder.

## SEARCH COVERAGE (Part 1)

Already completed in the previous turn (commit `6f93031`): the command
palette now indexes case studies, insights and network/ecosystem profiles
from the live API, alongside the pre-existing static pages/systems/
disciplines index. Re-verified this step: no private/admin/internal route
is indexed (the dynamic sources are all public `GET` endpoints; nothing
from `/auth/*`, `/subscribers`, `/contact-submissions` or `/operations/*`
is reachable through search). No further changes needed.

## SECTION-LEVEL ROUTING (Part 2) — one real bug found and fixed

Audited every `#hash` destination on the site (`/what-we-do#build`,
`/what-we-do#packages`, `/resources#privacy`, `/resources#terms`, plus a
newly added `/work#orbit`):

- **Real bug, fixed:** `ScrollToTop` (`lib/motion.js`) computed a hash
  target's scroll position once, the first time the element existed, and
  never re-checked. Confirmed live on `/what-we-do#build`: landed at
  scrollY 2104 while the target had actually settled at ~7980px — a
  ~5876px miss caused by font-swap reflow (six long capability cards plus
  a packages/builder section shift measurably once Newsreader/Rajdhani
  finish loading). Fixed by re-running the same scroll calculation once
  `document.fonts.ready` resolves. Verified live: `/what-we-do#build` now
  lands with its target 96px below the nav, matching `#packages`'
  already-correct behavior.
- **`#packages`, `#privacy`, `#terms`:** verified correct, unaffected.
- **New anchor, justified:** every ecosystem category page's "Back to the
  Orbit" link went to plain `/work` (the top of the page), past a stale
  comment claiming hash anchors "silently do nothing" — untrue since Step
  2's CommandPalette work. Added `id="orbit"` to `OrbitSection` and pointed
  the link at `/work#orbit`, so the link's own label now matches its
  destination. No anchors were added merely for quantity — this is the one
  case where a link's name promised a specific section it didn't reach.
- Sticky-header offset uses a JS-computed `-96px` in `ScrollToTop`, not CSS
  `scroll-margin-top`. Reviewed and deliberately kept: it already handles
  the sticky header correctly, plus a 20-retry poll for lazy-mounted
  content that a pure CSS approach would have to reimplement separately.
  Rewriting a working, documented, retry-aware mechanism for stylistic
  purity was judged higher-risk than the value it would add.

## SITE-WIDE LINK AUDIT (Part 3)

Full CTA-destination and hardcoded-link inventory performed (see agent
findings, ~60 CTAs traced). **Zero label/destination mismatches found.**
Every internal link uses React Router `<Link>`/`navigate()` — no raw
`<a href="/...">` internal links anywhere. No dead URLs, no placeholder
pages, no nonexistent anchors (after the `#build` fix above). Two teaser
links (`/coming-soon#hi-anzy-ai`, `/coming-soon#imkaan`) are reachable only
from the footer — present on every page, so not orphaned, but the least
discoverable real content on the site; noted, not treated as a defect
since the footer is universal.

## INFORMATION ARCHITECTURE / LINK GRAPH (Part 4)

- `/contact` — 18 inbound links (expected for the primary conversion CTA).
- `/work` — 9 inbound; `/network` — 6; `/how-we-work` — 5; `/what-we-do` — 3.
- Every hub page (`/work`, `/network`, `/insights`, `/what-we-do`) is
  reachable in 1 click from the nav on every page — click depth 1 for all
  primary hubs, 2 for every detail page (hub → detail).
- No important public page is an accidental orphan. The `/coming-soon`
  anchors are the only single-inbound-source content (see above).
- No cross-links were added purely to inflate a number; every link added
  or corrected this step (`/work#orbit`) already existed as a link whose
  label promised a destination it didn't reach.

## INSIGHTS: DATA-DRIVEN AND DYNAMIC (Parts 5–6)

- Architecture unchanged and confirmed correct: `/insights` and
  `/insights/:slug` already derive their content from `getInsights()`/
  `getInsight()` (the live API), not duplicated manual card data. The
  56-page static prerender architecture is untouched — this step did not
  and does not convert individual article pages to client-only rendering.
- **Search** now includes all 10 published insights (previous turn).
- **Category filtering** is now URL-synced (`?category=...`) — bookmarkable,
  shareable, and what a search result or external link can land directly
  into (previous turn, commit `6f93031`).
- **Related content ("Keep Reading")** was fixed in this session's prior
  turn: same-category picks first, then a position-rotated fallback,
  reducing zero-inbound-link articles from 7 of 10 to 1 of 10.
- **The remaining orphan — resolved via a genuine relationship, not forced:**
  "The Problem Behind the Problem" (category "Things We Noticed") is the
  sole article in its category, so no same-category sibling exists, and
  its position in the rotation happens to miss every other article's
  fallback window. Investigated a forced fix (alternate rotation formulas)
  and rejected it — every alternative tried either left a different
  article orphaned or reduced overall relevance quality for no net gain.
  Per this task's own explicit instruction not to create an artificial
  link merely to eliminate an orphan count, this is left as a documented,
  understood limitation of a 10-article/5-category dataset rather than
  force-fit. It remains fully reachable from `/insights` itself (1 click
  from nav) — "orphaned" here means zero cross-article recommendations,
  not unreachable.
- Featured/hero article: none currently designated — the index treats all
  published articles equally via the carousel. Not added this step (would
  require an editorial "featured" flag with no current data-model support
  and no owner input on which article should be featured — inventing one
  would be exactly the kind of unsupported claim this task prohibits).

## CONTENT COMPLETENESS & COPYWRITING (Parts 7–9)

Full-site scan (placeholder/lorem/TODO/repeated-paragraph/missing-description/
CTA-mismatch/alt-text) performed across every page and component file.
**Result: the site is clean.** No lorem ipsum, no user-visible placeholder
copy, no repeated/duplicated paragraphs, no heading without supporting copy,
no card missing a description its siblings have, no CTA whose label
contradicts its destination, no missing or filler alt text. The one
genuinely open item is not user-facing: `Seo.js`'s `sameAs` (LinkedIn/
Instagram) schema block is commented out pending real profile URLs — an
existing, already-documented owner action, not new.

**New Insight content: none created.** Per this task's own classification
scheme (READY FROM EXISTING MATERIAL / SAFE TO ASSEMBLE / NEEDS OWNER
MATERIAL / DO NOT CREATE), no candidate topic surfaced during this pass
that could be substantively assembled from existing approved material
without either thinning into SEO filler or requiring facts (client
outcomes, dates, specifics) this session has no authority to invent. No
filler was added to inflate the article count.

**No facts invented:** no clients, revenue figures, awards, testimonials,
research statistics, locations, partnerships, founder quotes or
performance metrics were added anywhere this step.

## TYPOGRAPHY (Parts 10–11) — one real rendering bug found and fixed

- **Real bug, fixed:** `portfolioWall.css` referenced `var(--font-display)`
  in five places; that custom property is declared nowhere in the
  codebase. An undeclared `var()` with no fallback computes to the
  inherited value, so the Portfolio Wall's stat numbers and index digits
  were silently rendering in the body's editorial serif instead of the
  Rajdhani display face their own class names specify. This predates the
  `story.css` split from two turns ago and was invisible only because that
  CSS wasn't loading on `/work` at all until that split fixed the loading
  bug — fixing the load exposed a font bug that was already there.
  Corrected to `var(--font-system)`. Verified live: the stat numbers now
  compute `"Rajdhani, ..."` instead of inheriting Newsreader.
- **Stale comment, corrected:** `App.css` claimed Figtree "isn't set as a
  primary face anymore," which is inaccurate — `story.css`'s `.story-home`
  (the homepage model explorer) still does, deliberately. No font was
  changed; only the comment.
- **Dormant config drift, corrected:** `tailwind.config.js`'s
  `fontFamily.editorial` was still `Figtree`, left over from before the
  Newsreader swap in `App.css`. Currently inert — `App.css`'s unlayered
  rules always beat Tailwind's `@layer utilities` regardless of source
  order — but a landmine for whenever that stops being true. Updated to
  match `App.css`'s real value.
- **File/weight inventory:** clean 1:1 mapping between the 22 shipped
  `.woff2` files and the 22 `@font-face` rules in `fonts.css` — no missing
  files, no unreferenced files. Every rule carries `font-display: swap`.
  Exactly one font is preloaded (`rajdhani-600-normal-latin.woff2`),
  confirmed to exactly match the hero H1's actual computed font
  (Rajdhani, weight 600). All three `--font-*` fallback stacks end in a
  correct generic (`sans-serif`/`serif`) — none can silently collapse to
  browser-default Times/Arial.
- **Minor, not fixed:** `font-pun` is combined with Tailwind's
  `font-medium` (weight 500) in two components, but only Amaranth 400 is
  shipped — the browser renders the nearest available real weight (400)
  rather than synthesizing a fake 500. Cosmetically negligible on a
  display/pun accent face; left as-is rather than touching two call sites
  for an effectively invisible difference.
- **Consistency spot-check** (Home, What We Do, Work, Work detail, Network,
  Insights, Insight detail, Contact): headings uniformly use the display
  font, body/narrative copy uniformly uses the editorial font, technical
  labels uniformly use mono — no page found using a mismatched variable on
  a main heading. Clean.

## WORK / NETWORK FINAL UI AUDIT (Parts 12–13)

Both pages re-verified after the CSS restoration from two turns ago, plus
this step's font fix:
- Portfolio Wall line-art diagrams render in the correct theme colors
  (white/orange line art, not solid black), stat labels read correctly
  spaced ("PORTFOLIO CONTEXT" / "06 WORKS"), and now render in the correct
  Rajdhani display face.
- Orbit/Evidence deck fan, tilt, drag and lift all confirmed unchanged; the
  horizontal-overflow fix from two turns ago re-verified clean at 1180px
  and 375px.
- Network's constellation map, resource-directory accordions, discipline
  filter chips and stat panel all confirmed rendering correctly with the
  restored `networkPage.css`.
- `ConnectedStory`'s own styling (`story.css`, now containing only its own
  content after the two extractions) re-verified unaffected — `.story-home`
  still resolves `position: relative` and its Figtree primary face
  correctly.
- No page-wide horizontal scrollbar on either page at 375/1180/1440.

## SCROLL PERFORMANCE (Part 14) — investigated, one real fix applied

Full audit of forced-layout risk, listener hygiene, ScrollTrigger cleanup,
hot-path state updates and card-media CLS risk (see agent findings).

- **Fixed:** `MagneticButton.js` (used by primary CTAs sitewide) called
  `getBoundingClientRect()` on every `mousemove` with no caching — the one
  genuinely costly pattern found that also had an established, already-
  correct sibling pattern to mirror (`MotifFrame.js`'s tilt handler: measure
  once on enter, reuse until leave). Fixed identically. Behavior unchanged
  — same pull calculation, same transform write, only the timing of the
  rect read moved from every event to once per hover.
- **Investigated, not changed:** `CardCarousel.js` and `PopIllustration.js`
  interleave `getBoundingClientRect()` reads with `opacity`/`transform`
  writes across the same scroll tick. On inspection, `opacity` and
  `transform` are compositor-only properties that do not invalidate layout
  in any current browser engine, so this does not actually force the
  synchronous reflow the pattern superficially resembles — reordering it
  would be a defensive-only change with no measurable benefit, so it was
  not made, per this task's own instruction to act only where measurement
  proves benefit.
- **Investigated, not changed:** `CollapseOnScroll.js` runs a
  `document.querySelectorAll("details[open]")` on every scroll tick,
  site-wide, to auto-close panels scrolled away from. Real but small cost
  (a cheap, mostly-empty query on pages with no open panel); the component
  protects a documented, deliberate correctness fix from this project's own
  history (a reader's scroll position losing meaning under an open panel).
  Left unchanged — gating it further was judged higher-risk than its
  marginal benefit.
- **Confirmed clean:** all 5 `ScrollTrigger.create()`/`gsap.timeline()`
  sites have matching cleanup; no leaked instances across route navigation.
  `ScrollProgress.js` and `ScrollVelocity.js` already write only to
  refs/CSS custom properties on every scroll tick — zero React re-renders,
  the correct pattern the two fixed/flagged components above should (and
  now partly do) mirror.
- **Card-media CLS:** Work/Network/Insight cards render inline SVG or text
  only — no external raster images inside any card grid, so the common
  "image with no reserved dimensions" CLS failure mode does not apply.

## ERROR / EMPTY STATES (Parts 19–20) — two real bugs found and fixed

- **`Work.js`:** the portfolio-wall fetch caught a failure into the same
  state as "no portfolio items," so a real API outage silently rendered as
  an empty section with a visible "PORTFOLIO ARCHIVE" header and nothing
  under it — no error message, no retry, unlike the sibling case-studies
  fetch on the same page. Fixed with a dedicated error state matching the
  existing pattern.
- **`Discipline.js`:** a real fetch failure fell into the same branch as a
  genuinely empty discipline, which renders the specific, confident claim
  "Nothing public listed... The relationships exist. The write-ups are
  still being verified" — actively wrong during an actual outage. Fixed
  with a dedicated error state; the loading skeleton was also given an
  error-aware exit so it can no longer spin indefinitely after a failure.
- Both verified against a **real** outage (stopped the `api` container,
  confirmed the correct message appears with no stale skeleton and no
  misleading empty-state copy), then confirmed both recover to normal
  content once the API was restored.
- **Investigated, not changed:** `ServiceDetail.js`'s supplementary
  "WHERE THIS HAS ALREADY RUN" proof-cases block silently renders nothing
  on failure. Reviewed and left as-is: unlike the two cases above, this
  section carries no persistent visible label when absent (no heading is
  ever shown without content), so failing silently to nothing is a
  reasonable degrade for a secondary enhancement, not a defect.
- No area anywhere renders a genuinely blank rectangle while loading; every
  data-driven page already has (or, after this step, now has) a distinct
  loading, empty, and error state.

## BACKEND CLEANUP & API EFFICIENCY (Parts 17–19)

- Import audit: every import in `server.py` is used; no dead code, no
  debug/launch-only cruft, no commented-out code blocks found. `manage.py`'s
  `print()` calls are legitimate CLI output for its documented purpose (a
  human-operated console), not debug leftovers.
- No broad rewrite performed or needed — the backend was already hardened
  for the Vercel runtime in this session's earlier work (serverless-aware
  lifespan, capped Mongo pool, trusted-proxy-aware client IP, explicit
  `Cache-Control: no-store` on private endpoints).
- **Duplicate-request check, live-verified this step:** a clean load of
  `/work` makes exactly 3 API calls (auth/me, case-studies, portfolio), a
  clean load of `/network` makes exactly 4, and `/insights` makes exactly
  2 — zero duplicates on any of the three.

## MOBILE (Part 22)

Re-verified at 375px and the 1179/1180 boundary on Work, Network, Insights
and What We Do (the four pages touched this step and the prior two): zero
horizontal overflow on any of them. 3D quality untouched throughout.

## SEO (Part 24)

Sitemap unchanged at 56 URLs, all on `https://hianzy.com`, no duplicates.
Prerendered page count unchanged at 56 HTML pages (+404.html). Spot-checked
titles on Work/Network/Insights/What We Do — all correct, unchanged. No new
public routes were added this step (the one new anchor, `/work#orbit`, is a
section of an existing page, not a new route) so no sitemap change was
required or made.

## PERFORMANCE REGRESSION (Part 26)

| Metric | Step-3 baseline | After Step 6 |
|---|---|---|
| Main JS | 681.77 KB raw / 231.14 KB gzip | 682.07 KB raw / 231.21 KB gzip |
| Initial CSS | 96.84 KB raw / 19.47 KB gzip | 96.84 KB raw / 19.47 KB gzip |

+0.3KB raw / +0.07KB gzip on JS (the dynamic search-index loader and the
MagneticButton/motion.js fixes); CSS unchanged at the gzip level. No
material regression.

## FULL VALIDATION (Part 25)

| Check | Result |
|---|---|
| `npm run lint` | PASS — clean |
| `npm test` (vitest) | PASS — 8/8 |
| `npm run test:build` | PASS — 6/6 |
| `npm run build` | PASS — 56 pages prerendered |
| `pytest tests/` | PASS — 60/60 |
| Docker full stack | PASS — rebuilt and live-tested throughout, including a real forced API outage for the error-state fixes |

## STEP 6 STATUS: COMPLETE

---

# PART 2A — SEARCH RESULTS MUST REPRESENT DISTINCT SECTIONS

Follow-up to Step 6's own search-coverage note (Part 1): the palette indexed
every *page*, but a long page still resolved every one of its sections to the
same top-of-page destination. This part makes 25 additional entries resolve
to their own place on the page, not a shared catch-all.

## WHAT WAS ADDED

- **`SECTION_ANCHORS`** (`frontend/src/lib/commandIndex.js`) — 14 hand-picked
  sections across Home (6), Work (3), Network (3) and What We Do (2). Each
  entry's title/keywords are quoted from the section's own kicker/heading,
  not invented. `id` attributes were added to the corresponding JSX
  (`Hero.js`, `Diagnostic.js`, `WhatWeDoGrid.js`, `WorkPreview.js`,
  `NetworkPreview.js`, `WhoWith.js`, `Work.js`, `Network.js`) so each entry
  has a real DOM target.
- **6 ecosystem-category entries**, generated from `ORBIT_CATEGORIES` — the
  same data `EcosystemCategoryPage.js` already renders from, not a second
  hand-maintained list.
- **5 Insights-category entries**, generated from `INSIGHT_CATEGORIES`,
  landing on the existing `?category=` filtered view.

**Deliberately excluded** (too thin or too risky to be their own
destination): Home's `SomethingsOff`/`WhyHowNow`/`Trust`/`Closing` sections,
and Home's pinned method sequence (`PinnedSequence`, GSAP `ScrollTrigger`
`pin: true`) — a direct anchor jump into a pinned scroll-scrub section would
land mid-animation rather than at a stable, readable position. Search intent
for "the method"/"how it works" is left resolving to the already-indexed,
safer `/how-we-work` page instead of manufacturing a risky in-page anchor.

## BUG FOUND AND FIXED: "Venues" label collision

`NETWORK_SUBCATS` already has a real discipline literally named **"Venues"**
(`/network/venues`, the Events & Venue Production capability). Giving the new
ecosystem roster entry the same label tied its exact-match score, and since
disciplines are pushed into the index before ecosystem entries, the
discipline won `searchCommands`' stable-sort tie-break — searching "Venues"
surfaced the wrong page first. Renamed the ecosystem entry to **"Venue
Partners"**, matching its real route (`/network/venue-partners`). Verified
live via a direct chunk import (`import('/assets/commandIndex-*.js')` →
`searchCommands()`) that both "Venues" and "Venue Partners" now each return
their own correct, unambiguous top result.

## LIVE VERIFICATION (per this part's own checklist: SEARCH → exact result →
correct page → correct anchor → sticky header does not cover heading →
section is visibly identifiable → browser Back works correctly)

All 14 `SECTION_ANCHORS` entries checked directly in the browser (measuring
the actual heading/content element's position against the sticky nav's
bottom edge, not just the outer `<section>` boundary — the outer boundary can
correctly sit at `scrollY:0`/top-of-viewport for a page's first section by
design, which is not the same as being covered):

| Anchor | Result |
|---|---|
| `/#home-hero-section` | PASS — h1 at 143px, nav bottom 85px |
| `/#home-diagnostic-section` | PASS — 96px |
| `/#home-what-we-do-section` | PASS — 96px |
| `/#home-work-section` | PASS — 95px |
| `/#home-network-section` | PASS — 95px |
| `/#home-who-section` | PASS — 96px |
| `/work#work-case-studies` | PASS — 89px |
| `/work#orbit` | PASS — 96px |
| `/work#portfolio-wall` | PASS — 96px |
| `/network#network-disciplines-section` | PASS — 127px |
| `/network#network-rosters` | PASS — 96px |
| `/network#network-specialists` | PASS — 96px |
| `/what-we-do#packages` | PASS — 271px (normal `section-pad` container gap above the visible kicker/heading, not a miss) |
| `/what-we-do#build` | PASS — 96px (re-confirms Step 6's font-swap-reflow fix still holds) |

All 6 ecosystem-category routes resolve to their correct, distinct page
(confirmed `/network/venues` and `/network/venue-partners` are two different
pages, not a collision). All 5 Insights category filters confirmed correct
against the live API's actual (title-case) category values — one initial
test used the CSS-uppercased chip text instead of the real value and
appeared to fail; re-tested with the correct casing and confirmed working,
so this was a testing mistake, not an app bug.

**Browser Back** verified for both a same-page hash jump (`/` →
`/#home-work-section` → Back returns to `/` at scrollY 0) and a cross-page
anchor jump (`/work` → `/network#network-rosters` → Back returns to `/work`).

## VALIDATION

| Check | Result |
|---|---|
| `npm run lint` | PASS — clean |
| `npm test` (vitest) | PASS — 8/8 |
| `npm run build` | PASS — 56 pages prerendered |
| `pytest tests/` | PASS — 60/60 (one Windows-only pytest tmpdir permission flake, confirmed passing in isolation with `--basetemp`; not a code defect, matches the same pre-existing flake noted in Step 2/3) |
| Docker `web` rebuild + live smoke test | PASS |

## PERFORMANCE

| Metric | Step 6 | After PART 2A |
|---|---|---|
| Main JS | 682.07 KB raw / 231.21 KB gzip | 682.22 KB raw / 231.26 KB gzip |
| Initial CSS | 96.84 KB raw / 19.47 KB gzip | unchanged |

+0.15KB raw / +0.05KB gzip — the `SECTION_ANCHORS` array and the two new
generated-entry loops. No material regression.

## COMMITS

- `7a81f71` fix: add stable section ids for search-driven anchor navigation
- `5b441aa` feat(search): make search results represent distinct sections, not just pages

## PART 2A STATUS: COMPLETE

---

# PART 28A — FINAL UI SYSTEM CONSISTENCY GATE

Side-by-side audit using Home (`Home.js` + `pages/home/*.js`) as the system
reference, across font family/weight/size/line-height, heading spacing,
alignment, section rhythm, cards, buttons, nav, labels, page width,
responsive margins, and dark/light surface relationships. Every other major
page (Work, Network, Insights, WhatWeDo, HowWeWork, WhyHiAnzy, Contact,
Discipline, ServiceDetail, WorkDetail, InsightDetail, ecosystem category
pages, Resources, Careers, Collaborate, ComingSoon) was checked against it.

Per this part's own explicit instruction, Work/Network/Insights/Experience
Lab's deliberate visual character (Portfolio Wall's dark-panel infographic
style, Network's constellation identity, ConnectedStory's model-explorer
treatment) was preserved and not flagged — only accidental drift was.

## FOUR GENUINE DRIFTS FOUND AND FIXED

1. **`WorkDetail.js`/`InsightDetail.js` `loadError` fallback** — missing the
   `pt-[84px]` fixed-nav offset every other state in the same two files
   already carries. Added.
2. **`WorkDetail.js`/`InsightDetail.js` `notFound` state** — missing
   `px-4 text-center`, which the same boilerplate pattern's other two copies
   (`ServiceDetail.js:106`, `Discipline.js:47`) already have. Added.
3. **`Contact.js`** — two spots used Tailwind's semantic `text-base`/
   `text-lg` instead of the explicit-pixel sizing convention used everywhere
   else on the site, including elsewhere in the same file. Changed to
   `text-[16px]`/`text-[18px]`.
4. **`WhyHiAnzy.js`** — three card headings ("Why 'Hi'?", "Dreamers +
   Doers", "Compass + Engine") used a fixed `text-5xl` where every
   comparable card-title heading elsewhere (`Packages.js:62`, `Work.js:185`,
   `Network.js:422,476`) uses a responsive `clamp()` scale. Matched to
   `Packages.js`'s card-title clamp (`clamp(2rem,3vw,2.8rem)`).

## ADDITIONAL BUG FOUND LIVE (not from the audit — user-reported with a
screenshot, fixed the same pass)

**StickyCta covering the Orbit deck's own CTA.** The global "Not sure which
part is broken?" bar (`StickyCta.js`) is fixed-position and appears in a
scroll window (1.4-3.2 viewports) on any long page. On `/work` that window
overlapped the Orbit deck's active card, covering its "Explore" link with
the bar's own "Start a Conversation" link — two stacked CTAs, one unusable.
Fixed with an opt-in `.sticky-cta-avoid` class: an `IntersectionObserver`
(15% threshold) suppresses the bar while any such element is in view,
independent of the scroll-window logic. Applied to the Orbit deck's wrapper.
Because `EvidenceDeck` mounts after `Work.js`'s own async data fetch
resolves, the avoid-zone lookup polls (20×300ms, mirroring `ScrollToTop`'s
existing retry pattern for the identical late-mount problem) rather than
querying only once on mount — a first version of this fix that queried once
on mount silently failed to find the element and was caught before commit.
Verified live: sticky bar suppressed while the deck is in view, resumes
normal show/hide once scrolled clear.

## VALIDATION

| Check | Result |
|---|---|
| `npm run lint` | PASS — clean |
| `npm test` (vitest) | PASS — 8/8 |
| `npm run build` | PASS — 56 pages, 682.63 KB raw / 231.40 KB gzip main JS |
| `pytest tests/` | PASS — 60/60 |
| Docker `web` rebuild + live verification | PASS — sticky-CTA suppression confirmed live; no new console errors (only the pre-existing anonymous `auth/me` 401 pattern) |

## COMMITS

- `c514246` fix: stop the sticky CTA bar from covering the Orbit deck's own CTA
- `616cfc8` fix: correct four genuine UI-consistency drifts found in system audit

## PART 28A STATUS: COMPLETE

---

# PHASE A — FINAL SCROLL STABILIZATION

Scope rule applied throughout: change scroll code **only** where inspection or
profiling demonstrates a real cost or correctness risk. Lenis, ScrollTrigger,
GSAP choreography and all animation timing were preserved exactly.

**3D IMPACT: NONE / ANIMATION IMPACT: NONE / VISUAL DESIGN IMPACT: NONE / CONTENT IMPACT: NONE**

## A1 — DEPENDENCY MAP (built before touching anything)

The scroll architecture has a single source of truth and no competing listeners:

- `LenisProvider` (`lib/motion.js`) — Lenis (`lerp: 0.12`, `smoothWheel: true`)
  driven by the GSAP ticker, with ScrollTrigger synced to it. One instance,
  exposed as `window.__lenis`.
- `subscribeScroll(cb)` (`lib/motion.js`) — the one subscription helper every
  consumer uses. Polls for `window.__lenis` (40 × 50ms) and falls back to a
  native passive listener. No component adds its own raw scroll listener.
- Consumers verified: `Nav.js` (`isDarkUnderNav`, already rAF-throttled to
  120ms in a prior session), `StickyCta.js`, `SectionIndex.js`, `WorkPreview`.

## A2 — PROFILING

Executed as visual + console inspection across representative routes at 375 /
430 / 768 / 1180 / 1440px. **Honest limitation:** the in-app browser cannot run
Chrome DevTools Performance traces (flame charts, fps recording), so this was
not a flame-chart profile. No scroll performance issue surfaced beyond the one
candidate A1 identified.

## A3 — OPTIMIZATIONS APPLIED: NONE

The single candidate — `SectionIndex.js:207`, a `getBoundingClientRect` call
inside a scroll handler — was examined and deliberately left alone: it is
desktop-only (≥1180px), runs over a small array of 3–8 items, and showed no
measurable cost. Changing it would have been speculative work against the
A3 rule, not a fix. **No scroll code was modified in this phase.**

## A4 — PREVIOUSLY INVESTIGATED PATTERNS: RESPECTED

The `isDarkUnderNav` 120ms rAF throttle (ported from the platform repo,
commit `687908c`) and the `ScrollToTop` retry poll were both left untouched.

## A5 — REGRESSION TEST

Routes `/`, `/work`, `/network`, `/insights`, `/contact`, `/lab/` verified at
mobile (375), tablet (768) and the SectionIndex breakpoint (1180). Layout,
Newsreader typography, 3D scenes and navigation all intact.

## A6 — PERFORMANCE COMPARISON

No before/after delta to report, because no code changed. Build output is
unchanged from Part 28A: 56 pages, 682.72 KB raw / 231.45 KB gzip main JS.

## KNOWN, NOT FIXED (LOW)

`NotFoundError: Failed to execute 'removeChild' on 'Node'` can appear during
*rapid* successive route navigation (4 routes in ~8s). Cause: a GSAP
ScrollTrigger pin-spacer cleanup racing React unmount in `PinnedSequence.js`.
Non-fatal, page keeps working, pre-existing, and not reproducible at real
user navigation speed. Left alone per the A3 rule.

**More precise reproduction found in the scroll-lag investigation below**: this
same error also fires from a single fast scroll gesture straight through
`PinnedSequence` on `/` alone — no route navigation needed. Confirmed
pre-existing by building the untouched pre-session `motion.js` and reproducing
it identically; not introduced by anything in this session. Still non-fatal,
still LOW. Updating the reproduction steps here since "rapid route navigation"
undersold how easily it triggers.

## PHASE A STATUS: COMPLETE

---

# SCROLL LAG INVESTIGATION (continued from the "increase scrolling speed and
# watch for lag" user report — real profiling this time, not just inspection)

## WHAT WAS DONE

Chrome DevTools MCP's own browser instance could not be reached this session
(stale profile lock, `--isolated` not exposed as a tool parameter). Built a
real profiling harness instead, directly in the live page: `PerformanceObserver`
`longtask` entries plus an instrumented `Element.prototype.getBoundingClientRect`
(call count + total self time). Verified representative: `lenis.scrollTo({duration})`
bypasses `lerp`/`wheelMultiplier` entirely (a separate, mutually-exclusive
animation path in Lenis's own `animate.ts`), so all real measurements used
synthetic `WheelEvent` dispatch instead — the actual lerp-damped path a real
user's scroll wheel drives.

## SHIPPED: scroll speed (commit `b6a8f47`)

`lerp: 0.12 -> 0.16`, added `wheelMultiplier: 1.2` in `LenisProvider`
(`lib/motion.js`). Verified via ctx7 against Lenis's current README/types
before touching it. Baseline: 80 synthetic wheel ticks at the old settings
only moved the page half their nominal input distance (8800 of a notional
8800px — full catch-up, but see below) actually the *speed* gain is the
distance-per-tick: at 1.0x it reached scrollY 8800 for 80x110px of input; at
1.2x it reached scrollY 10560, exactly 80x110x1.2 — confirmed live via
`window.__lenis.options`. This reduces *total* time spent scrolling through a
long page, and so *total* lag encountered end-to-end, but does not reduce
*per-frame* cost (see below) — reported to the user as exactly that, not
oversold as "fixed."

## INVESTIGATED AND RULED OUT: the 3D scenes are not the cause

Per-section long-task attribution (correlating `longtask` timestamps with
scroll position against measured section boundaries) found cost concentrated
in Home's first ~40%: `home-hero-section` alone accounted for 572ms across
only 1167px of scroll — roughly 3.6x the cost-per-pixel of `home-what-we-do-
section` (323ms across 2375px), the page's largest section. `home-network-
section` produced the single worst individual long task (111ms).

Both of those sections carry the page's only two R3F canvases (Hero's
`SystemCore`, NetworkPreview's `Constellation`), which made them look like the
obvious cause. They are not: both already use `useSceneVisibility`
(`components/three/useSceneVisibility.js`), a carefully engineered, already-
measured hook from a prior session — its own comment documents "scrolling
11,500px away from the hero scene changed total draw calls by 0.3%" before
this hook existed, i.e. the "runs forever off-screen" bug class is already
fixed. `Constellation` goes further, adding a third `frameloop="demand"` tier
between fully active and fully stopped. The cost measured in these sections is
the genuine, already-tuned, already-approved cost of actively rendering
approved WebGL scenes while they are on screen — not a bug, and explicitly
protected by the freeze ("Preserve 3D scenes... Do not remove 3D detail to
make performance numbers look better"). Not touched.

## TESTED AND FALSIFIED: ScrollTrigger.update() "double firing"

Stack-trace sampling of `getBoundingClientRect` callers during a scroll
initially showed an even 348/348 split across two call paths into the same
minified function, suggestive of `ScrollTrigger.update()` firing twice per
Lenis tick (once from Lenis's own `.on("scroll", ScrollTrigger.update)`
binding, once from ScrollTrigger's own native `scroll` listener, since Lenis
writes to real `window.scrollY` every frame per this file's own
`subscribeScroll` comment). Verified against GSAP's official docs (via ctx7)
that `scrollerProxy` is the documented mechanism for this integration and that
ScrollTrigger always listens natively regardless.

Tested directly, twice, in the local Docker container only (never committed,
never pushed): commented out the explicit `.on("scroll", ScrollTrigger.update)`
binding, rebuilt, measured with the identical wheel-tick harness.
**Result: no measurable difference** — 927 calls/986ms/39 long tasks without
the binding vs. 945/1001ms/40 with it, noise-level variance. Removing it buys
nothing.

First test run also showed the `removeChild` error above, which looked at
first like a regression from this change — re-verified against the untouched
original `motion.js` (built and measured separately) and found it reproduces
identically there too. Correctly attributed as pre-existing, not caused by the
experiment; see the updated KNOWN, NOT FIXED entry above. Good that this got
checked rather than assumed either way, in both directions.

Binding kept, exactly as committed. Its original justification (avoiding a
one-frame-behind desync for scroll-triggered animations, since anything
polling `window.scrollY` from its own rAF loop can land a frame behind Lenis's
authoritative interpolated value) stands unchallenged; removing it had no
performance case and a documented desync risk.

## REMAINING, UNFIXED, HONEST CONCLUSION

The first ~40% of Home costs more per pixel scrolled because it packs more
concurrently-active GSAP `ScrollTrigger` instances into less vertical space
than the rest of the page (Hero's `RouteLine` + several `Reveal`s,
`SomethingsOff`, `WhyHowNow`, `WhatWeDoGrid`'s card grid, then straight into
`PinnedSequence`'s own pin/scrub) — each one reads its own `getBoundingClientRect`
on every `ScrollTrigger.update()`. This is not a bug with a discrete fix; it is
the measured cost of the approved animation density in that stretch of the
page, matching almost exactly how the user described the problem ("more info
and animation"). A change here would mean reducing how many scroll-triggered
elements are simultaneously active — a real choreography change, which the
freeze protects and which was not requested. Reported as a location-specific,
evidence-backed finding rather than something silently left unexplained.

## VALIDATION

| Check | Result |
|---|---|
| `npm run lint` | PASS — clean |
| `npm test` (vitest) | PASS — 8/8 |
| Docker rebuild + live verification | PASS — `lerp`/`wheelMultiplier` confirmed live via `window.__lenis.options`; `PinnedSequence`'s stage transitions still pin/unpin correctly at the new settings |
| Two local-only ScrollTrigger.update() experiments | Both reverted; working tree confirmed clean (`git diff --stat`) against commit `b6a8f47` before and after |
| `removeChild` regression check | Reproduced on untouched original code; confirmed pre-existing, not introduced this session |

## COMMITS

- `b6a8f47` perf(scroll): raise Lenis lerp/wheelMultiplier after measuring real scroll lag

## SCROLL LAG INVESTIGATION STATUS: COMPLETE

---

# SCROLL FLOW FIX — root cause found and fixed in `subscribeScroll`

User asked for "Apple flow level scroll" with the constraint: change nothing in
the UI, touch nothing else, fix the scroll animation only. That is what landed:
one function in `lib/motion.js`, no UI, no choreography, no timing changes.

## ROOT CAUSE

`subscribeScroll` (`lib/motion.js`) is the single scroll subscription every
scroll-driven component uses. It attaches a Lenis `"scroll"` listener once
Lenis exists — and *also* registered a native `window` `scroll` listener
unconditionally, as a fallback for reduced-motion (no Lenis). That fallback was
never gated off once Lenis attached. Lenis writes the real `scrollTop` every
animation frame, so the native event fired every frame too, and **every
subscriber ran twice per frame**: once with Lenis's interpolated value, once
with the one-frame-stale `window.scrollY` the file's own comment warns about.

The second (native) pass is what hurt: it ran after ScrollTrigger/GSAP had
already written the frame's styles, so each subscriber's `getBoundingClientRect`
/ `scrollHeight` read forced a synchronous reflow of a ~15,000px document.
`WorkPreview.js` carries a prior session's DevTools-trace comment describing
this exact mechanism for its own read; the double-fire was applying it to
every subscriber on every frame.

Affected subscribers (all 8 users of `subscribeScroll`): `Nav` (isDarkUnderNav),
`StickyCta`, `SectionIndex`, `PopIllustration`, `WorkPreview`, `ScrollProgress`,
`ScrollVelocity`, `CollapseOnScroll`. Plus `emitNative` itself calling
`nativeLimit()` → `scrollHeight` on every native tick.

## HOW IT WAS FOUND

Previous session's minified stack sampling showed a suspicious exact 348/348
split of `getBoundingClientRect` callers into two paths. Attributed then,
wrongly, to ScrollTrigger double-updating (tested, null result, reverted). This
session ran the same harness against the **Vite dev server** (unminified), and
the two paths resolved to `Array.handler (motion.js) <- Emitter.emit (lenis)`
and `emitNative (motion.js)` — same subscriber, two entry points, e.g.
`SectionIndex.js:122` ~90x via Lenis and ~84x via native; `PopIllustration.js:46`
24/24; `StickyCta.js:61` scrollHeight 21/18.

## THE FIX (`lib/motion.js`, `subscribeScroll`)

Wrap the native scroll listener: `onNativeScroll` bails when `lenisOff` is set
and `window.__lenis` is live, otherwise delegates to `onNative`. The `resize`
listener and the initial `emitNative()` are deliberately untouched — Lenis's
`resize()` does not emit `scroll`, so subscribers still need the resize-driven
re-emit for `limit`/height changes. If Lenis is ever destroyed the gate reopens
(`window.__lenis` null) and native resumes as the fallback. 14 lines added,
2 changed.

## VERIFICATION

Correctness gate (dev server, HMR-applied, frame-rate independent): rect calls
via `emitNative` **72 → 0**; `nativeLimit` scrollHeight reads **36 → 0**; all
subscribers still fed by Lenis (progress bar `scaleX(0.74)`, nav
`--scrolled --dark`, sticky CTA mounted, `--scroll-dir` set).

Frame-accurate before/after — **same bench, same width (1440×900), same bundle
type**: a pre-fix production bundle was built from `HEAD`'s `motion.js` into
the scratchpad and served on :3102; the patched production bundle on :3101.
Identical harness: 80 synthetic wheel ticks @50ms + 1.5s settle, real
`PerformanceObserver` longtask entries, instrumented `getBoundingClientRect`.

| | pre-fix (:3102) | patched (:3101) run 1 | patched run 2 |
|---|---|---|---|
| `getBoundingClientRect` calls | 3,722 | 2,163 | 2,302 |
| time inside those calls | **977 ms** | **97 ms** | **62 ms** |
| long tasks (>50ms) | **65** | **5** | **3** |
| total main-thread blocked | **4,641 ms** | **391 ms** | **213 ms** |
| worst single task | 172 ms | 184 ms (scene init) | 99 ms |
| caller shape | 2 equal paths (1371 / 1320) | 1 path | 1 path |

~10x less forced-layout time, ~12–20x less main-thread blocking, and the rect
reads themselves drop from ~0.26 ms to ~0.03–0.045 ms each — i.e. layout is no
longer dirty when they run. `framesOver20ms` stayed high on *both* sides
(146 vs 154–157 of ~155–200): that is headless Chromium software-rendering the
two WebGL scenes every frame, a constant floor on this bench that this change
does not touch and a real GPU does not have.

Post-scroll pin check on the patched bundle: `.pin-spacer` present, all five
stages (01 AUDIT … 05 SCALE) in the DOM, console shows only the two expected
`/api` 500s from `vite preview` having no backend — **no new errors, and no
`removeChild`**. `npm run lint` clean, `npm run build` clean (56 pages).

## BENCH NOTES (why this took three browsers)

- In-app Browser pane: `document.hidden === true`, 0 frames — `get_layout`
  confirmed this session was not open in any window, so its rAF was paused.
- chrome-devtools MCP page: `hidden:false`, `hasFocus:true`, yet 2–8 rAF frames
  per second even after `bringToFront` — an occluded/starved window; unusable
  for frame work, and its `performance_start_trace` produced no insights for a
  scroll-only (no-navigation) recording.
- Playwright (headless Chromium): 62 fps self-check passed → used for all
  frame-accurate numbers above, with the software-WebGL caveat noted.

## NOT CHANGED, ON PURPOSE

`SectionIndex` still reads ~8 rects per frame (one per section) and
`PopIllustration` one per instance — now ~0.4 ms/frame total with clean
layout, not worth a second file under "touch nothing else". Lenis `lerp`
(0.16) / `wheelMultiplier` (1.2) from the previous session left as is.

## COMMITS

- (this session) perf(scroll): stop subscribeScroll double-firing every subscriber

## SCROLL FLOW FIX STATUS: COMPLETE

---

# PHASE B — AWS ARCHITECTURE PREPARATION

Repo-side only. **No AWS resources created, no DNS touched, nothing deployed.**
Full detail lives in `AWS_PREP.md`; this is the summary.

Target architecture: Amplify Hosting (frontend) + App Runner (backend) +
MongoDB Atlas, with `hianzy.com` / `www.hianzy.com` → `api.hianzy.com`.

## HEADLINE FINDING: THE BACKEND NEEDS NO CODE CHANGES

The existing architecture is already AWS-compatible. Everything that differs
between Vercel and AWS is a **configuration value**, not code:

| Concern | Mechanism already in place | AWS value |
|---|---|---|
| API base URL | `REACT_APP_BACKEND_URL` (already in `envPrefix`) | `https://api.hianzy.com` |
| CORS | `CORS_ORIGINS` env var, wildcard actively refused | `https://hianzy.com,https://www.hianzy.com` |
| Cookies | `COOKIE_SECURE` / `COOKIE_SAMESITE`, validated at import | `true` / `none` (cross-subdomain) |
| Seeding | `IS_SERVERLESS` gate | `VERCEL` unset on App Runner → seeds normally, which is correct |
| Health check | `/api/health` (DB ping → 200 or 503) | used as-is by App Runner |
| Container | `backend/Dockerfile` — 3.12-slim, non-root, `0.0.0.0:8000` | passes App Runner audit unchanged |

## FILES ADDED

| File | Purpose |
|---|---|
| `amplify.yml` | Amplify build spec (B2) |
| `customHttp.yml` | Security headers for Amplify (B2) |
| `backend/.env.aws.example` | Production env reference for App Runner (B7) |
| `AWS_PREP.md` | Full B1–B15 documentation |
| `.gitignore` | one line: un-ignore `.env.aws.example` |

## TWO REAL ISSUES CAUGHT DURING THIS PHASE

1. **CSP would have blocked every API call.** Vercel's CSP ends
   `connect-src 'self'`, which is correct only while frontend and API share an
   origin. On AWS they do not. `customHttp.yml` sets
   `connect-src 'self' https://api.hianzy.com`. Missing this would have
   produced a fully rendered site whose every API call failed in the browser.
2. **A first draft of `amplify.yml` was wrong and was fixed before commit.**
   It used `cd frontend && npm run build` followed by a root-relative
   `cp -r frontend/lab …`. Within an Amplify phase the working directory
   persists between commands, so that second path would have resolved to
   `frontend/frontend/lab` and failed the build. Rewritten using Amplify's
   documented `applications` / `appRoot: frontend` monorepo format, which
   removes the ambiguity and makes every path match `vercel.json` 1:1.

## B1 — VERCEL WORK CLASSIFICATION (summary)

- `vercel.json` — **VERCEL ONLY, retire before AWS deploy.** Deliberately
  *kept* for now: Vercel is still the live fallback and no AWS resource exists.
- `IS_SERVERLESS` in `server.py:52` — **KEEP**, platform-independent and
  already does the right thing on App Runner.
- `REACT_APP_BACKEND_URL` — **KEEP**, only the value changes per platform.
- `backend/Dockerfile`, `/api/health` — **KEEP**, already App Runner-ready.

## OWNER ACTIONS (B3, B12, B13, B14, B15 — nothing Claude can or should do)

1. Amplify Console → add the SPA catch-all rewrite (exact rule in `AWS_PREP.md` §B3).
2. Amplify Console → set `REACT_APP_BACKEND_URL=https://api.hianzy.com`.
3. Secrets Manager → create `MONGO_URL`, `RESEND_API_KEY` (+ `SMTP_PASS` if used).
4. MongoDB Atlas → create the production cluster and connection string.
   **Not fabricated or guessed here.**
5. DNS → only after both services are live and healthy on their temporary URLs.

## PHASE C — VALIDATION

| Check | Result |
|---|---|
| `npm run lint` | PASS — clean |
| `npm test` (vitest) | PASS — 8/8 |
| `npm run test:build` | PASS — 6/6 |
| `npm run build` | PASS — 56 pages, 682.72 KB raw / 231.45 KB gzip main JS |
| `pytest tests/test_api.py` | PASS — 60/60 |
| `amplify.yml` / `customHttp.yml` YAML parse | PASS |
| `cp -r lab build/lab` (appRoot-relative) | PASS — verified against the real tree |
| Docker stack | PASS — `web`, `api`, `mongo` all healthy |
| Live browser sweep | PASS — `/`, `/work`, `/network`, `/insights`, `/contact`, `/lab/` all render real content; only the pre-existing anonymous `auth/me` 401 pattern in console |

Two test-environment notes, neither a code defect: `pytest` needs Mongo on
`127.0.0.1:27117` (the dev compose Mongo is unpublished), so a disposable
`mongo:7` container was run on that port for the suite and removed afterwards;
and pytest's default Windows temp dir is permission-denied on this machine, so
`--basetemp` was pointed at the scratchpad.

## PHASE D — CLEANUP

Nothing to remove. No real secrets in any new file (the only `mongodb+srv://`
strings are `user:pass@cluster0.xxxxx` placeholders). Only `.example` env files
are tracked. `.vercel/` is untracked, gitignored, and holds nothing but a local
build cache.

## PHASE B STATUS: COMPLETE — STOP GATE REACHED

Nothing pushed, nothing merged, no AWS resource created, no DNS touched.

---

# FINAL INDEPENDENT AUDIT

Independent review of the repo's launch readiness, including this session's own
work. Severity is release-candidate style.

## BLOCKER

**B-1 — CI fails today: `check_frontend_lock.py` is stale by 100+ files.**
`.github/workflows/check.yml` runs `python scripts/check_frontend_lock.py` on
every push. It currently fails: `docs/frontend-source-lock.json` was last
updated 2026-09-16 (`54886e4`), while frontend source changed through
2026-09-19 (`616cfc8`). Every session since — Orbit, ecosystem pages, search,
typography, the Part 28A fixes — drifted from the lock.

*Not caused by this session:* Phase A changed no code and Phase B touched only
root-level files; `git status frontend/` is empty, and `.gitignore` does not
appear in the failure list (the lock's `.gitignore` key is `frontend/.gitignore`,
which is untouched).

This blocks the GitHub → AWS flow documented in B13, which names CI as the gate
before merge to `main`.

**Deliberately not auto-fixed.** Regenerating the lock would rubber-stamp 100+
files nobody reviewed, which defeats the only thing the lock exists to do. The
owner should diff the drift, confirm every change is intended, and only then
regenerate.

**B-2 — The lock can never pass after a build.** `frontend/public/sitemap.xml`
is *in* the lock, but `npm run build`'s `prebuild` step regenerates it with the
current date. Any build dirties a locked file. Even a correct regeneration of
B-1 goes stale the next time anyone builds. The lock needs to exclude generated
artifacts (`public/sitemap.xml` at minimum) or B-1 will keep recurring.

## HIGH

**H-1 — A naive Amplify SPA rewrite would silently destroy prerendered SEO.**
Full detail in `AWS_PREP.md` §B3. A blanket extensionless→`/index.html` 200
rewrite shadows `work.html` and serves the SPA shell; the page looks right to a
human while crawlers get generic metadata on all 56 pages, with no error
anywhere. Guidance and a view-source test are documented — **but the behavior is
unverified against a live Amplify app.** Treat the §B3 test as a launch gate.

**H-2 — MongoDB Atlas network access for App Runner is unsolved.** App Runner's
default egress IPs are not static, so there is no stable Atlas allowlist. The
tempting fix — allowing `0.0.0.0/0` in Atlas — exposes the database to the
internet behind nothing but credentials. The correct fix is a VPC connector plus
a NAT Gateway with an Elastic IP, which is infrastructure not yet planned or
costed. Decide before creating the cluster; retrofitting means re-networking a
live service.

**H-3 — `customHttp.yml` monorepo syntax is not fully verified.** AWS states
monorepo custom headers use a specific YAML format; the canonical reference page
could not be retrieved. `appRoot: frontend` was added to every entry based on
the documented monorepo requirement and the CDK `CustomResponseHeader` contract
(`appRoot` + `pattern` + `headers`). If the shape is still wrong the headers do
not apply and CSP, `X-Frame-Options` and the rest silently vanish — with a
green build. Diff against the Console's own downloaded `customHttp.yml` at
setup.

## MEDIUM

**M-1 — Dual-deploy risk.** `vercel.json` is intentionally retained (Vercel is
the live fallback). If both Vercel and Amplify are connected to the repo, both
build on every push to `main`. Cutover needs an explicit step: disconnect
Vercel, or confirm the intent to run both.

**M-2 — App Runner config is not in code.** B5/B6 describe port, health check
and env vars as Console settings. There is no committed `apprunner.yaml`, so
the service is not reproducible from the repo. Acceptable for a first manual
deploy; worth committing once the shape is settled.

**M-3 — Cross-subdomain auth is untested end-to-end.** `SameSite=none; Secure`
is correct and validated at import, but no cookie has actually crossed
`hianzy.com` → `api.hianzy.com` yet. The pre-existing P2 (auth points at a
third-party scaffold host) is still unresolved and is the likelier problem.

## LOW

**L-1 — `removeChild` NotFoundError on rapid route changes.** GSAP
ScrollTrigger pin-spacer cleanup racing React unmount in `PinnedSequence.js`.
Pre-existing, non-fatal, only reproducible at ~4 routes in 8s. Left alone.

**L-2 — Bundle sizes exceed Vite's 500 KB warning.** `react-three-fiber`
805 KB, main index 683 KB. Inherent to the locked 3D product; not actionable
under the freeze. Noted so it is a decision, not an oversight.

**L-3 — Local test friction.** `pytest` expects Mongo on `127.0.0.1:27117`
but compose leaves Mongo unpublished, so a disposable container is needed; and
pytest's default Windows temp dir is permission-denied here, needing
`--basetemp`. CI is unaffected. A documented `TEST_MONGO_URL` or a published
dev port would remove the trap.

## INFORMATIONAL

**I-1 — Phase A correctly produced zero code changes.** The one candidate was
examined and rejected as speculative. Recorded so the absence of a diff reads
as a decision rather than an omission.

**I-2 — The backend needs no code changes for AWS.** Every Vercel/AWS
difference is a configuration value. `IS_SERVERLESS` already does the right
thing on App Runner.

**I-3 — Anonymous `401` on `/api/auth/me`** on every page load. Expected,
documented as P2, unchanged.

---

# FABLE-5 — FINAL PRODUCT COMPLETION

Ran 2026-09-22/23 on `launch/step-1` from `62216dc`. Eleven focused commits;
full audit in `docs/FINAL_PRODUCT_AUDIT.md`; verification log in
`LAUNCH_TESTS.md` (FABLE-5 TEST LOG).

## WHAT LANDED

- `98a7c8b` feat(insights): establish marketing knowledge encyclopedia — 20
  evergreen entries + 10 notes on `/api/insights`, eight topics, related graph,
  encyclopedia renderer (TOC, inline cross-links, GO DEEPER, NEXT TOPICS,
  Article/BreadcrumbList/FAQPage JSON-LD), RelatedReading on service,
  discipline, case-study and roster pages, snapshot regenerated, tests.
- `a3825ef` feat(search): connect section-level knowledge destinations —
  topic hubs and entries indexed; a destination-path tier so "contact" and
  "coming soon" resolve.
- `b135a9d` feat(content): complete missing public destinations — the six
  Orbit roster pages linked as plain links from Work and Network.
- `29c2614` docs(links): link-graph inventory (`frontend/scripts/link-graph.cjs`,
  `docs/FINAL_LINK_GRAPH.md`): 76 pages, 178 links, 0 broken, 0 orphans.
- `b4c243f` fix(ui): revert the pin before React removes the pinned section —
  L-1 below is closed: reproduced deterministically (viewport across 640px)
  and fixed structurally, no try/catch.
- `b77ba88` feat(seo): stabilise sitemap lastmod on content fingerprints —
  B-2 below is closed: a build moves lastmod only for pages whose fingerprint
  moved; snapshot fallback when the API is unreachable.
- `7436f5c` fix(ui): give every API-backed surface a visible failure state —
  RouteErrorBoundary, retry states, auth fetch deadlines, palette recovery;
  verified under a controlled API outage.
- `70d0e1a` docs(aws): finalize production architecture — ADR-002 (Proposed):
  Amplify + App Runner (ECR) + Atlas with conditions; H-2 decided (VPC
  connector + NAT + Elastic IP), H-1 documented as a 404-200 rule plus a
  launch gate.
- `35d619f` chore(aws): align deployment configuration — customHttp.yml now
  uses the monorepo shape from the AWS custom-header YAML reference (H-3
  closed); amplify.yml, backend/.env.aws.example and AWS_PREP.md corrected.
- `14a6392` fix(ci): establish deterministic frontend freeze — B-1 closed:
  every drift since `54886e4` traced in `docs/FRONTEND_FREEZE_AUDIT.md`, the
  checker classifies and regenerates (`--write`), 4 tests, lock regenerated
  (236 entries), CI runs the tests.
- docs(release): this record, the final audit and the regenerated link graph.

## FINAL INDEPENDENT AUDIT — STATUS AFTER FABLE-5

| Item | Status |
|---|---|
| B-1 stale lock | Closed (`14a6392`): traced, not blessed; CI lock step green |
| B-2 lock dirtied by every build | Closed (`b77ba88`, `14a6392`): generated outputs deterministic |
| H-1 Amplify SPA rewrite | Documented as the rule not to add; single `404-200` rewrite plus the §B3 launch gate (P1-2 in the final audit) |
| H-2 Atlas network access | Decided in ADR-002: VPC connector + NAT Gateway + Elastic IP, costed |
| H-3 customHttp.yml shape | Closed (`35d619f`): verified against the AWS reference, launch check kept |
| M-1 dual deploy | Open, ordered into the ADR-002 cutover (P2-4) |
| M-2 App Runner config not in code | Open (P3-4) |
| M-3 cross-subdomain auth | Open, tied to the sign-in decision (P2-1) |
| L-1 removeChild | Closed (`b4c243f`) |
| L-2 bundle sizes | Open, inherent (P3-3) |
| L-3 local test friction | Documented recipe (disposable Mongo on 27117, `TEST_MONGO_URL`, `--basetemp`) |
| I-3 anonymous 401 on `/api/auth/me` | Unchanged, P2-1 |

## STOP GATE

Not merged to `main`, not pushed, no AWS provisioned, no DNS change, no
`hianzy.com` attachment, no production Mongo data, no credential anywhere in
the tree. Next exact action is the owner's: review and `git push origin
launch/step-1`.

## FABLE-5 STATUS: COMPLETE — STOP GATE REACHED

---

# POST-FABLE DELTA CLOSEOUT

2026-09-23, after the FABLE-5 record above. Not a development phase: four
code commits reconciled and validated, the remaining AWS P1 closed in code,
and the branch prepared for GitHub. Full detail in
`docs/FINAL_PRODUCT_AUDIT.md`, "POST-FABLE DELTA".

- `20de858` fix(ui): Orbit deck wrapper no longer clips the raised card
  (`overflow-x: clip`); verified at seven widths on five pages.
- `57e275d` chore(seo): the `/work` sitemap fingerprint moved with that file;
  nothing else moved.
- `9a900bb` fix(api): `client_ip()` trusts `x-forwarded-for` only behind the
  proxy `TRUSTED_PROXY` names (rightmost hop for App Runner, first for
  Vercel), with regression tests. Closes FABLE-5 P1-1.
- `52e3b69` fix(ui): hash destinations stay in view while content above them
  loads; `/work#orbit` no longer lands 1000px short.

Scroll regression gate: PASS (single dispatch confirmed, native fallback and
reduced motion verified, long tasks 7 and 513 ms blocked on the accepted
harness versus 65 and 4,641 ms pre-fix). Source lock: 236 files verified.
Sitemap: zero churn on rebuild. Link graph: 76 pages, 178 links, 0 broken,
0 orphans. Routes: 20 hard refreshes green on the rebuilt Docker stack.

CODE READY: YES. LIVE AWS VERIFIED: NO (no infrastructure exists).

## POST-FABLE DELTA STATUS: COMPLETE — READY FOR GIT PUSH
