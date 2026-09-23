"""Deployment-configuration guards for the AWS path (docs/AWS_STAGING_EXECUTION_PLAN.md).

These read files, not AWS: they prove the repository side of the pipeline has
the shape the plan promises (OIDC only, immutable commit tags, queued
deploys, least-privilege templates without real account values, the App
Runner contract the backend expects, and no Experiment Lab coupling). Live
behaviour on AWS is a separate gate and is never inferred from these tests.
"""
import json
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github/workflows/deploy-api.yml"
TEMPLATES = ROOT / "deploy/aws"
DEPLOY_FILES = [
    WORKFLOW,
    ROOT / "amplify.yml",
    ROOT / "customHttp.yml",
    ROOT / "vercel.json",
    ROOT / "backend/Dockerfile",
    ROOT / "frontend/Dockerfile",
    ROOT / "frontend/nginx.conf.template",
    ROOT / "backend/.env.aws.example",
    *sorted(TEMPLATES.rglob("*.json")),
    TEMPLATES / "README.md",
]

ACCOUNT_ID = re.compile(r"(?<![0-9])[0-9]{12}(?![0-9])")
AWS_KEY = re.compile(r"AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|aws_secret_access_key|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID", re.I)
LAB = re.compile(r"experi(ence|ment) lab|frontend/lab|build/lab|cp -r lab|/lab/|/lab\b|(^|[^a-z_-])lab/", re.I)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def workflow() -> dict:
    return yaml.safe_load(read(WORKFLOW))


def test_workflow_parses_and_deploys_only_through_oidc():
    wf = workflow()
    assert wf["permissions"] == {"contents": "read", "id-token": "write"}
    text = read(WORKFLOW)
    assert not AWS_KEY.search(text), "the workflow must never carry or reference static AWS keys"
    assert "aws-actions/configure-aws-credentials@" in text and "role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}" in text
    assert "aws-actions/amazon-ecr-login@" in text


def test_workflow_triggers_test_gate_first_and_queues_deploys():
    wf = workflow()
    on = wf.get("on") or wf.get(True)  # PyYAML reads the bare key `on` as boolean True
    assert set(on["push"]["branches"]) == {"main", "deploy/aws-staging"}
    assert "workflow_dispatch" in on and "image_tag" in on["workflow_dispatch"]["inputs"]
    jobs = wf["jobs"]
    assert list(jobs) == ["test", "build-push", "deploy"]
    assert jobs["build-push"]["needs"] == "test"
    assert set(jobs["deploy"]["needs"]) == {"test", "build-push"}
    assert "needs.test.result != 'failure'" in jobs["deploy"]["if"]
    assert wf["concurrency"]["cancel-in-progress"] is False
    assert "deploy-api-" in wf["concurrency"]["group"]
    for job in ("build-push", "deploy"):
        assert "vars.AWS_DEPLOY_ROLE_ARN != ''" in jobs[job]["if"], f"{job} must skip itself until the role variable exists"
        assert "environment" in jobs[job]
    assert "tests/test_deploy_config.py" in json.dumps(jobs["test"]["steps"])


def test_workflow_tags_images_by_commit_sha_only():
    text = read(WORKFLOW)
    assert ":${{ github.sha }}" in text
    assert ":latest" not in text and ":staging" not in text and ":prod" not in text
    assert "ImageIdentifier = $img" in text, "App Runner is pointed at the exact image; nothing else in the source configuration is touched"
    assert "list-operations" in text and "ROLLBACK_SUCCEEDED" in text
    assert "/api/health" in text


