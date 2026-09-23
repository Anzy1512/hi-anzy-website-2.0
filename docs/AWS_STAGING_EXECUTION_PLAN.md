# AWS staging execution plan (hiAnzy Agency Website)

Status: **dry run. No AWS resource has been created.** This document is the
plan the owner executes; every step that needs an AWS account, a credential or
a billable resource is marked as an owner action. The code side (the pipeline,
the templates, the tests) is in place on `deploy/aws-staging`.

Evidence classes used below: VERIFIED LOCALLY (this repository, this
machine), VERIFIED IN CI (GitHub Actions on this branch), UNVERIFIED — LIVE
GATE (needs a real AWS deployment), BLOCKED — OWNER ACTION.

## Architecture

Approved in `docs/ADR-002-aws-production-architecture.md` (Option A):

```
GitHub (branch)  ──▶  AWS Amplify Hosting  ──▶  static + prerendered Vite output on the Amplify CDN
GitHub Actions   ──▶  GitHub OIDC ──▶ IAM role hianzy-github-deploy ──▶ Amazon ECR (hianzy-api) ──▶ AWS App Runner (hianzy-api-staging)
App Runner       ──▶  MongoDB Atlas (hianzy_staging database)
Secrets          ──▶  AWS Secrets Manager, injected by App Runner as runtime secrets
DNS              ──▶  UNCHANGED DURING STAGING
```

The Experiment Lab is a separate product; nothing in this plan builds, copies
or serves it (`tests/test_deploy_config.py` fails if that changes).

## What the repository already provides (VERIFIED LOCALLY)

| Piece | Where | State |
|---|---|---|
| Backend image | `backend/Dockerfile` | `python:3.12-slim`, non-root `appuser` (uid 10001), port 8000, `uvicorn server:app`, health check on `/api/health`, unbuffered logs to stdout, no dev server, no localhost assumption (every origin is an environment value) |
| App Runner contract | `backend/server.py`, `backend/.env.aws.example` | `/api/health` pings the database (200 / 503); `TRUSTED_PROXY=apprunner` reads the rightmost `x-forwarded-for` hop; explicit `CORS_ORIGINS`; cookies validated at import; `MONGO_URL` and `DB_NAME` required at import; `VERCEL` unset means seeding and both background workers run |
| Pipeline | `.github/workflows/deploy-api.yml` | test gate → OIDC role → ECR login → build → informational Trivy report → push `:<commit-sha>` → App Runner `update-service` with only the image changed → wait for RUNNING → last operation SUCCEEDED → `/api/health` 200; queued per environment; `workflow_dispatch` with `image_tag` redeploys an existing SHA (rollback); jobs skip themselves until `AWS_DEPLOY_ROLE_ARN` exists |
| IAM, ECR, App Runner templates | `deploy/aws/` | trust and permission policies with `<PLACEHOLDER>` values only; ECR lifecycle policy; App Runner `create-service` input |
| Frontend edge | `amplify.yml`, `customHttp.yml` | monorepo `appRoot: frontend`, Node 22, `npm ci`, `npm run build`, artifacts `build/`; security headers and a CSP whose `connect-src` names the API origin; no Lab step |
| Environment matrix | `docs/ENVIRONMENT_CONTRACT.md` | names, consumers and sources per tier |
| Guards | `tests/test_deploy_config.py`, `frontend/scripts/build.test.cjs` | OIDC-only workflow, SHA tags, queued deploys, placeholder-only templates, App Runner contract, CSP origin, no Lab coupling |

## Required resources (exact list, staging)

Created once by the owner unless marked automated.

