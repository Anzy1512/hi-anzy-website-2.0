# LAUNCH TESTS

Statuses: `NOT RUN` · `PASS` · `FAIL` · `BLOCKED`

A status is only ever `PASS` if it was actually executed against this repo,
this session. All rows below are `hi-anzy-website-2.0` on `launch/step-1`.

## BUILD / CI
| Check | Status | Note |
|---|---|---|
| `npm run build` | PASS | includes postbuild prerender-metadata, 56 pages |
| `npm test` (vitest) | PASS | 8/8, 3 files |
| `npm run lint` | PASS | clean, no output |
| `npm run test:build` | PASS | 6/6 (sitemap generation tests) |
| `pytest tests/test_api.py` | PASS (58/59) | real Mongo 7 container on :27117, matching CI. 1 error is a Windows-only pytest tmpdir permission issue, not a code defect — doesn't occur on CI's Ubuntu runner |
| GitHub Actions `check.yml` (actual CI run) | NOT RUN | not triggered this session; local runs matched CI's own commands exactly |

## DEPLOYMENT (re-audited — architecture corrected from legacy builds/routes to Services)
| Check | Status | Note |
|---|---|---|
| `vercel.json` present | PASS | |
| `vercel.json` JSON syntax valid | PASS | re-validated after rewrite to `services` model |
| Services architecture verified against current official docs, not assumed | PASS | fetched `vercel.com/docs/services`, `/services/routing`, `/services/config-reference` live |
| Referenced paths exist (`frontend/`, `backend/`, `backend/server.py`, `backend/requirements.txt`) | PASS | |
| `vercel dev -L` detects both services from config | PASS | printed `frontend [Vite]`, `backend [FastAPI]` — real CLI output, not inferred |
| Full local `vercel dev -L` boot | BLOCKED | local machine's Python 3.11 vs. the CLI's own tooling requiring ≥3.12 — a local-tooling limitation, not a config defect; doesn't reflect Vercel's actual cloud Python version |
| `vercel build`/deploy against a real linked project | BLOCKED | requires `vercel link` with the owner's Vercel account, and "Services (Beta)" + dashboard Framework Preset set to Services |
| `/api/*` path-preservation traced against documented routing table | PASS | docs explicitly confirm the backend receives the full original path (`/api/users` stays `/api/users`), matching `APIRouter(prefix="/api")` exactly — no code change, no `/api/api` duplication |
| SPA/prerendered-HTML routing (`cleanUrls`) | NOT RUN (real deploy) | reasoned from documented `cleanUrls` semantics + this project's existing prerendered `.html`/`404.html` files; not blindly copied from generic Vite-SPA advice, which would have regressed the prerender mechanism |
| Experience Lab present in the Vercel-served output | NOT RUN (real deploy) | traced that Vite's build never touches `frontend/lab/` (outside its `public/` convention) and would omit it; added a scoped `buildCommand` copy step as the fix — reasoning verified, execution needs a real deploy |
| Mongo connection from Vercel's network | NOT RUN | needs production Mongo URI (owner action) |

## DOCKER (local parity check — not the production deploy target)
| Check | Status | Note |
|---|---|---|
| `docker compose up --build web api` | PASS | all three containers healthy |
| `GET /` (web :8080) | PASS | 200 |
| `GET /lab/` | PASS | 200 |
| `GET /lab/index.html` | PASS | 200 |
| `GET /api/health` | PASS | 200 |
| `GET /api/insights` | PASS | 200, 10 items |
| `GET /api/case-studies` | PASS | 200, 5 items |
| `GET /api/ecosystem?category=built_here` | PASS | 200, 3 items |

## CONTENT REGRESSION GATE
| Check | Status | Note |
|---|---|---|
| `seed_data.py` counts (case studies, network, insights, portfolio) | PASS | 5 / 35 / 10 / 8, matches known-good baseline |
| `ECOSYSTEM_ITEMS` derivation | PASS | 35 items, 6 categories, correct counts each |
| `/work/built-here`, `/work/built-together` routes wired | PASS | confirmed in `App.js` |
| `/network/*` category + discipline routes wired | PASS | confirmed in `App.js`, no slug shadowing |
| Placeholder/empty-state check | PASS | none found — all categories have real counts |

