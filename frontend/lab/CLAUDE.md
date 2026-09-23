# hiAnzy Experience Lab — scope

This scope is the hiAnzy Experiment Lab. Experimental work belongs here. Do
not modify the Agency Website or its approved frontend unless explicitly
requested.

See [`../../docs/ADR-001-experience-lab-separation.md`](../../docs/ADR-001-experience-lab-separation.md)
for the full separation decision this scope implements.

## What is actually in this directory

**Pre-built static output only — no source.** This directory holds 71 files
of already-compiled, minified, content-hashed build output (`assets/*.js`,
`assets/*.css`, `index.html`, its own `fonts/` and `brand/`). There is no
`package.json`, no `src/`, and nothing to `npm install` or run in dev mode
here. Its Vite build config (`LAB_BASE=/lab/`) lives in a separate project
that is not part of this repository and was not found anywhere else on this
machine either.

**Do not treat this as source to edit.** Hand-editing a hashed, minified
bundle is not how this product is developed — its actual source lives
elsewhere. If a task needs the Lab's behavior changed, that has to happen in
the Lab's own project and land here as a fresh build output copy, not as an
edit to these files.

## Entry point

`index.html` — the Lab's own HTML shell, self-contained, referencing only
files inside this directory (own fonts, own brand assets, own hashed JS/CSS).

## Build / start commands

None exist in this repository for the Lab. If you need to run or modify the
Lab, you need its own project, which this workspace does not have access to.
Say so rather than fabricating a build step.

## Deployment boundary

- `frontend/Dockerfile` copies this directory into the served image, after
  the Agency's own build, unmodified.
- `vercel.json` and `amplify.yml` both copy this directory verbatim
  (`cp -r lab build/lab`) as the last step of the Agency's build — they do not
  build, lint, or test anything under this path.
- `frontend/nginx.conf.template` serves this directory at `/lab/` and
  `/lab/assets/` via dedicated `location ^~` blocks placed before the Agency's
  SPA catch-all, so the Agency's React Router fallback cannot shadow it.
- `scripts/check_frontend_lock.py` (the Agency's frozen-source check)
  explicitly skips this directory — a Lab rebuild is not an Agency change and
  must never be reported as one.

## Rules specific to this scope

- Never import Agency components, styles, or routes into anything that ends
  up here — this directory should only ever receive a verbatim copy of the
  Lab's own build output.
- Never add a build step here that reaches into `frontend/src/` or
  `frontend/node_modules/`. The two products do not share a build pipeline.
- If asked to "fix" or "update" something under this path, the honest answer
  is usually that the fix belongs in the Lab's own project, not here.
