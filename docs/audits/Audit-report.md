# hiAnzy audit and local preview

Completed 9 September 2026. The frontend is available at **http://127.0.0.1:3100**. The local API and a real, persistent MongoDB database are running with it.

## Copies

- Original source is unchanged: `D:\claude project\hi anzy website`.
- Full imported backup: `C:\Users\anish\Documents\Codex\2026-09-09\up\work\hi anzy website`.
- Edited audit copy: `C:\Users\anish\Documents\Codex\2026-09-09\up\work\hi-anzy-audit`.

The starting copy contained 54,497 files, including Git history, dependencies, and configuration. Changes were made only in the audit copy. The original design and content were retained. Local configuration uses a separate database, and email delivery is disabled so test submissions remain local.

## Fixes made

| Area | Problem | Result |
| --- | --- | --- |
| Frontend dependencies | 35 known dependency advisories, largely in Create React App tooling | Replaced CRA/CRACO with Vite 7; updated React Router to 7; regenerated the dependency lockfile. Final npm audit: zero known advisories. |
| Local setup | Docker unavailable; no working local Python/MongoDB stack | Installed dependencies into the workspace, launched a real local MongoDB instance, and connected frontend/API through the local proxy. |
| API address | Missing environment value could produce `undefined/api` | Empty backend origin now uses `/api`; trailing slashes are normalized; requests have a timeout. |
| Contact form | Repeated submit actions could write duplicates | Added an immediate in-flight guard and disabled the real submit button while sending. |
| Form validation | Whitespace passed backend minimum lengths; browser fields exceeded API limits | Required inputs are trimmed before validation; browser fields now carry matching maximum lengths. |
| Rate limiting | Contact/subscription requests reported success even when discarded for exceeding the limit | Return HTTP 429 with `Retry-After`; keep honeypot behavior separate. |
| Subscriptions | Public response disclosed whether an email address was already subscribed | Repeat and new subscriptions have the same public response; database upsert and unique index prevent duplicates. |
| Subscription errors | Network failures were described as invalid email addresses | Show distinct validation, save-failure, and rate-limit messages. |
| Sessions | Missing, malformed, or timezone-less expiry could leave sessions usable or raise an error | Invalid and expired sessions are rejected and removed. |
| Auth provider response | Malformed JSON could become an unhandled server error | Return a controlled 502 response; issue a fresh local session token. |
| Database health | Health endpoint returned success when MongoDB failed | Database failures return HTTP 503; connection selection has a bounded timeout. |
| Backend lifecycle | Background rate-pruning task was not explicitly cancelled | Managed startup/shutdown with a lifespan handler and task cleanup. |
| Data integrity | Natural identifiers had no uniqueness enforcement | Added unique indexes for subscribers, sessions, users, and seeded content identifiers. |
| Content loading | Older filter responses could overwrite the current selection | Ignore stale responses for Insights and Network; show retryable failure states. |
| Detail pages | A failed related-content request hid an otherwise valid article/case study | Main content and related content load independently; distinguish unavailable content from 404 responses. |
| Scroll lifecycle | Deferred subscriptions could attach after cleanup | Cancel pending attachment and prevent callbacks after disposal. |
| SEO | Canonical URLs included query strings; check tested a copied implementation | Remove query/hash from canonical URLs; regression test mounts the real SEO component. |
| Sitemap | Local generator did not read the running API configuration | Load local environment; final sitemap includes all 56 routes. |
| Accessibility | Mobile menu dialog lacked an accessible title | Added a real dialog title; verified the named dialog in the browser. |
| Build/deployment setup | Docker and nginx still assumed CRA output | Updated build instructions, Node/npm requirements, Vite asset paths, and missing-asset handling. Docker itself was not run. |

## Verification

Three rounds covered source/dependency review, regression tests, and live browser checks followed by final rebuild/rechecks.

- **32 backend tests passed**, using a uniquely named real MongoDB test database. They cover content APIs, filters, persistence, validation, rate limits, subscriber privacy, admin authorization, invalid session expiry, health failure, and malformed provider responses. Each test database is removed afterwards.
- **5 frontend tests passed**, covering the actual SEO component, duplicate submissions, form limits, subscription network errors, and rate-limit messaging.
- React hook lint passed without warnings after cleanup.
- Production build passed. The configured opacity check passed for 547 color modifiers.
- Sitemap generated all **56 routes**: 19 static, 6 service, 16 discipline, 10 article, and 5 case-study routes.
- Browser traversal rendered all 56 routes at **320 px width** with no document-level horizontal overflow or failed eager images detected. Desktop content routes and representative desktop/mobile screenshots were inspected as well.
- Mobile menu open/navigate/close and the final accessible title were verified.
- Insight category filtering returned the selected category.
- Keyboard package selection populated the contact brief, and a real local contact submission returned success. Email delivery was disabled.
- Static asset reference check found all 18 literal brand/font references it extracted. This is a targeted check, not exhaustive validation of every dynamically constructed URL.
- Final npm and Python dependency checks both report **zero known vulnerabilities**. Machine-readable results are saved beside this report.

## Running it again

Run `Start-hiAnzy.ps1` from this output folder. It starts services on unused local ports and leaves existing listeners alone. It was checked with the current services already running; a full machine-reboot test was not performed.

For editing with hot reload, use `npm start` in the audit copy's `frontend` directory after stopping the preview on port 3100. For a rebuilt preview, run `npm run build` and refresh the browser. The project contains `LOCAL-DEVELOPMENT.md` with setup and test commands.

## Remaining limits

- External Google sign-in and actual email delivery were not exercised. They require their real service setup. Local form persistence works.
- Docker was not running on the host, so the updated container configuration remains unverified by a container build.
- The site is still a client-rendered SPA. Crawlers that do not execute JavaScript do not receive page-specific metadata; prerendering/SSR remains a separate improvement.
- Large lazy 3D bundles still trigger a build-size advisory. Existing animation and design were preserved.
- This is a broad engineering audit with the coverage listed above, not proof that every possible defect or security issue is eliminated. External links, all drag gestures, assistive-technology combinations, load testing, and external service behavior were not exhaustively tested.

The local preview remains running. Audit work has stopped as requested.
