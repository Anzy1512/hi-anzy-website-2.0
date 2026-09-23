# IA CONSOLIDATION AUDIT (2026-09-23)

Branch `ia/page-consolidation`, cut from `main` at `0208378`
(`020837893c0af5e7f2e5cda72734b430c955cd37`). Nine standalone routes were
absorbed into the three hubs that already held their subject: the Work hub,
the Network hub and Why hiAnzy. **Not merged, not pushed, not deployed; no
AWS resource provisioned; DNS untouched.**

Every number below was measured on the branch as committed, with the
production build served by `vite preview` (port 3100, `/api` proxied to the
local API on 8010) and by the rebuilt Docker stack (nginx on 8080). Nothing
in this document was estimated.

## Final verdict

**READY WITH LIVE AWS VERIFICATION.** The consolidation is complete and
verified locally at every layer this repository controls. One gate can only
be closed on AWS: whether Amplify keeps the `#section` fragment in the nine
redirect targets (see AWS LIVE GATES).

## ROUTES BEFORE / AFTER

| | Before (`main`) | After (branch) |
|---|---|---|
| Public URLs | 76 | 67 |
| Static pages | 13 | 10 |
| Service pages | 6 | 6 |
| Discipline pages | 16 | 16 |
| Orbit roster pages | 6 | 0 (six hub sections) |
| Case studies | 5 | 5 |
| Insight articles | 30 | 30 |
| Sitemap URLs | 76 | 67 (no legacy path listed) |
| Prerendered HTML pages | 76 | 67 |

`/lab/` (the Experience Lab, its own static bundle) and `/404.html` are
unchanged and outside the count, as before.

## CANONICAL ROUTES

The nine merges, exactly as approved in the dry run:

| Legacy route | Canonical destination | Hub section id |
|---|---|---|
| `/work/built-here` | `/work#built-here` | `built-here` (Work hub, after the Orbit deck) |
| `/work/built-together` | `/work#built-together` | `built-together` (Work hub, after the Orbit deck) |
| `/network/collaborators` | `/network#collaborators` | `collaborators` (roster accordion inside `#network-rosters`) |
| `/network/artists-creators` | `/network#creators` | `creators` (roster accordion) |
| `/network/venue-partners` | `/network#venues` | `venues` (roster accordion) |
| `/network/partners` | `/network#partners` | `partners` (roster accordion) |
| `/collaborate` | `/network#collaborate` | `collaborate` (participation track) |
| `/careers` | `/network#careers` | `careers` (permanent-seat track) |
| `/who-we-work-with` | `/why-hi-anzy#who-we-work-with` | `who-we-work-with` (audiences and fit checklist) |

Existing working section ids were kept, not renamed: `#work-case-studies`,
`#orbit`, `#portfolio-wall`, `#network-disciplines-section`,
`#network-rosters`, `#network-specialists`. `ORBIT_CATEGORIES` in
`content.js` is the single source for the six roster destinations (`route`,
`anchor`, `legacyRoute`); `LEGACY_ROUTES` derives from it plus the three
static merges, and the router, the search index, the link graph and the
build test all read that one list.

## LEGACY REDIRECTS

Four layers, each verified as far as this repository can verify it:

| Layer | Mechanism | Verified |
|---|---|---|
| In-app router | `LegacyRedirect` renders `<Navigate replace>` to the hub path, keeps the query string, adds the section hash | Yes: 9 of 9 land on the section (table below); Back returns to the referring page, not the legacy URL |
| nginx (Docker image) | nine `location ~ ^/path/?$ { return 301 "/hub$is_args$args#section"; }` rules before `location /` | Yes: 9 of 9 answer 301 with query and fragment (table below); `/careers/` also 301; `/careers/x` 404 |
| Vercel | nine `permanent` entries in `vercel.json` `redirects` | Shape verified by `build.test.cjs`; no Vercel deployment exists to test against |
| Amplify | nine 301 rules documented in `amplify.yml` and AWS_PREP.md §B3, above the SPA fallback | **AMPLIFY HASH REDIRECT — REQUIRES LIVE AWS VERIFICATION** |

