#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import json
from contextlib import redirect_stderr
from io import StringIO
from pathlib import Path
from urllib.error import URLError


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "id",
    "title",
    "summary",
    "keywords",
    "entry",
    "reason",
    "steps",
    "prompt",
    "success",
    "recovery",
    "source_label",
    "source_url",
    "verified_at",
}


def load_update_module():
    module_path = ROOT / "scripts" / "check_official_updates.py"
    spec = importlib.util.spec_from_file_location("check_official_updates", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def validate_update_logic() -> None:
    module = load_update_module()
    old_feed = b"""<?xml version='1.0'?><rss><channel><item><title>Desktop app update</title><link>https://example.test/1</link><guid>one</guid><description>Local project</description><pubDate>Thu</pubDate></item></channel></rss>"""
    new_feed = b"""<?xml version='1.0'?><rss><channel><item><title>Desktop app update</title><link>https://example.test/1</link><guid>one</guid><description>Local project and file update</description><pubDate>Thu</pubDate></item><item><title>Scheduled task update</title><link>https://example.test/2</link><guid>two</guid><description>New notification</description><pubDate>Fri</pubDate></item></channel></rss>"""
    old_entries = module.parse_feed(old_feed)
    new_entries = module.parse_feed(new_feed)
    changes = module.diff_entries(old_entries, new_entries)
    assert {change["kind"] for change in changes} == {"added", "updated"}
    affected = {item["scenario_id"] for item in module.suggest_affected_scenarios(changes)}
    assert "website-change" in affected
    assert "recurring-automation" in affected
    candidate = module.build_candidate(changes, "2026-08-21T00:00:00+00:00")
    assert candidate["status"] == "pending_review"
    assert candidate["difference_scope"] == "official_rss_snapshot"
    assert candidate["human_review_required"]
    assert "从 RSS 消失等于功能下线" in candidate["cannot_prove"]

    original_urlopen = module.urlopen

    def fail_fetch(*_args, **_kwargs):
        raise URLError("offline fixture")

    module.urlopen = fail_fetch
    error_output = StringIO()
    with redirect_stderr(error_output):
        assert module.main() == 2
    module.urlopen = original_urlopen
    assert "SOURCE_FETCH_FAILED" in error_output.getvalue()


def main() -> int:
    scenarios = json.loads((ROOT / "content" / "scenarios.json").read_text())
    assert 6 <= len(scenarios) <= 8, "V1 must contain 6-8 scenarios"
    ids = [scenario["id"] for scenario in scenarios]
    assert len(ids) == len(set(ids)), "scenario ids must be unique"
    for scenario in scenarios:
        missing = REQUIRED - scenario.keys()
        assert not missing, f"{scenario.get('id', '<unknown>')} missing: {sorted(missing)}"
        assert scenario["steps"], f"{scenario['id']} requires steps"
        assert scenario["prompt"].strip(), f"{scenario['id']} requires a copyable prompt"
        assert scenario["source_url"].startswith("https://"), f"{scenario['id']} requires an HTTPS source"
        assert " 或 " not in scenario["entry"], f"{scenario['id']} must recommend one default entry"

    for name in ["index.html", "app.js", "styles.css", "AGENTS.md", "README.md", "LICENSE", "docs/PRODUCT_SPEC.md", "docs/SOURCE_NOTES.md", "docs/OPERATIONS.md"]:
        assert (ROOT / name).is_file(), f"missing {name}"

    html = (ROOT / "index.html").read_text()
    app = (ROOT / "app.js").read_text()
    assert "不用先学功能，先说你想完成什么。" in html
    assert "官方变化先进入人工确认" in html
    assert 'type="submit" disabled' in html, "route submission must wait for scenario data"
    assert "还不能可靠判断入口" in app, "unknown input must not silently receive a guessed route"
    assert "if (!scenarios.length)" in app, "loading race must be handled"
    assert "eyebrow" not in html
    validate_update_logic()
    print(f"PASS: {len(scenarios)} scenarios, UI contract, sources, and update-candidate logic are valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