1. IAM OIDC identity provider `token.actions.githubusercontent.com` (account-wide, once).
2. IAM role `hianzy-github-deploy` with `deploy/aws/iam/github-oidc-trust-policy.json` and inline policy `deploy/aws/iam/github-deploy-policy.json`.
3. IAM role `AppRunnerECRAccessRole` (trust `deploy/aws/iam/apprunner-ecr-access-trust-policy.json`, managed policy `AWSAppRunnerServicePolicyForECRAccess`).
4. IAM role `hianzy-apprunner-instance-role` (trust `deploy/aws/iam/apprunner-instance-trust-policy.json`, inline policy `deploy/aws/iam/apprunner-instance-secrets-policy.json` with `<ENVIRONMENT>` = `staging`).
5. ECR repository `hianzy-api`: tag immutability ON, scan on push ON, AES-256 encryption, lifecycle policy `deploy/aws/ecr/lifecycle-policy.json`.
6. Secrets Manager: `hianzy/staging/MONGO_URL`; `hianzy/staging/RESEND_API_KEY` only if mail is enabled on staging.
7. App Runner auto scaling configuration `hianzy-api-staging-scaling` (min 1, max 1, concurrency 100).
8. App Runner service `hianzy-api-staging` from `deploy/aws/apprunner/staging-service.json` (1 vCPU / 2 GB, HTTP health check `/api/health`, egress DEFAULT unless the NAT option below is chosen).
9. MongoDB Atlas: project `hianzy-staging`, cluster `hianzy-staging` (M0 for staging), user `hianzy_api_staging` with `readWrite` on `hianzy_staging` only, network access per the decision below.
10. Amplify app `hianzy-website` connected to this GitHub repository, branch `deploy/aws-staging` as a branch deployment with access control (basic auth) enabled, environment variables and the ten rewrite/redirect rules from `AWS_PREP.md` §B3.
11. GitHub: environments `staging` (no reviewers) and `production` (required reviewers: the owner); repository variables `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `ECR_REPOSITORY`; environment variable `APP_RUNNER_SERVICE_ARN` on `staging`.
12. Optional, decision-dependent (see Atlas network strategy): VPC `hianzy-prod-vpc`, two private subnets, one public subnet, NAT Gateway `hianzy-prod-nat`, Elastic IP `hianzy-prod-egress`, security group, App Runner VPC connector.

## Estimated cost categories

No exact prices are invented here; the figures ADR-002 verified against AWS
documentation in September 2026 are cited where they exist. Confirm on the
pricing pages before setting the budget alarm.

| Category | Items |
|---|---|
| Free / near zero | IAM roles and the OIDC provider; ECR storage for ~20 small images; GitHub Actions minutes at this cadence; Atlas M0 for staging; Amplify build minutes and hosting at staging traffic; CloudWatch logs at staging volume; a paused App Runner service (pause staging between test sessions) |
| Fixed monthly | App Runner provisioned instance memory while the service runs (ADR-002: ≈ $10 per month floor for 2 GB continuously, ≈ $11–14 with active vCPU); Secrets Manager per-secret monthly charge (two secrets); Amplify custom domain only at production |
| Usage based | App Runner vCPU-seconds while requests are served; Amplify data transfer and build minutes; ECR data transfer; Secrets Manager API calls; CloudWatch log ingestion |
| Potentially expensive | **NAT Gateway** (ADR-002: ≈ $32–35 per month plus per-GB, billed every hour it exists, including idle) and the Elastic IP it needs; App Runner with max instances above 1; a dedicated Atlas tier (production only); unlimited CloudWatch log retention |

**NAT Gateway is flagged:** it is the single largest avoidable cost in the
design and exists only to give App Runner a static egress address for the
Atlas allow-list. Do not create it for staging unless the network decision
below requires it.

## Atlas network strategy for staging (BLOCKED — OWNER DECISION, then LIVE GATE)

App Runner's default egress has no static IP, so an Atlas IP allow-list needs
either VPC egress through a NAT Gateway with an Elastic IP (ADR-002's
production decision) or an allow-list that is not an IP.

- **Option 1, parity with production:** VPC connector + NAT Gateway + Elastic
  IP; allow-list that one address in Atlas. Proves the production network path
  on staging. Cost: the NAT Gateway line above from the day it is created.
- **Option 2, disposable staging cluster:** an M0 cluster used only for
  staging, a user scoped to `hianzy_staging` with a long random password kept
  only in Secrets Manager, Atlas network access opened to `0.0.0.0/0` for the
  staging window, and the cluster deleted at destruction. This is an explicit,
  recorded risk acceptance for a database that never holds production data;
  it is not the production configuration and must not be copied to it.

Pick one before step A5 below. Either way, whether App Runner reaches Atlas is
UNVERIFIED — LIVE GATE until `/api/health` answers `db: connected` on the
staging service.

## Secrets required (names only)

| Name | Store | Consumer |
|---|---|---|
| `hianzy/staging/MONGO_URL` | Secrets Manager | App Runner runtime secret → `MONGO_URL` |
| `hianzy/staging/RESEND_API_KEY` | Secrets Manager (optional) | App Runner runtime secret → `RESEND_API_KEY` |
| none | GitHub | no AWS credential is stored in GitHub; the workflow uses OIDC |

Secret values are entered in the Console or through the CLI prompt, never in a
file in this repository, never in a shell history line.

## Environment variables (names and sources)

`docs/ENVIRONMENT_CONTRACT.md` is the matrix. Staging in short:

- App Runner service (`RuntimeEnvironmentVariables` in the template):
  `ENVIRONMENT=production`, `DB_NAME=hianzy_staging`, `TRUSTED_PROXY=apprunner`,
  `CORS_ORIGINS=<Amplify staging origin>`, `COOKIE_SECURE=true`,
  `COOKIE_SAMESITE=none`, `SITE_URL=<Amplify staging origin>`,
  `PUBLIC_API_URL=<App Runner staging origin>`, `RESEND_FROM`,
  `CONTACT_NOTIFY_EMAIL`, `ADMIN_EMAILS`; runtime secrets `MONGO_URL`,
  `RESEND_API_KEY`. `VERCEL` and `LOCAL_API_URL` never exist there.
- Amplify branch `deploy/aws-staging`: `AMPLIFY_MONOREPO_APP_ROOT=frontend`,
  `REACT_APP_BACKEND_URL=<App Runner staging origin>`; nothing else.
- GitHub: `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `ECR_REPOSITORY` (repository),
  `APP_RUNNER_SERVICE_ARN` (environment `staging`).