## SYSTEMS
| Check | Status | Note |
|---|---|---|
| CommandPalette retry after failed import | **FAIL → FIXED, Step 2** | Step 1's fix (`defd3da`) was code-correct but incomplete; live re-verification with a real forced 404 (renamed the served chunk) showed retry still failed. Root cause: the browser's module registry permanently caches a rejected import per URL. Fixed with a real `window.location.reload()` on retry (`fe783da`), re-verified end to end with the same forced-404 technique — search works after the reload. |
| CommandPalette open/type/navigate (live browser) | PASS | open, focus, search filtering (verified against the real `searchCommands` output, not just DOM state), arrow-key navigation, close, reopen all correct |
| Contact form submit — valid | PASS | `POST /api/contact`, 200, real id returned |
| Contact form submit — invalid email | PASS | 422, clear Pydantic error |
| Contact form submit — missing required field | PASS | 422 |
| Contact form submit — message under min_length | PASS | 422 |
| Contact form submit — honeypot filled | PASS | 200 fake-success (`id:null`), no record created — correct anti-spam design |
| Contact rate limiting | PASS | 5 hits/10min enforced exactly, 6th+ gets a real 429 |
| Subscribe | PASS | `POST /api/subscribe`, 200 |
| Sitemap output | PASS | generated during build |
| CORS wildcard refusal | PASS | read directly in `server.py`, confirmed logic (refuses `*`, logs it) |
| Cookie security self-validation | PASS | read directly, confirmed raises on invalid `COOKIE_SECURE`/`COOKIE_SAMESITE` combinations |
| Security response headers | PASS | read directly, all present |

## ROUTES (live browser, Docker stack, real slugs pulled from the running API)
| Route | Status | Note |
|---|---|---|
| `/` | PASS | client nav + hard refresh both clean, only known 401 in console |
| `/what-we-do` | PASS | 12 service links found |
| `/what-we-do/business-audit-strategy` | PASS | real slug, real content |
| `/how-we-work` | PASS | |
| `/work` | PASS | |
| `/work/built-here` | PASS | 3 cards |
| `/work/built-together` | PASS | 2 cards |
| `/work/the-storefront-was-never-the-problem` | PASS | 19 detail sections |
| `/network` | PASS | |
| `/network/strategy` | PASS | real discipline slug |
| `/why-hi-anzy` | PASS | |
| `/insights` | PASS | 10 articles |
| `/insights/why-we-package-services` | PASS | hard-refresh deep link also verified — identical content, same known-benign console entries |
| `/contact` | PASS | form present, submits correctly (see SYSTEMS) |
| `/who-we-work-with` | PASS | |
| `/collaborate` | PASS | |
| `/careers` | PASS | |
| `/resources` | PASS | |
| `/coming-soon` | PASS | |
| `/lab/` | PASS | real landing content (16 realities index), zero console messages |
| Client-side nav chain (5 routes, no reload) | PASS | no errors, no stale state, homepage remounts correctly |

## MOBILE / BREAKPOINT SWEEP (live browser, exact-pixel viewport emulation)
| Width | Status | Note |
|---|---|---|
| 320 | PASS | no horizontal overflow, toggle shown, mobile menu opens with all 6 links |
| 375 | PASS | no overflow |
| 390 | PASS | no overflow |
| 430 | PASS | no overflow |
| 1179 | PASS | toggle-only (below 2.0's actual 1180 breakpoint) |
| 1180 | PASS | nav-only, no dead zone — but flush (0px gap) exactly at threshold, logged as P3 |
| 1391 | PASS | nav-only (not a boundary in 2.0 — see note below) |
| 1400 | PASS | nav-only, 98px gaps either side |
| 1440 | PASS | 116px gaps, comfortable |

Note on 1391/1400: these values matter for the *platform* repo's nav (fixed
to 1400 there). 2.0's own nav breakpoint was never changed from `1180` —
Step 1 correctly classified that fix as not applicable here. Tested anyway,
per the brief; both are safely above 2.0's real 1180 threshold, so both
correctly show the desktop nav with no dead zone. The actually relevant
boundary (1180) was tested directly and also shows no dead zone.

