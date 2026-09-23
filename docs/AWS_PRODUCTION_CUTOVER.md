# AWS production cutover plan (hiAnzy Agency Website)

Status: **plan only. Not executed.** Nothing below runs automatically; every
step is an owner action gated on the one before it. Vercel stays live until
the AWS production site is verified; no step creates downtime to finish the
migration faster. The Experiment Lab is a separate product and is not part of
this cutover.

## 1. Staging pass requirements

Production work starts only when `docs/AWS_STAGING_EXECUTION_PLAN.md` steps
A1–A8 and B1–B7 are recorded as VERIFIED ON AWS STAGING in `LAUNCH_TESTS.md`,
including the AMPLIFY HASH REDIRECT gate (fragment kept, or the documented
fallback applied and recorded), the view-source routing gate, the headers
gate and the staging test matrix.

## 2. Database readiness

- Atlas project `hianzy-production`, cluster `hianzy-prod` on the tier the
  owner chooses for production (verify current pricing), same region as App
  Runner, backups enabled, user `hianzy_api` with `readWrite` on `hianzy`
  only.
- Network access: the production NAT Elastic IP only (ADR-002 condition 2);
  never `0.0.0.0/0`.
- `hianzy/prod/MONGO_URL` in Secrets Manager; the staging secret is never
  reused.
- First start seeds the content automatically (`seed()` in the lifespan);
  confirm the seed count in the logs and `manage.py status` after start.

## 3. App Runner production readiness

- VPC `hianzy-prod-vpc`, private subnets, public subnet, NAT Gateway
  `hianzy-prod-nat` with Elastic IP `hianzy-prod-egress`, security group, VPC
  connector `hianzy-prod-vpc-connector` (ADR-002 owner actions 7).
- Service `hianzy-api-prod` from the staging template with production values:
  `DB_NAME=hianzy`, `CORS_ORIGINS=https://hianzy.com,https://www.hianzy.com`
  (plus the Amplify default origin only during step 13), `SITE_URL=https://hianzy.com`,
  `PUBLIC_API_URL=https://api.hianzy.com`, `TRUSTED_PROXY=apprunner`,
  `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none` (or `lax` once both hosts sit
  under `hianzy.com` and the sign-in decision allows it), egress through the
  VPC connector, auto scaling min 1 / max 1, health check `/api/health`.
- Instance role scoped to `hianzy/prod/*` secrets only.
- `APP_RUNNER_SERVICE_ARN` on the `production` GitHub environment with required
  reviewers, so a merge to `main` builds the image but waits for approval
  before the service is updated.
- Verify on the default service URL before any DNS step: `/api/health` 200 with
  `db: connected`, seed and workers in the logs, rate limiting per client,
  CORS.

## 4. Amplify production readiness

- Amplify app connected to `main` only, auto-branch creation off, monorepo root
  `frontend`, `AMPLIFY_MONOREPO_APP_ROOT=frontend`,
  `REACT_APP_BACKEND_URL=https://api.hianzy.com` (set after step 9 so the
  bundle bakes the final origin), optionally `SITE_URL=https://hianzy.com`,
  no `LOCAL_API_URL`.
- Rewrites and redirects: the nine legacy 301s then the single `/<*>` →
  `/index.html` `404-200` rule (or the recorded fallback from staging).
- `customHttp.yml` on `main` carries `connect-src 'self' https://api.hianzy.com`;
  the staging-origin line must not be present.
- First production build read for `metadata: generated 67 public HTML pages`
  (the number follows the content) and no snapshot fallback.

## 5. Domain mapping

- `api.hianzy.com` → App Runner custom domain on `hianzy-api-prod`.
- `hianzy.com` and `www.hianzy.com` → Amplify domain management on the
  production app; `www` as an alias or redirect to the apex, one direction
  only.

## 6. Certificate status

- App Runner issues the certificate for `api.hianzy.com` after its validation
  CNAMEs resolve.
