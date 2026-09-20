"""Verify the frozen frontend source and assets."""
import hashlib
import json
import os
from pathlib import Path

root = Path(__file__).resolve().parents[1]
expected = json.loads((root / "docs/frontend-source-lock.json").read_text(encoding="utf-8"))
actual = {}
for base, dirs, files in os.walk(root / "frontend"):
    # frontend/lab/ is the Experience Lab's pre-built static output, a
    # separate product with its own source repo (not this one) and its own
    # boundary (docs/ADR-001-experience-lab-separation.md). It is not part of
    # the Agency frontend this lock freezes; walking it here would make every
    # Lab rebuild look like an unreviewed Agency change.
    dirs[:] = [d for d in dirs if d not in {"node_modules", "build", ".cache", ".vite", "coverage", ".git", "lab"}]
    for name in files:
        path = Path(base) / name
        relative = path.relative_to(root / "frontend").as_posix()
        if name == ".env" or (name.startswith(".env.") and not name.endswith(".example")) or name.endswith(".log"):
            continue
        actual[relative] = hashlib.sha256(path.read_bytes()).hexdigest()
changed = sorted(p for p in actual.keys() | expected.keys() if actual.get(p) != expected.get(p))
if changed:
    raise SystemExit("Frontend changed: " + ", ".join(changed))
print(f"Verified {len(actual)} unchanged frontend files.")
