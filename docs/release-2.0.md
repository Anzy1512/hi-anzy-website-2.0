# Website 2.0 release review

This release preserves the site's layout, styles and existing animations. The earlier audited project remains unchanged as a recovery copy.

## Functional fixes

- The network's lightweight fallback exposes all 16 disciplines and every subbranch. Touch selection works even when the browser emits a mouse-style click after a touch.
- Fullscreen network exploration stays in fullscreen and shows branches without scrolling to the page below. Its instructions now describe that behavior.
- A duplicate portfolio configuration key was removed without changing its effective value. Lint now catches duplicate keys.
- Sitemap generation uses the documented local API port and includes the available detail pages.

## Backend and repository organization

The backend retains the completed cleanup: shared authentication and admin checks, reliable logout, validated profile updates and configuration, bounded email requests, sanitized email subjects, atomic user upserts, and clean database shutdown. Public API contracts remain compatible with the frontend. See `backend/README.md` for the server's organization.

Docker now forwards the documented SMTP and sender settings. Development test dependencies and local setup instructions are included. Historical design and implementation notes live in `docs/project-notes`. Local environments, credentials, dependency folders, generated builds, reference documents and recovery archives are excluded from Git. No empty source directories remained to remove.

## Validation

- Backend: 48 tests passed against local MongoDB.
- Frontend: 8 tests across 3 files passed, including network fallback regressions.
- Frontend lint and production build passed. The existing large-bundle advisory remains.
- Sitemap: 56 URLs generated from static routes and API content.
- Release source manifest: 223 frontend files verified. Original frontend backup: 347 files unchanged.
- Browser checks confirmed fullscreen branch expansion without page scrolling, the portfolio sections, official email links, and no browser error logs during those checks.

External email delivery and third-party sign-in were not exercised with real accounts. Docker deployment was not run. The source manifest detects later changes; it does not make files read-only.
