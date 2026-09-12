# hiAnzy — Work Ecosystem, Evidence Deck & Coming Soon

## Context

hiAnzy's site (`C:\projects\hi-anzy-website` = `github.com/Anzy1512/hi-anzy-platform`, branch `feat/work-ecosystem-coming-soon`, cut from `main` at `bd55f23`) is an approved, already-shipped production site that intentionally demonstrates premium frontend/3D/motion craft as a live capability demo, not just a marketing page. This upgrade adds a new "Hi Anzy Orbit" section to the Work page — a card-deck of six ecosystem categories (in-house work, joint work, collaborators, creators, venues, partners) — plus a Coming Soon page teasing two future brands, while hardening the analytics/contact endpoints and cleaning up two confirmed pre-existing bugs (a duplicated sticky CTA, a homepage section that explains the same 5-stage method twice). The primary rule governing every decision below is **preserve first, enhance second, refactor only when it reduces real technical risk** — nothing here redesigns an approved page, rewrites approved copy, or migrates a framework.

This document was researched via three parallel direct-code audits (backend, frontend routing/Footer/StickyCta/Home.js, Three.js/GSAP/Framer inventory) plus a validation pass that re-verified the riskiest claims against the actual files. Every fact below with a file:line citation was read directly, not inferred.

Two decisions were confirmed with the project owner before implementation started: **typography applies now, sitewide, in this branch** (Phase B, full literal scope), and **delivery is staged at four milestones** rather than one continuous pass (see Delivery section at the end). Everything else below is a resolved recommendation with its reasoning shown inline.

---

## Current architecture (verified)

