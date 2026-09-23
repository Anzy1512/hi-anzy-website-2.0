"""Verify, classify or regenerate the frozen frontend source lock.

docs/frontend-source-lock.json freezes a sha256 per file under frontend/, so a
change to the Agency frontend cannot land unnoticed: CI runs this script and
fails when the tree and the lock disagree.

Usage
    python scripts/check_frontend_lock.py            verify (exit 1 on drift)
    python scripts/check_frontend_lock.py --write    regenerate the lock from the tree

Exclusions
    node_modules, build, .cache, .vite, coverage, .git   build products and caches
    .env, .env.*    secrets (the .example files stay in)
    *.log           local logs

Generated files stay in the lock. public/sitemap.xml, public/robots.txt,
public/fonts.css, src/dark.generated.css and scripts/sitemap-lastmod.json are
written by scripts, but each is deterministic from committed inputs (the
sitemap's lastmod moves only when a page's content fingerprint moves, see
frontend/scripts/generate-sitemap.js), so a build that changes one of them
means its inputs changed, which is exactly what the lock should notice.

Drift is reported as modified / added / missing so the report says what
happened, not only that something did. docs/FRONTEND_FREEZE_AUDIT.md records
how every drift since the previous lock was traced to its commit before the
lock was rewritten; do the same before running --write.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

EXCLUDED_DIRS = {"node_modules", "build", ".cache", ".vite", "coverage", ".git"}
LOCK = "docs/frontend-source-lock.json"


def excluded_file(name: str) -> bool:
    return name == ".env" or (name.startswith(".env.") and not name.endswith(".example")) or name.endswith(".log")


def snapshot(frontend: Path) -> dict[str, str]:
    """sha256 of every locked file under frontend/, keyed by posix-style relative path."""
    out: dict[str, str] = {}
    for base, dirs, files in os.walk(frontend):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDED_DIRS)
        for name in sorted(files):
            if excluded_file(name):
                continue
            path = Path(base) / name
            out[path.relative_to(frontend).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    return out


def classify(expected: dict[str, str], actual: dict[str, str]) -> dict[str, list[str]]:
    return {
        "modified": sorted(p for p in expected if p in actual and actual[p] != expected[p]),
        "added": sorted(p for p in actual if p not in expected),
        "missing": sorted(p for p in expected if p not in actual),
    }


def serialise(lock: dict[str, str]) -> bytes:
    # The committed lock is CRLF with a trailing newline; keep it byte-stable.
    return (json.dumps(lock, indent=2, sort_keys=True).replace("\n", "\r\n") + "\r\n").encode("utf-8")


def main(argv: list[str] | None = None, root: Path | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verify or regenerate the frozen frontend source lock.")
    parser.add_argument("--write", action="store_true", help="regenerate the lock from the current tree")
    args = parser.parse_args(argv)
    root = root or Path(__file__).resolve().parents[1]
    lock_path = root / LOCK
    actual = snapshot(root / "frontend")
    if args.write:
        lock_path.write_bytes(serialise(actual))
        print(f"Wrote {LOCK} with {len(actual)} entries.")
        return 0
    expected = json.loads(lock_path.read_text(encoding="utf-8"))
    drift = classify(expected, actual)
    total = sum(len(paths) for paths in drift.values())
    if total:
        lines = [f"Frontend changed: {total} path(s) differ from {LOCK}."]
        for kind in ("modified", "added", "missing"):
            lines.extend(f"  {kind:<9}{path}" for path in drift[kind])
        lines.append("Trace each change to its commit, record it in docs/FRONTEND_FREEZE_AUDIT.md, then rerun with --write.")
        print("\n".join(lines), file=sys.stderr)
        return 1
    print(f"Verified {len(actual)} unchanged frontend files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
