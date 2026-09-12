"""Contact pipeline + content API + hardening verification, run against the
docker-compose stack (web on 8080, api on 8010, mongo unpublished).
Run: python tests/test_contact_poc.py

This originally loaded MONGO_URL/DB_NAME from backend/.env and connected with
pymongo directly from the host. Two things made that unreliable on this
checkout: the dotenv paths were hardcoded container paths from a prior
deployment platform (/app/backend/.env, /app/frontend/.env), and
backend/.env's MONGO_URL (mongodb://localhost:27017) is a local-dev value for
running the API outside Docker -- the compose stack's mongo container is
deliberately not published to the host at all (see docker-compose.yml), so
that connection string was quietly resolving to an unrelated, stale mongo
container that happens to occupy the same host port. `docker exec` addresses
the running container by name instead, which is correct regardless of which
mongo happens to be sitting on 27017 on the host.
"""
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
import requests

BASE = os.environ.get("HIANZY_BASE_URL", "http://localhost:8010").rstrip("/")
API = f"{BASE}/api"
MONGO_CONTAINER = os.environ.get("HIANZY_MONGO_CONTAINER", "hianzy-mongo")
API_CONTAINER = os.environ.get("HIANZY_API_CONTAINER", "hianzy-api")

results = []


def check(name, cond, detail=""):
    results.append((name, cond, detail))
    print(f"{'PASS' if cond else 'FAIL'} — {name} {detail}")


def db_name():
    """The DB name actually in use by the running api container -- read live
    rather than duplicated here, so this can't quietly drift out of sync with
    docker-compose.yml's own default."""
    out = subprocess.run(
        ["docker", "exec", API_CONTAINER, "printenv", "DB_NAME"],
        capture_output=True, text=True, timeout=15,
    )
    return out.stdout.strip() or "hianzy"


def mongo_count(dbname, collection, query: dict) -> int:
    js = (
        f'db=db.getSiblingDB("{dbname}");'
        f'print(db.{collection}.countDocuments({json.dumps(query)}));'
    )
    out = subprocess.run(
        ["docker", "exec", MONGO_CONTAINER, "mongosh", "--quiet", "--eval", js],
        capture_output=True, text=True, timeout=20,
    )
    try:
        return int(out.stdout.strip().splitlines()[-1])
    except (ValueError, IndexError):
        return -1  # signals "couldn't read", never mistaken for a real zero


def mongo_delete(dbname, collection, query: dict):
    js = (
        f'db=db.getSiblingDB("{dbname}");'
        f'db.{collection}.deleteMany({json.dumps(query)});'
    )
    subprocess.run(
        ["docker", "exec", MONGO_CONTAINER, "mongosh", "--quiet", "--eval", js],
        capture_output=True, text=True, timeout=20,
    )