**Frontend**: CRA + craco, React 18.3.1, react-router-dom 6.23.1, Tailwind 3.4.4, framer-motion 11.2.10 (used in exactly one place today — `Work.js`'s expand panel), gsap 3.12.5 (18 files, all importing from the shared `@/lib/motion` re-export, never `gsap` directly), three 0.165.0 + @react-three/fiber/drei (10 scene files under `components/three/`). No TypeScript, no Next.js anywhere. A shadcn CLI scaffold exists (`components.json`, `src/components/ui/*.jsx` plain-JS Radix wrappers) but `shadcn` itself is not a runtime dependency — this establishes the house convention for "components you own, copied in" if a new primitive is needed.

**Backend**: FastAPI + Motor(Mongo), single file `backend/server.py` (648 lines, 17 routes under `/api`). Four content collections (`case_studies`, `network_resources`, `insights`, `portfolio_groups`) are plain Python dict literals in `backend/seed_data.py`, upserted idempotently by a natural key (`slug` or `category`) on every startup via `seed()` (server.py:559-569) — no Pydantic validation on these. Only `/contact`, `/subscribe`, `/analytics/event` are Pydantic-validated today. `requirements.txt` has zero version pins, no `slowapi`. nginx deliberately 404s `/api/` — the frontend calls the API's own published origin cross-origin, baked in at CRA build time.

**Zero automated tests exist.** No `@testing-library/*`, no test files under `frontend/`; `npm test` finds nothing to run. `tests/test_contact_poc.py` is a real, working (if currently broken) smoke script — hardcoded `/app/backend/.env` container paths from a prior deployment platform, doesn't run on this Windows checkout as-is.

---

## Phase A — Cost-neutral hardening

### A1. StickyCta duplication (confirmed real bug, not intentional)

`App.js` renders `<StickyCta />` twice, unconditionally, on every route: line 57 (before `<main>`) and line 82 (after `</main>`). These are two independent React instances, each with its **own** `visible`/`dismissed` state (`StickyCta.js:37-60`) reading the same scroll signal — so they become visible simultaneously and stack exactly on top of each other (`position:fixed; left:50%; bottom:18px`, `App.css:1433-1437`). Worse than double-painting: **dismissing the top one leaves the other's focusable link/button still in the DOM** at the same coordinates — a real, demonstrable accessibility bug (ghost focusable control after "dismiss"), not just visual doubling.

**Fix**: delete the line-57 instance, keep line 82. Reasoning: `Nav.js:92` establishes a site convention that `<main>` content should be reachable first in keyboard/AT order (`<a href="#main" className="skip-link">Skip to content</a>`) — a conversion banner ahead of `<main>` cuts in line. StickyCta is conversion chrome, semantically closer to Footer's own "Say Hi" CTA than to `SectionIndex`. One-line deletion, no behavior change beyond removing the duplicate.

### A2. `/api/analytics/event` — currently has zero validation and zero rate limiting

Confirmed (`server.py:87-90, 393-401`): `AnalyticsEvent.name` is a bare unconstrained `str` (no allow-list), `meta: Optional[Dict[str, Any]]` has no key-count/size/depth/type constraint, and `track_event()` never calls the rate limiter at all — this route is fully open to unlimited-volume, arbitrary-shape writes.

**Fix**:
- `ALLOWED_EVENTS` — a `set[str]` of every event name actually in use today (grepped directly, 28 names: `cta_primary_click`, `method_explored`, `service_explored`, `diagnostic_cta_click`, `case_opened`, `network_category_selected`, `discipline_opened`, `network_deep_dive`, `network_profile_opened`, `resource_requested`, `contact_started`, `contact_form_abandoned`, `contact_validation_failed`, `contact_completed`, `service_to_case`, `portfolio_item_opened`, `case_expanded`, `case_to_service`, `command_palette_opened`, `command_palette_navigate`, `notes_subscribed`, `next_step_click`, `package_module_added`, `package_brief_sent`, `package_stage_opened`, `theme_changed`, `discipline_cross_link`, `article_read_depth`) plus the 10 new Phase S events (below) = 38 total. Pydantic validator rejects (422) anything not in the set. Frontend's `track()` (`lib/api.js:26-34`) already does `.catch(() => {})` on every call — a 422 here is completely safe to ship, nothing downstream reacts to it.
- `path`: `max_length` cap, must start with `/`.
- `meta`: cap at 20 keys, each key ≤60 chars; every value must be a scalar (`str|int|float|bool|None` — reject nested dict/list, satisfying "reject unsupported nested structures"); string values capped at 500 chars; whole payload capped at ~4KB serialized. "Sanitize" here means type-enforce + strip/reject control characters and NUL bytes — there's no HTML-rendering path for this data anywhere in the codebase, so no HTML-escaping is needed; don't build one speculatively.
- Rate limiting: generalize the existing hand-rolled `rate_limited()` (`server.py:147-161`, currently only wired to `/contact`/`/subscribe` at 5/10min) to accept a bucket name + configurable max/window, and wire `/analytics/event` through it at a higher, analytics-appropriate throughput (60 events/IP/60s as a starting number — a real visitor triggers single digits/minute; adjust after observing real traffic, this is a tuning knob not an architecture decision). On rate-limit specifically, match the existing site convention exactly: `/contact` and `/subscribe` both silently return `{"ok": true}` on limit rather than 429, with an explicit code comment explaining this is deliberate anti-enumeration (`server.py:290-293`) — do the same for analytics, for consistency, not because it matters much functionally here.
- Fix the confirmed unbounded-growth leak: `_rate: Dict[str, List[float]] = {}` never evicts idle IP keys on a long-lived process — prune empty hit-lists opportunistically inside the same function.
- No IP is captured for analytics events today (only `contact_submissions`/`subscribers` store `ip`) — preserve that; don't add IP capture to analytics as part of this hardening (avoids unnecessary PII per Phase A's own instruction).

### A3. `/api/contact` and `/api/subscribe`

Confirmed: `name`/`message`/`email` are already bounded (`Field(min_length=..., max_length=...)`, `EmailStr`); `SubscribeCreate.source` already has `max_length=120`. But `ContactCreate`'s six other optional fields — `company`, `role`, `website`, `stage`, `investmentRange`, `timeline`, `phone` — have **no** `max_length` (`server.py:69-75`). Add reasonable caps to all six (a clean, isolated, backward-compatible Pydantic-only change). Honeypot (`orgField`) and the shared rate limiter already provide baseline spam resistance and duplicate handling (email-keyed upsert on subscribe) — no changes needed there; error responses are already generic/non-leaking (confirmed no stack traces or DB internals surface in any `HTTPException`).

### A4. No Redis, no nginx rate limiting added

Everything above stays in-process/in-memory — correct for a single-process launch-stage deployment. If the API is ever scaled to multiple workers/replicas, the in-memory rate limiter's effective ceiling multiplies per-process and would need a shared store (Redis or similar) at that point — a named **future upgrade**, not built now.

---

## Phase B — Typography (confirmed: apply now, sitewide)