Legacy landings on the production build (1440×900, `?utm=keep` appended,
fresh document load, sampled every 100 ms for 4 s):

| Legacy URL | Final location | Section at 96 px after | Final offset | Roster open |
|---|---|---|---|---|
| `/work/built-here` | `/work?utm=keep#built-here` | 769 ms | 94 px | n/a |
| `/work/built-together` | `/work?utm=keep#built-together` | 273 ms | 89 px | n/a |
| `/network/collaborators` | `/network?utm=keep#collaborators` | 347 ms | 96 px | yes |
| `/network/artists-creators` | `/network?utm=keep#creators` | 324 ms | 96 px | yes |
| `/network/venue-partners` | `/network?utm=keep#venues` | 293 ms | 96 px | yes |
| `/network/partners` | `/network?utm=keep#partners` | 314 ms | 96 px | yes |
| `/collaborate` | `/network?utm=keep#collaborate` | 292 ms | 96 px | n/a |
| `/careers` | `/network?utm=keep#careers` | 801 ms | 96 px | n/a |
| `/who-we-work-with` | `/why-hi-anzy?utm=keep#who-we-work-with` | 698 ms | 96 px | n/a |

nginx on the rebuilt Docker image (`curl -I`):

| Request | Status | Location |
|---|---|---|
| `/work/built-here?utm=keep` | 301 | `http://localhost/work?utm=keep#built-here` |
| `/work/built-together?utm=keep` | 301 | `http://localhost/work?utm=keep#built-together` |
| `/network/collaborators?utm=keep` | 301 | `http://localhost/network?utm=keep#collaborators` |
| `/network/artists-creators?utm=keep` | 301 | `http://localhost/network?utm=keep#creators` |
| `/network/venue-partners?utm=keep` | 301 | `http://localhost/network?utm=keep#venues` |
| `/network/partners?utm=keep` | 301 | `http://localhost/network?utm=keep#partners` |
| `/collaborate?utm=keep` | 301 | `http://localhost/network?utm=keep#collaborate` |
| `/careers?utm=keep` | 301 | `http://localhost/network?utm=keep#careers` |
| `/who-we-work-with?utm=keep` | 301 | `http://localhost/why-hi-anzy?utm=keep#who-we-work-with` |

The `Location` host carries no port because nginx builds absolute redirects
from the container's own listen port (80); behind the real host on 80/443
that is the public URL. On a port-mapped local stack the browser would be
sent to port 80 (see KNOWN RISKS, P3).

## CONTENT ITEMS BEFORE / AFTER

Counted item by item in the approved dry run (headings, paragraphs, lists,
CTAs, kickers, legends, metadata) and re-checked after implementation:

| Source pages | Items | Migrated onto the hub section | Exact duplicates (already at the destination) | Unmapped |
|---|---|---|---|---|
| Six Orbit roster pages | 78 | 54 | 24 | 0 |
| Collaborate | 16 | 13 | 3 | 0 |
| Careers | 15 | 12 | 3 | 0 |
| Who We Work With | 12 | 9 | 3 | 0 |
| **Total** | **121** | **88** | **33** | **0** |

Where the content lives now:

- **Work hub, `BuiltRoster` ×2** (`built-here`, `built-together`): Orbit
  kicker and number, roster name, descriptor, tagline, SEO description and
  the credit sentence, the glyph, the case cards (provenance tag, services,
  summary, `LAST VERIFIED` year, "Read the full case"), the built-together
  footnote, related reading, plus skeleton, error and empty states. The
  grouping rule (`provenance === "HI ANZY"` → built here, otherwise built
  together) mirrors the seed rule, so the cards are the same 3 + 2 cases the
  standalone pages listed.
- **Network hub, `RosterPanel` ×4** inside `#network-rosters`: one
  accordion per roster (collaborators 7, creators 10, venues 3, partners
  10 = the 35 ecosystem records), each with kicker, tagline, SEO description,
  glyph, member cards (name, provenance, geography, capabilities, short
  description, `LAST VERIFIED`, visit link), footnote and related reading.
  One roster open at a time; the roster named in the URL hash opens itself.