- Amplify issues the certificate for `hianzy.com` / `www` after its
  verification record resolves.
- Both must show "issued" before traffic moves; check the Console status, then
  `curl -vI` each host.

## 7. DNS records

Recorded here as names only; the targets are what the Consoles provide at the
time:

| Record | Type | Target | When |
|---|---|---|---|
| `api.hianzy.com` | CNAME | App Runner custom-domain target | step 9 |
| App Runner validation names | CNAME | App Runner validation values | step 9 |
| Amplify verification name | CNAME | Amplify verification value | step 11 |
| `hianzy.com` | ALIAS/ANAME (or the registrar's equivalent) | Amplify domain target | step 11 |
| `www.hianzy.com` | CNAME | Amplify domain target | step 11 |

## 8. TTL strategy

Lower the TTL of the records that will move (`hianzy.com`, `www`) to 300 s at
least 24–48 hours before step 11 so the old value expires quickly; raise it
again (for example 3600 s) once production has been stable for a day. Records
that are created new (`api.hianzy.com`) can start at 300 s.

## 9. API domain

Attach `api.hianzy.com` to `hianzy-api-prod` and add its records. This record
is not visitor-facing, so it goes first (ADR-002 build order): it lets the
Amplify production build bake `https://api.hianzy.com` and keeps
`customHttp.yml`'s `connect-src` final. Verify `https://api.hianzy.com/api/health`.

## 10. Frontend environment update

Set `REACT_APP_BACKEND_URL=https://api.hianzy.com` on the Amplify production
app and rebuild `main`. Verify the raw HTML, the sitemap host and that the
bundle calls the final origin.

## 11. CORS production update

`CORS_ORIGINS=https://hianzy.com,https://www.hianzy.com,https://<amplify-default-origin>`
during the smoke test; remove the Amplify default origin at step 15.

## 12. CSP production update

`customHttp.yml` on `main`: `connect-src 'self' https://api.hianzy.com`
(already the committed value). Confirm on the live headers after the first
production build; no broad source is added.

## 13. Smoke test

On the Amplify default URL with `hianzy.com` still pointing at Vercel: the
staging test matrix again (`docs/AWS_STAGING_EXECUTION_PLAN.md`), plus the
contact form against the production database, the subscribe confirmation link
on `api.hianzy.com`, `python scripts/check_raw_metadata.py --base https://<amplify-url>`,
and the nine legacy URLs with their fragments. Only then attach
`hianzy.com` and `www` (steps 5, 7).

## 14. Rollback

- Before DNS: nothing to roll back; delete or pause the AWS production
  resources.
- After DNS, within TTL: point `hianzy.com` and `www` back at the Vercel
  targets; the Vercel project is still connected and serving.
- Backend only: `workflow_dispatch` with the previous SHA, or App Runner's own
  rollback on a failed health check.
- Frontend only: Amplify "Redeploy this version".

## 15. Vercel retirement sequence

Only after production has been verified on `hianzy.com` for an agreed period:
disconnect the Vercel project from the repository so it stops building
`main`; keep it deployed but idle for one TTL cycle as the fallback; then
remove the project; then retire `vercel.json` in a follow-up commit
(`tests/test_deploy_config.py` still reads it until that commit removes the
assertion).

## 16. Post-launch monitoring

- Uptime check on `https://api.hianzy.com/api/health` every 1–5 minutes,
  alerting on 503 or timeout.
- CloudWatch alarms on App Runner 5xx and unhealthy-instance events; log
  retention set to a finite period.
- `manage.py status` daily for `failedNotifications` (`docs/operations.md`).
- Atlas backup and restore rehearsed into a non-production database before
  launch week (`docs/operations.md`, "Database backup and restore").
- Budget alarm at the agreed ceiling; review the first two invoices for the
  NAT Gateway and App Runner lines.
- Secret rotation dates recorded; the `production` GitHub environment keeps
  required reviewers.