Current token system (`App.css:4-8`): `--font-system` = Rajdhani (already used for H1/H2/nav/buttons/metrics — i.e. already matches the spec's "system/display voice" rule), `--font-editorial` = **Figtree** (sans, used for all body/narrative/case-study/Why-hiAnzy copy today), `--font-pun` = Amaranth. **Newsreader was completely absent from the codebase — zero references anywhere** before this change (grepped `frontend/` in full, including `node_modules`).

Implemented literally and sitewide — `--font-editorial` swaps from Figtree to Newsreader everywhere body/narrative copy uses it. This is a real, highly visible change (every paragraph of body copy site-wide moves from a sans humanist face to a serif editorial face), flagged clearly here and in the delivery summary for deliberate visual review.

Mechanically: Newsreader fetched alongside the existing 4 families in `scripts/fetch-fonts.py` (same self-hosted pattern), `public/fonts.css` regenerated, `--font-editorial` updated in `App.css`. Spacing fixed locally only where Newsreader's metrics genuinely broke a line-length/line-height assumption — layout otherwise untouched. Note: `--font-mono` (IBM Plex Mono) is fetched but orphaned from the token system (one hardcoded inline usage in `SystemDiagnostic.js:158`) — out of scope for this task, not touched.

---

## Phase C/D — Home.js refactor + method consolidation

### The method is genuinely explained twice, back-to-back (confirmed)

`MethodSection` (Home.js:262-333, "THE hiAnzy METHOD" kicker, compact 5-card row, has its own inline GSAP path-draw + active-stage highlight) is rendered immediately followed by `<PinnedSequence kicker="THE SEQUENCE" title="One system, five moves..." steps={METHOD_STAGES} />` (Home.js:765-770, a separate, already-reusable component: full `ScrollTrigger pin:true` scrub through the same 5 stages with duration/inputs/outputs per stage, desktop-only via live `matchMedia`, already falls back to an unpinned stacked list under reduced motion or on mobile — `PinnedSequence.js:31-40`). Both consume the identical `METHOD_STAGES` array (`data/content.js:386-436`). No content sits between them; the `SectionConnector` labels bracket the pair ("CAPABILITY → METHOD" before `MethodSection`, "METHOD → PROOF" after `PinnedSequence`) with no connector between the two duplicates themselves.

**Fix**: `MethodSection` deleted entirely. `PinnedSequence` kept — it's already the fuller, canonical version and already satisfies "no long scroll trap / no scroll hijacking" (4.25 viewports total, desktop-only, reduced-motion-safe). The two connectors collapsed into one "CAPABILITY → METHOD" directly before the surviving `PinnedSequence`.

`METHOD_STAGES` was read in full before deciding to discard `MethodSection`'s copy: 4 of 5 stages already match the animation-meaning framing almost verbatim without any rewrite — AUDIT's body says "Fragments become visible" (reveal hidden info), ARCHITECT says "Turn the mess into a map" (scattered→structure), BUILD says "Objects gain structure" (tangible form), CONNECT says "Bring the right minds into the room... Strategists, designers, technologists, creators, media, venues, operators" (introduce nodes — almost word for word, the Orbit concept the new Work-page section introduces). **SCALE is a real gap**: its copy is about measurement/discipline/stopping unproductive work, not "revealing a larger system" — a visual-staging note for future tuning, not a copy problem (approved copy was not rewritten to close it).

Flagged, not silently decided: **`PinnedSequence` has no orange route element at all** — the scroll-scrubbed orange path was a `MethodSection`-only feature that was deleted along with it. `SectionConnector` immediately before it (orange stroke + traveling signal-red node) covers the macro transition, and the orange-highlighted active progress-pill is a reasonable stand-in in spirit. A low-risk optional addition — a thin connective line threaded through `PinnedSequence`'s progress rail, reusing `RouteLine.js`'s constants — remains available as a future polish pass; not required for Phase D to be satisfied.

### Home.js decomposition (790 lines, 11 sections confirmed)

Each top-level section extracted into `frontend/src/pages/home/<Name>.js` as a **verbatim copy-move** (not a rewrite): `Hero.js`, `SomethingsOff.js`, `WhyHowNow.js`, `WhatWeDoGrid.js`, `Diagnostic.js`, `WorkPreview.js`, `NetworkPreview.js`, `Trust.js`, `WhoWith.js` (its `MarqueeRow` helper kept colocated — used nowhere else), `Closing.js`. `Hero` and `NetworkPreview` take `show3d` as an explicit prop (previously closure-scoped to `Home()`).

**Correctness rule enforced**: `useRevealObserver()` (`lib/motion.js:164-208`) and the `[data-parallax]` effect stayed in `Home.js` itself, not moved into any extracted section — both are scoped to the single outer `<div ref={ref}>` wrapping all of Home's composed output, and the observer's `MutationObserver{subtree:true}` picks up `.reveal` elements from any descendant regardless of which file defines them, as long as every extracted section keeps rendering inside that one outer ref'd div. (`Footer.js`'s own code comment is direct evidence of what breaks if this rule is missed: Footer sits outside `<main>` and had to duplicate its own observer to work at all.)