- **Network hub, `#collaborate`**: heading, lede, HandsSpark motif, the
  three asks, the "HOW CREDIT WORKS HERE" panel with its link into the
  specialists directory, the guidance line and the contact CTA.
- **Network hub, `#careers`**: heading, lede, QuestionOrbit motif, the four
  values, the contact CTA and the "mention careers" line.
- **Why hiAnzy, `#who-we-work-with`**: kicker, heading, lede, the twelve
  audiences (`OrderingGrid`), the five-point fit checklist and the CTA.

## EXACT DUPLICATES MERGED

33 items existed verbatim at the destination or on the Orbit card that
already introduced the roster (roster names, descriptors and one-line copy
repeated from `ORBIT_CATEGORIES`; the contact CTA each retired page ended
on; the provenance legend the Network page already shows; the roster
descriptions that are the directory notes). They are kept once, at the
destination. No sentence that appeared only on a retired page was dropped.

## UNMAPPED CONTENT

**0.** Every item on the nine retired pages is on a hub section or was an
exact duplicate of one already there.

## LINK GRAPH BEFORE / AFTER

`node scripts/link-graph.cjs --md` against the local API (cases, insights
and ecosystem from the API):

| Metric | Before (`main`) | After |
|---|---|---|
| Source files scanned | 119 | 116 |
| Links found | 178 | 175 |
| Internal links | 159 | 156 |
| Public pages | 76 | 67 |
| Broken links | 0 | 0 |
| Orphan pages | 0 | 0 |
| Static anchor ids | 45 | 54 |
| Ecosystem items | 35 (linking to a category page) | 35 (listed on a roster section) |

Nine new literal ids (`built-here`, `built-together`, `collaborators`,
`creators`, `venues`, `partners`, `collaborate`, `careers`,
`who-we-work-with`) are validated as hash targets the same way every other
id is. A link to a retired route is reported as BROKEN on purpose; there
are none.

## BROKEN

0.

## ORPHANS

0.

## SEARCH

- The three absorbed pages are indexed as sections with wording that says
  what the section holds (`SECTION_ANCHORS` in `commandIndex.js`); the six
  rosters are indexed from `ORBIT_CATEGORIES` with the roster's on-screen
  name as the hint and the retired URL's words in the body.
- Sections that absorbed a page keep that page's rank (+8, the same bonus
  pages get), so "who we work with" resolves to the Why hiAnzy section and
  not to the homepage preview of the same name. The Venues discipline still
  wins its exact name over the venue roster.
- `commandIndex.test.js`: eight legacy terms land on eight distinct
  consolidated destinations; "venues" → `/network/venues` first; no result
  points at a retired route.
- Live (Docker build): palette query "who we work with" → first result
  "Who We Work With · Why hiAnzy · the audiences and the fit checklist" →
  Enter lands `/why-hi-anzy#who-we-work-with`.

## SEO

- 67 prerendered pages with escaped title, description, canonical and share
  image: `check_raw_metadata.py` verified 67 routes + 1 share image on the
  preview (`https://hianzy.com` canonical) and on Docker
  (`http://localhost:8080` canonical).
- Sitemap: 67 URLs, no legacy path, `lastmod moved for 0` on the final
  build. The 29 dates that moved in `fix(seo)` are the pages that import
  `content.js` (routes, anchors, footer links and the legacy list live
  there); the manifest keys each page on its module plus the data modules it
  imports, so a shared data module moving every page that renders from it is
  the manifest working as designed.
- `fix(sitemap)`: the insights and cases families are now hashed in slug
  order, so an API build and a snapshot build compute the same fingerprint
  (before, `/insights` and `/work` moved whenever the build's source
  changed). Two fingerprints changed once; no date changed.
- Hub metadata: Why hiAnzy title and description now name who we work with;
  Network description now says how to join or work with us; Work metadata
  unchanged. The nine legacy paths are written nowhere as pages, so the edge
  answers 301 before any file lookup.
- Structured data: the Network `CollectionPage` JSON-LD now carries one
  `ItemList` per roster from the same payload the panels render.

## PERFORMANCE

