# plan.md (Updated)

## 1) Objectives
- Ship a production-quality, multi-page **hiAnzy** website (React + FastAPI + MongoDB) that clearly positions hiAnzy as a **Business Systems & Transformation Consultancy**.
- Preserve the deck’s **Analog Intelligence** visual DNA in the web: paper canvas, charcoal panels, orange routing-line system, red interventions, B&W cut-out/halftone imagery, editorial asymmetry.
- Deliver purposeful 3D moments with **WebGL fallbacks** and **reduced-motion equivalents**.
- Implement real content plumbing: CMS-like Mongo collections + APIs, contact submissions stored + **optional** email notifications (Resend/SMTP env-driven).
- **Typography system (current):** Two-font system only — **Rajdhani (System voice)** + **Figtree (Human/body voice)**. No other visible fonts.
- Add editorial proof/credibility surface areas without changing approved content: **Proof Strip** below hero (rotating quotes + brand-credit marquee), labelled honestly.
- Maintain responsive spacing and layout integrity across mobile/tablet/desktop; avoid accidental “blank space” and ensure async content never renders invisible.

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation) ✅ Completed
**Core risk = external email notification integration** (Resend/SMTP) + submission pipeline reliability.
1. Implement minimal FastAPI endpoints:
   - `POST /api/contact` (validation, honeypot, store in Mongo, optional email send)
   - `GET /api/health` (basic readiness)
2. Create a standalone **Python test script** to:
   - POST a valid contact payload
   - Verify Mongo write succeeded
   - Verify email send succeeds **only if** env credentials exist; otherwise confirm graceful skip
3. Fix until stable: handle missing creds, timeouts, input sanitization, and consistent API responses.

**Status / Evidence**
- POC test script: **14/14 checks passed**.
- Email notifications: **gracefully skipped** when credentials are not set; submissions are always stored.

**User stories (Phase 1)**
1. As a visitor, I want my contact message to reliably submit so I’m not wondering if anyone received it.
2. As hiAnzy, I want every submission stored in MongoDB so nothing gets lost.
3. As hiAnzy, I want email notifications when configured so the team can respond fast.
4. As a visitor, I want clear, accessible error messages when I miss required fields.
5. As a visitor, I want the form to reject obvious bot submissions without punishing real humans.

---

### Phase 2 — V1 App Development (MVP, end-to-end) ✅ Completed
**Goal:** build the full site with shared nav/footer, motion system, API-backed content, and the key 3D experiences.

1. Frontend foundation
   - Global tokens (paper/ink/orange/red/black/white)
   - Shared layout shell: header nav + persistent **Say Hi** CTA; footer with required copy + micro-interaction
   - Routing (`react-router-dom`) for all required pages + 404
   - `react-helmet-async` for titles/meta + JSON-LD scaffolds
2. Motion + interaction primitives
   - Lenis smooth scroll, GSAP + ScrollTrigger
   - Orange route system: active-nav underline + directional link underlines
   - Magnetic buttons + hover micro-copy
   - `prefers-reduced-motion` support (complete equivalents)
3. Backend V1 (content APIs + seed)
   - Mongo collections: `case_studies`, `network_resources`, `insights`, `contact_submissions`, `analytics_events`, `portfolio_groups`
   - Endpoints:
     - `GET /api/case-studies`, `GET /api/case-studies/{slug}`
     - `GET /api/network?category=`, `GET /api/network/categories`
     - `GET /api/insights`, `GET /api/insights/{slug}`
     - `GET /api/portfolio`
     - `POST /api/contact`, `POST /api/analytics/event`
   - Idempotent seed:
     - **5 case studies** (realistic sample; truthful metrics policy)
     - **33 network resources** with provenance labels
     - **6 insights** in approved voice
     - **8 portfolio groups** migrated from deck (Brand Decks, Packaging, Web Development, E‑Commerce, Motion Graphics, Audio Production, Social Media, TVC & Video Production)
4. Homepage build (approved section hierarchy)
   - Hero + **System Core** R3F scene (lazy-load + fallback)
   - Method: ScrollTrigger scrubbed route travel (no scroll hijack)
   - Network: Constellation teaser + CTA
5. 3D experiences (purposeful + performant)
   - System Core: authored camera, pointer parallax, scroll-driven connection sequence
   - Network Constellation: charcoal scene, clustered categories, focus interaction
   - Fallbacks: static diagram + accessible category list when WebGL fails/reduced-motion
6. Secondary pages
   - What We Do / How We Work / Why hiAnzy / Work (+detail) / Network / Insights (+detail) / Contact
   - Additional editorial pages: Who We Work With, Collaborate, Careers, Resources
7. Contact page E2E
   - Frontend validation + backend submission + success state
8. Conclude Phase 2
   - Run **testing_agent_v3**.

**Status / Evidence**
- Site delivered end-to-end; content APIs and pages operational.

