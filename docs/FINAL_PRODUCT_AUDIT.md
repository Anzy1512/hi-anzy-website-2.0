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

**P1-1 Client IP behind App Runner.** `client_ip()` trusts `x-forwarded-for`
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
