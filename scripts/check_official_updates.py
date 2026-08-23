#!/usr/bin/env python3
"""Detect official changelog entry differences and create a human-review candidate."""

from __future__ import annotations

import hashlib
import html
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
STATE_PATH = ROOT / "content" / "update-state.json"
CANDIDATE_PATH = ROOT / "content" / "update-candidate.json"
SOURCE_URL = "https://learn.chatgpt.com/docs/changelog"
FEED_URL = "https://learn.chatgpt.com/codex/changelog/rss.xml"
CONTENT_TAG = "{http://purl.org/rss/1.0/modules/content/}encoded"

SCENARIO_TERMS = {
    "quick-question": {"chat", "prompt", "conversation"},
    "content-project": {"project", "work", "image", "content", "site"},
    "website-change": {"codex", "code", "local", "project", "git", "site", "desktop"},
    "organize-files": {"file", "folder", "local", "project"},
    "research-decision": {"research", "browser", "search", "source"},
    "data-analysis": {"data", "spreadsheet", "table", "csv", "excel"},
    "recurring-automation": {"scheduled", "automation", "task", "notification"},
    "troubleshoot": {"bug", "fix", "permission", "sandbox", "security", "error", "diagnostic"},
}


def clean_text(value: str | None) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", html.unescape(value or ""))
    return re.sub(r"\s+", " ", without_tags).strip()


def parse_feed(body: bytes) -> list[dict[str, str]]:
    root = ElementTree.fromstring(body)
    entries: list[dict[str, str]] = []
    for item in root.findall("./channel/item"):
        title = clean_text(item.findtext("title"))
        link = clean_text(item.findtext("link"))
        entry_id = clean_text(item.findtext("guid")) or link
        published = clean_text(item.findtext("pubDate"))
        summary = clean_text(item.findtext("description"))
        content = clean_text(item.findtext(CONTENT_TAG))
        digest_input = "\n".join((title, link, published, summary, content)).encode()
        entries.append(
            {
                "id": entry_id,
                "title": title,
                "link": link,
                "published": published,
                "summary": summary[:280],
                "sha256": hashlib.sha256(digest_input).hexdigest(),
            }
        )
    if not entries:
        raise ValueError("official changelog feed contained no entries")
    return entries


def diff_entries(previous: list[dict[str, str]], current: list[dict[str, str]]) -> list[dict[str, str]]:
    previous_by_id = {entry["id"]: entry for entry in previous}
    current_by_id = {entry["id"]: entry for entry in current}
    changes: list[dict[str, str]] = []

    for entry in current:
        old = previous_by_id.get(entry["id"])
        if old is None:
            changes.append({"kind": "added", **entry})
        elif old.get("sha256") != entry["sha256"]:
            changes.append({"kind": "updated", **entry})

    for entry in previous:
        if entry["id"] not in current_by_id:
            changes.append({"kind": "removed", **entry})
    return changes


def suggest_affected_scenarios(changes: list[dict[str, str]]) -> list[dict[str, object]]:
    haystack = " ".join(f"{change.get('title', '')} {change.get('summary', '')}" for change in changes).lower()
    suggestions: list[dict[str, object]] = []
    for scenario_id, terms in SCENARIO_TERMS.items():
        matched = sorted(term for term in terms if term in haystack)
        if matched:
            suggestions.append({"scenario_id": scenario_id, "matched_terms": matched, "status": "needs_human_review"})
    return suggestions or [{"scenario_id": "manual-triage", "matched_terms": [], "status": "needs_human_review"}]


def build_candidate(changes: list[dict[str, str]], observed_at: str) -> dict[str, object]:
    return {
        "status": "pending_review",
        "difference_scope": "official_rss_snapshot",
        "source_url": SOURCE_URL,
        "feed_url": FEED_URL,
        "observed_at": observed_at,
        "differences": changes,
        "suggested_affected_scenarios": suggest_affected_scenarios(changes),
        "human_review_required": [
            "核对每条变化的官方原文与适用平台",
            "对 removed 只解释为当前 RSS 快照不再包含，不得直接写成功能下线",
            "确认是否真的改变某个 V1 场景的入口或步骤",
            "补充套餐、地区、工作区和灰度范围",
            "确认后再人工修改 guide.json，并更新受影响的 manual、update 与 solution 关联",
        ],
        "cannot_prove": [
            "功能已对所有用户可用",
            "从 RSS 消失等于功能下线",
            "现有指南必须修改",
            "候选内容可以自动发布",
        ],
    }


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def main() -> int:
    request = Request(FEED_URL, headers={"User-Agent": "ruhang365-codex-scenario-guide/0.1"})
    try:
        with urlopen(request, timeout=30) as response:
            entries = parse_feed(response.read())
    except (URLError, TimeoutError, ValueError, ElementTree.ParseError) as error:
        print(f"SOURCE_FETCH_FAILED: {error}", file=sys.stderr)
        return 2

    previous = json.loads(STATE_PATH.read_text()) if STATE_PATH.exists() else None
    observed_at = datetime.now(timezone.utc).isoformat()
    write_json(
        STATE_PATH,
        {"source_url": SOURCE_URL, "feed_url": FEED_URL, "observed_at": observed_at, "entries": entries},
    )

    previous_entries = previous.get("entries") if isinstance(previous, dict) else None
    if not isinstance(previous_entries, list):
        print("BASELINE_RECORDED")
        return 0

    changes = diff_entries(previous_entries, entries)
    if not changes:
        print("NO_CHANGE")
        return 0

    write_json(CANDIDATE_PATH, build_candidate(changes, observed_at))
    print(f"UPDATE_CANDIDATE {CANDIDATE_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
