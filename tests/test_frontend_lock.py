"""The frontend freeze checker: what it walks, how it classifies drift, and that --write round-trips."""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("check_frontend_lock", ROOT / "scripts/check_frontend_lock.py")
checker = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(checker)


def make_tree(tmp_path):
    fe = tmp_path / "frontend"
    (fe / "src").mkdir(parents=True)
    (fe / "lab").mkdir()
    (fe / "node_modules" / "x").mkdir(parents=True)
    (tmp_path / "docs").mkdir()
    (fe / "src" / "App.js").write_bytes(b"export default 1;\r\n")
    (fe / "src" / "dark.generated.css").write_bytes(b"/* generated */\n")
    (fe / "lab" / "index.html").write_bytes(b"<html>lab</html>")
    (fe / "node_modules" / "x" / "index.js").write_bytes(b"ignored")
    (fe / ".env").write_bytes(b"SECRET=1")
    (fe / ".env.example").write_bytes(b"SECRET=")
    (fe / "debug.log").write_bytes(b"noise")
    return fe


def test_snapshot_walks_source_and_generated_files_but_not_lab_secrets_or_logs(tmp_path):
    fe = make_tree(tmp_path)
    assert set(checker.snapshot(fe)) == {"src/App.js", "src/dark.generated.css", ".env.example"}


def test_write_then_verify_round_trip_is_byte_stable(tmp_path, capsys):
    make_tree(tmp_path)
    assert checker.main(["--write"], root=tmp_path) == 0
    lock = (tmp_path / "docs/frontend-source-lock.json").read_bytes()
    assert lock.endswith(b"\r\n")
    assert b"\n" not in lock.replace(b"\r\n", b"")
    assert checker.main([], root=tmp_path) == 0
    assert "Verified 3 unchanged" in capsys.readouterr().out
    assert checker.main(["--write"], root=tmp_path) == 0
    assert (tmp_path / "docs/frontend-source-lock.json").read_bytes() == lock


def test_drift_is_classified_as_modified_added_missing_and_lab_is_ignored(tmp_path, capsys):
    fe = make_tree(tmp_path)
    checker.main(["--write"], root=tmp_path)
    (fe / "src" / "App.js").write_bytes(b"export default 2;\r\n")
    (fe / "src" / "New.js").write_bytes(b"new")
    (fe / "src" / "dark.generated.css").unlink()
    (fe / "lab" / "index.html").write_bytes(b"<html>rebuilt lab</html>")
    assert checker.main([], root=tmp_path) == 1
    err = capsys.readouterr().err
    assert "3 path(s) differ" in err
    assert "modified src/App.js" in err
    assert "added    src/New.js" in err
    assert "missing  src/dark.generated.css" in err
    assert "lab/" not in err


def test_repository_lock_matches_the_committed_frontend():
    """The lock CI enforces must agree with the tree it ships with."""
    expected = json.loads((ROOT / "docs/frontend-source-lock.json").read_text(encoding="utf-8"))
    drift = checker.classify(expected, checker.snapshot(ROOT / "frontend"))
    assert drift == {"modified": [], "added": [], "missing": []}
