"""
Stage 2 ETL — merges the qualitative "Theories" field (from the per-link
narrative docx working tables in /private-data) into the curated JSON
produced by build_data.py, and computes theory-frequency aggregates.

Coverage note: as of this build, full narrative text has been processed for
OSM_to_ENG (100 papers). The other 8 narrative-covered links have partial
coverage (a handful of papers each, from theories_partial.json) as a
proof of concept. OSM_to_BRA has no narrative theory data yet at all —
its docx working table was not found among the reviewed files.
Re-run this script after adding more rows to theories_partial.json or a
fuller parsed export, to raise coverage over time.
"""

import json
import re
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).parent
PRIVATE = HERE.parent / "private-data"
DATA_DIR = HERE.parent / "app" / "public" / "data"

ROW_RE = re.compile(
    r"^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*[^|]*\|\s*([^|]+?)\s*\|",
    re.MULTILINE,
)


def parse_markdown_theories(path):
    text = Path(path).read_text()
    out = {}
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 4:
            continue
        pid = cells[0]
        if not pid.isdigit():
            continue
        theories = cells[3]
        out[pid] = theories
    return out


def clean_theory_list(raw):
    if not raw or raw.lower().startswith("no explicit theory"):
        return []
    parts = re.split(r";|,\s*(?=[A-Z])", raw)
    parts = [p.strip().rstrip(".") for p in parts if p.strip()]
    return parts


def main():
    theories_by_link = {}

    osm_eng_path = PRIVATE / "narrative_OSM_to_ENG.md"
    if osm_eng_path.exists():
        theories_by_link["OSM_to_ENG"] = parse_markdown_theories(osm_eng_path)

    partial_path = PRIVATE / "theories_partial.json"
    if partial_path.exists():
        theories_by_link.update(json.loads(partial_path.read_text()))

    papers_by_link = json.loads((DATA_DIR / "papers_by_link.json").read_text())
    links = json.loads((DATA_DIR / "links.json").read_text())

    # Case-insensitive canonicalisation: group "Uses and gratifications theory"
    # and "Uses and Gratifications Theory" together, display the more common
    # original spelling. This directly addresses the naming-drift issue
    # observed in the source data (e.g. ENG vs SME for the same construct).
    display_name_counts = defaultdict(lambda: defaultdict(int))

    def canon(t):
        return re.sub(r"\s+", " ", t.strip().lower())

    global_theory_counts = defaultdict(lambda: {"count": 0, "links": set()})
    per_link_theory_counts = {}
    coverage = {}

    for link, papers in papers_by_link.items():
        tmap = theories_by_link.get(link, {})
        n_with = 0
        theory_counter = defaultdict(int)
        for p in papers:
            raw = tmap.get(str(p["id"]))
            if raw is not None:
                n_with += 1
                p["theories_raw"] = raw
                for t in clean_theory_list(raw):
                    key = canon(t)
                    display_name_counts[key][t] += 1
                    theory_counter[key] += 1
                    global_theory_counts[key]["count"] += 1
                    global_theory_counts[key]["links"].add(link)
            else:
                p["theories_raw"] = None
        coverage[link] = {
            "papers_with_theory_data": n_with,
            "papers_total": len(papers),
        }
        per_link_theory_counts[link] = sorted(
            [
                {"theory": max(display_name_counts[k], key=display_name_counts[k].get), "n_papers": c}
                for k, c in theory_counter.items()
            ],
            key=lambda x: -x["n_papers"],
        )

    global_theories = sorted(
        [
            {
                "theory": max(display_name_counts[k], key=display_name_counts[k].get),
                "n_papers": v["count"], "n_links": len(v["links"]), "links": sorted(v["links"]),
            }
            for k, v in global_theory_counts.items()
        ],
        key=lambda x: -x["n_papers"],
    )

    (DATA_DIR / "papers_by_link.json").write_text(json.dumps(papers_by_link, indent=2, default=str))
    (DATA_DIR / "theories_by_link.json").write_text(json.dumps(per_link_theory_counts, indent=2))
    (DATA_DIR / "theories_global.json").write_text(json.dumps(global_theories, indent=2))
    (DATA_DIR / "theory_coverage.json").write_text(json.dumps(coverage, indent=2))

    print("Theory coverage by link:")
    for link, c in coverage.items():
        print(f"  {link}: {c['papers_with_theory_data']}/{c['papers_total']} papers")
    print(f"\n{len(global_theories)} distinct theories identified across processed links.")


if __name__ == "__main__":
    main()