**User stories (Phase 2)**
1. As a visitor, I want to understand quickly what hiAnzy is (consultancy) and what they build (operating systems).
2. As a visitor, I want the homepage 3D to explain “connection → system → ROI” without blocking reading.
3. As a visitor, I want to explore What We Do by outcomes instead of a giant service list.
4. As a visitor, I want to see Work with business context (Situation/GAP/Move/Result) so I can trust the thinking.
5. As a visitor, I want to contact hiAnzy with a clear form and get a human confirmation state.

---

### Phase 3 — Refinement + Brand Deck Alignment ✅ Completed
This phase incorporates user-requested refinements without breaking approved structure/functionality.

1. Deck asset extraction + usage
   - Extracted authentic **hiAnzy wordmark** and halftone cutout art assets from the deck PDF
   - Implemented:
     - Nav uses `/brand/logo-dark.png`
     - Footer uses `/brand/logo-light.png`
     - Deck art used as accents in sections (no content rewrites)
2. Typography system (updated per user request)
   - **Rajdhani = System voice** for headings/nav/buttons/labels/chips/metadata
   - **Figtree = Human/body voice (sans)** for body/leads/editorial statements/quotes
   - Removed/avoided all other visible fonts
3. Fix contact Select bug
   - Replaced shadcn Select components with native `<select>` elements (`select-native`)
4. Proof/credibility surface
   - Added **Proof Strip** below hero:
     - Rotating brand-voice quotes
     - Brand-credit marquee derived from deck references (captioned honestly)
5. Work / Network / Motion refinements
   - Added deck-derived **Portfolio Wall** to Work (8 groups)
   - Network section expanded with improved alignment + filled hero band:
     - Two-column hero layout
     - “Network at a glance” stats panel driven from available data
   - Added character motion surface area:
     - “Architects” character parade on Why hiAnzy (6 character cutouts)
6. Minor 3D texture enhancement (Home)
   - Added deck-referenced halftone dot texture as a **subtle 3JS motion backdrop** (`HalftoneBackdrop`), with static CSS fallback
7. Critical motion-system correctness fix
   - **Bug fixed:** async-fetched content wrapped in `.reveal` could remain invisible forever (IntersectionObserver only observed nodes present at mount)
   - Implemented `MutationObserver` in `useRevealObserver` to observe newly inserted `.reveal` nodes and reveal them correctly
8. Conclude Phase 3
   - Run **testing_agent_v3** again.

**Status / Evidence**
- Testing iteration_3: **100% pass** (backend 14/14, frontend verified, mobile OK, zero console errors).
- Post-test changes (Figtree swap, “NOW WHAT?”, Network hero alignment fill) were compile-checked and verified via Playwright DOM checks + screenshots.

**User stories (Phase 3)**
1. As a visitor, I want reduced-motion mode to keep the site fully understandable without complex animation.
2. As a visitor, I want the typography to clearly separate “systems voice” from “human voice,” while staying fully sans in body reading.
3. As hiAnzy, I want deck-authentic logo/texture language present so the brand feels consistent.
4. As a visitor, I want credibility and proof signals to be visible without needing to open every page.
5. As a visitor, I want Work and Portfolio content to appear reliably (never hidden due to motion/reveal timing).

---

### Phase 4 — Optional Enhancements (only after review) ⏳ Backlog
These are explicitly out of scope unless approved.
- Contact email notifications: configure provider + credentials and enable runtime send (Resend or SMTP)
- Contact attachments (file upload) with size/type limits + secure storage (e.g., S3/R2) + virus scanning option
- Simple internal/admin view for contact submissions (auth optional)
- Real analytics wiring (GA4/Plausible keys) using existing event abstraction
- Replace seeded Work/Network/Insights with production content via Mongo collections (content ops process)
- More case-study transitions (card → detail expand) using safe, non-fragile patterns

**User stories (Phase 4)**
1. As a visitor, I want to attach a brief file so I don’t have to paste everything into a textarea.
2. As hiAnzy, I want to review submissions in a simple internal list so nothing is missed.
3. As hiAnzy, I want to add new insights/work/network entries without code changes.
4. As a visitor, I want the site to remain usable even if WebGL is disabled.

## 3) Next Actions
1. **Optional: enable email notifications** for contact submissions:
   - Resend: provide `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_NOTIFY_EMAIL`, or
   - SMTP: provide `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_NOTIFY_EMAIL`
2. **Content operations:** provide final, production Work/Network/Insights content to replace seeded content (schemas and endpoints already in place).
3. If desired, approve any Phase 4 backlog items (attachments/admin/analytics keys).

## 4) Success Criteria
- Brand positioning is unmistakable: consultancy-first; system-thinking and transformation-led.
- Orange route system consistent across nav, sections, and key interactions.
- 3D moments load lazily, have fallbacks, and never become the only source of meaning.
- All routes render correctly; Work/Network/Insights/Portfolio driven by API data.
- Contact form: validated, accessible, stores in Mongo; email notifications work **when creds provided**.
- Reduced-motion users get a complete experience; keyboard navigation works.
- **Typography spec achieved:** only **Rajdhani + Figtree** visible; correct hierarchy, clamp sizing, no clipping/overflow.
- Reveal/motion system does not hide async-loaded content; no accidental blank gaps introduced.
- No console errors; minimal layout shift; pages are indexable with correct metadata.