## IAM (roles, policies, trust boundaries)

| Role | Trusts | May do | May not do |
|---|---|---|---|
| `hianzy-github-deploy` | GitHub's OIDC provider, only tokens whose `sub` is `repo:Anzy1512/hi-anzy-website-2.0:environment:staging` or `:environment:production` and whose `aud` is `sts.amazonaws.com` | get an ECR login token; push, read and describe the `hianzy-api` repository; describe, update and list operations on `hianzy-api-staging` and `hianzy-api-prod`; pass `AppRunnerECRAccessRole` to App Runner | anything else: no `*` resource except the ECR login token, no IAM writes, no service creation, no secrets |
| `AppRunnerECRAccessRole` | `build.apprunner.amazonaws.com` | pull images (AWS managed policy) | — |
| `hianzy-apprunner-instance-role` | `tasks.apprunner.amazonaws.com` | read the two staging secrets | any other secret |

No IAM user and no access key exists in this design. Forks and other
repositories cannot assume the role because the `sub` condition names this
repository; a push to a feature branch cannot either because the workflow only
deploys from the `staging` and `production` GitHub environments.

## DNS

**UNCHANGED DURING STAGING.** Staging uses the Amplify default branch URL and
the App Runner default service URL. No record for `hianzy.com`, `www` or
`api.hianzy.com` is created or changed; that is the production cutover
(`docs/AWS_PRODUCTION_CUTOVER.md`).

## Execution order

Prerequisite: PR #3 merged into `main` and this branch rebased onto it (see
"How this branch reaches main"). Each step names who performs it.

### A. Backend first

