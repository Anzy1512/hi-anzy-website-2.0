# Running enquiries and newsletters

The public design is unchanged. Operators use protected API routes or `backend/manage.py`; no public admin screen or shared password has been added.

## First-time configuration

Keep credentials in `backend/.env` (or the deployment's secret settings), never in Git or frontend environment variables.

- Set `CONTACT_NOTIFY_EMAIL=anish@hianzy.com`.
- For Resend, set `RESEND_API_KEY` and a verified `RESEND_FROM`. Alternatively set `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER` and `SMTP_PASS`. Resend is used when its key exists; SMTP is used otherwise.
- Set `ADMIN_EMAILS` to the verified sign-in addresses of your operators. An empty allowlist denies all web admin access. The local console instead requires filesystem and database access.
- Set `SITE_URL` to the public website origin and `PUBLIC_API_URL` to the public API origin. Newsletter links use the latter. With a same-origin API, both can be the website origin. With the provided local Docker setup, they are `http://localhost:8080` and `http://localhost:8010`.
- For public hosting, use HTTPS, production mode, explicit CORS origins and secure cookies. Confirm a real sign-in, session refresh and logout on the deployed origin. Optional `VITE_AUTH_LOGIN_URL` and `AUTH_SESSION_DATA_URL` overrides must implement the existing provider's redirect/session contract; they are not adapters for arbitrary OAuth providers.

Restart the API after changing its environment. Rebuild the frontend after changing frontend settings.

## Daily enquiry review

From the project root, using your virtual environment's Python:

```powershell
python backend/manage.py status
python backend/manage.py enquiries --status new
python backend/manage.py review ENQUIRY_ID in_progress
python backend/manage.py review ENQUIRY_ID replied
python backend/manage.py review ENQUIRY_ID closed
```

The console returns up to 50 enquiries at a time; use `--offset 50` for the next page. Its output contains customer information: keep it local. Old records without review state appear as new. A staff member still needs to read and reply; setting `replied` records that work and does not send a reply.

Every new enquiry is saved with its delivery state before notification starts. Missing provider configuration leaves it pending. Failed deliveries retry with backoff, up to five attempts; then they remain marked failed for review. A two-minute lease prevents simultaneous workers from claiming the same delivery and lets a restarted process recover abandoned work.

```powershell
python backend/manage.py retry ENQUIRY_ID
```

Retry queues an unsent enquiry for the API worker. It refuses sent or actively sending records. The worker checks every 30 seconds. `status` exposes failed notifications and unreviewed enquiries; arrange for an operator or deployment monitor to check it daily. Logs identify failed record IDs without printing messages or credentials.

Delivery is at least once: if a provider accepts mail but its response is lost, a retry may deliver a duplicate. The stable enquiry ID lets the operator recognize it. No claim of exactly-once external delivery is made.

Authenticated administrators can use:

- `GET /api/operations/status`
- `GET /api/contact-submissions`
- `PATCH /api/contact-submissions/{id}` with `{"status":"replied"}`
- `POST /api/contact-submissions/{id}/retry`

## Newsletter workflow

Signup creates an unconfirmed record and queues a confirmation email. The reader must press the confirmation button before receiving newsletters. Confirmation expires after seven days; submitting the form again renews an expired request. Visiting a confirmation or unsubscribe URL alone does not change consent, so email scanners cannot trigger the action.

Prepare a UTF-8 text file, review its content, and preview the audience count:

```powershell
python backend/manage.py newsletter --campaign september-note --subject "A note from hiAnzy" --body-file note.txt
```

Add `--send` only when you intend to send it. This is a real external email action. Each message includes a working unsubscribe link, and consent is checked immediately before delivery. Unconfirmed or unsubscribed addresses are excluded. Confirmation tokens are omitted from subscriber API responses.

Rerunning the same campaign skips sent records and retries eligible failures after backoff. Use `--retry-failed --send` to explicitly requeue records that exhausted five attempts. Reusing a campaign ID with different content is refused; use a new ID for a new note. Legacy unconfirmed subscribers are not silently opted in.

## Build and raw-response checks

```powershell
Set-Location frontend
npm run lint
npm test
npm run test:build
npm run build
npm run preview
```

In another terminal from the project root:

```powershell
python scripts/check_raw_metadata.py --base http://127.0.0.1:3100
```

The build creates 56 route-specific HTML heads, preserving React layout and animation code. The checker fetches every route over HTTP without JavaScript and verifies titles, descriptions, canonical URLs, sharing images and image availability. If building for another origin, pass `--canonical-origin` to match `SITE_URL`.

Metadata uses live public API content when available and a checked-in public-content snapshot otherwise. The snapshot is tested against `backend/seed_data.py`; update both when changing seeded case/article metadata. Database-only editorial changes require a fresh build against that database. Each failed sitemap endpoint preserves its own previously known URLs; a successful empty list removes obsolete entries for that family.

## Database backup and restore

The Compose database uses its persistent `mongo-data` volume. Preserve that volume; `docker compose down -v` deletes it. Store scheduled `mongodump --archive --gzip` backups outside the repository in restricted, encrypted storage. Customer data and session tokens are sensitive.

Before launch, restore a backup with `mongorestore` into a separate staging database, verify collection counts and representative records, then run the app against that staging database. Do not restore into the live database as a test. The hosting operator must choose backup frequency, retention and recovery objectives and demonstrate the restore. This production recovery test has not been performed by this local code-fix pass.

## Remaining owner inputs

Real mail credentials and a verified sender, admin sign-in addresses, the production host/origins, a real production sign-in test, and confirmation of portfolio/network relationship claims remain required. The code cannot establish those facts or provision them by inventing values. The displayed historical verification dates have not been advanced.
