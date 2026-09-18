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

## DEPLOYMENT
| Check | Status | Note |
|---|---|---|
| `vercel.json` present | PASS | added this session |
| `vercel.json` JSON syntax valid | PASS | |
| Referenced paths exist (`backend/server.py`, `backend/requirements.txt`, `frontend/package.json`) | PASS | |
| `vercel build` against a real project | BLOCKED | requires `vercel link` with the owner's Vercel account |
| FastAPI ASGI detection by `@vercel/python` | NOT RUN | can't verify without a real deploy |
| `/api/*` routing on Vercel | NOT RUN | same |
| SPA/prerendered-HTML routing on Vercel | NOT RUN | same |
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
| CommandPalette retry after failed import | PASS (fixed + re-verified via lint/test/build) | not manually clicked through in a live browser this session |
| CommandPalette open/type/navigate (live browser) | NOT RUN | |
| Contact form submit | NOT RUN | |
| Subscribe | NOT RUN | |
| Sitemap output | PASS | generated during build |
| CORS wildcard refusal | PASS | read directly in `server.py`, confirmed logic (refuses `*`, logs it) |
| Cookie security self-validation | PASS | read directly, confirmed raises on invalid `COOKIE_SECURE`/`COOKIE_SAMESITE` combinations |
| Security response headers | PASS | read directly, all present |

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

## NOT YET RUN (deferred to later steps per the protocol's own priority order)
- Mobile viewport sweep (320/375/390/430)
- Live browser console/network audit
- Route-by-route direct-load + refresh QA
- SEO per-route metadata audit
- Full CI trigger on GitHub
