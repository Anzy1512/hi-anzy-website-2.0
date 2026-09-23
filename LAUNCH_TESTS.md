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

---

# STEP 6 — FINAL PRODUCT COMPLETION VERIFICATION

## SEARCH
| Check | Status | Note |
|---|---|---|
| Case studies indexed | PASS | verified in prior turn, re-confirmed |
| Insights indexed | PASS | |
| Network/ecosystem profiles indexed | PASS | built_here/built_together deliberately excluded — duplicates of already-indexed case studies |
| No private/admin routes in index | PASS | dynamic sources are all public GET endpoints only |

## SECTION ANCHORS
| Anchor | Status | Note |
|---|---|---|
| `/what-we-do#build` | **FAIL → FIXED** | landed ~5876px short before fix (font-swap reflow after initial measure); now lands 96px below nav |
| `/what-we-do#packages` | PASS | unaffected, already correct |
| `/resources#privacy` | PASS | |
| `/resources#terms` | PASS | |
| `/work#orbit` (new) | PASS | added; "Back to the Orbit" now reaches the actual section |

## SITE-WIDE LINK AUDIT
| Category | Result |
|---|---|
| CTA label/destination mismatches | 0 found (~60 CTAs traced) |
| Hardcoded broken internal links | 0 found |
| Missing/inappropriate alt text | 0 found |
| Placeholder/lorem/unfinished copy | 0 found (one non-user-facing TODO: Seo.js sameAs, pre-existing/documented) |

## INSIGHTS
| Check | Status | Note |
|---|---|---|
| All 10 published articles searchable | PASS | |
| Category filter URL-synced | PASS | `?category=...`, verified round-trip in prior turn |
| Related-content orphans | 1 of 10 (down from 7 of 10) | "The Problem Behind the Problem" — sole member of its category; not force-linked, per explicit instruction not to fabricate a relationship |
| New articles created | 0 | no candidate assemblable from existing material without inventing facts |

## TYPOGRAPHY
| Check | Status | Note |
|---|---|---|
| `var(--font-display)` undefined in portfolioWall.css | **FAIL → FIXED** | 5 occurrences corrected to `var(--font-system)`; verified live, computed font now Rajdhani |
| Font file ↔ @font-face mapping | PASS | 22 files, 22 rules, 1:1, no 404 risk, no unreferenced files |
| `font-display: swap` on all faces | PASS | 22/22 |
| Preload matches hero H1's actual font | PASS | rajdhani-600-normal-latin.woff2 |
| Fallback stacks end in a safe generic | PASS | all 3 `--font-*` tokens |
| Cross-page heading/body font consistency | PASS | 8 representative pages checked |
| App.css stale comment (Figtree) | FIXED | comment-only, no behavior change |
| tailwind.config.js editorial=Figtree drift | FIXED | corrected to Newsreader; was dormant (App.css always wins), no rendered change |

## WORK / NETWORK UI RE-AUDIT
| Check | Status |
|---|---|
| Portfolio Wall diagrams (color, not black) | PASS |
| Portfolio Wall label spacing | PASS |
| Portfolio Wall font (post-fix) | PASS — verified `Rajdhani, ...` computed |
| Orbit deck fan/tilt/drag/lift | PASS — unchanged |
| Orbit overflow fix (prior turn) | PASS — re-verified at 375/1180/1440 |
| Network constellation/accordions/filters | PASS |
| ConnectedStory unaffected | PASS — `.story-home` position/font both correct |
| No page-wide horizontal scrollbar | PASS |

## SCROLL PERFORMANCE
| Item | Action |
|---|---|
| MagneticButton uncached rect-per-mousemove | FIXED — cached on enter, mirrors MotifFrame's proven pattern |
| CardCarousel/PopIllustration read/write interleave | Investigated, not changed — opacity/transform don't invalidate layout, no measurable benefit to reordering |
| CollapseOnScroll sitewide querySelectorAll on scroll | Investigated, not changed — small real cost, protects a documented correctness fix, gating judged higher-risk than benefit |
| ScrollTrigger/GSAP instance cleanup | PASS — all 5 sites have matching cleanup, no leaks |
| Card-media CLS risk (Work/Network/Insights) | PASS — no external raster images in any card grid |

