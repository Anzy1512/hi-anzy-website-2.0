# hiAnzy — project map

This repository holds two separate products sharing one brand and one deployed
origin. They are not the same application. See
[`docs/ADR-001-experience-lab-separation.md`](docs/ADR-001-experience-lab-separation.md)
for the full separation decision and evidence.

| Product | Directory | Own scope file |
|---|---|---|
| hiAnzy Agency Website | everything in this repo **except** `frontend/lab/` | this file |
| hiAnzy Experience Lab | `frontend/lab/` (pre-built static output only — no source here) | [`frontend/lab/CLAUDE.md`](frontend/lab/CLAUDE.md) |

**A request for "hiAnzy" does not automatically mean both products.** Match the
request to whichever directory it actually touches. If a request genuinely
spans both (e.g. the shared brand, the `/lab/` routing boundary itself), say so
and ask before assuming scope — don't silently apply one product's rules to
the other's files.

---

## Scope: hiAnzy Agency Website

This scope is the hiAnzy Agency Website. Preserve its approved business
website experience. Do not introduce Experiment Lab features or change Lab
files unless explicitly requested.

### Directory

- `frontend/src/` — React app: pages, components, `lib/`. Everything under
  React Router lives here.
- `backend/` — FastAPI + Motor/Mongo API.
- `frontend/public/`, `frontend/index.html` — Agency's own static assets and
  HTML shell.
- Root-level deploy/build config (`vercel.json`, `amplify.yml`,
  `customHttp.yml`, `docker-compose.yml`, `frontend/Dockerfile`,
  `frontend/nginx.conf.template`, `backend/Dockerfile`) — all Agency-owned,
  except the specific `cp -r lab build/lab` copy step and the `/lab/` nginx
  locations, which move the Lab's pre-built output without touching it.
- `frontend/lab/` is **not** part of this scope — see its own CLAUDE.md.

### Entry points

- Frontend dev server: `npm start` in `frontend/` (Vite, port 3100).
- Backend dev server: `uvicorn server:app` in `backend/` (see
  `docs/project-notes/LOCAL-DEVELOPMENT.md`).
- Production build: `npm run build` in `frontend/` (Vite build → prerender →
  76 static HTML pages in `frontend/build/`).
- Full stack: `docker compose up` at the repo root.

### Deployment boundary

Currently deploys via Vercel Services (`vercel.json`). AWS Amplify Hosting +
App Runner preparation is documented in `AWS_PREP.md`; no AWS resources exist
yet. Either target serves the Agency's own build output plus a verbatim copy
of the Lab's pre-built `frontend/lab/` — see ADR-001 for exactly how that copy
stays a boundary, not a merge.

### Rules specific to this scope

- **Frontend freeze in effect** (see `AGENTS.md`): the visual design was
  frozen 2026-09-10, functional fixes authorized 2026-09-12. Bug fixes only —
  no redesign, no animation replacement, no copy rewrites. Verify with
  `python scripts/check_frontend_lock.py` before calling work done; it now
  excludes `frontend/lab/` (see ADR-001) so a stale/failing result here is
  always about Agency source, never the Lab.
- Preserve Lenis, GSAP/ScrollTrigger choreography, Framer Motion, 3D scenes,
  and all animation timing unless a task explicitly asks to change them.
- Never import from, route to, or iframe `frontend/lab/`. If a task asks for
  that, it is asking to break ADR-001 — flag it rather than doing it silently.