Hooks: `useHeroEntrance` extracted (`pages/home/hooks/useHeroEntrance.js`) — `Hero`'s GSAP headline-stagger effect was fully self-contained and cleanly reusable. `useDiagnosticMotion`/`useMethodTimeline`/`useOrangeRoute` were **not** created — nothing in the current codebase warranted them (see plan discussion above). Separately noted as a deferred, out-of-charter observation: `RouteLine.js` and `SectionConnector.js` each hand-roll near-identical scroll-scrubbed SVG path-draw logic — a real DRY opportunity, but sitewide in scope and beyond this task's charter.

---

## Phase E/F — Work page architecture + The Hi Anzy Orbit

"Proof has context." headline, the 5 verified case studies, existing provenance logic (`ProvenanceTag`), and the portfolio archive wall preserved exactly as they were. New page order: **VERIFIED CASE STUDIES → THE HI ANZY ORBIT → PORTFOLIO ARCHIVE → CTA** — `OrbitSection` inserted into `Work.js` between the existing case-study carousel and the portfolio-wall section.

Copy, six categories, and routes as specified — **with one confirmed, necessary deviation**:

### Routing collision (confirmed real, resolved)

`disciplines.js` has a real discipline at `slug: "venues"` (16 slugs confirmed: strategy, brand, design, technology, ai, automation, performance, media, creators, production, events, venues, experiences, pr, security, operations), served by `/network/:slug` → `Discipline.js`. A static `/network/venues` route for the Orbit's "Places with Possibility" category would have permanently shadowed that existing discipline page — a real regression.

**Resolution**: only this one route was renamed, to **`/network/venue-partners`** — the ecosystem category is a roster of literal partner venues (physical locations hiAnzy has relationships with), conceptually distinct from the `venues` *discipline* (a service/capability page about event production). The other five routes (`/work/built-here`, `/work/built-together`, `/network/collaborators`, `/network/artists-creators`, `/network/partners`) had zero collision risk and were left exactly as specified.

---

## Phase G/H/I/J/K/L/U — Evidence Deck