| # | Step | Who | Evidence when done |
|---|---|---|---|
| A1 | Create the OIDC provider and the three roles from `deploy/aws/iam/*.json` (replace `<ACCOUNT_ID>`, `<REGION>`, `<ENVIRONMENT>` in a local copy; never commit the filled copy) | owner | `aws iam get-role --role-name hianzy-github-deploy` |
| A2 | Create the ECR repository with immutable tags, scan on push and the lifecycle policy | owner | `aws ecr describe-repositories --repository-names hianzy-api` |
| A3 | In GitHub, create environments `staging` and `production` (reviewers on production); set `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `ECR_REPOSITORY` | owner | Settings → Environments; Variables |
| A4 | Run **Deploy API image** (workflow_dispatch, environment `staging`, no `image_tag`): the test gate runs, the image is built and pushed as `hianzy-api:<sha>`; the deploy job reports that `APP_RUNNER_SERVICE_ARN` is not set and stops cleanly | code (automated) | the run is green; `aws ecr describe-images --repository-name hianzy-api` lists the SHA |
| A5 | Atlas: project, M0 cluster, `hianzy_api_staging` user on `hianzy_staging`, network access per the decision above; create `hianzy/staging/MONGO_URL` in Secrets Manager | owner | secret exists; Atlas user exists |
| A6 | Create the auto scaling configuration (min 1, max 1) and the service from `deploy/aws/apprunner/staging-service.json` with the SHA from A4; `PUBLIC_API_URL` is corrected to the service URL once it is known (update-service) | owner | `aws apprunner describe-service` → RUNNING; service URL known |
| A7 | Verify on the service URL: `/api/health` → 200 `db: connected`; `/api/` liveness; logs show the seed and both workers; `TRUSTED_PROXY` in effect (two requests from different networks rate-limit independently; `x-forwarded-for` spoof from the left is ignored); CORS preflight from the Amplify staging origin allowed and from another origin refused | owner with the checklist in `docs/AWS_STAGING_TEST_MATRIX` section below | recorded in `LAUNCH_TESTS.md` as VERIFIED ON AWS STAGING |
| A8 | Set `APP_RUNNER_SERVICE_ARN` on the `staging` GitHub environment; from now on every push to `deploy/aws-staging` that touches the backend redeploys the exact SHA | owner, then automated | the next workflow run updates the service and reports `healthy` |

### B. Frontend second

| # | Step | Who | Evidence when done |
|---|---|---|---|
| B1 | Commit the App Runner staging origin into `customHttp.yml` `connect-src` on `deploy/aws-staging` (the only branch-specific line; reverted before merge) | code | commit on the branch; `tests/test_deploy_config.py` adjusted if the assertion on the production origin is kept |
| B2 | Amplify: connect the repository, select branch `deploy/aws-staging`, monorepo root `frontend`, environment variables `AMPLIFY_MONOREPO_APP_ROOT=frontend` and `REACT_APP_BACKEND_URL=<App Runner staging origin>`; enable access control (basic auth) on the branch; add the ten rules from `AWS_PREP.md` §B3 (nine 301s, then `/<*>` → `/index.html` `404-200`); delete any pre-populated rule | owner | branch build green |
| B3 | Read the build log: `metadata: generated 67 public HTML pages` (the number follows the content), no `using the checked-in public content snapshot`, no `API unreachable` | owner | log excerpt in `LAUNCH_TESTS.md` |
| B4 | Routing gate by view-source on the Amplify URL: `/work` carries `Work | Proof, With Context | hiAnzy`; `/network/strategy`; one `/insights/<slug>`; `/sitemap.xml` as XML; an unknown path renders the not-found page; then `python scripts/check_raw_metadata.py --base https://<amplify-url>` (add `--canonical-origin https://hianzy.com`, the canonical host staging keeps on purpose) | owner | 67 routes verified |
| B5 | Headers gate: `/` and one `/assets/<hash>.js` carry the CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cache-Control` from `customHttp.yml` | owner | header dump recorded |
| B6 | **AMPLIFY HASH REDIRECT — LIVE VERIFICATION REQUIRED**: request each of the nine legacy URLs (plain, with `?utm=x`, with a trailing slash) and confirm a 301 whose `Location` ends with the `#section` fragment; then open them in a browser and confirm the section lands under the nav. If Amplify drops the fragment, apply the documented fallback (type-200 rewrites to `/index.html` for exactly those nine paths so the in-app `LegacyRedirect` lands the visitor) and record it | owner | recorded either way |
| B7 | Smoke test on the Amplify URL: nav, footer, CTAs, palette, direct URLs, hard refresh, Back/Forward, contact form (record via `manage.py enquiries --status new` against the staging database), subscribe confirmation link on the App Runner origin, no CSP violation in the console except the known anonymous `auth/me` 401 | owner | recorded |

