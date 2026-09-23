# AWS deployment templates (hiAnzy Agency Website)

Templates for the approved architecture in `docs/ADR-002-aws-production-architecture.md`:
GitHub → Amplify Hosting (static site); GitHub Actions → OIDC → ECR → App Runner
(API); MongoDB Atlas (data). The step-by-step use of these files, the cost
categories, the secrets, the IAM boundaries, the rollback and the destruction
procedure are in `docs/AWS_STAGING_EXECUTION_PLAN.md`.

Nothing here contains a real account ID, region, ARN suffix or credential.
Every account-specific value is a `<PLACEHOLDER>`; `tests/test_deploy_config.py`
fails if a real 12-digit account ID or a key is ever committed into these files.

| File | Used by | Purpose |
|---|---|---|
| `iam/github-oidc-trust-policy.json` | owner, once | Trust policy of the `hianzy-github-deploy` role: only this repository's `staging` and `production` GitHub environments may assume it, and only through GitHub's OIDC provider |
| `iam/github-deploy-policy.json` | owner, once | Permissions of that role: push to one ECR repository, update two App Runner services, pass the ECR access role. Nothing else |
| `iam/apprunner-ecr-access-trust-policy.json` | owner, once | Trust policy of `AppRunnerECRAccessRole` (App Runner pulls the image); attach the AWS managed policy `AWSAppRunnerServicePolicyForECRAccess` |
| `iam/apprunner-instance-trust-policy.json` | owner, once | Trust policy of `hianzy-apprunner-instance-role` (the running container) |
| `iam/apprunner-instance-secrets-policy.json` | owner, once | Permissions of the instance role: read the two Secrets Manager secrets and nothing else |
| `ecr/lifecycle-policy.json` | owner, once | Keeps the last 20 commit-tagged images for rollback, expires untagged layers after a day |
| `apprunner/staging-service.json` | owner, once per environment | `aws apprunner create-service --cli-input-json` template: image, port, environment, secrets, health check, instance size |
| `.github/workflows/deploy-api.yml` | every push | The pipeline these templates authorise |

The Experiment Lab is a separate product and has no place in this tree; the
deployment-configuration tests assert that as well.
