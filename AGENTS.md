# Frontend freeze

The user froze the visual design on 10 September 2026 and authorized functional frontend fixes on 12 September 2026 while preserving that design. Limit this release to bug fixes; do not redesign layouts, replace animations or rewrite page content. Keep the original audited copy and its recovery snapshot unchanged.

After the authorized fixes, verify the release with `python scripts/check_frontend_lock.py`; the source manifest is `docs/frontend-source-lock.json`. Record intentional changes in the release report before refreshing that manifest. Generated builds, credentials and dependencies are excluded from Git.

Backend maintenance must preserve existing public API routes and request/response field names. Do not upload local environment files, database data or private recovery archives.
