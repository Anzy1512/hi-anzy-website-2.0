# Fix report — 16 September 2026

The September 15 audit's code fixes are implemented. The existing layout, styles, 3D scenes and scroll animations are preserved. Production launch still needs the configuration and checks listed below.

## Completed

- Enquiries are saved before notification, with delivery state, retries, recovery after worker restarts, and protected review/retry operations. A local operations console supports daily follow-up without adding a public admin screen.
- Newsletter signup now has confirmation, expiry, unsubscribe and a consent-aware campaign command. Sending requires an explicit `--send`; reruns skip deliveries already recorded as sent. No real campaign or test email was sent during this work.
- Partial sitemap API failures preserve the unavailable route family independently. Successful empty responses remove outdated entries; malformed responses use the fallback.
- Resource engagement events are accepted by the API. A regression test checks the frontend's event names against the backend allowlist.
- Builds generate route-specific HTML metadata for 56 public routes, including case studies and articles. Titles, descriptions, canonical URLs and sharing images are available in the raw HTTP response. This prerenders the HTML head; the page body remains React-rendered. The current content uses the existing branded sharing image; supplied content images are supported.
- Authentication endpoints can be configured, and failed session exchanges show an error. The default provider remains compatible with the existing login flow.
- Added an operations guide and GitHub Actions checks for backend, frontend, build behavior, source integrity and raw HTML metadata.

## Verification

- 59 backend tests passed against an isolated MongoDB test database.
- Eight frontend tests and six build/sitemap regression tests passed.
- Frontend lint, opacity/SEO checks and production build passed.
- HTTP checks verified metadata for all 56 public routes and the shared image without executing JavaScript.
- The local network page loaded its specialist sections, showed no document-wide horizontal overflow at the inspected desktop size, and produced no captured console errors.
- The CSS asset remains `index-CoT5t6nV.css`. No animation implementation or layout styling was edited.
- The original project remains separate; its 347-file source lock is retained. The release manifest is refreshed only for the intentional changes in this report.

The earlier npm failure was a sandbox filesystem restriction. npm itself is working; reinstalling it was unnecessary. Docker's engine is not running, so container execution has not been verified. Large JavaScript bundle warnings remain; this pass does not establish a mobile performance budget.

## Intentional frontend changes

Build scripts and deployment configuration now serve route metadata. The authentication helper accepts a compatible provider override and reports exchange failure. Newsletter success text explains confirmation. Decorative case-banner/essay serials were removed; meaningful process stages remain. Historical relationship verification labels now say “Last verified” without inventing newer dates. The metadata component's obsolete comments were removed. These are functional and limited text changes, not a visual redesign.

## Still required before production

1. Configure an email provider and verified sender, then verify real delivery, confirmation and unsubscribe on the deployed origins. `CONTACT_NOTIFY_EMAIL` is already the official address; provider credentials are not configured.
2. Supply the operator's verified sign-in address in `ADMIN_EMAILS`. An empty allowlist intentionally denies web administration. Review existing enquiries locally in the meantime.
3. Choose the production host and set the website/API origins, HTTPS, CORS and secure-cookie settings. Verify a real provider login, session refresh and logout there.
4. Start Docker and validate the complete container deployment. Run a staging backup/restore drill and assign backup retention and daily enquiry-review ownership.
5. Confirm the accuracy of portfolio/network relationship claims and historical verification dates. Run measured mobile-device performance checks before advertising performance guarantees.

See [operations.md](operations.md) for setup, follow-up commands, retries, newsletter delivery and recovery. These external dependencies are not presented as completed or silently replaced with invented credentials or business facts.
