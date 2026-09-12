# Backend cleanup and frontend freeze

Completed on 10 September 2026 in `work/hi-anzy-audit`.

## Frontend state

The user's final instruction freezes the frontend. All 347 project frontend files, including the built preview, match the SHA-256 manifest captured at the start of this backend pass. Installed dependencies and disposable caches are excluded. A local ZIP snapshot provides a recovery copy. Project `AGENTS.md` records the freeze for subsequent work.

No frontend source, asset, configuration, dependency or build was changed during this pass. Backend seed content was also preserved. The public website remains at http://127.0.0.1:3100/.

Smooth scrolling already exists: `LenisProvider` is mounted in `App.js`, uses `smoothWheel: true`, and is synchronized with GSAP ScrollTrigger. Reduced-motion preferences disable it; fullscreen exploration deliberately pauses page scrolling. No new scrolling implementation was added.

## Backend changes

- Removed unused code and lengthy historical commentary from `backend/server.py`.
- Reused one admin-access check for enquiries and subscribers.
- Reused one cookie/bearer-token reader for session lookup and logout. Bearer logout now actually revokes the session.
- Validated sign-in provider profiles before database writes and used an atomic account upsert for repeated sign-ins.
- Added clear required-setting errors and checked cookie configuration.
- Bounded SMTP calls with a timeout, sanitized notification subjects and retained saved enquiries when notification delivery fails.
- Used a monotonic clock for rate limiting and rejected non-finite analytics values.
- Closed the database client when startup fails.
- Skipped writes for unchanged seed records, preserving timestamps on restart.
- Included port 3100 in the local development CORS defaults.
- Added a concise backend README with startup, API and test instructions.

No empty source folders were found outside the frozen frontend, dependencies, caches and tool metadata. No application data or useful folders were deleted. The existing sign-in integration was retained because the frozen frontend depends on it.

## Verification

- Baseline: 32 backend regression tests passed.
- After cleanup: 48 regression tests passed against an isolated local MongoDB database.
- Tests cover publication filters, content details, contact persistence and validation, rate limits, subscriber privacy, admin access, sessions, logout, provider failures, SMTP handling, CORS, startup cleanup and unchanged seed writes.
- Only the API was restarted, on port 8111. Its health endpoint reports the database connected.
- All 48 captured public API responses match the baseline, excluding maintenance timestamps. This includes lists, detail pages and category filters.
- All 347 frozen frontend file hashes match after the restart.
- Backend diff whitespace checks passed. Two existing third-party test-client deprecation warnings remain.
- Email delivery and external sign-in were mocked in tests; no real emails or external sign-ins were performed.

## Recent frontend work reviewed, pending an explicit unlock

These items were recorded rather than changed because the user repeated the frontend lock instruction:

- Work infographic copy still uses abstract phrases such as “signal” and “what it proves.” A future content pass should replace these with concrete deliverables and clearly labeled intended uses, avoiding claims of measured client outcomes without evidence.
- Decorative serial labels remain in the archive. Review them separately from meaningful sequence-stage numbers before removing them.
- The motion-graphics infographic data contains duplicate `verb` keys (`MOVE` and `TIMING`); JavaScript currently takes the second one.
- Fullscreen node handlers keep exploration in place and hover fans exist, but the fullscreen touch hint still says “tap again to continue,” which no longer matches that behavior.
- The non-WebGL constellation fallback currently limits the visible categories to twelve although the network has sixteen.
- Hover-only sub-branch extents are not included in the scene's active-selection bounds calculation; narrow-screen clipping needs visual verification before any future layout change.
- Converting static portfolio infographics into motion and revising the visible content require frontend changes. They cannot be implemented through backend cleanup while honoring the freeze.

The frozen state is the state at the start of this pass, including the preceding frontend edits. No earlier work was rolled back.
