"""Content, enquiries, subscriptions and sign-in for the hiAnzy website."""

import asyncio
import json
import logging
import math
import os
import smtplib
import secrets
import hashlib
import html
import time
import uuid
from contextlib import asynccontextmanager, suppress
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from enum import Enum
from pathlib import Path
from typing import List, Optional, Dict, Any

import requests as http_requests
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import HTMLResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, TypeAdapter, ValidationError, field_validator
from pymongo import ReturnDocument
from starlette.middleware.cors import CORSMiddleware

from operations import pending_delivery, deliver_record, notification_loop

from seed_data import CASE_STUDIES, NETWORK_RESOURCES, INSIGHTS, PORTFOLIO_GROUPS, ECOSYSTEM_ITEMS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

def required_setting(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Set {name} in backend/.env before starting the API")
    return value


mongo_url = required_setting("MONGO_URL")
database_name = required_setting("DB_NAME")
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
db = client[database_name]

ENVIRONMENT = os.environ.get("ENVIRONMENT", "production").strip().lower()
IS_PRODUCTION = ENVIRONMENT not in {"development", "dev", "local"}

@asynccontextmanager
async def lifespan(app):
    prune_task = None
    delivery_task = None
    try:
        await seed()
        prune_task = asyncio.create_task(_prune_rate_limiter_loop())
        delivery_task = asyncio.create_task(notification_loop(db, send_contact_notification, send_subscription_confirmation, mail_configured))
        yield
    finally:
        for task in (prune_task, delivery_task):
            if task:
                task.cancel()
                with suppress(asyncio.CancelledError):
                    await task
        client.close()


app = FastAPI(
    lifespan=lifespan,
    title="hiAnzy API",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("hi-anzy")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=4000)
    company: Optional[str] = Field(None, max_length=200)
    role: Optional[str] = Field(None, max_length=200)
    website: Optional[str] = Field(None, max_length=300)
    stage: Optional[str] = Field(None, max_length=200)
    investmentRange: Optional[str] = Field(None, max_length=200)
    timeline: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=40)
    orgField: Optional[str] = None  # honeypot

    @field_validator("name", "message", "email", mode="before")
    @classmethod
    def trim_required_fields(cls, value):
        return value.strip() if isinstance(value, str) else value


class SubscribeCreate(BaseModel):
    email: EmailStr
    source: Optional[str] = Field(None, max_length=120)
    orgField: Optional[str] = None  # honeypot

    @field_validator("email", mode="before")
    @classmethod
    def trim_email(cls, value):
        return value.strip() if isinstance(value, str) else value


ALLOWED_EVENTS = {
    "cta_primary_click", "method_explored", "service_explored", "diagnostic_cta_click",
    "case_opened", "network_category_selected", "discipline_opened", "network_deep_dive",
    "network_profile_opened", "resource_requested", "resource_discussed", "contact_started", "contact_form_abandoned",
    "contact_validation_failed", "contact_completed", "service_to_case", "portfolio_item_opened",
    "case_expanded", "case_to_service", "command_palette_opened", "command_palette_navigate",
    "notes_subscribed", "next_step_click", "package_module_added", "package_brief_sent",
    "package_stage_opened", "theme_changed", "discipline_cross_link", "article_read_depth",
    "orbit_viewed", "orbit_category_changed", "orbit_card_dragged", "orbit_category_opened",
    "ecosystem_index_viewed", "ecosystem_profile_opened", "ecosystem_filter_used",
    "coming_soon_viewed", "hianzy_ai_teaser_clicked", "imkaan_teaser_clicked",
}

ANALYTICS_META_MAX_KEYS = 20
ANALYTICS_META_MAX_KEY_LEN = 60
ANALYTICS_META_MAX_STR_LEN = 500
ANALYTICS_META_MAX_BYTES = 4096


