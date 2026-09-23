# hiAnzy — project map

This repository is the **hiAnzy Agency Website** and nothing else. The hiAnzy
Experiment Lab (called the "Experience Lab" in older records) is a separate
product in a separate project: it is not hosted, bundled, built, served,
proxied, locked or deployed from here, and Agency work never modifies it.

| Product | Where | Scope file |
|---|---|---|
| hiAnzy Agency Website | this repository | this file |
| hiAnzy Experiment Lab | a separate project, not present in this repository | its own repository |

**A request for "hiAnzy" means the Agency Website here.** If a request needs
the Experiment Lab, say so and stop: the Lab is out of scope for this
repository. The only acceptable Agency-side reference to it is passive copy
inside already-approved Agency content (there is none today); such a
reference must never load Lab code or host the Lab.

## Product boundary (2026-09-23)

- `docs/ADR-001-experience-lab-separation.md` recorded the earlier
  arrangement, in which the Lab's build output was committed at
  `frontend/lab/` and served at `/lab/` from the Agency origin. That
  arrangement is superseded: `frontend/lab/` was removed, and nginx, the
  Docker image, `amplify.yml`, `vercel.json`, `customHttp.yml`, the source
  lock and the link-graph tooling no longer know about `/lab/`.
- Recovery, if the old bundled artifact is ever needed: `ad03114` on
  `ia/page-consolidation` is the last commit that contains it
  (`git show ad03114:frontend/lab/index.html`); `1474afd` is the last commit
  that changed it.
- `/lab/` on the Agency origin is an unknown path and answers the Agency's
  404 page.

## Scope: hiAnzy Agency Website

This scope is the hiAnzy Agency Website. Preserve its approved business
website experience. Do not introduce Experiment Lab features here.

### Directory

- `frontend/src/` — React app: pages, components, `lib/`. Everything under
  React Router lives here.
- `backend/` — FastAPI + Motor/Mongo API.
- `frontend/public/`, `frontend/index.html` — the Agency's static assets and
  HTML shell.
- Root-level deploy/build config (`vercel.json`, `amplify.yml`,
  `customHttp.yml`, `docker-compose.yml`, `frontend/Dockerfile`,
  `frontend/nginx.conf.template`, `backend/Dockerfile`) — all Agency-owned.

### Entry points

- Frontend dev server: `npm start` in `frontend/` (Vite, port 3100).
- Backend dev server: `uvicorn server:app` in `backend/` (see
  `docs/project-notes/LOCAL-DEVELOPMENT.md`).
- Production build: `npm run build` in `frontend/` (Vite build → prerender →
  one static HTML page per public route in `frontend/build/`; 67 pages since
  the information-architecture consolidation of 2026-09-23, see
  `docs/IA_CONSOLIDATION_AUDIT.md`).
- Full stack: `docker compose up` at the repo root.

### Deployment boundary

Intended production hosting is AWS Amplify Hosting (static site) + App Runner
(API, from ECR) + MongoDB Atlas, per `docs/ADR-002-aws-production-architecture.md`
and `AWS_PREP.md`; no AWS resource exists yet. `vercel.json` remains the
Vercel Services fallback until cutover. Both targets serve the Agency's own
build output only.

### Rules specific to this scope

- **Frontend freeze in effect** (see `AGENTS.md`): the visual design was
  frozen 2026-09-10, functional fixes authorized 2026-09-12. Bug fixes only —
  no redesign, no animation replacement, no copy rewrites. Verify with
  `python scripts/check_frontend_lock.py` before calling work done.
- Preserve Lenis, GSAP/ScrollTrigger choreography, Framer Motion, 3D scenes,
  and all animation timing unless a task explicitly asks to change them.
- Never import from, route to, iframe or copy the Experiment Lab into this
  repository. If a task asks for that, it is asking to cross the product
  boundary — flag it rather than doing it silently.
