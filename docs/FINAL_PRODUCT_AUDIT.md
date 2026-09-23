# Final product audit: FABLE-5 completion phase

Branch `launch/step-1`, audited 2026-09-23 after the last commit of the phase.
Nothing is merged to `main`, pushed, deployed or provisioned; the STOP GATE
holds. This audit is independent of the phase's own commit messages: every
number below was re-measured on the final tree.

## What the phase delivered

| Area | Commit | Result |
|---|---|---|
| Insights as a knowledge encyclopedia | `98a7c8b` | 20 evergreen entries + 10 notes on `/api/insights`; 8-topic vocabulary; related graph (52 service, 67 discipline, 23 case-study, 29 roster, 119 article edges); encyclopedia renderer with TOC, inline cross-links, GO DEEPER, NEXT TOPICS; Article + BreadcrumbList + FAQPage JSON-LD; RelatedReading on service, discipline, case-study and roster pages |
| Search as navigation | `a3825ef` | topic hubs, encyclopedia entries and categories indexed; destination-path tier ("contact", "coming soon" resolve); explicit entries for the two pages outside the nav lists |
| Complete public destinations | `b135a9d` | six Orbit roster pages linked as plain links from Work and Network |
| Link graph tooling | `29c2614` | `frontend/scripts/link-graph.cjs` → `docs/link-graph.json`, `docs/FINAL_LINK_GRAPH.md` |
| removeChild NotFoundError | `b4c243f` | reproduced (viewport across 640px, both directions, mid-page) and fixed structurally: the ScrollTrigger belongs to the pinned section and dies with it in a layout effect; no try/catch |
| Stable sitemap lastmod | `b77ba88` | content fingerprints + committed manifest; snapshot fallback; 7 build tests |
| API failure states | `7436f5c` | RouteErrorBoundary; Work expanded-case error + retry; empty states; Discipline stat; roster page alert + retry + contact link; auth fetch deadlines; palette recovery and refresh |
| AWS architecture | `70d0e1a`, `35d619f` | ADR-002 (Proposed); amplify.yml, customHttp.yml (monorepo shape verified against the AWS reference), backend/.env.aws.example, AWS_PREP.md aligned |
| Deterministic frontend freeze | `14a6392` | every drift since `54886e4` traced (`FRONTEND_FREEZE_AUDIT.md`); checker classifies and regenerates; 4 tests; lock regenerated (236 entries); CI runs the tests |

## Verification on the final tree

| Check | Result |
|---|---|
| `python -m pytest tests/test_api.py tests/test_frontend_lock.py` | 65 passed |
| `npm test` (vitest) | 10 passed, 4 files |
| `npm run test:build` (prerender + sitemap) | 7 passed |
| `npm run lint` | clean |
| `npm run build` | 76 prerendered pages; `index` chunk 684.83 kB (gzip 232.08 kB) versus 682.72 kB (gzip 231.45 kB) before the phase |
| `python scripts/check_raw_metadata.py` against `vite preview` | 76 routes and the share image verified |
| `python scripts/check_frontend_lock.py` | Verified 236 unchanged frontend files |
| `node scripts/link-graph.cjs` | 76 pages, 178 links, 0 broken, 0 orphans |
| Responsive sweep (Playwright, 12 routes × 320/375/768/1024/1440/1920) | no horizontal overflow on any page at any width |
| removeChild regression (Playwright, production build) | 1440→700, 1440→600, 1440→600 mid-page, 600→1440, reduced-motion toggle, route change and back: 0 page errors; pin-spacer count 1 → 0 → 1 |
| Controlled outage (API container stopped) | `/`, `/work`, case page, `/insights`, article, `/network`, discipline, roster page, service page and the palette: nav and footer intact, alert with retry where designed, 0 page errors, no empty root |
| Recovery (first request aborted, then allowed) | roster page retry → 7 items; Insights retry → 20 entries; palette answers from the static index during the outage and lists case studies, articles and ecosystem entries on the next opening |
| Scroll bench (Playwright headless, focused tab, 1440×900, 40 wheel ticks) | article page 16.7 ms average frame, 0 frames over 33 ms; Home 30 ms and Work 28 ms average, which is the software-WebGL floor the scroll-fix bench already recorded on this harness, not a change |
| Docker stack rebuilt from HEAD | web healthy; sitemap 76 URLs with the same lastmod set as the local build (the Docker build has no API and used the snapshot); `/insights/crm-strategy` served with its prerendered title; `/lab/` 200; unknown path 404 |

## Findings

### P0 — release blockers

None.

### P1 — must be done before the AWS launch, cannot be done in this repo alone

**P1-1 Client IP behind App Runner** (resolved in the post-FABLE delta below). `client_ip()` trusts `x-forwarded-for`
only when `IS_SERVERLESS` is true (Vercel). On App Runner the socket peer is
the request router, so every visitor would share one rate-limit bucket.
ADR-002 condition 4: extend `client_ip()` to trust the rightmost hop behind an
explicit environment flag, with tests. Deliberately not done in this phase:
it changes rate-limiting semantics per platform and deserves its own reviewed
commit against the platform it targets.

