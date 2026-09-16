# hiAnzy API

`server.py` contains the application, validation, routes, notifications and session handling. `seed_data.py` supplies the site's published content. The release preserves the website's design and existing API routes, field names and content.

## Run locally

Install `requirements.txt` in a Python environment. Copy `.env.example` to `.env`, then set `MONGO_URL` and `DB_NAME`. For local HTTP use `ENVIRONMENT=development`, `COOKIE_SECURE=false` and `COOKIE_SAMESITE=lax`.

From this directory:

```powershell
..\.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8111
```

The existing local database runs on port 27117. Check `/api/health` for database readiness. The application creates unique indexes and adds or updates seed records at startup. Unchanged records keep their timestamps.

## Routes

| Purpose | Routes |
| --- | --- |
| Status | `GET /api/`, `GET /api/health` |
| Work | `GET /api/case-studies`, `GET /api/case-studies/{slug}`, `GET /api/portfolio` |
| Network | `GET /api/network`, `GET /api/network/categories`, `GET /api/ecosystem` |
| Insights | `GET /api/insights`, `GET /api/insights/{slug}` |
| Enquiries | `POST /api/contact`, `GET /api/contact-submissions` |
| Notes | `POST /api/subscribe`, `GET /api/subscribers` |
| Sign-in | `POST /api/auth/session`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Analytics | `POST /api/analytics/event` |

The enquiry and subscriber lists require a valid session and an email address listed in `ADMIN_EMAILS`. Public content routes retain their published/public filters. Sign-in still uses the provider expected by the existing frontend.

## Notifications

Enquiries are stored before email is attempted. Set `CONTACT_NOTIFY_EMAIL` to `anish@hianzy.com`, then configure either Resend or SMTP. Resend needs `RESEND_API_KEY` and a verified `RESEND_FROM`. SMTP needs `SMTP_HOST` and a sender in `SMTP_USER`; supply credentials when the relay requires authentication.

Missing configuration or a delivery failure returns `emailSent: false`; it does not discard the enquiry. Local tests mock delivery and sign-in providers and send no real messages.

## Checks

From the project root, with local MongoDB running:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_api.py -q -p no:cacheprovider
.\.venv\Scripts\python.exe scripts/check_frontend_lock.py
```

Tests create and remove their own uniquely named `hianzy_test_*` database. They never use the preview database for submissions. The rate limiter is in memory and assumes a single API worker; multiple workers require a shared store.

## Operations

`operations.py` owns durable notification attempts and retry leases. `manage.py` provides the local operator console. Enquiries retain their review and delivery state in MongoDB. Newsletter delivery requires explicit confirmation and includes unsubscribe handling. See [operations](../docs/operations.md) before enabling real mail.