class AnalyticsEvent(BaseModel):
    name: str
    path: Optional[str] = Field(None, max_length=200)
    meta: Optional[Dict[str, Any]] = None

    @field_validator("name")
    @classmethod
    def name_must_be_allowed(cls, v: str) -> str:
        if v not in ALLOWED_EVENTS:
            raise ValueError("unknown event name")
        return v

    @field_validator("path")
    @classmethod
    def path_must_look_like_a_path(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.startswith("/"):
            raise ValueError("path must start with '/'")
        return v

    @field_validator("meta")
    @classmethod
    def meta_must_be_shallow_and_bounded(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if v is None:
            return v
        if len(v) > ANALYTICS_META_MAX_KEYS:
            raise ValueError(f"meta may carry at most {ANALYTICS_META_MAX_KEYS} keys")
        for key, value in v.items():
            if not isinstance(key, str) or len(key) > ANALYTICS_META_MAX_KEY_LEN:
                raise ValueError("meta key too long")
            if value is not None and not isinstance(value, (str, int, float, bool)):
                raise ValueError("meta values must be scalar (no nested objects/arrays)")
            if isinstance(value, float) and not math.isfinite(value):
                raise ValueError("meta numbers must be finite")
            if isinstance(value, str):
                if len(value) > ANALYTICS_META_MAX_STR_LEN:
                    raise ValueError("meta string value too long")
                if any(ord(c) < 32 or ord(c) == 127 for c in value):
                    raise ValueError("meta value contains control characters")
        if len(json.dumps(v).encode("utf-8")) > ANALYTICS_META_MAX_BYTES:
            raise ValueError("meta payload too large")
        return v


class EcosystemCategory(str, Enum):
    """Public categories used by the portfolio and network pages."""
    built_here = "built_here"
    built_together = "built_together"
    collaborator = "collaborator"
    creator = "creator"
    venue = "venue"
    partner = "partner"


class Provenance(str, Enum):
    """Describes who delivered the work or provides access."""
    HI_ANZY_DIRECT = "HI_ANZY_DIRECT"
    HI_ANZY_COLLABORATOR = "HI_ANZY_COLLABORATOR"
    COLLABORATOR_CREDENTIAL = "COLLABORATOR_CREDENTIAL"
    NETWORK_ACCESS = "NETWORK_ACCESS"


class EcosystemItem(BaseModel):
    """Public ecosystem record returned to the website."""
    id: str
    slug: str
    name: str
    category: EcosystemCategory
    relationshipType: str
    title: str
    shortDescription: str
    longDescription: Optional[str] = None
    image: Optional[str] = None
    gallery: List[str] = Field(default_factory=list)
    capabilities: List[str] = Field(default_factory=list)
    geography: List[str] = Field(default_factory=list)
    links: List[str] = Field(default_factory=list)
    featured: bool = False
    publicStatus: str
    lastVerified: str
    provenance: Provenance
    sortOrder: int
    details: Optional[Dict[str, Any]] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


def _send_email_sync(subject: str, text: str, to: str, from_addr: str) -> bool:
    subject = " ".join(subject.splitlines())
    resend_key = os.environ.get("RESEND_API_KEY")
    if resend_key:
        try:
            resp = http_requests.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
                json={"from": from_addr, "to": [to], "subject": subject, "text": text},
                timeout=10,
            )
            if 200 <= resp.status_code < 300:
                return True
            logger.warning("Resend rejected a notification (HTTP %s)", resp.status_code)
            return False
        except Exception as e:
            logger.warning("Resend notification failed: %s", type(e).__name__)
            return False

    smtp_host = os.environ.get("SMTP_HOST")
    if smtp_host:
        try:
            smtp_port = int(os.environ.get("SMTP_PORT") or 587)
            smtp_user = os.environ.get("SMTP_USER", "")
            smtp_pass = os.environ.get("SMTP_PASS", "")
            msg = MIMEText(text)
            msg["Subject"] = subject
            msg["From"] = from_addr
            msg["To"] = to
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as s:
                s.starttls()
                if smtp_user:
                    s.login(smtp_user, smtp_pass)
                s.send_message(msg)
            return True
        except Exception as e:
            logger.warning("SMTP notification failed: %s", type(e).__name__)
            return False

    return False


async def send_email(subject: str, text: str, to: Optional[str] = None) -> bool:
    notify_to = to or os.environ.get("CONTACT_NOTIFY_EMAIL")
    from_addr = os.environ.get("RESEND_FROM") or os.environ.get("SMTP_USER")
    if not notify_to:
        return False
    if not from_addr:
        logger.info("Email notification skipped: configure RESEND_FROM or SMTP_USER")
        return False
    try:
        return await asyncio.to_thread(_send_email_sync, subject, text, notify_to, from_addr)
    except Exception as e:
        logger.warning("Email notification failed: %s", type(e).__name__)
        return False


def mail_configured() -> bool:
    sender = os.environ.get("RESEND_FROM") or os.environ.get("SMTP_USER")
    return bool(sender and (os.environ.get("RESEND_API_KEY") or os.environ.get("SMTP_HOST")))


def public_site_url() -> str:
    return (os.environ.get("SITE_URL") or "https://hianzy.com").rstrip("/")


def public_api_url() -> str:
    return (os.environ.get("PUBLIC_API_URL") or public_site_url()).rstrip("/")


async def send_contact_notification(record):
    fields = ["name", "email", "phone", "company", "role", "website", "stage", "investmentRange", "timeline", "message"]
    text = "\n".join(f"{key}: {record.get(key) or '-'}" for key in fields)
    return await send_email(f"New enquiry: {record['name']}", f"Enquiry: {record['id']}\n{text}")


async def send_subscription_confirmation(record):
    if record.get("confirmed") or record.get("unsubscribed"):
        return True
    token = record.get("confirmationToken")
    if not token or record.get("confirmationExpiresAt", 0) < time.time():
        return False
    link = f"{public_api_url()}/api/newsletter/confirm?token={token}"
    return await send_email("Confirm your hiAnzy notes subscription",
        f"You asked to receive hiAnzy notes. Confirm your address here:\n{link}\n\n"
        "This link expires in seven days. If you did not request this, ignore the message.", record["email"])


# One worker owns these buckets. Multiple workers need a shared rate-limit store.
_rate: Dict[str, List[float]] = {}
_RATE_PRUNE_AFTER = 900  # comfortably longer than any bucket's own window


def rate_limited(bucket: str, ip: str, max_hits: int = 5, window_seconds: int = 600) -> bool:
    now = time.monotonic()
    key = f"{bucket}:{ip}"
    hits = [t for t in _rate.get(key, []) if now - t < window_seconds]
    if len(hits) >= max_hits:
        _rate[key] = hits
        return True
    hits.append(now)
    _rate[key] = hits
    return False


async def _prune_rate_limiter_loop():
    """Remove idle rate-limit buckets to release memory."""
    while True:
        await asyncio.sleep(_RATE_PRUNE_AFTER)
        now = time.monotonic()
        stale = [k for k, hits in _rate.items() if not hits or now - hits[-1] >= _RATE_PRUNE_AFTER]
        for k in stale:
            _rate.pop(k, None)


@api_router.get("/")
async def root():
    return {"service": "hiAnzy API", "status": "ok"}


@api_router.get("/health")
async def health():
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"status": "ok", "db": db_status}