**P1-2 Amplify routing and headers are launch gates, not facts.** The single
`/<*>` → `/index.html` `404-200` rewrite and the monorepo `customHttp.yml`
shape are documented from the AWS references, but only a live Amplify app can
prove that `/work` returns `work.html` before the fallback and that the
headers apply. AWS_PREP.md §B3 and customHttp.yml carry the view-source and
header checks to run on the temporary Amplify URL before any DNS change.

### P2 — should be decided or fixed soon

**P2-1 Sign-in product decision.** Every page load still asks `/api/auth/me`
and gets a 401 for anonymous visitors; the login URL points at a third-party
scaffold host; a signed-in avatar would be blocked by the CSP's `img-src`.
Keep, fix or remove sign-in. Unchanged this phase on purpose.

**P2-2 Line-ending policy.** 14 files CRLF-only, 11 LF-only, 5 mixed among
the audited drift; four earlier commits flipped endings on lines they did not
touch. An editor that normalises on save will create lock drift with no source
change. Adopt `.editorconfig` or a `.gitattributes` `eol=` rule in one
dedicated commit, then regenerate the lock once.

**P2-3 Loading states are not announced.** The pulse skeletons on Work,
WorkDetail, InsightDetail, Insights, Network, Discipline, the roster pages and
WorkPreview have no `role="status"`; only the Work expanded panel got one this
phase. A small shared `LoadingBlocks` component would fix all ten call sites.

**P2-4 Dual-deploy at cutover.** `vercel.json` is retained as the live
fallback; connecting Amplify while Vercel is still connected builds every push
twice. ADR-002's cutover order ends with disconnecting Vercel.

### P3 — polish

**P3-1** `/work/built-here` and `/work/built-together` show no related reading:
no article names those two rosters in `related.network`. A content
opportunity, not a defect; the pages have their items and onward links.

**P3-2** The sitemap generator's "today" is the UTC date while git dates are
local; a first-seen entry can differ by a day around midnight. Cosmetic.

**P3-3** Bundle sizes remain above Vite's 500 kB warning (main chunk 685 kB,
`react-three-fiber` chunk ~805 kB). Inherent to the locked 3D product.

**P3-4** App Runner service configuration is Console state, not code
(`apprunner.yaml` is not used because the service deploys from an image).
Worth a committed description once the shape settles.

### INFO

- The contact page is labelled "Say Hi" and the coming-soon page hangs off
  the footer teasers only; both are searchable by the words visitors type
  through explicit palette entries and the destination-path tier.
- Two analytics events (`ecosystem_filter_used`, `resource_requested`) are
  allow-listed but never fired by the frontend; all 37 fired names are
  allow-listed.
- Backend audit: no dead imports, no blocking calls in async paths, timeouts
  present on outbound calls; CORS omits PATCH, which the frontend never uses.
- The Experience Lab boundary (ADR-001) is intact: `frontend/lab/` is a
  compiled artifact, excluded from the lock and untouched.

## Visual design, 3D and choreography impact

None. No Three.js scene, GSAP choreography, ScrollTrigger storytelling, Lenis
setting, hero concept, palette, logo or typography family changed. The
PinnedSequence change moves where the trigger lives, not what it does; the
same `ScrollTrigger.create` options run with the same section markup.

## Owner actions

1. Review the branch and push it (`git push origin launch/step-1`); open the
   pull request to `main`. Not done here by the STOP GATE.
2. Decide P2-1 (sign-in) and P2-2 (line endings).
3. Before AWS: land P1-1 with tests, and the ECR image workflow (ADR-002
   owner action 5).
4. Provision per ADR-002 "Owner actions", in order, and run the AWS_PREP.md
   §B3 gate on the temporary Amplify URL before any visitor-facing DNS.

## POST-FABLE DELTA (2026-09-23)

Closeout after the audit above. Four code commits and this record; nothing
reopened, nothing redesigned. Every number was re-measured on the final tree
(production build served by `vite preview`, the Docker stack rebuilt from the
same commit, Playwright headless Chromium with the tab fronted).

