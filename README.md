# hi anzy website 2.0

The hiAnzy website, with its existing design, portfolio carousels, scrolling animations and interactive network. The backend serves public content and handles enquiries, subscriptions and sign-in.

Official contact: anish@hianzy.com | +91 8470098122.

## Project layout

| Folder | Contents |
| --- | --- |
| frontend/ | React pages, Three.js scenes, styles and public assets |
| backend/ | FastAPI application, content records and runtime dependencies |
| tests/ | Backend regression tests |
| scripts/ | Source verification utilities |
| docs/ | Release notes, design references and earlier audits |

The backend entry point is `backend/server.py`. Related routes stay together and share validation, session lookup, admin access and notification helpers. `backend/seed_data.py` supplies published database content. See [backend setup](backend/README.md) for API routes and configuration.

## Run with Docker

```powershell
Copy-Item .env.docker.example .env
docker compose up -d --build
```

Website: http://localhost:8080. API health: http://localhost:8010/api/health. MongoDB is accessible only inside the Compose network. Configure your email and sign-in services in the environment file. Credentials and database files are excluded from Git.

## Run without Docker

Use Node.js 22.14+, npm 11+, Python 3.12+ and MongoDB. Start MongoDB first. From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
```

Set `MONGO_URL` and `DB_NAME` in `backend/.env`. For local HTTP, use `ENVIRONMENT=development`, `COOKIE_SECURE=false` and `COOKIE_SAMESITE=lax`. Start the API:

```powershell
Set-Location backend
..\.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8111
```

In another terminal:

```powershell
Set-Location frontend
npm ci
Copy-Item .env.example .env
npm start
```

The website uses port 3100 and proxies `/api` to port 8111. Never place private keys in frontend environment variables.

## Check the project

From `frontend/`: `npm run lint`, `npm test`, `npm run build`.

From the project root:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest tests/test_api.py -q -p no:cacheprovider
python scripts/check_frontend_lock.py
```

Backend tests use MongoDB at `127.0.0.1:27117` by default. Set `TEST_MONGO_URL` to use a different test server. Tests create and delete only a uniquely named `hianzy_test_*` database; email and sign-in providers are mocked.

The September 12 release includes functional fixes without a redesign. See [release notes](docs/release-2.0.md) for changes and checks. Dependencies, generated builds, Desktop reference documents and private recovery backups are outside Git. Previous audit reports describe earlier project states.

Private project. All rights reserved.