def test_templates_are_valid_json_with_placeholders_and_least_privilege():
    for path in sorted(TEMPLATES.rglob("*.json")):
        doc = json.loads(read(path))
        assert doc, path
        text = read(path)
        if "arn:aws:" in text:
            assert "<ACCOUNT_ID>" in text, f"{path.name} must use placeholders, not a real account"
        assert not ACCOUNT_ID.search(text), f"{path.name} contains what looks like a real account ID"
    trust = json.loads(read(TEMPLATES / "iam/github-oidc-trust-policy.json"))
    cond = trust["Statement"][0]["Condition"]["StringEquals"]
    assert cond["token.actions.githubusercontent.com:aud"] == "sts.amazonaws.com"
    subs = cond["token.actions.githubusercontent.com:sub"]
    assert all(s.startswith("repo:Anzy1512/hi-anzy-website-2.0:environment:") for s in subs) and len(subs) == 2
    policy = json.loads(read(TEMPLATES / "iam/github-deploy-policy.json"))
    for statement in policy["Statement"]:
        resources = statement["Resource"] if isinstance(statement["Resource"], list) else [statement["Resource"]]
        if "*" in resources:
            assert statement["Action"] == "ecr:GetAuthorizationToken", "only the ECR login token may be account-wide"
    lifecycle = json.loads(read(TEMPLATES / "ecr/lifecycle-policy.json"))
    assert [r["rulePriority"] for r in lifecycle["rules"]] == [1, 2]
    service = json.loads(read(TEMPLATES / "apprunner/staging-service.json"))
    image = service["SourceConfiguration"]["ImageRepository"]["ImageConfiguration"]
    assert image["Port"] == "8000"
    assert image["RuntimeEnvironmentVariables"]["TRUSTED_PROXY"] == "apprunner"
    assert image["RuntimeEnvironmentVariables"]["COOKIE_SECURE"] == "true"
    assert set(image["RuntimeEnvironmentSecrets"]) == {"MONGO_URL", "RESEND_API_KEY"}
    assert service["HealthCheckConfiguration"]["Path"] == "/api/health"
    assert service["SourceConfiguration"]["AutoDeploymentsEnabled"] is False, "deploys are driven by the workflow, by commit SHA"


def test_backend_image_matches_the_app_runner_contract():
    dockerfile = read(ROOT / "backend/Dockerfile")
    assert "FROM python:3.12-slim" in dockerfile
    assert "USER appuser" in dockerfile
    assert "EXPOSE 8000" in dockerfile
    assert 'CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]' in dockerfile
    assert "/api/health" in dockerfile
    example = read(ROOT / "backend/.env.aws.example")
    for key in ("MONGO_URL", "DB_NAME", "ENVIRONMENT=production", "TRUSTED_PROXY=apprunner", "CORS_ORIGINS", "COOKIE_SECURE=true", "COOKIE_SAMESITE=none", "SITE_URL", "PUBLIC_API_URL"):
        assert key in example, key
    assert not re.search(r"mongodb(\+srv)?://[^<\s]+:[^<\s]+@", example), "the example must not carry a real connection string"


def test_frontend_edge_configuration_names_the_api_origin_and_nothing_broad():
    headers = read(ROOT / "customHttp.yml")
    csp = next(line for line in headers.splitlines() if "default-src" in line and "value:" in line)
    assert "connect-src 'self' https://api.hianzy.com" in csp
    assert "script-src 'self'" in csp and "object-src 'none'" in csp and "base-uri 'self'" in csp and "frame-ancestors 'self'" in csp
    assert " * " not in csp and "-src *" not in csp
    amplify = yaml.safe_load(read(ROOT / "amplify.yml"))
    app = amplify["applications"][0]
    assert app["appRoot"] == "frontend"
    build = app["frontend"]["phases"]["build"]["commands"]
    assert build == ["npm run build"], build
    assert app["frontend"]["artifacts"]["baseDirectory"] == "build"
    assert "npm ci" in app["frontend"]["phases"]["preBuild"]["commands"]


def test_no_experiment_lab_coupling_in_any_deployment_file():
    for path in DEPLOY_FILES:
        text = read(path)
        for line in text.splitlines():
            if "separate product" in line or "separate project" in line:
                continue  # the boundary statement itself may name the Lab
            assert not LAB.search(line), f"{path.relative_to(ROOT)} references the Experiment Lab: {line.strip()[:80]}"
    assert not (ROOT / "frontend/lab").exists()