## ISDARKUNDERNAV THROTTLE VERIFICATION
| Check | Status | Note |
|---|---|---|
| Detection matches unthrottled ground truth | PASS | ran the exact untouched detection function directly (bypassing the throttle) at 12 points across the homepage's full 13,702px scroll height; throttled live behavior matched at every point |
| Visual nav appearance unchanged | PASS | |
| No stuck/delayed-incorrect state observed | PASS | |
| 3D/animation impact | NONE | change is a JS timing guard only, no CSS/GSAP/Three.js touched |

## WORKPREVIEW VERIFICATION
| Check | Status | Note |
|---|---|---|
| Card order preserved | PASS | real case-study slugs, correct order |
| Horizontal scroll sync | PASS | `scrollLeft` advances monotonically with scroll fraction (0→0→5→9 of 15px max) |
| Visual timing/imagery | PASS | unchanged — fix only moved *when* values are read, not what renders |

## EXPERIENCE GATE
| Item | Status |
|---|---|
| 3D objects changed | NO |
| 3D detail/quality reduced | NO |
| Three.js removed/replaced | NO |
| Primary hero 3D delayed | NO |
| Animations removed | NO |
| Animation timing changed | NO |
| GSAP choreography changed | NO |
| ScrollTrigger behavior changed | NO |
| Lenis feel changed | NO |
| Approved visual identity changed | NO (Hero backdrop is additive CSS behind an already-transparent canvas) |

Benign, non-error observation: a `console.log` (not warn/error) from Three.js's
own "WebGLRenderer: Context Lost" lifecycle logging fires on homepage→other-route
navigation, when its canvas unmounts. Normal WebGL cleanup, not a defect —
noted for completeness since it appeared during navigation testing.