@api_router.get("/case-studies")
async def list_case_studies(featured: Optional[bool] = None):
    query: Dict[str, Any] = {"published": True}
    if featured is not None:
        query["featured"] = featured
    cursor = db.case_studies.find(query, {"_id": 0, "body": 0}).sort("_id", 1)
    return await cursor.to_list(length=100)


@api_router.get("/case-studies/{slug}")
async def get_case_study(slug: str):
    doc = await db.case_studies.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Case study not found")
    return doc


@api_router.get("/network")
async def list_network(category: Optional[str] = None):
    query: Dict[str, Any] = {"publicStatus": "public"}
    if category:
        query["category"] = category
    cursor = db.network_resources.find(query, {"_id": 0}).sort("featured", -1)
    return await cursor.to_list(length=200)


@api_router.get("/network/categories")
async def network_categories():
    docs = await db.network_resources.find({"publicStatus": "public"}, {"_id": 0, "category": 1}).to_list(length=200)
    seen = []
    for d in docs:
        cat = d.get("category")
        if cat and cat not in seen:
            seen.append(cat)
    return {"categories": seen}


@api_router.get("/ecosystem", response_model=List[EcosystemItem])
async def list_ecosystem(category: Optional[EcosystemCategory] = None):
    """Return public records in editorial order."""
    query: Dict[str, Any] = {"publicStatus": "public"}
    if category:
        query["category"] = category.value
    cursor = db.ecosystem_items.find(query, {"_id": 0}).sort("sortOrder", 1)
    return await cursor.to_list(length=100)


