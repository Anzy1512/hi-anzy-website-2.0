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
- Broad performance/CSS/font/dependency work (explicitly out of scope for Step 2)
- SEO per-route metadata audit
- Full CI trigger on GitHub