def main():
    dbname = db_name()

    # 1. Health
    r = requests.get(f"{API}/health", timeout=10)
    check("health endpoint", r.status_code == 200 and r.json().get("db") == "connected", str(r.status_code))

    # 2. Valid contact submission
    payload = {
        "name": "POC Tester",
        "email": "poc-test@example.com",
        "message": "We are growing but margins are shrinking and nobody can tell me why.",
        "company": "POC Industries",
        "stage": "Scaling",
        "investmentRange": "TBD",
        "timeline": "This quarter",
    }
    r = requests.post(f"{API}/contact", json=payload, timeout=20)
    body = r.json()
    check("valid contact accepted", r.status_code == 200 and body.get("ok") is True, str(body))
    sub_id = body.get("id")
    check("graceful email skip (no creds)", body.get("emailSent") is False, f"emailSent={body.get('emailSent')}")

    # 3. Mongo write verification (via docker exec, see module docstring)
    count = mongo_count(dbname, "contact_submissions", {"id": sub_id})
    check("submission stored in MongoDB", count == 1, f"count={count}")

    # 4. Validation error (missing message)
    r = requests.post(f"{API}/contact", json={"name": "X", "email": "bad"}, timeout=10)
    check("invalid submission rejected (422)", r.status_code == 422, str(r.status_code))

    # 4b. Oversized optional field rejected (Phase A hardening)
    oversized = dict(payload, company="x" * 300)
    r = requests.post(f"{API}/contact", json=oversized, timeout=10)
    check("oversized contact field rejected (422)", r.status_code == 422, str(r.status_code))

    # 5. Honeypot discard
    hp = dict(payload)
    hp["orgField"] = "I am a bot"
    r = requests.post(f"{API}/contact", json=hp, timeout=10)
    check("honeypot silently discarded", r.status_code == 200 and r.json().get("id") is None)

    # 6. Content endpoints (seeded)
    r = requests.get(f"{API}/case-studies", timeout=10)
    check("case studies seeded", r.status_code == 200 and len(r.json()) >= 5, f"count={len(r.json())}")
    slug = r.json()[0]["slug"]
    r = requests.get(f"{API}/case-studies/{slug}", timeout=10)
    check("case study detail", r.status_code == 200 and r.json()["slug"] == slug)

    r = requests.get(f"{API}/network", timeout=10)
    check("network seeded", r.status_code == 200 and len(r.json()) >= 20, f"count={len(r.json())}")
    r = requests.get(f"{API}/network?category=Creators", timeout=10)
    check("network category filter", r.status_code == 200 and all(x["category"] == "Creators" for x in r.json()))
    r = requests.get(f"{API}/network/categories", timeout=10)
    check("network categories list", r.status_code == 200 and len(r.json()["categories"]) >= 10)

    r = requests.get(f"{API}/insights", timeout=10)
    check("insights seeded (list, no body)", r.status_code == 200 and len(r.json()) >= 6 and "body" not in r.json()[0])
    islug = r.json()[0]["slug"]
    r = requests.get(f"{API}/insights/{islug}", timeout=10)
    check("insight detail with body", r.status_code == 200 and len(r.json().get("body", [])) > 3)

    # 6b. Ecosystem (Phase M/N/O/P) — derived collection, publicStatus-gated
    r = requests.get(f"{API}/ecosystem", timeout=10)
    ecosystem = r.json() if r.status_code == 200 else []
    expected_categories = {"built_here", "built_together", "collaborator", "creator", "venue", "partner"}
    seen_categories = {x["category"] for x in ecosystem}
    check(
        "ecosystem seeded, only public records, all 6 categories present",
        r.status_code == 200
        and len(ecosystem) > 0
        and all(x["publicStatus"] == "public" for x in ecosystem)
        and expected_categories.issubset(seen_categories),
        f"count={len(ecosystem)} categories={sorted(seen_categories)}",
    )
    # The 5 NETWORK_RESOURCES with relationshipType "HI ANZY DIRECT" are
    # hiAnzy's own internal studios, not external network entities — they
    # must never surface as ecosystem items. (Case studies hiAnzy built
    # itself DO legitimately carry provenance HI_ANZY_DIRECT under the
    # built_here category — that's a different, correct use of the same
    # enum value, not what this check is about.)
    internal_studio_slugs = {
        "hi-anzy-strategy-desk", "hi-anzy-brand-studio", "hi-anzy-systems-web-studio",
        "hi-anzy-automation-lab", "hi-anzy-ai-practice",
    }
    ecosystem_slugs = {x["slug"] for x in ecosystem}
    check(
        "hiAnzy-internal studios excluded from ecosystem",
        ecosystem_slugs.isdisjoint(internal_studio_slugs),
        f"overlap={ecosystem_slugs & internal_studio_slugs}",
    )
    r = requests.get(f"{API}/ecosystem?category=creator", timeout=10)
    check(
        "ecosystem category filter",
        r.status_code == 200 and len(r.json()) > 0 and all(x["category"] == "creator" for x in r.json()),
        f"count={len(r.json()) if r.status_code == 200 else 'n/a'}",
    )
    r = requests.get(f"{API}/ecosystem?category=not_a_real_category", timeout=10)
    check("ecosystem invalid category rejected (422)", r.status_code == 422, str(r.status_code))

    # 7. Analytics hardening (Phase A)
    r = requests.post(f"{API}/analytics/event", json={"name": "cta_primary_click", "path": "/poc"}, timeout=10)
    check("known analytics event accepted", r.status_code == 200 and r.json().get("ok") is True)

    r = requests.post(f"{API}/analytics/event", json={"name": "not_a_real_event"}, timeout=10)
    check("unknown analytics event rejected (422)", r.status_code == 422, str(r.status_code))

    r = requests.post(
        f"{API}/analytics/event",
        json={"name": "cta_primary_click", "meta": {f"k{i}": "v" for i in range(25)}},
        timeout=10,
    )
    check("oversized analytics meta rejected (422)", r.status_code == 422, str(r.status_code))

    r = requests.post(
        f"{API}/analytics/event",
        json={"name": "cta_primary_click", "meta": {"nested": {"a": 1}}},
        timeout=10,
    )
    check("nested analytics meta rejected (422)", r.status_code == 422, str(r.status_code))

    r = requests.post(f"{API}/analytics/event", json={"name": "cta_primary_click", "path": "no-leading-slash"}, timeout=10)
    check("malformed analytics path rejected (422)", r.status_code == 422, str(r.status_code))

    # 7b. Rate limit — runs last since it deliberately exhausts the analytics
    # bucket for this process's IP; anything after this point would itself be
    # silently dropped for ~60s. 65 requests to clear the 60/60s ceiling with
    # margin regardless of how many accepted calls ran earlier in this script.
    # Fired concurrently, not in a loop: sent one at a time, each round trip
    # through Docker's networking on this host takes long enough that the
    # earliest hits can age out of the 60s window before the last one goes
    # out, which let all 65 land and made this check flaky. A burst is what
    # the limiter is actually meant to catch.
    def _fire(i):
        requests.post(
            f"{API}/analytics/event",
            json={"name": "cta_primary_click", "meta": {"rateProbe": str(i)}},
            timeout=10,
        )

    accepted_before = mongo_count(dbname, "analytics_events", {"meta.rateProbe": {"$exists": True}})
    with ThreadPoolExecutor(max_workers=20) as pool:
        list(pool.map(_fire, range(65)))
    accepted_after = mongo_count(dbname, "analytics_events", {"meta.rateProbe": {"$exists": True}})
    landed = accepted_after - accepted_before
    check("analytics rate limit caps writes below request count", 0 < landed < 65, f"landed={landed}/65")
    mongo_delete(dbname, "analytics_events", {"meta.rateProbe": {"$exists": True}})

    # cleanup POC contact docs
    mongo_delete(dbname, "contact_submissions", {"email": "poc-test@example.com"})

    failed = [r for r in results if not r[1]]
    print(f"\n{'='*50}\n{len(results)-len(failed)}/{len(results)} checks passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