## NOT YET RUN (deferred to later steps per the protocol's own priority order)
- Full GitHub Actions CI trigger (local runs matched CI's own commands exactly)
- Vercel cloud deploy (owner-side, in progress in parallel per this session's brief)
- SEO per-route metadata audit
- SEO per-route metadata audit

---

# STEP 3 — PERFORMANCE VERIFICATION

## MEASURED BEFORE/AFTER
| Metric | Before Step 3 | After Step 3 |
|---|---|---|
| Main JS bundle (raw / gzip) | 723.78kB / 243.31kB | 681.77kB / 231.14kB |
| Initial CSS (raw / gzip) | 136.16kB / 27.04kB | 96.84kB / 19.47kB |
| `ConnectedStory` + 3D model-explorer deps | shipped in main bundle (lazy split defeated by a static/dynamic import conflict) | genuinely deferred — own chunk, loads only on model-explorer open |
| `WhyHiAnzy` hero-adjacent image | 128KB PNG, `loading="lazy"` on an above-the-fold image | 30KB AVIF (via `Picture`), no lazy attribute |
| Critical heading font | discovered only after `fonts.css` downloads+parses | `<link rel="preload">`, first font request in network log |
| `@tanstack/react-query` | installed + `QueryClientProvider` mounted, zero real usage | removed |
| `Cache-Control` on `/auth/me`, `/subscribers`, `/contact-submissions`, `/operations/status` | absent (framework default) | `no-store`, verified live on both the 401 and a real 200 |

## LIVE VERIFICATION PERFORMED (not just code review)
- Network tab confirmed `ConnectedStory`/`BusinessFlowScene` chunks do not
  load until the homepage's model explorer is opened.
- Network tab confirmed `.avif` (not `.png`) loads for the `WhyHiAnzy`
  collage image; screenshot pixel-identical to pre-change.
- Network tab confirmed the preloaded font is the first font request; no
  "preload not used" console warning.
- Live-checked `/`, `/work`, `/network`, `/contact` after the react-query
  removal: zero new console errors (only the pre-existing, expected
  anonymous-visitor 401 from `/api/auth/me`).
- Rebuilt the `api` Docker container after the caching fix; inserted a
  throwaway session + user document directly into the local dev Mongo (not
  production data), hit `/api/auth/me` with that session cookie, confirmed a
  real `200 OK` response carries `cache-control: no-store`, then deleted the
  test rows. Also confirmed the 401 (unauthenticated) path and the untouched
  `/api/case-studies` (public) response.

## EXPERIENCE GATE — STEP 3
| Item | Status |
|---|---|
| 3D objects/geometry/materials/lighting changed | NO |
| Three.js scenes altered, removed, or re-initialized differently | NO — audited all 8 scene files; no loaded assets, no duplicate canvases, listeners already correctly paired |
| Animations, GSAP choreography, ScrollTrigger, Lenis feel changed | NO |
| Framer Motion timing changed | NO |
| Visual identity/layout/approved content changed | NO |
| Any visual regression observed during live verification | NO |

## REGRESSION CHECKS
| Check | Result |
|---|---|
| `npm run build` | PASS — build output sizes match expected before/after deltas above |
| `npm test` (vitest, 3 files) | PASS — 8/8 |
| `pytest tests/test_api.py` (59 tests) | PASS — 59/59 |
| Docker `api` rebuild | PASS — healthy |
| Public content endpoints unaffected by caching fix | PASS — `/api/case-studies` confirmed to carry no new headers |

## NOT DONE THIS STEP (explicitly out of scope or restraint-gated)
- `Home.js` was not converted to `lazy()` — investigated, deliberately left
  eager (see LAUNCH_STATE.md reasoning: would trade a loading-flash onto the
  majority of visits landing on `/`).
- `AuthContext.Provider`'s per-render value object was not memoized —
  investigated, blast radius is a single consumer with infrequent parent
  re-renders; memoizing would be exactly the "blanket memoize" the protocol
  says not to do.
- `ConnectedStory`'s unreachable render modes (`gap`/`services`/`method`/etc.)
  were not deleted — flagged as dead code, left as-is (outside this pass's
  risk tolerance for an already-twice-touched file).
- Full CI trigger on GitHub

---

# PART A — VERCEL BACKEND RUNTIME HARDENING

## HOW THE SERVERLESS PATH WAS TESTED
The serverless branch cannot be proven by reading the diff, so the app was
booted exactly as Vercel would boot it — `VERCEL=1` set, against an isolated
throwaway database — and asserted on. Every line below was executed.

| Assertion | Result |
|---|---|
| `VERCEL=1` detected (`IS_SERVERLESS is True`) | PASS |
| Mongo pool capped on serverless (`max_pool_size == 10`) | PASS |
| App boots and serves `/api/health` → 200 | PASS |
| Startup did **not** seed (0 case studies, 0 insights after boot) | PASS |
| Startup started **no** background workers (`_prune_rate_limiter_loop`, `notification_loop` absent from running tasks) | PASS |
| `client_ip` uses first hop of `x-forwarded-for` when on Vercel | PASS |
| `client_ip` falls back to the socket peer when the header is absent/blank | PASS |
| Explicit `seed()` still populates on demand | PASS — 5 case studies, 35 network resources, 10 insights, 8 portfolio groups, 35 ecosystem items |

This also quantified what the change avoids on every cold start: **93 seed
documents plus 9 index creations** worth of round trips, on a write path.

## NON-SERVERLESS (DOCKER) PATH — UNCHANGED
| Check | Result |
|---|---|
| `api` container rebuilt and healthy | PASS |
| `/api/health` → `{"status":"ok","db":"connected"}` | PASS |
| Still seeds automatically at startup (no serverless log line) | PASS |
| Content endpoints still serve real data (`/api/case-studies`, `/api/ecosystem?category=built_here`) | PASS |
| `manage.py seed` runs and reports counts | PASS — 5 / 35 / 10 / 8 / 35 |

## CLIENT IP REGRESSION TEST (permanent)
Added `test_client_ip_trusts_the_forwarded_header_only_on_vercel`, asserting
**both** directions — trusting the header off-platform would let anyone rotate
it past the rate limit; trusting it nowhere would bucket every Vercel visitor
into one shared global limit. Both failure modes are silent, so both are
pinned by the test.

## EMAIL
No real email was sent at any point. Mail was left unconfigured throughout, so
`mail_configured()` was false and delivery was skipped — which is itself the
verification that the app boots and accepts enquiries without credentials.

## PRODUCTION DATA
None touched. All backend testing ran against the local Docker database or an
isolated `hianzy_sl_*` / `hianzy_test_*` database that was dropped afterwards.

---

# PART B — STEP 4 VERIFICATION

## HOW THE VERCEL MODEL WAS SIMULATED LOCALLY
Vercel itself could not be deployed to (owner blocker), so the real production
build was served through a local stand-in that reproduces the parts that
matter: same-origin `/api` proxying (as the rewrite does), `cleanUrls`
resolution, and the **exact headers parsed out of `vercel.json`** so the test
cannot drift from the committed config. Controls were run on the same build
with headers removed, and with the existing nginx CSP, to isolate cause.

## ROUTE + METADATA SWEEP (19 routes, real slugs)
| Check | Result |
|---|---|
| All 19 public routes return 200 | PASS |
| Each serves its **own** prerendered title (not a generic shell) | PASS |
| Canonical matches the route on every page | PASS |
| 6 Open Graph tags per page | PASS |
| 4 Twitter tags per page | PASS |
| Real H1 present | PASS |
| `/lab/` serves the Experience Lab's own app | PASS — title "Hi Anzy — Experience Lab", own bundle, real content |
| Unknown path returns 404 with the 404 page | PASS |
| JSON-LD present in the DOM at runtime | PASS — `/contact` carries `ProfessionalService` + `ContactPage` |
| No invented ratings/testimonials/awards/clients/addresses | PASS — `sameAs` left commented, as the source already intended |

## SITEMAP / ROBOTS
| Check | Result |
|---|---|
| 56 URLs, all `https://hianzy.com` | PASS |
| No duplicate URLs | PASS |
| No Lab or internal paths | PASS |
| Correct dynamic slugs | PASS |
| `Sitemap:` points at the production domain | PASS |
| No accidental global `Disallow` | PASS |
| No staging/debug paths exposed | PASS |

## SECURITY HEADERS / CSP (A5, verified in the browser)
| Check | Result |
|---|---|
| All five headers present on HTML and assets | PASS |
| Homepage mounts under the new CSP | PASS |
| All three homepage canvases initialise (Three.js runs under `script-src 'self'`, no `unsafe-eval`) | PASS |
| GSAP inline styles work (`style-src 'unsafe-inline'` retained) | PASS |
| Same-origin `/api` calls succeed under `connect-src 'self'` | PASS |
| `/lab/` runs under the same CSP | PASS — zero console errors |
| No CSP violation reported on any route | PASS |
| Control: same build, headers removed | Identical behaviour — confirms the policy degrades nothing |
| Control: same build, existing nginx CSP | Identical behaviour |
| Vercel CLI 59.23.1 parses the config with the new `headers` block | PASS — `Detected services: frontend [Vite], backend [FastAPI]` |

## STEP-3 VISUAL REGRESSION GATE
| Check | Result |
|---|---|
| Initial CSS is only `fonts.css` + `index-*.css` before the model explorer opens | PASS |
| `ConnectedStory-*.css` loads **when** the explorer opens | PASS |
| Story UI is actually styled, not just loaded (`.story-home` → `position: relative`) | PASS — no FOUC |
| `.story-mini-object` present and styled (the rules duplicated into App.css) | PASS |
| 4th canvas appears only on open — lazy split still holds | PASS |
| Home / What We Do / Work / Network / Why hiAnzy mount with real H1s | PASS |
| Zero broken images across those routes | PASS |
| Why hiAnzy serves `art-cube-head.avif` with no `loading` attribute | PASS |
| Dark theme applies correctly | PASS |
| No horizontal overflow on any route checked | PASS |

## MOBILE / BREAKPOINT
| Width | Overflow | Nav | Result |
|---|---|---|---|
| 320 | none | mobile toggle | PASS |
| 375 | none | mobile toggle | PASS |
| 390 | none | mobile toggle | PASS |
| 430 | none | mobile toggle + menu opens (6 items + Say Hi) | PASS |
| 1179 | none | mobile toggle | PASS |
| 1180 | none | desktop nav | PASS |
| 1182 | none | desktop nav, 6 links | PASS |
| desktop | none | desktop nav | PASS |

**No dead zone** — exactly one navigation visible at every width tested.

## CONSOLE / NETWORK
| Check | Result |
|---|---|
| Failed chunks / fonts / images / CSS | NONE |
| Duplicate API requests on a clean load | NONE — exactly 2 calls, 1 each |
| CSP violations | NONE |
| CORS issues (same-origin model) | NONE |
| Anonymous `/api/auth/me` 401 | Expected, not a defect |
| React `removeChild` NotFoundError | **Observed intermittently — see below** |

### The one unresolved observation
A React `NotFoundError: Failed to execute 'removeChild'` appeared twice in the
browser pane: on its very first cold load, and once when `/lab/` fell through
to the SPA 404 (because a bare `npm run build` had cleared `build/lab`).

Investigated rather than assumed:
- **Not the CSP.** Fresh tabs with the new CSP load clean; the error never
  appeared on the no-CSP control or the nginx-CSP control.
- **Not reproducible on demand** — repeated fresh loads of `/`, `/contact`,
  `/work` and two 404 routes were all clean.
- **Not fatal** — in every instance where mount state was measured afterwards,
  the app was mounted and rendering normally.

Recorded as an open P3 for the independent review rather than being written
off. Screenshots could not be used to corroborate visually: the browser pane
repeatedly failed to capture (it reports the page may not draw while the
window is behind another), so all visual conclusions here come from DOM and
computed-style inspection, which is more precise for CSS/FOUC questions
anyway. Pixel-level visual confirmation is therefore **NOT RUN**.

---

# PART C — FINAL VALIDATION (all executed)
| Command | Result |
|---|---|
| `npm run lint` | **PASS** — clean, exit 0 |
| `npm test` (vitest) | **PASS** — 8/8, 3 files |
| `npm run test:build` | **PASS** — 6/6 |
| `npm run build` | **PASS** — **56 public HTML pages generated**, expected chunk sizes |
| `pytest tests/` | **PASS** — 60/60 (59 existing + 1 new client_ip test) |
| `vercel dev -L` config parse | **PASS** — both services detected |
| `vercel` full local boot | **BLOCKED** — local Python 3.11.16 vs `vercel-runtime` requiring 3.12+. Local toolchain only; Vercel builds with its own Python. |
| Real Vercel cloud deploy | **BLOCKED — OWNER** (Services Beta + project link) |
| Pixel-level visual screenshots | **NOT RUN** — browser pane could not capture reliably |

# EXPERIENCE GATE — PARTS A + B
| Item | Status |
|---|---|
| 3D objects / geometry / materials / lighting changed | NO |
| 3D quality reduced | NO |
| Three.js scenes altered | NO — no file under `components/three/` touched |
| GSAP choreography / ScrollTrigger / Lenis feel changed | NO |
| Animation timing changed | NO |
| Framer Motion changed | NO |
| Approved layout / content / visual identity changed | NO |
| Frontend source changed at all | NO — the only frontend-affecting change is response headers declared in `vercel.json` |