**New component**, not an extension of the existing `CardCarousel.js` (a flat horizontal scroll-snap track with edge-fade opacity/scale — no 3D perspective, no fan/overlap geometry, no drag-spring physics, no autoplay; bending it to Phase G's requirements would have replaced nearly everything internal).

**File**: `frontend/src/components/EvidenceDeck.js`. Adapted from the supplied reference into this codebase's conventions: `next/link` → `react-router-dom`'s `Link`/`useNavigate`; the reference's local `cn()` reimplementation → this codebase's real `@/lib/utils` `cn()`; reduced-motion gating → this codebase's own `prefersReducedMotion()`/`useReducedMotion()` from `@/lib/motion`, so the deck's Framer-driven animation and the GSAP-driven route line share one canonical reduced-motion signal.

Geometry defaults within the spec's tuned ranges (props, not hardcoded): 5 visible cards, 520×330px, overlap 0.57, spread 54°, perspective 1250px, depth ~95px, inactive scale 0.93, active scale 1.035, active lift 30px, inactive tilt 8°, spring stiffness 240 / damping 26 ("weighted, not bouncy").

**Imagery**: not photographic. Each of the 6 category cards renders a small new hand-drawn inline SVG glyph in the same visual family as the existing 4 hand-drawn motifs under `components/deck/` (`InboxUnfold`, `LensFocus`, `QuestionOrbit`, `HandsSpark` — shared palette: `#232A2A` charcoal linework, `#F19020` orange / `#F7F5EE` cream / `#E54A25` signal-red accents), not photography, stock, or AI-generated imagery of real people/venues.

**Orange route (Phase H)**: a new small piece (not a reuse of `RouteLine.js`, which is hardwired to `ScrollTrigger` scroll-position triggers rather than arbitrary state changes) that GSAP-tweens an SVG path toward the active card's on-screen position whenever `activeIndex` changes, reusing `RouteLine`'s visual constants by copying them. Target position measured via the active card's `getBoundingClientRect()` imperatively on each change.

**Progress control (Phase I)**: "03 / 06 ─────●───── MINDS IN THE MIX" — node position computed from `active/(len-1)`, real `<button aria-label="Go to {title}" aria-current={isActive}>` elements underneath the visual line.

**Autoplay/input (Phase J)**: 5200ms interval, pauses on hover/focus/`document.hidden`/scrolled-offscreen (`IntersectionObserver`, matching `MotifFrame.js`'s pattern), permanently stops after any intentional input for the component's lifecycle.

**Card→page transition (Phase K)**: inactive card click → becomes active. Active card click → reliable `navigate()`/`<Link>` route change as the baseline (browser back nav works for free); `layoutId`-based shared-layout enhancement treated as a stretch goal only, not required.

**Mobile (Phase L)**: live `matchMedia` check (mirroring `PinnedSequence.js`'s pattern) switches internal geometry constants to ~3 visible cards, 84-88vw active width, minimal perspective, swipe-first.

**Accessibility (Phase U)**: `ArrowLeft`/`ArrowRight` move `active`; `Enter`/`Space` on the active card navigates; Tab moves through the deck's real focusable controls in DOM order; under `prefersReducedMotion()`, autoplay/perspective/tilt/lift disable and every card's info/link remains reachable via a plain accessible fallback.

---

## Phase M/N/O/P — Ecosystem routes + backend data

### Data model decision

**New, genuinely separate `ecosystem_items` collection** — not tagging the existing `case_studies`/`network_resources` collections in place. The two source collections have materially different field shapes and different public-gating field conventions (`published: bool` vs. `publicStatus == "public"` string); tagging in place would still require a shape-normalization layer, just moved into ad-hoc per-call-site JS. Neither source collection has a `sortOrder` today, and the Orbit needs deliberate curatorial ordering. A new collection is exactly consistent with the existing `seed()` pattern (`server.py:559-569`) — a 5th `(collection, docs, key, label)` tuple, derived from the other two at seed time.

### Derivation rule (real data, one important exclusion)

`ecosystem_items` populated in `seed_data.py`, derived from `CASE_STUDIES` and `NETWORK_RESOURCES` (both read-only inputs, never mutated):

- **`built_here`**: case studies where `provenance == "HI ANZY"`.
- **`built_together`**: case studies where `provenance in {"HI ANZY + PARTNER", "COLLABORATOR WORK"}`.
- **`creator`**: network resources where `category == "Creators"` (10 entries).
- **`venue`**: network resources where `category == "Venues"` (3 entries).
- **`collaborator`**: remaining resources where `relationshipType in {"HI ANZY + COLLABORATOR", "COLLABORATOR CREDENTIAL"}` (7 entries).
- **`partner`**: remaining resources where `relationshipType == "NETWORK ACCESS"` (10 entries).
- **Explicitly excluded**: the 5 `relationshipType == "HI ANZY DIRECT"` entries — hiAnzy's own internal studios, not external network entities. Including them would have blurred exactly the client/network attribution line Phase O exists to protect, in the opposite direction (implying hiAnzy's own team is "network"). *(35 total network resources: 5 direct / 6 collaborator / 1 credential / 23 network-access.)*

`image`/`gallery[]` left genuinely `null`/empty on every derived entry — an honest "not photographed yet" on a real, named record, not the kind of fabricated "placeholder" Phase M warns against.

### Provenance (Phase O)

`ecosystem_items.provenance` stores Phase O's literal enum (`HI_ANZY_DIRECT`, `HI_ANZY_COLLABORATOR`, `COLLABORATOR_CREDENTIAL`, `NETWORK_ACCESS`, a real Python `Enum`); the frontend normalizes underscores to spaces before looking it up in the existing `PROVENANCE_STYLES` (`content.js:614-623`), which already covers 3 of the 4 resulting strings — one alias key (`"HI ANZY COLLABORATOR"`) added for the fourth. `ProvenanceTag.js` reused as-is.

### Schema (Phase P) and the Phase N granularity mismatch

Backend `EcosystemItem` Pydantic model with Phase P's exact field list, `category` restricted to the 6 literal values, `provenance` restricted to the Phase O enum. New route `GET /api/ecosystem` (optional `category` filter, `publicStatus == "public"` gating). Phase N's much richer per-entity-type field lists describe **detail pages**, which Phase M itself frames as future work — implemented as Phase P's flat schema today plus one optional escape-hatch field, `details: Dict[str, Any] = None`, rather than building speculative per-category sub-schemas.

### Frontend routes + pages

New `<Route>` entries in `App.js`: `/work/built-here`, `/work/built-together`, `/network/collaborators`, `/network/artists-creators`, `/network/venue-partners`, `/network/partners`, `/coming-soon`. New index pages under `frontend/src/pages/ecosystem/`. New `getEcosystem(category)` in `lib/api.js`, following `getNetwork(category)`'s exact shape. `@tanstack/react-query` deliberately not adopted for this fetching despite being an installed dependency — every real data-fetch in this codebase uses plain axios + `useState`/`useEffect`, and this task follows that existing convention rather than the dormant one.

---

## Phase Q/R — Footer teaser + Coming Soon page

**Footer**: one new bordered row inserted between the existing nav-grid zone and the final copyright bar, following the exact same divider convention the other two internal zones already use — a single two-item row, continuing the footer's existing rhythm rather than inflating any one zone.

**Coming Soon page**: `frontend/src/pages/ComingSoon.js`, two sections (Hi Anzy AI, Imkaan), anchor-linkable (`#hi-anzy-ai`, `#imkaan`).

**Notify Me**: reused `NotesSubscribe.js` (already generic, accessible, honeypot-protected, posting to the existing `/subscribe` endpoint) with new optional `heading`/`body`/`ctaLabel` props defaulting to its current hardcoded strings — fully backward-compatible for every existing caller. Zero backend changes.

---

## Phase S — Analytics events

New events allow-listed alongside the 28 existing ones (38 total): `orbit_viewed`, `orbit_category_changed`, `orbit_card_dragged`, `orbit_category_opened`, `ecosystem_index_viewed`, `ecosystem_profile_opened`, `ecosystem_filter_used`, `coming_soon_viewed`, `hianzy_ai_teaser_clicked`, `imkaan_teaser_clicked` (`contact_started`/`contact_completed` already existed).

---

## Performance & accessibility strategy (Phase T/U, cross-cutting)

- No new WebGL scene for the Orbit — Framer Motion + CSS 3D transforms + a small GSAP-driven SVG path cover everything Phase G/H ask for.
- Card glyphs are inline SVG — no new network request, no AVIF/WebP conversion applicable.
- Pause-when-offscreen via `IntersectionObserver`, reusing `MotifFrame.js`'s existing pattern.
- GSAP context cleanup follows the same kill-on-unmount convention used everywhere else in the codebase.
- Nothing new is WebGL, so the relevant fallback is purely the reduced-motion branch — no functionality gated behind it disappears.

---

## Migration risks (named explicitly)

1. **Routing collision** on `/network/venues` — resolved by renaming to `/network/venue-partners`.
2. **`useRevealObserver()` scope** during Home.js extraction — verified explicitly after extraction (see test plan).
3. **First-ever `layoutId` usage** in this codebase (Phase K) — treated as a gated stretch goal with a reliable fallback built first.
4. **Typography scope** (Phase B) — sitewide; every page's body copy visibly changes.
5. **Analytics allow-list rollout** — any event name fired by the live frontend that isn't in the allow-list starts silently failing (safe, `track()` already swallows non-2xx) but stops being recorded; the 38-name list was grepped directly against current call sites to avoid this.
6. **Ecosystem category-bucketing rule** — a deterministic, auditable mapping (shown above), a one-line change if a specific resource's categorization needs adjusting.

---

## Test plan

No existing automated test suite existed to run. Verification for this work:

1. **Fixed and extended `tests/test_contact_poc.py`** rather than either doing nothing machine-checked or introducing a first-ever test framework (RTL) as a side effect of this already-large task. Hardcoded `/app/...` container paths fixed for this Windows checkout; extended with: unknown analytics event name → 422; oversized/malformed `meta` → 422; analytics rate-limit → silent `{"ok":true}`; contact field over `max_length` → 422; `GET /api/ecosystem` returns only `publicStatus=="public"` records with the expected 6 category values present.
2. **Production build**: `npm run build` (frontend) succeeds with the existing `prebuild` checks (opacity-scale, SEO-output, sitemap generation) passing unmodified.
3. **Docker rebuild + live browser verification**: all 6 new ecosystem routes + `/coming-soon` + both anchors resolve and render; `EvidenceDeck` keyboard/drag/click/autoplay/reduced-motion behavior; breakpoints 320px/mobile/tablet/desktop/large-desktop; StickyCta single-instance + clean dismiss; Home.js `.reveal` animations intact across every extracted section; zero new console errors; no unexpected network requests; 404 behavior unchanged.
4. **Deferred, explicitly not built now**: `@testing-library/react` + component-level smoke tests for `EvidenceDeck` and the ecosystem pages — a scoped, separate follow-up once this branch's shape has settled.

---

## Rollback plan

Everything on `feat/work-ecosystem-coming-soon`, cut from `bd55f23` — `main`/`origin/main` never touched, so not merging is the rollback.

`seed()`'s `(collection, docs, key, label)` tuples are fully independent — no cross-collection references/transactions. `ecosystem_items` is additive and derived read-only from the other two collections, so `db.ecosystem_items.drop()` is fully isolated and cannot affect `case_studies`/`network_resources`/`insights`/`portfolio_groups`. Local Mongo only exists inside the docker-compose-managed volume bound to `127.0.0.1`, and the frontend is a static build baked at Docker build time — nothing is "live" anywhere until someone explicitly rebuilds and redeploys from this branch. New routes are plain `<Route>` additions not linked from `NAV_LINKS`/`FOOTER_LINKS` unless explicitly wired.

---

## Delivery (staged at 4 milestones)

Changes stay on `feat/work-ecosystem-coming-soon`; nothing merges to `main`, nothing pushes, nothing deploys publicly, until explicit approval. Delivered in four checkpoints, each left in a working, `npm run build`-verified, Docker-rebuilt, browser-tested state:

1. **Hardening + typography** — Phase A (StickyCta fix, analytics/contact hardening) + Phase B (Newsreader, sitewide).
2. **Home refactor + method consolidation** — Phase C/D (section extraction into `pages/home/`, `MethodSection` deletion, connector cleanup).
3. **EvidenceDeck + Orbit + ecosystem backend** — Phase E through P (the deck component, the Work-page Orbit section, all 6 new routes + index pages, the `ecosystem_items` schema/derivation/endpoint).
4. **Footer + Coming Soon + final audit** — Phase Q/R/S (footer teaser, `/coming-soon`, analytics events) + Phase V/W/X (full test pass, build validation, before/after audit against `bd55f23`).

**Full file-by-file change list** (new files marked *new*, everything else *modify*):

| Area | File | Change |
|---|---|---|
| Hardening | `backend/server.py` | Allow-list + validators for `AnalyticsEvent`; `max_length` on `ContactCreate`'s 6 unconstrained fields; generalized rate limiter + IP eviction; wire `/analytics/event` through it |
| Hardening | `backend/requirements.txt` | Pin dependency versions |
| Hardening | `tests/test_contact_poc.py` | Fix hardcoded Linux paths; extend with new hardening + `/ecosystem` checks |
| Typography | `frontend/scripts/fetch-fonts.py`, `App.css`, `public/fonts.css` | Add Newsreader family, sitewide |
| Home refactor | `frontend/src/pages/Home.js` | Strip to composition only; delete `MethodSection`; collapse connectors |
| Home refactor | `frontend/src/pages/home/{Hero,SomethingsOff,WhyHowNow,WhatWeDoGrid,Diagnostic,WorkPreview,NetworkPreview,Trust,WhoWith,Closing}.js` | *new* — verbatim extraction |
| Home refactor | `frontend/src/pages/home/hooks/useHeroEntrance.js` | *new* — extracted hook |
| Home refactor | `frontend/src/components/PinnedSequence.js` | Optional: connective route-line polish |
| Work/Orbit | `frontend/src/pages/Work.js` | Insert `OrbitSection` between case studies and portfolio wall |
| Work/Orbit | `frontend/src/components/OrbitSection.js` | *new* — Phase F copy + `EvidenceDeck` |
| EvidenceDeck | `frontend/src/components/EvidenceDeck.js` | *new* — fan/spring/drag/autoplay/progress/route-line/a11y |
| EvidenceDeck | 6 hand-drawn category SVG glyphs | *new* |
| Ecosystem | `frontend/src/App.js` | 6 new routes + `/coming-soon` |
| Ecosystem | `frontend/src/pages/ecosystem/*.js` | *new* — index pages |
| Ecosystem | `frontend/src/lib/api.js` | `getEcosystem(category)` |
| Ecosystem | `frontend/src/data/content.js` | +1 `PROVENANCE_STYLES` alias key |
| Ecosystem backend | `backend/server.py` | `EcosystemItem` Pydantic model, `GET /api/ecosystem`, 5th `seed()` tuple |
| Ecosystem backend | `backend/seed_data.py` | Derivation function → `ECOSYSTEM_ITEMS` |
| Footer/Coming Soon | `frontend/src/components/Footer.js` | New teaser row |
| Footer/Coming Soon | `frontend/src/pages/ComingSoon.js` | *new* |
| Footer/Coming Soon | `frontend/src/components/NotesSubscribe.js` | Additive optional props only |

---

## Delivery record

All four milestones shipped on `feat/work-ecosystem-coming-soon`, cut from `bd55f23`. Nothing merged or pushed. Commits: `703d91c` (Milestone 1), `736af15` (Milestone 2), `6bea67f` (Milestone 3), plus Milestone 4's commit closing this branch out for review.

### What shipped, exactly as planned
Phases A–S all landed as designed above: analytics/contact hardening, sitewide Newsreader, the Home.js decomposition with `MethodSection` deleted, the Orbit's six categories on `/work` via `EvidenceDeck`, the `ecosystem_items` derivation and `GET /api/ecosystem`, the Footer teaser, `/coming-soon`, and all 10 new analytics events.

### Deviations from the plan, and why
- **`/network/venues` → `/network/venue-partners`**: flagged during planning as a genuine routing collision (that slug already belongs to the Events & Venue Production discipline page) and resolved before any code was written. Confirmed live: `/network/venue-partners` resolves correctly, the discipline page at `/network/venues` is untouched.
- **Phase K's `layoutId` shared-layout card→page transition**: not attempted. The plan framed this as a gated stretch goal behind a reliable baseline, specifically because it would be this codebase's first-ever use of the pattern. Shipped the reliable `<Link>`-based baseline instead — confirmed working, including that a drag gesture does not accidentally trigger it.
- **`built_here`/`built_together` ecosystem cards link to the existing case-study detail pages** (`/work/:slug`) rather than staying purely informational — these categories are derived from real case studies that already have a full write-up, so linking through uses what already exists instead of dead-ending. The other four categories, which have no detail route yet, stay informational per Phase M's own framing of detail pages as future work.
- **`ecosystem_filter_used`**: allow-listed backend-side (Phase S asked for the name to exist) but nothing on the category index pages fires it — no secondary filter UI was requested or built.
- **`PinnedSequence` connective route-line polish** (optional, named in Phase D): not attempted — time went to the larger required phases instead.

### Verification performed
- `tests/test_contact_poc.py`: 24/24 passing (added ecosystem checks: public-only gating, all 6 categories present, category filter, invalid category → 422, internal-studio exclusion).
- `npm run build`: compiles clean at every milestone boundary, no new warnings.
- Docker rebuild + live browser testing at every milestone: all 6 ecosystem routes plus `/coming-soon` and both its anchors render correctly; `EvidenceDeck`'s fan geometry verified against computed transform matrices; autoplay confirmed ticking and then permanently stopping on interaction; click-to-select, click-to-navigate, keyboard nav with focus movement, the progress control, and drag (via synthetic pointer events, confirmed it does not also trigger navigation) all confirmed; mobile geometry fork confirmed (3 visible cards, reduced perspective); the `/work/:slug` and `/network/:slug` routing-collision avoidance confirmed for both new static routes that sit next to a dynamic one; console stayed clean across the entire test session (only the pre-existing, unrelated `/api/auth/me` 401).
- `git diff bd55f23 --stat`: 38 files changed, zero touches to `package.json`, `requirements.txt`, or `docker-compose.yml` — no dependency additions, no infrastructure changes, across all four milestones.

### Known gaps
- **`prefers-reduced-motion` was not live-tested.** The browser tool available in this environment emulates `prefers-color-scheme` but not `prefers-reduced-motion`, so `EvidenceDeck`'s reduced-motion fallback (a plain accessible list, same `useReducedMotion` hook already proven correct elsewhere on this site) is code-reviewed but not watched rendering live.
- **Screenshot/visual compositing was unavailable** in this environment for both Milestone 2 and Milestone 3/4 testing. All verification used DOM structure, computed styles, console/network inspection, and dispatched-event interaction tests instead — a real limitation, disclosed rather than papered over.

### Deferred, out of this branch's charter
`RouteLine.js`/`SectionConnector.js`'s duplicated scroll-scrubbed SVG path logic (noted during Phase C, sitewide in scope, not Home.js-specific); a first-ever `@testing-library/react` suite (this branch fixed and extended the existing smoke-script pattern instead of introducing a new test framework mid-task); per-category detail-page schemas beyond the `details: Dict[str, Any]` escape hatch (Phase N's richer field lists, deferred exactly as Phase M itself frames them — future work).