@api_router.get("/insights")
async def list_insights(category: Optional[str] = None):
    """Return published insights, optionally filtered by category."""
    query: Dict[str, Any] = {"published": True}
    if category:
        query["category"] = category
    cursor = db.insights.find(query, {"_id": 0, "body": 0}).sort("_id", -1)
    return await cursor.to_list(length=50)


@api_router.get("/insights/{slug}")
async def get_insight(slug: str):
    doc = await db.insights.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Insight not found")
    return doc


@api_router.get("/portfolio")
async def list_portfolio():
    cursor = db.portfolio_groups.find({}, {"_id": 0}).sort("_id", 1)
    return await cursor.to_list(length=20)


@api_router.post("/contact")
async def create_contact(payload: ContactCreate, request: Request):
    ip = request.client.host if request.client else "unknown"

    if payload.orgField:
        return {"ok": True, "id": None, "emailSent": False}

    if rate_limited("contact", ip):
        raise HTTPException(status_code=429, detail="Please try again in a few minutes", headers={"Retry-After": "600"})

    sub_id = str(uuid.uuid4())
    doc = {
        "id": sub_id,
        **payload.model_dump(exclude={"orgField"}),
        "ip": ip,
        "createdAt": now_iso(),
        "reviewStatus": "new",
        "delivery": pending_delivery(),
    }
    await db.contact_submissions.insert_one(doc)

    email_sent = await deliver_record(db.contact_submissions, sub_id, send_contact_notification) if mail_configured() else False

    return {"ok": True, "id": sub_id, "emailSent": email_sent}


@api_router.post("/subscribe")
async def create_subscription(payload: SubscribeCreate, request: Request):
    """Save an address once without disclosing existing subscriptions."""
    ip = request.client.host if request.client else "unknown"

    if payload.orgField:
        return {"ok": True}

    if rate_limited("subscribe", ip):
        raise HTTPException(status_code=429, detail="Please try again in a few minutes", headers={"Retry-After": "600"})

    email = payload.email.lower().strip()
    token = secrets.token_urlsafe(32)
    result = await db.subscribers.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "source": payload.source,
                "updatedAt": now_iso(),
            },
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "createdAt": now_iso(),
                "confirmed": False,
                "unsubscribed": False,
                "confirmationToken": token,
                "confirmationHash": hashlib.sha256(token.encode()).hexdigest(),
                "confirmationExpiresAt": time.time() + 7 * 86400,
                "unsubscribeToken": secrets.token_urlsafe(32),
                "delivery": pending_delivery(),
            },
        },
        upsert=True,
    )

    if result.upserted_id is None:
        # Allow another opt-in after expiry or unsubscribe, without changing a
        # current confirmed subscription or disclosing whether it exists.
        await db.subscribers.update_one(
            {"email": email, "$or": [{"unsubscribed": True},
                {"confirmed": False, "confirmationExpiresAt": {"$lt": time.time()}},
                {"confirmed": False, "confirmationHash": {"$exists": False}}]},
            {"$set": {"confirmed": False, "unsubscribed": False,
                "confirmationToken": token, "confirmationHash": hashlib.sha256(token.encode()).hexdigest(),
                "confirmationExpiresAt": time.time() + 7 * 86400,
                "unsubscribeToken": secrets.token_urlsafe(32), "delivery": pending_delivery()}},
        )
    if mail_configured():
        subscriber = await db.subscribers.find_one({"email": email})
        await deliver_record(db.subscribers, subscriber["id"], send_subscription_confirmation)

    return {"ok": True}


async def require_admin(request: Request) -> dict:
    """Require a valid session and an address on the admin allowlist."""
    user = await session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    admins = {
        e.strip().lower()
        for e in os.environ.get("ADMIN_EMAILS", "").split(",")
        if e.strip()
    }
    if not admins:
        logger.error("Admin access denied: ADMIN_EMAILS is not configured")
        raise HTTPException(status_code=403, detail="Admin access is not configured")

    if (user.get("email") or "").lower() not in admins:
        raise HTTPException(status_code=403, detail="Not authorised")
    return user