## ERROR / EMPTY STATES
| Page | Before | After | Verified against real outage? |
|---|---|---|---|
| Work.js (portfolio) | error silently rendered as empty | dedicated error message + retry | YES — stopped `api` container, confirmed message, confirmed recovery |
| Discipline.js (network) | error rendered misleading "still being verified" copy | dedicated error message; skeleton no longer spins forever | YES — same real-outage test |
| ServiceDetail.js (proof cases) | silent no-op on failure | left as-is (no persistent label to look broken) | N/A — reviewed, not changed |

## API EFFICIENCY (duplicate requests, live-measured)
| Page | Total API calls | Duplicates |
|---|---|---|
| /work | 3 (auth/me, case-studies, portfolio) | 0 |
| /network | 4 (auth/me, ecosystem, network/categories, network) | 0 |
| /insights | 2 (auth/me, insights) | 0 |

## BACKEND CLEANUP
| Check | Result |
|---|---|
| Dead imports | 0 found |
| Debug/launch-only code | 0 found |
| Commented-out code blocks | 0 found |
| Broad rewrite performed | NO — none needed |

## MOBILE (375px, 1179/1180 boundary)
| Page | 375px overflow | 1180px overflow |
|---|---|---|
| /work | 0 | 0 (-15, normal) |
| /network | 0 | not re-tested this width (unaffected by this step's changes) |
| /insights | 0 | not applicable |
| /what-we-do | 0 | not applicable |

## SEO
| Check | Result |
|---|---|
| Sitemap URL count | 56 (unchanged) |
| Prerendered HTML pages | 56 + 404.html (unchanged) |
| Spot-checked titles (Work/Network/Insights/What We Do) | PASS, unchanged |
| New public routes requiring sitemap changes | 0 (new anchor is a section of an existing page) |

## PERFORMANCE REGRESSION
| Metric | Step-3 baseline | After Step 6 | Delta |
|---|---|---|---|
| Main JS raw | 681.77 KB | 682.07 KB | +0.30 KB |
| Main JS gzip | 231.14 KB | 231.21 KB | +0.07 KB |
| Initial CSS raw | 96.84 KB | 96.84 KB | 0 |
| Initial CSS gzip | 19.47 KB | 19.47 KB | 0 |

## FULL VALIDATION SUITE
| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm test` | PASS — 8/8 |
| `npm run test:build` | PASS — 6/6 |
| `npm run build` | PASS — 56 pages |
| `pytest tests/` | PASS — 60/60 |
| Docker full stack (rebuild + live test) | PASS — including a real forced API outage |

## STEP 6 TEST STATUS: COMPLETE

---

# PART 2A — SECTION-LEVEL SEARCH VERIFICATION

## SECTION ANCHORS (new this part — 14 entries)
Each checked live: correct page, correct anchor, actual heading/content
element measured against the sticky nav's bottom edge (not the outer
`<section>` boundary, which can legitimately sit at scrollY 0 for a page's
first section without being "covered").

| Anchor | Content top (px) | Nav bottom (px) | Status |
|---|---|---|---|
| `/#home-hero-section` | 143 (h1) | 85 | PASS |
| `/#home-diagnostic-section` | 96 | 85 | PASS |
| `/#home-what-we-do-section` | 96 | 85 | PASS |
| `/#home-work-section` | 95 | 85 | PASS |
| `/#home-network-section` | 95 | 85 | PASS |
| `/#home-who-section` | 96 | 85 | PASS |
| `/work#work-case-studies` | 89 | 85 | PASS |
| `/work#orbit` | 96 | 85 | PASS |
| `/work#portfolio-wall` | 96 | 85 | PASS |
| `/network#network-disciplines-section` | 127 | 85 | PASS |
| `/network#network-rosters` | 96 | 85 | PASS |
| `/network#network-specialists` | 96 | 85 | PASS |
| `/what-we-do#packages` | 271 (normal `section-pad` gap) | 85 | PASS |
| `/what-we-do#build` | 96 | 85 | PASS — re-confirms Step 6's font-swap-reflow fix |

## ECOSYSTEM-CATEGORY & INSIGHT-CATEGORY ENTRIES (generated, not hand-listed)
| Check | Result |
|---|---|
| 6 ecosystem routes resolve to correct, distinct pages | PASS |
| `/network/venues` vs `/network/venue-partners` are two different pages | PASS — collision confirmed resolved |
| 5 Insights `?category=` filters match live API category values | PASS (one test initially used the CSS-uppercased chip text instead of the real title-case value and looked broken; retested with correct casing — confirmed a testing mistake, not an app bug) |

## BROWSER BACK
| Scenario | Result |
|---|---|
| Same-page hash (`/` → `/#home-work-section` → Back) | PASS — returns to `/` at scrollY 0 |
| Cross-page anchor (`/work` → `/network#network-rosters` → Back) | PASS — returns to `/work` |

## "VENUES" COLLISION BUG
Ecosystem entry originally labeled "Venues" tied `NETWORK_SUBCATS`'
pre-existing "Venues" discipline (`/network/venues`) on exact-match score;
insertion-order tie-break made the discipline win, so searching "Venues"
surfaced the wrong page. Renamed to "Venue Partners" (matches its real route
`/network/venue-partners`). Verified via direct chunk import
(`searchCommands()`) that both queries now return distinct, correct results.

## PERFORMANCE REGRESSION
| Metric | Step 6 | After PART 2A | Delta |
|---|---|---|---|
| Main JS raw | 682.07 KB | 682.22 KB | +0.15 KB |
| Main JS gzip | 231.21 KB | 231.26 KB | +0.05 KB |
| Initial CSS | 96.84 KB / 19.47 KB gzip | unchanged | 0 |

## FULL VALIDATION SUITE
| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm test` | PASS — 8/8 |
| `npm run build` | PASS — 56 pages |
| `pytest tests/` | PASS — 60/60 (one Windows-only tmpdir-permission flake, confirmed passing in isolation) |
| Docker `web` rebuild + live smoke test | PASS |

## PART 2A TEST STATUS: COMPLETE

---

# PART 28A — FINAL UI SYSTEM CONSISTENCY GATE

## AUDIT SCOPE
Home used as system reference; every other major page checked against it
for font family/weight/size/line-height, heading spacing, alignment,
section rhythm, cards, buttons, nav, labels, page width, responsive
margins, dark/light surface relationships. Work/Network/Insights/Lab's
deliberate visual character explicitly preserved, not flagged.

## FINDINGS FIXED
| # | File | Issue | Fix |
|---|---|---|---|
| 1 | WorkDetail.js / InsightDetail.js | `loadError` fallback missing `pt-[84px]` nav offset (present in every other state in the same files) | Added |
| 2 | WorkDetail.js / InsightDetail.js | `notFound` state missing `px-4 text-center` (present in ServiceDetail.js/Discipline.js's copies of the same pattern) | Added |
| 3 | Contact.js | Two spots used `text-base`/`text-lg` instead of the sitewide explicit-pixel convention | Changed to `text-[16px]`/`text-[18px]` |
| 4 | WhyHiAnzy.js | Three card headings used fixed `text-5xl` instead of the established card-title `clamp()` scale | Changed to `clamp(2rem,3vw,2.8rem)`, matching Packages.js |

## ADDITIONAL BUG (user-reported live, screenshot-confirmed)
StickyCta's fixed-position show window (1.4–3.2 viewports) overlapped the
Orbit deck's active card on `/work`, covering its "Explore" link with the
bar's own "Start a Conversation" link. Fixed with an opt-in
`.sticky-cta-avoid` class + IntersectionObserver (15% threshold), applied
to the Orbit deck wrapper, with a 20×300ms poll for the late-mounting
deck (mirrors ScrollToTop's existing retry pattern). Verified live:
suppressed while deck in view, resumes normal behavior once scrolled clear.

## VALIDATION
| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm test` | PASS — 8/8 |
| `npm run build` | PASS — 56 pages, 682.63 KB raw / 231.40 KB gzip |
| `pytest tests/` | PASS — 60/60 |
| Docker rebuild + live verification | PASS — no new console errors |

## PART 28A TEST STATUS: COMPLETE

---

# FABLE-5 TEST LOG

Final tree `14a6392` plus the docs(release) commit. Production build served by
`vite preview` on 3100 against the Docker API on 8010; browser checks in
Playwright headless Chromium.

## AUTOMATED

| Suite | Result |
|---|---|
| `pytest tests/test_api.py tests/test_frontend_lock.py` (disposable Mongo on 27117) | 65 passed |
| `npm test` (vitest, 4 files incl. `RouteErrorBoundary.test.jsx`) | 10 passed |
| `npm run test:build` (prerender render, sitemap fallbacks, stable lastmod) | 7 passed |
| `npm run lint` | clean |
| `npm run build` | 76 pages; `sitemap: 76 urls … lastmod moved for 0` on a rebuild |
| `python scripts/check_raw_metadata.py` | 76 routes + share image verified |
| `python scripts/check_frontend_lock.py` | Verified 236 unchanged frontend files |
| `node scripts/link-graph.cjs --md` | 76 pages, 178 links, 0 broken, 0 orphans |

## BROWSER

| Check | Result |
|---|---|
| Insights hub | 8 topic chips with counts, 7 category chips, 20 entries + 10 notes, CollectionPage JSON-LD; chip click → `?topic=Brand` (9 entries + 1 note); `?topic=Operations` deep link 3 + 3; empty state with Clear filters |
| Encyclopedia entry | breadcrumb, KNOWLEDGE chip, 8-item TOC (click scrolls and sets the hash), 11 inline cross-links, steps, FAQ, takeaway, 9 GO DEEPER links, 4 NEXT TOPICS, Article + BreadcrumbList + FAQPage JSON-LD, canonical |
| Unknown article slug | not-found state with an `h1` and a way back; title "Page not found" |
| RelatedReading | service page 5 links, discipline page 1, case page 3, roster pages 6/5/1/6 |
| Orbit and roster links | 6 links under the Work deck, 4 under the Network carousel |
| Palette | "brand", "knowledge", "operations", "seo", "venue", "crm", "automation" return typed destinations; "contact", "coming soon", "imkaan" resolve; dynamic results refresh for a query typed before they arrive |
| Responsive | 12 routes × 320/375/768/1024/1440/1920: no horizontal overflow |
| removeChild | before: thrown at 1440→600 in 3 of 3 scenarios; after: 0 page errors in 6 scenarios, pin-spacer 1 → 0 → 1 |
| Controlled outage | API stopped: 9 routes + palette, every one with nav, footer, an alert and retry where designed; 0 page errors; API restarted: retry restores roster (7), Insights (20) and palette dynamic results on the next opening |
| Scroll bench | article 16.7 ms avg frame, 0 over 33 ms; Home 30 ms / Work 28 ms avg on the software-WebGL harness floor recorded in the scroll-fix bench; no regression |
| Docker stack | web rebuilt from HEAD, healthy; sitemap 76 URLs with the local build's lastmod set; prerendered titles; `/lab/` 200; unknown path 404 |

## FABLE-5 TEST STATUS: COMPLETE

---

# POST-FABLE DELTA TEST LOG

| Check | Result |
|---|---|
| Orbit deck, 7 widths × 5 pages | PASS: no horizontal overflow anywhere; active card edges and Explore label visible at 320–1920; no inner scroll box |
| Scroll architecture | PASS: Lenis single dispatch (0.68 progress-bar writes per frame), native fallback after `destroy()`, reduced motion path |
| Scroll regression harness | PASS: long tasks 7, blocked 513 ms, rect reads 77 ms (accepted 5/3, 391/213 ms, 97/62 ms; pre-fix 65, 4,641 ms, 977 ms) |
| Section rail, sticky CTA, scroll velocity, pinned sequence, anchors | PASS |
| `pytest tests/test_api.py tests/test_frontend_lock.py` | 68 passed |
| `npm test` / `npm run test:build` / `npm run lint` | 10 passed / 7 passed / clean |
| `npm run build` | 76 pages, lastmod moved for 0, 685.18 kB (gzip 232.21 kB) |
| `check_raw_metadata.py` / `check_frontend_lock.py` | 76 routes verified / 236 files verified |
| Link graph | 76 pages, 178 links, 0 broken, 0 orphans |
| Knowledge system | 30 insights (20 knowledge, 10 notes), filters, 91 inline links resolve |
| Hard refresh, rebuilt Docker stack | 20 routes 200 with title and h1, `/lab/` 200, unknown 404 |
| Backend | health ok, CORS preflight from site origin ok, secrets scan clean |

## POST-FABLE DELTA TEST STATUS: COMPLETE

---

# POST-MERGE RECONCILIATION TEST LOG (2026-09-23)

Run on `main` at `0208378` (the PR #2 merge; tree identical to `bca84da`).

| Check | Result |
|---|---|
| `python scripts/check_frontend_lock.py` | Verified 236 unchanged frontend files |
| `pytest tests/test_api.py tests/test_frontend_lock.py` (disposable Mongo on 27117) | 68 passed |
| `npm run lint` / `npm test` / `npm run test:build` | clean / 10 passed / 7 passed |
| `npm run build` | 76 pages; `sitemap: 76 urls … lastmod moved for 0`; 685.18 kB (gzip 232.21 kB); tree clean afterwards |
| `python scripts/check_raw_metadata.py` (vite preview, canonical `https://hianzy.com`) | 76 routes + share image verified |
| `node scripts/link-graph.cjs --md` | 76 pages, 178 links, 0 broken, 0 orphans; only the timestamp changed, so the regenerated report was reverted |
| Docker stack (`main` tree) | `check_raw_metadata.py --base http://localhost:8080 --canonical-origin http://localhost:8080`: 76 routes verified; `/lab/` 200 with immutable hashed assets; unknown path 404 with the not-found title and `noindex,follow` |
| Insights (live API) | 30 total, 20 knowledge, 10 notes, 8 topics, 6 categories; `?topic=` and `?category=` filter; article bodies carry h2/p/quote/list/steps/faq/takeaway; related graph keys intact |
| PR #1 reconciliation | `44d032a` and `3f531b3` are ancestors of `main`; empty diff on `Home.js` and `CommandPalette.js` |
| PR #2 reconciliation | 61 release commits present; `TREE(main) == TREE(bca84da)` |

## POST-MERGE RECONCILIATION STATUS: CLEAN

---

# IA CONSOLIDATION TEST LOG (2026-09-23)

Run on `ia/page-consolidation` at its final commit (docs/IA_CONSOLIDATION_AUDIT.md
holds the full audit and the commit list).

| Check | Result |
|---|---|
| `python scripts/check_frontend_lock.py` | Verified 235 unchanged frontend files (written twice; second write identical) |
| `pytest tests` (disposable Mongo on 27117) | 68 passed |
| `npm run lint` / `npm test` / `npm run test:build` | clean / 16 passed (6 files) / 8 passed |
| `npm run build` | 67 pages; `sitemap: 67 urls … lastmod moved for 0`; main chunk 685.48 kB (gzip 232.35 kB), stylesheet hash unchanged; tree clean afterwards |
| `python scripts/check_raw_metadata.py` (vite preview, canonical `https://hianzy.com`) | 67 routes + 1 share image |
| `python scripts/check_raw_metadata.py --base http://localhost:8080 --canonical-origin http://localhost:8080` (Docker) | 67 routes + 1 share image |
| `node scripts/link-graph.cjs --md` (API sources) | 67 pages, 175 links, 0 broken, 0 orphans, 54 static anchor ids |
| Legacy URLs, in-app (preview, `?utm=keep`) | 9 of 9 land on their section at 96 px (Work rosters 89 to 94 px), query kept, roster opened where the hash names one |
| Legacy URLs, nginx (Docker) | 9 of 9 answer 301 with `?utm=keep` and the `#section` fragment in `Location`; `/careers/` 301; `/careers/x` 404 |
| Direct hash loads at 320/375/768/1024/1200/1440/1920 | three hubs land within 87 to 96 px, no horizontal overflow, no nested scroll box |
| Back / Forward | external `/careers` link → `/network#careers`; Back → `/` (replace semantics); Forward → section again; in-app chip → `/network#creators`, Back → `/work` |
| Reduced motion | `/network/venue-partners` → `/network#venues` at 96 px through the native scroll path, roster open |
| API outage / recovery | ecosystem and case-studies aborted: roster and built sections show their error copy at the landing offset, no page error; restored: creators 10, built-here 3, built-together 2 |
| Command palette (Docker) | "who we work with" → "Who We Work With · Why hiAnzy · the audiences and the fit checklist" → `/why-hi-anzy#who-we-work-with` |
| Docker walkthrough | 14 public pages 200 with title, h1, `index,follow` and canonical, no page error, no failed request; `/lab/` 200; `/no-such-page` 404 `noindex,follow`; sitemap 67 URLs with no legacy path |
| Secret and artefact scan | `git diff main...HEAD`: no key, token or password pattern; no build output tracked |

## IA CONSOLIDATION TEST STATUS: COMPLETE — NOT MERGED, NOT PUSHED

---

# AGENCY SEPARATION + RELEASE HARDENING TEST LOG (2026-09-24)

Run on `ia/page-consolidation` after the Experiment Lab detachment. Production
build served by `vite preview` (3100, `/api` proxied to the Docker API on 8010)
and by the rebuilt Docker `web` image (nginx on 8080); Playwright headless
Chromium with the tab fronted.

| Check | Result |
|---|---|
| `python scripts/check_frontend_lock.py` | Verified 235 unchanged frontend files (the Lab exclusion is gone from the checker) |
| `pytest tests` (disposable Mongo on 27117) | 68 passed |
| `npm run lint` / `npm test` / `npm run test:build` | clean / 16 passed (6 files) / 10 passed (2 new: no Lab step in any deployment file; trailing-slash rule ordering) |
| `npm run build` | 67 pages; `build/lab` absent; index chunk 685.48 kB (gzip 232.35 kB); sitemap moved for 2 (`/network`, `/why-hi-anzy`, the restored copy), then `lastmod moved for 0` from the snapshot and from the API |
| `python scripts/check_raw_metadata.py` (preview, canonical `https://hianzy.com`) | 67 routes + 1 share image |
| `python scripts/check_raw_metadata.py --base http://localhost:8080 --canonical-origin http://localhost:8080` (Docker) | 67 routes + 1 share image |
| `node scripts/link-graph.cjs --md` (API sources) | 67 pages, 175 links, 0 broken, 0 orphans, 54 static anchor ids |
| Lab boundary (Docker) | `/lab/` 301 → `/lab` → 404 with the Agency not-found page (status 404, title "404: Not in the Roadmap"); `/lab/index.html` and `/lab/assets/*.js` 404; sitemap carries no `/lab` entry; `nginx -t` passes on the trimmed template |
| Trailing slashes (Docker) | `/work/`, `/network/`, `/insights/`, `/what-we-do/`, `/why-hi-anzy/`, `/contact/`, `/network/venues/`, a case study: 301 to the canonical URL, query string kept (`/work/?utm=keep` → `/work?utm=keep`); `/careers/` still takes the legacy 301 first; `/api/` still 404 |
| Nine legacy URLs (Docker, in-browser, `?utm=keep`) | 9 of 9: one 301 each, land on the hub section at 96 px under the 85 px nav, hard refresh 96 px, Back returns to the referrer, hubs answer 200 |
| Direct hash loads (Docker) | 9 sections at 96 px; `/work#built-together`, `/network#careers`, `/why-hi-anzy#who-we-work-with` at 320/375/768/1024/1200/1440/1920 all below the nav (86 to 96 px) |
| Restored copy (Docker) | Careers standfirst, Collaborate credit line and the Who We Work With audience summary render; 12 audiences |
| Responsive sweep (Docker) | Home, Work, Network, Why hiAnzy, Insights, a service, a discipline, a case study, an article, Contact × 320/375/768/1024/1200/1440/1920 = 70 loads: all 200, 0 page errors, 0 horizontal overflow, 0 nested scroll boxes, 0 clipped headings or CTAs, 0 text cut inside cards, 0 fixed-element collisions; section rail present from 1200 on every multi-section page; sticky CTA in view when shown and hidden only by its own Orbit-deck avoidance on `/work` |
| Scroll harness (1440×900, 80 wheel ticks of 100 px at 50 ms, long-task observer, rAF frame intervals) | Home 8 long tasks, 545 ms blocked, worst 84 ms, 26.4 ms average frame; Work 9, 475 ms, 64 ms, 23.1 ms; article 0, 0 ms, 16.7 ms average, 0 frames over 33 ms; fast wheel (30 × 600 px) Home 5 long tasks, 282 ms; trackpad-like (120 × 12 px) Network 1 long task, 53 ms, 17.4 ms average. Equivalent to the accepted baseline (7 long tasks, 513 ms; article 16.7 ms); the Home and Work frame floor is the software-WebGL harness, as recorded before |
| Pin / unpin, resize | Home pinned sequence pins at 84 px through its 3741 px spacer and unpins after; 1440 → 600: spacer 0, `data-pinned="false"`; back to 1440: spacer 1, pinned; no errors |
| Route transitions | Home (scrolled) → Work (top, h1) → Network → Back → Back (Home, spacer 1) → Forward: paths and top-of-page landings correct, same Lenis instance throughout |
| Reduced motion | Home, `/network#venues`, `/why-hi-anzy#who-we-work-with`: no Lenis, stacked sequence, nothing hidden in view, sections at 96 px |
| API outage / recovery (Docker) | Work, Network, Insights, an article, a case study with every `/api/` request aborted: h1, alert and retry where designed, no page error, root never empty; restored: creators 10, disciplines 16 |
| Backend | `/api/health` ok, db connected; anonymous `/api/auth/me` 401; CORS preflight from the site origin allowed with credentials, foreign origin refused (400); contact: invalid email 422, missing message 422, honeypot 200 with `id:null`, valid 200 with an id (local probe record deleted afterwards); reserved test domains are refused by the validator |
| Hygiene | tracked files: no key, token, password or connection string (only the documented placeholder in AWS_PREP §B15); only `.example` env files tracked; no logs, dumps, screenshots or patch scripts tracked; two workstation paths in `docs/audits/Audit-report.md` redacted |

## AGENCY SEPARATION TEST STATUS: COMPLETE — NOT MERGED