- No new dependency. One small component added (`LegacyRedirect`), four
  page chunks removed. Main chunk on the final build: `index-CfrQSuHB.js`
  685.48 kB (gzip 232.35 kB) against 685.18 kB (gzip 232.21 kB) on `main`;
  the stylesheet is byte-identical (`index-B9apjEug.css`, 97.38 kB, gzip
  19.58 kB, same hash on both builds).
- Network: the ecosystem payload is fetched once (it already was, for the
  roster counts) and now also feeds the four panels and the JSON-LD; the
  rosters render from that payload, nothing is fetched per panel. Work: the
  two built rosters render from the case-study list the carousel already
  loads.
- Roster member cards are compact and only the open roster's body is
  visible; the four rosters are 35 cards in total.

## MOBILE

Direct hash loads of the three hubs at each required width, fresh
document, section offset after 3.5 s of settling (target 96 px, the fixed
nav's height), horizontal overflow checked on `documentElement` and `body`:

| Width | `/work#built-together` | `/network#creators` | `/why-hi-anzy#who-we-work-with` | Overflow |
|---|---|---|---|---|
| 320 | 92 px | 96 px | 87 px | none |
| 375 | 91 px | 95 px | 88 px | none |
| 768 | 89 px | 95 px | 87 px | none |
| 1024 | 88 px | 95 px | 87 px | none |
| 1200 | 92 px | 96 px | 96 px | none |
| 1440 | 91 px | 96 px | 96 px | none |
| 1920 | 91 px | 94 px | 90 px | none |

No nested scroll box on any of the three pages at any width; no heading or
CTA clipped (the only elements beyond the viewport edge are the case-study
carousel's own off-screen cards, which is that carousel's design). The 4 to
9 px drift on some cells is a late layout settle after the 3 s re-measure
window closes; the section heading stays fully below the nav in every cell.

Browser Back after a legacy redirect returns to the referring page
(`/`, scrollY 0); Forward lands on the section again. An in-app chip from
`/work` to `/network#creators` opens the roster at 93 px; Back returns to
`/work` at the top.

Reduced motion (`prefers-reduced-motion: reduce`): `/network/venue-partners`
lands on `/network#venues` at 96 px through the native scroll path (Lenis
absent), roster open.

API outage (ecosystem and case-studies requests aborted): the creators
roster opens at 96 px with its "This roster could not…" state, the Work
built-here section shows "The project list could not be loaded. Refresh";
no page error. With the API back: creators 10 cards, built-here 3,
built-together 2.

## VISUAL DESIGN IMPACT

None to the approved systems. The roster accordions reuse the existing
`.network-resource-section*` styles; the audiences reuse `OrderingGrid`;
the CTAs are `MagneticButton`; the motifs are the existing `HandsSpark` and
`QuestionOrbit`; provenance tags and related reading are the existing
components. No CSS file changed on the branch (the built stylesheet keeps
its hash). Typography, colour tokens, spacing and card treatments are
untouched. The Orbit deck copy now says the two Work rosters are just below
and the four Network rosters are on the Network page.

## 3D IMPACT

None. No scene added, removed or re-gated; `useSceneVisibility` and every
`ThreeSafe` boundary are as on `main`. The Experience Lab (`/lab/`) is
untouched and still answers 200 with its own bundle.

## ANIMATION CHOREOGRAPHY IMPACT

- One change in `motion.js`, inside `ScrollToTop`'s hash landing:
  `window.__lenis.resize()` before the immediate `scrollTo`. Lenis learns
  the document height through a ResizeObserver it debounces by 250 ms and
  clamps `scrollTo()` to that height; a legacy URL redirecting into a hub
  renders a bare shell first, so the roster 3800 px down was clamped to
  430 px (the shell's own height, confirmed by reading `lenis.limit` during
  the landing) and only recovered when something above it happened to resize
  inside the 3 s follow window. Measured before the fix: `/work/built-together`
  landed at 430 px in 2 of 5 runs. After: 9 of 9 legacy URLs and 21 of 21
  direct hash loads land on the section.
- Untouched: the Lenis single-source dispatch and settings (`lerp 0.16`,
  `wheelMultiplier 1.2`), the native fallback gating, ScrollTrigger
  integration, pinned-sequence cleanup, the fonts.ready re-scroll, the
  ResizeObserver hash re-measure, the Orbit `overflow-x: clip` fix, GSAP
  timelines and the reveal observers.

## AWS LIVE GATES

- **AMPLIFY HASH REDIRECT — REQUIRES LIVE AWS VERIFICATION.** Rules 1 to 9
  in AWS_PREP.md §B3 (also listed in `amplify.yml`) carry a `#section`
  target. Whether Amplify passes the fragment through in `Location` is not
  proven anywhere in this repository. On the temporary Amplify hostname,
  request each legacy URL and confirm a 301 whose `Location` ends with the
  fragment. If Amplify drops it, replace rules 1 to 9 with type-200 rewrites
  to `/index.html` for exactly those nine paths, so the shell loads at the
  old URL and the in-app `LegacyRedirect` lands the visitor on the section.
- `TRUSTED_PROXY=apprunner` on the App Runner service (unchanged from the
  release candidate).
- Nothing provisioned, no DNS change, nothing pushed.

## FILES CHANGED

35 files against `main` before the documentation commit (928 insertions,
679 deletions):

- Added: `frontend/src/components/LegacyRedirect.js`,
  `frontend/src/components/LegacyRedirect.test.jsx`,
  `frontend/src/lib/commandIndex.test.js`.
- Removed (after the ledger showed zero unmapped items and the destinations
  were verified): `frontend/src/pages/Careers.js`,
  `frontend/src/pages/Collaborate.js`, `frontend/src/pages/WhoWeWorkWith.js`,
  `frontend/src/pages/ecosystem/EcosystemCategoryPage.js`.
- Hubs: `frontend/src/pages/Work.js`, `frontend/src/pages/Network.js`,
  `frontend/src/pages/WhyHiAnzy.js`.
- Data, routing and links: `frontend/src/data/content.js`,
  `frontend/src/App.js`, `frontend/src/components/NextSteps.js`,
  `frontend/src/components/CharacterQuote.js`,
  `frontend/src/components/OrbitSection.js`,
  `frontend/src/components/RelatedReading.js`,
  `frontend/src/pages/home/WhoWith.js`.
- Search and motion: `frontend/src/lib/commandIndex.js`,
  `frontend/src/lib/motion.js`.
- Redirect layers: `frontend/nginx.conf.template`, `vercel.json`,
  `amplify.yml`, `AWS_PREP.md`.
- Generators and their outputs: `frontend/scripts/prerender-metadata.cjs`,
  `frontend/scripts/generate-sitemap.js`, `frontend/scripts/link-graph.cjs`,
  `frontend/scripts/build.test.cjs`, `frontend/scripts/sitemap-lastmod.json`,
  `frontend/public/sitemap.xml`, `docs/frontend-source-lock.json`.
- Documentation: `LAUNCH_STATE.md`, `LAUNCH_TESTS.md`,
  `docs/FINAL_PRODUCT_AUDIT.md`, `docs/FRONTEND_FREEZE_AUDIT.md`,
  `docs/ADR-002-aws-production-architecture.md`, and with this commit
  `docs/IA_CONSOLIDATION_AUDIT.md`, `docs/FINAL_LINK_GRAPH.md`,
  `docs/link-graph.json`.

## COMMITS

On `ia/page-consolidation`, after `main` `0208378`:

| Commit | Subject |
|---|---|
| `0e3e089` | docs(reconcile): record post-merge status and correct stale test references |
| `912f2b1` | refactor(ia): consolidate Work category pages into Work hub |
| `6de0b26` | refactor(ia): consolidate Network roster and participation pages |
| `d069466` | refactor(ia): integrate audience content into Why hiAnzy |
| `0c01628` | fix(routes): preserve legacy URLs with canonical redirects |
| `733b30f` | fix(search): map consolidated sections to distinct search destinations |
| `e6de552` | fix(links): update internal graph to canonical consolidated destinations |
| `729ffcf` | fix(seo): update sitemap prerender and canonical migration |
| `de23e49` | refactor(ia): remove absorbed standalone page components |
| `4dfba95` | fix(scroll): refresh Lenis dimensions before landing on a hash target |
| `4e9df32` | fix(search): keep absorbed pages' rank for the sections that hold them |
| `2b190c6` | fix(sitemap): hash content families in slug order |
| `3f51ec2` | test(ia): verify consolidated route graph and anchor navigation |
| (this commit) | docs(ia): record page consolidation audit |

The approved plan named nine commits; implementation realities split
"fix(search)" in two (the rank fix came out of the new test) and added the
scroll and sitemap fixes found during validation, as the brief allowed.

## VALIDATION GATE (final tree)

| Check | Result |
|---|---|
| `python scripts/check_frontend_lock.py` | Verified 235 unchanged frontend files (236 on `main`: four pages removed, `LegacyRedirect.js` and two test files added); written twice, second write identical |
| `pytest tests` (disposable Mongo on 27117) | 68 passed |
| `npm run lint` | clean |
| `npm test` | 16 passed in 6 files (`main`: 10) |
| `npm run test:build` | 8 passed (`main`: 7) |
| `npm run build` | 67 pages; `sitemap: 67 urls … lastmod moved for 0`; tree clean afterwards |
| `python scripts/check_raw_metadata.py` (preview) | 67 routes + 1 share image |
| `python scripts/check_raw_metadata.py --base http://localhost:8080 --canonical-origin http://localhost:8080` (Docker) | 67 routes + 1 share image |
| `node scripts/link-graph.cjs --md` | 67 pages, 175 links, 0 broken, 0 orphans |
| Secret and artefact scan of `git diff main...HEAD` | no key, token or password pattern; no build output tracked |
| Docker walkthrough (`docker compose build web api && up -d`) | Home, What We Do, How We Work, Work, Network, Why hiAnzy, Insights, `/what-we-do/advisory-security-scale`, `/network/venues`, `/work/a-rebrand-that-turned-out-to-be-a-pricing-problem`, `/insights/a-better-funnel-cannot-rescue-a-confused-offer`, Resources, Contact, Coming Soon: all 200, correct title and h1, `index,follow`, canonical, no page error, no failed request, no horizontal overflow; `/lab/` 200; `/no-such-page` 404 with the not-found title and `noindex,follow`; `/api/health` 404 on nginx (the API is not proxied by nginx, as designed) |
| Docker hubs | Network: four roster ids, `#collaborate`, `#careers`, 16 discipline cards, `#network-specialists` directory intact; Work: `#work-case-studies`, `#orbit`, `#built-here` (3 cases), `#built-together` (2 cases), `#portfolio-wall`; Why hiAnzy: `#who-we-work-with` with 12 audiences |

## KNOWN RISKS

- **P0:** none.
- **P1:** Amplify fragment handling is unverified (AWS LIVE GATES above).
  Until it is, the nine legacy URLs are proven only on nginx and in-app.
- **P2:** Search engines ignore fragments, so the nine retired URLs now
  consolidate onto three hub URLs; the sections are not separately
  indexable. This is the approved outcome of 76 → 67, recorded here so the
  loss of nine indexable URLs is a decision, not a surprise.
- **P3:** nginx absolute redirects carry the container's listen port, so on
  a port-mapped local stack (`localhost:8080` → 80) a followed legacy link
  goes to port 80. Production hosts on 80/443 are unaffected;
  `absolute_redirect off;` would make the `Location` host-agnostic if the
  image is ever run behind a non-standard port.
- **P3:** a late layout settle of 4 to 9 px after the 3 s re-measure window
  on some widths (table under MOBILE); the heading stays clear of the nav.
- **P3:** related reading under the two Work rosters renders nothing
  because the related graph has no entries keyed `built_here` or
  `built_together`; the retired standalone pages made the same component
  call with the same result, so this is unchanged behaviour, noted for a
  content follow-up.

## STOP CONDITION

This branch is not merged into `main`, not pushed, not deployed; no DNS
change and no AWS resource. Nothing moves until the owner has reviewed this
audit and authorises it explicitly.