@api_router.get("/subscribers")
async def list_subscribers(request: Request):
    """Return subscribers to configured administrators."""
    await require_admin(request)

    cursor = db.subscribers.find({}, {"_id": 0, "ip": 0, "confirmationToken": 0, "confirmationHash": 0, "unsubscribeToken": 0}).sort("createdAt", -1)
    return await cursor.to_list(length=500)


@api_router.get("/contact-submissions")
async def list_contact_submissions(request: Request):
    """Return enquiries to administrators, excluding stored IP addresses."""
    await require_admin(request)

    cursor = db.contact_submissions.find({}, {"_id": 0, "ip": 0}).sort("createdAt", -1)
    return await cursor.to_list(length=200)


class EnquiryReview(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def known_status(cls, value):
        if value not in {"new", "in_progress", "replied", "closed"}:
            raise ValueError("Unknown review status")
        return value


@api_router.patch("/contact-submissions/{record_id}")
async def review_enquiry(record_id: str, payload: EnquiryReview, request: Request):
    user = await require_admin(request)
    result = await db.contact_submissions.update_one({"id": record_id}, {"$set": {
        "reviewStatus": payload.status, "reviewedAt": now_iso(), "reviewedBy": user["email"]}})
    if not result.matched_count:
        raise HTTPException(404, "Enquiry not found")
    return {"ok": True}


@api_router.post("/contact-submissions/{record_id}/retry")
async def retry_enquiry(record_id: str, request: Request):
    await require_admin(request)
    result = await db.contact_submissions.update_one(
        {"id": record_id, "$or": [{"delivery.status": {"$in": ["failed", "retry", "pending"]}},
                                   {"delivery": {"$exists": False}}]},
        {"$set": {"delivery": pending_delivery()}},
    )
    if not result.matched_count:
        raise HTTPException(409, "Enquiry unavailable or delivery is already sent/in progress")
    return {"ok": True}


@api_router.get("/operations/status")
async def operations_status(request: Request):
    await require_admin(request)
    return {"mailConfigured": mail_configured(),
            "notificationRecipientConfigured": bool(os.environ.get("CONTACT_NOTIFY_EMAIL")),
            "newEnquiries": await db.contact_submissions.count_documents({"reviewStatus": {"$in": ["new", None]}}),
            "failedNotifications": await db.contact_submissions.count_documents({"delivery.status": "failed"})}


class SubscriptionToken(BaseModel):
    token: str = Field(min_length=32, max_length=128)


@api_router.get("/newsletter/{action}", response_class=HTMLResponse)
async def newsletter_action_page(action: str, token: str = ""):
    if action not in {"confirm", "unsubscribe"} or not 32 <= len(token) <= 128:
        raise HTTPException(400, "Invalid subscription link")
    verb = "Confirm subscription" if action == "confirm" else "Unsubscribe"
    # GET renders only: email scanners must not confirm or remove subscriptions.
    return HTMLResponse(f"""<!doctype html><html lang="en"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
    <title>{verb} | hiAnzy</title><body><main><h1>{verb}</h1>
    <form method="post"><input type="hidden" name="token" value="{html.escape(token, quote=True)}">
    <button>{verb}</button></form></main></body></html>""",
    headers={"Referrer-Policy": "no-referrer", "Cache-Control": "no-store"})


@api_router.post("/newsletter/{action}")
async def newsletter_action(action: str, request: Request):
    if action not in {"confirm", "unsubscribe"}:
        raise HTTPException(404, "Unknown subscription action")
    if rate_limited("newsletter_action", request.client.host if request.client else "unknown", 20, 600):
        raise HTTPException(429, "Please try again later")
    is_json = "application/json" in request.headers.get("content-type", "")
    if is_json:
        try:
            raw = await request.json()
        except ValueError:
            raise HTTPException(400, "Invalid JSON")
    else:
        from urllib.parse import parse_qs
        body = await request.body()
        if len(body) > 1024:
            raise HTTPException(413, "Request too large")
        try:
            raw = {k: v[0] for k, v in parse_qs(body.decode()).items()}
        except UnicodeDecodeError:
            raise HTTPException(400, "Invalid form encoding")
    try:
        token = SubscriptionToken.model_validate(raw).token
    except ValidationError:
        raise HTTPException(400, "Invalid subscription link")
    if action == "confirm":
        result = await db.subscribers.update_one(
            {"confirmationHash": hashlib.sha256(token.encode()).hexdigest(),
             "confirmationExpiresAt": {"$gt": time.time()}, "unsubscribed": False},
            {"$set": {"confirmed": True, "confirmedAt": now_iso()},
             "$unset": {"confirmationToken": "", "confirmationHash": ""}},
        )
    else:
        result = await db.subscribers.update_one({"unsubscribeToken": token},
            {"$set": {"unsubscribed": True, "confirmed": False, "unsubscribedAt": now_iso()},
             "$unset": {"confirmationToken": "", "confirmationHash": ""}})
    if not result.matched_count:
        raise HTTPException(400, "This link is invalid, expired or already used")
    if is_json:
        return {"ok": True}
    message = "Subscription confirmed." if action == "confirm" else "You have been unsubscribed."
    return HTMLResponse(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>hiAnzy notes</title><main><h1>{message}</h1><a href="{html.escape(public_site_url(), quote=True)}">Return to hiAnzy</a></main></html>',
        headers={"Referrer-Policy": "no-referrer", "Cache-Control": "no-store"})


@api_router.post("/analytics/event")
async def track_event(evt: AnalyticsEvent, request: Request):
    ip = request.client.host if request.client else "unknown"
    if rate_limited("analytics", ip, max_hits=60, window_seconds=60):
        return {"ok": True}
    await db.analytics_events.insert_one({
        "name": evt.name,
        "path": evt.path,
        "meta": evt.meta or {},
        "createdAt": now_iso(),
    })
    return {"ok": True}


EMERGENT_SESSION_DATA_URL = os.environ.get("AUTH_SESSION_DATA_URL") or "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_COOKIE = "session_token"
SESSION_TTL_DAYS = 7
cookie_secure_setting = os.environ.get("COOKIE_SECURE", "").strip().lower()
if cookie_secure_setting not in {"", "true", "false"}:
    raise RuntimeError("COOKIE_SECURE must be true or false")
COOKIE_SECURE = cookie_secure_setting == "true" if cookie_secure_setting else IS_PRODUCTION
COOKIE_SAMESITE = os.environ.get("COOKIE_SAMESITE", "").strip().lower() or ("none" if COOKIE_SECURE else "lax")
if COOKIE_SAMESITE not in {"none", "lax", "strict"}:
    raise RuntimeError("COOKIE_SAMESITE must be none, lax or strict")
if COOKIE_SAMESITE == "none" and not COOKIE_SECURE:
    raise RuntimeError("COOKIE_SAMESITE=none requires COOKIE_SECURE=true")
email_adapter = TypeAdapter(EmailStr)


def public_user(doc: dict) -> dict:
    """Return profile fields without session credentials."""
    return {
        "id": doc.get("user_id"),
        "email": doc.get("email"),
        "name": doc.get("name"),
        "picture": doc.get("picture"),
    }


def session_token(request: Request) -> Optional[str]:
    """Use the same cookie or bearer token for login checks and logout."""
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        return token
    scheme, _, credential = request.headers.get("Authorization", "").partition(" ")
    if scheme.lower() != "bearer":
        return None
    return credential.strip() or None


async def session_user(request: Request) -> Optional[dict]:
    """Resolve a valid, unexpired session."""
    token = session_token(request)
    if not token:
        return None

    sess = await db.user_sessions.find_one({"session_token": token})
    if not sess:
        return None

    try:
        expires_at = datetime.fromisoformat(sess.get("expiresAt", ""))
        valid = expires_at.tzinfo is not None and expires_at > datetime.now(timezone.utc)
    except (ValueError, TypeError):
        valid = False
    if not valid:
        await db.user_sessions.delete_one({"session_token": token})
        return None

    return await db.users.find_one({"user_id": sess.get("user_id")})


@api_router.post("/auth/session")
async def auth_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing X-Session-ID header")

    def fetch_profile():
        return http_requests.get(
            EMERGENT_SESSION_DATA_URL,
            headers={"X-Session-ID": session_id},
            timeout=10,
        )

    try:
        provider = await asyncio.to_thread(fetch_profile)
    except Exception as exc:  # network/timeout — never leak details to the client
        logger.error("Auth provider request failed: %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="Auth provider unreachable")

    if provider.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    try:
        data = provider.json()
        if not isinstance(data, dict):
            raise ValueError("Invalid profile")
    except (ValueError, TypeError):
        raise HTTPException(status_code=502, detail="Invalid auth provider response")
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Auth provider returned no email")
    try:
        email = email_adapter.validate_python(email)
        for field in ("name", "picture"):
            if data.get(field) is not None and not isinstance(data[field], str):
                raise ValueError(f"Invalid {field}")
    except (ValidationError, ValueError):
        raise HTTPException(status_code=502, detail="Invalid auth provider response")

    # A single upsert avoids creating two accounts during simultaneous sign-ins.
    user = await db.users.find_one_and_update(
        {"email": email},
        {
            "$set": {
                "name": data.get("name"),
                "picture": data.get("picture"),
                "lastLoginAt": now_iso(),
            },
            "$setOnInsert": {
                "user_id": str(uuid.uuid4()),
                "email": email,
                "createdAt": now_iso(),
            },
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    token = str(uuid.uuid4())
    await db.user_sessions.insert_one({
        "session_token": token,
        "user_id": user["user_id"],
        "createdAt": now_iso(),
        "expiresAt": (datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)).isoformat(),
    })

    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
        path="/",
    )
    return {"user": public_user(user)}


@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return public_user(user)


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = session_token(request)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(key=SESSION_COOKIE, path="/", samesite=COOKIE_SAMESITE, secure=COOKIE_SECURE)
    return {"ok": True}


async def upsert_all(collection, docs: List[dict], key: str) -> int:
    """Write changed content; keep timestamps stable on an unchanged restart."""
    written = 0
    now = now_iso()
    for doc in docs:
        existing = await collection.find_one({key: doc[key]}, {"_id": 0})
        if existing and all(field in existing and existing[field] == value for field, value in doc.items()):
            continue
        result = await collection.update_one(
            {key: doc[key]},
            {"$set": {**doc, "updatedAt": now}, "$setOnInsert": {"createdAt": now}},
            upsert=True,
        )
        if result.upserted_id is not None or result.modified_count:
            written += 1
    return written


async def seed():
    for collection, key in (
        (db.subscribers, "email"),
        (db.newsletter_deliveries, "id"),
        (db.users, "email"),
        (db.user_sessions, "session_token"),
        (db.case_studies, "slug"),
        (db.network_resources, "slug"),
        (db.insights, "slug"),
        (db.portfolio_groups, "category"),
        (db.ecosystem_items, "slug"),
    ):
        await collection.create_index(key, unique=True)
    for collection, docs, key, label in (
        (db.case_studies, CASE_STUDIES, "slug", "case studies"),
        (db.network_resources, NETWORK_RESOURCES, "slug", "network resources"),
        (db.insights, INSIGHTS, "slug", "insights"),
        (db.portfolio_groups, PORTFOLIO_GROUPS, "category", "portfolio groups"),
        (db.ecosystem_items, ECOSYSTEM_ITEMS, "slug", "ecosystem items"),
    ):
        written = await upsert_all(collection, docs, key)
        if written:
            logger.info("Seeded/updated %s %s", written, label)


app.include_router(api_router)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Apply browser response headers to API responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), interest-cohort=()"
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    response.headers["Server"] = "hi-anzy"
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


raw_origins = os.environ.get("CORS_ORIGINS", "").strip()
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:3100",
    "http://127.0.0.1:3100",
]

if "*" in origins:
    logger.error(
        "Ignoring wildcard CORS origin: set an explicit frontend origin."
    )
    origins = [o for o in origins if o != "*"]

if not origins:
    if IS_PRODUCTION:
        logger.error("CORS_ORIGINS is unset in production — cross-origin requests will be denied.")
    else:
        origins = DEV_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Session-ID"],
    max_age=600,
)
