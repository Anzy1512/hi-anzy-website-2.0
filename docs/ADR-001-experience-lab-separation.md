# ADR-001: hiAnzy Agency Website and Experience Lab are separate products

## Status

Accepted. Implemented before this document existed — `nginx.conf.template` and
`frontend/Dockerfile` have referenced "ADR-001" in comments since the Lab was
first mounted, but no document backed that reference until now. This closes
that gap; it records a decision already in effect, not a new one.

## Context

hiAnzy has two products sharing one brand:

1. **hiAnzy Agency Website** — the client-facing consultancy site: services,
   work, network, about, contact. Source lives in this repository at
   `frontend/src/`, `backend/`.
2. **hiAnzy Experience Lab** — an experimental experience platform (Living
   World, Matter Engine, Time Travel, Presence, Reality Compiler, hiAnzy OS,
   terminal, agency simulator, and other immersive modes). Its source is a
   **separate project not present in this repository.** Only its build output
   is committed here, at `frontend/lab/`.

Sharing a brand does not authorize merging the two products' pages,
navigation, application logic, dependencies, or deployments. This ADR records
how they stay separate while sharing one deployed origin.

## Decision

- The Lab is integrated as **pre-built static output only.** `frontend/lab/`
  contains its compiled `dist/` (71 files: hashed JS/CSS, its own fonts, its
  own brand assets) copied in verbatim. Nothing under `frontend/src/` imports,
  routes to, or iframes the Lab, and the Lab does not reach into the Agency's
  asset tree — its fonts and brand images are independent copies, not shared
  references.
- **Serving boundary:** `nginx.conf.template` gives `/lab/` and `/lab/assets/`
  their own `location ^~` blocks, placed before the SPA catch-all so the
  Agency's React Router fallback cannot shadow them, and the Lab's hashed
  assets get their own cache headers. `frontend/Dockerfile` copies `lab/` into
  the served image after the Agency's own build.
- **Deploy boundary:** `vercel.json`'s `buildCommand` and `amplify.yml`'s build
  phase both do a literal `cp -r lab build/lab` — the Agency's build script
  places the Lab's already-built output into its own serving tree. Neither
  config builds, lints, or tests Lab source, because none is present to build.
- **Verification boundary:** `scripts/check_frontend_lock.py` (the Agency's
  frozen-source CI gate) explicitly excludes `frontend/lab/` from its walk.
  Before this fix, Lab rebuilds appeared indistinguishable from unreviewed
  Agency changes in the same failure output — a real, if low-severity, mixing
  risk in tooling rather than runtime.
- **Dependency boundary:** `frontend/package.json` carries no Lab-specific
  dependencies. The Lab's bundle is self-contained within its own build
  output.
- **Ordinary links, not embedding:** any link from an Agency page to `/lab/`
  (or the reverse) is a normal `<a>`/navigation, never an iframe or inline
  mount. None currently exist in `frontend/src/` — verified by search, not
  assumed.

## What this repository does not contain

The Lab's actual source (whatever project produces `LAB_BASE=/lab/` builds
with modes named `ChaosMode`, `CompilerMode`, `DreamMode`, `MatterMode`,
`OsMode`, `PresenceMode`, `SimulatorMode`, `TimeMachineMode`, `WorldMode`,
etc.) is not in this repository, and was not found in the reference
`hi-anzy-website` platform checkout either — both contain the same
build-output-only pattern. Wherever that source lives, it is out of scope for
work done in this repository. Do not fabricate, guess at, or attempt to
reconstruct it here.

## Consequences

- The Agency can be built, tested, and deployed with zero knowledge of the
  Lab's internals — verified: `frontend/vite.config.mjs`, `frontend/src/`, and
  `backend/server.py` have no Lab references.
- The Lab **cannot currently be rebuilt from this repository.** Updating it
  means replacing `frontend/lab/`'s contents with a new build from its own
  project and re-verifying the serving/deploy boundaries above still hold —
  not editing files under `frontend/lab/` by hand.
- Scope for AI-assisted sessions is documented per-directory: see the root
  `CLAUDE.md` (Agency scope + project map) and `frontend/lab/CLAUDE.md` (Lab
  scope).

## See also

- [`../CLAUDE.md`](../CLAUDE.md) — root project map and Agency scope.
- [`../frontend/lab/CLAUDE.md`](../frontend/lab/CLAUDE.md) — Lab scope.
- `6f68021` — restored the Lab into this repo (`hi-anzy-website-2.0`).
- `dba09cf` (reference platform repo, `hi-anzy-website`) — original staging
  integration this repo's restoration was based on.