| Change | Commit | Result |
|---|---|---|
| Orbit deck wrapper clipping the raised card | `20de858` | `overflow-x: hidden` had made the deck wrapper a vertical scroll box (hidden on one axis forces the other to auto); `overflow-x: clip` stops the horizontal bleed without a scroll box. At 320, 375, 768, 1024, 1200, 1440 and 1920 the active card's top, bottom, left, right edges and its Explore label are on screen, the wrapper has no inner scroll box, and `document.scrollWidth` never exceeds the viewport on Home, Work, a case study, Network or an article. Clicking the active card still navigates; ArrowRight still moves the active card; tilt, drag and lift code untouched. |
| Sitemap manifest for `/work` | `57e275d` | The wrapper file is a source of `/work`, so only that page's fingerprint and date moved; every other entry unchanged. |
| Proxy-aware client IP (FABLE-5 P1-1) | `9a900bb` | `TRUSTED_PROXY=apprunner` reads the rightmost `x-forwarded-for` hop (the one App Runner's router appends); `vercel` (or `VERCEL=1`) reads the first; unset ignores the header. Non-IP hops fall back to the socket peer. Three regression tests cover the local request, both trusted contexts, a spoofed header outside any trusted context, multi-hop, malformed and empty values, and rate-limit buckets following the derived address. Rate-limit semantics unchanged. |
| Hash destinations landing short | `52e3b69` | `/work#orbit` (a palette destination) landed about 1000px short because the case-study carousel replaced its skeleton after the target was measured. `ScrollToTop` now re-measures the target while the document is still changing size, for at most three seconds, and stops at the visitor's first wheel, touch or key. Five hash destinations land at the 96px nav offset; a visitor who scrolls during the window is not pulled back; the palette's "The Hi Anzy Orbit" result lands on the section. Scroll dispatch and Lenis settings untouched. |

### Scroll regression gate

Architecture, read from `frontend/src/lib/motion.js` and confirmed live:
Lenis is the single dispatch while present (`window.__lenis` set; the native
listener returns early through the `lenisOff && window.__lenis` guard);
during a Lenis scroll the progress bar received 0.68 style writes per frame
(a doubled path would show about two); native `scroll` events still fire in
the browser (396 during the harness) but are not fed to subscribers while
Lenis drives (409 Lenis events). Native fallback verified by destroying Lenis
at runtime: scrolling, the progress bar, the section rail and the velocity
variable all keep working. Reduced motion: no Lenis, the stacked sequence
(`data-pinned="false"`), progress via the native path, rail disabled by design.

Same harness as the accepted scroll fix (80 wheel ticks at 50 ms, 1.5 s
settle, 1440×900, longtask observer, instrumented `getBoundingClientRect`):

| Metric | Pre-fix (recorded) | Accepted patched state (recorded) | This tree |
|---|---|---|---|
| Long tasks (>50 ms) | 65 | 5 / 3 | 7 |
| Main-thread blocked | 4,641 ms | 391 / 213 ms | 513 ms |
| Time inside rect reads | 977 ms | 97 / 62 ms | 77 ms |
| Worst single task | 172 ms | 184 / 99 ms | 109 ms |

Materially equivalent to the accepted state and an order of magnitude from
the pre-fix numbers; the page now carries 20 more articles and the harness
scrolled 8,000px. Not optimised further. Also confirmed: SectionIndex updates
its current label; StickyCta gains `is-in` mid-page; ScrollVelocity writes
`--scroll-v` (0.618 under Lenis, 0.530 under the native fallback); the pinned
sequence pins at 84px, advances from step 0 to step 3 across its range and
unpins; PopIllustration drifts through the same `subscribeScroll` path (not
separately measured).

### Validation on the final tree

| Check | Result |
|---|---|
| `pytest tests/test_api.py tests/test_frontend_lock.py` | 68 passed (3 new client-IP tests) |
| `npm test` (vitest) | 10 passed, 4 files |
| `npm run test:build` | 7 passed |
| `npm run lint` | clean |
| `npm run build` | 76 prerendered pages; `sitemap: … lastmod moved for 0`; index chunk 685.18 kB (gzip 232.21 kB), +0.35 kB over the FABLE-5 tree |
| `python scripts/check_raw_metadata.py` | 76 routes and the share image verified |
| `python scripts/check_frontend_lock.py` | Verified 236 unchanged frontend files (regenerated twice for the two traced frontend changes) |
| `node scripts/link-graph.cjs` | 76 pages, 178 links, 0 broken, 0 orphans |
| Knowledge system (live API) | 30 insights: 20 knowledge, 10 notes; 8 topics; 6 categories; `?topic=Brand` 10, `?category=Brand, Decoded` 6; body projected out of the list; 91 inline links, 0 unresolved |
| Hard refresh on the rebuilt Docker stack | 20 representative routes (home, what-we-do, service, how-we-work, work, case study, network, discipline, two rosters, insights, article, why, contact, coming-soon, who-we-work-with, collaborate, careers, resources, `/lab/`) all 200 with their own title and h1, no horizontal scroll, no page errors; an unknown path answers 404 with the not-found page |
| Backend | `/api/health` ok, db connected; startup seeds and serves; CORS preflight from the site origin answers with the origin; no PATCH used; no blocking work added; secrets scan of tracked files clean (only the illustrative `user:pass@cluster0` shape in AWS_PREP.md §B15) |
| Sitemap | a rebuild with no content change moves zero dates |

### Readiness

- **CODE READY: YES.** All gates green on `launch/step-1`.
- **LIVE AWS VERIFIED: NO.** No infrastructure exists. P1-2 (the Amplify
  404-200 routing and monorepo header shape) can only be proven on a live
  Amplify app; P1-1 is closed in code and needs `TRUSTED_PROXY=apprunner` set
  on the service.
- Open owner items unchanged: sign-in decision (P2-1), line-ending policy
  (P2-2), announced loading states (P2-3), Vercel disconnect at cutover
  (P2-4), the ECR image workflow.
- INFO: the anonymous 401 from `/api/auth/me` carries no `Cache-Control`
  header (the authenticated 200 carries `no-store`, covered by tests); a 401
  is not cacheable by browsers.