### Staging test matrix (what "verified on staging" means)

Run from the public staging URLs, on the raw HTML where SEO is concerned:
navigation (all nav and footer links, CTAs, command palette, direct URLs, hard
refresh, Back, Forward); the nine legacy URLs (plain, query string, trailing
slash, hard refresh, destination, section position); widths 320, 375, 768,
1024, 1200, 1440, 1920 on Chromium desktop and a mobile viewport; scroll (fast
wheel, small deltas, deep hash landing, route changes, pinned sections, section
index, sticky CTA, reduced motion, the long Insights page, Work, Network); API
(health, insights, case studies, contact, anonymous auth, timeout and recovery);
SEO (title, description, canonical, Open Graph, structured data, 404, sitemap,
robots, share image). The local equivalents of every one of these already pass
(`LAUNCH_TESTS.md`, 2026-09-24); staging repeats them on the real edge.

## Rollback

- **Backend, independent of the frontend:** run **Deploy API image** by
  `workflow_dispatch` with `image_tag` set to a previous commit SHA that ECR
  still holds (the lifecycle policy keeps the last 20). App Runner also rolls
  back by itself when an update fails its health check (`ROLLBACK_SUCCEEDED`);
  the previous image keeps serving throughout.
- **Frontend, independent of the backend:** Amplify Console → the branch →
  "Redeploy this version" on the previous build, or push a revert commit to
  the branch.
- **Configuration:** App Runner `update-service` with the previous
  environment values; the workflow never touches anything but the image.

## Destruction (staging can be removed completely)

In this order, so nothing keeps billing: delete the Amplify branch deployment
(or app); `aws apprunner delete-service` for `hianzy-api-staging` and delete
`hianzy-api-staging-scaling`; delete the ECR repository with `--force` (drops
the images) if production will use a different repository, otherwise keep it;
delete the two Secrets Manager secrets (`--force-delete-without-recovery` or
the 7-day window); delete the App Runner VPC connector, the NAT Gateway, the
Elastic IP and the VPC **if Option 1 was chosen** (the NAT Gateway and the
Elastic IP bill until they are gone); delete the Atlas staging cluster and
user; remove `APP_RUNNER_SERVICE_ARN` from the `staging` environment; keep the
OIDC provider and the roles only if production will reuse them. Check the
next billing report for zero staging lines.

## Owner actions versus what the code automates

| The code automates | The owner must do |
|---|---|
| backend test gate on every push; image build; vulnerability report; push with an immutable commit tag; App Runner update with only the image changed; wait and verify `/api/health`; queued, ordered deploys; rollback by `image_tag` | AWS account, budget alarm and region choice; OIDC provider, roles, ECR repository, secrets (values); Atlas project, cluster, user, network decision; App Runner service creation (first time) and `PUBLIC_API_URL` correction; Amplify connection, environment variables, rewrites, access control; GitHub environments and variables; every live gate in this plan; the merge of PR #3 and of this branch; production cutover and DNS (never during staging) |

## How this branch reaches main

`deploy/aws-staging` was cut from the verified head of PR #3 (`10ea69b`),
because the AWS pipeline must sit on the consolidated Agency tree and `main`
did not contain it yet. After PR #3 merges, rebase this branch onto `main`
(`git rebase --onto main 10ea69b deploy/aws-staging`, a clean replay of the AWS
commits only) and retarget its pull request to `main`; GitHub does this
retargeting itself when the PR #3 branch is deleted after the merge. Revert
the B1 staging-origin commit before that merge.

## Owner-action block (what only you can do next)

1. Merge PR #3 (the consolidated Agency tree); then rebase and retarget this branch.
2. Decide the Atlas network option for staging (NAT parity or disposable cluster).
3. Prepare the AWS account (budget alarm, region) and execute A1–A3.
4. Run the workflow (A4), then A5–A8 and B1–B7, recording each live gate.
