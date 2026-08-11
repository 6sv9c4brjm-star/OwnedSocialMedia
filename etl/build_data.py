"""
Theory/Relationship Atlas — ETL build script
=============================================

PRIVACY MODEL
-------------
This script is the ONLY thing that ever touches the raw research file
(relationships_by_sheet.xlsx, 227 columns, per-effect coded data, internal
QA notes). It reads that file from ../private-data/ (a folder that is
git-ignored and MUST NEVER be committed or pushed to GitHub), computes
aggregated / curated views, and writes ONLY those curated JSON files to
../app/public/data/. Those JSON files are what actually ships to the
public website. A visitor to the deployed site can inspect the JS bundle
and the /data/*.json files, but they will only ever see:

  - pooled statistics per relationship (k, N, pooled r, pos/neg/null counts)
  - per-paper rows with published-citation info (Authors, Year, Journal) and
    the correlation/N *for that paper*, since those are the actual scholarly
    "evidence" a literature-review site is meant to show
  - macro-construct labels and theory names/frequencies

It will NEVER see:
  - the internal QA columns (Salvonotes, Somethingtocheck, Suspiciuscorrelations)
  - the full 227-column coded sheet itself
  - the extraction protocol documents
  - anything not explicitly selected below

Re-run this script any time the underlying literature review is updated:
    python3 etl/build_data.py
Then commit only the changed files under app/public/data/.
"""

import json
import os
import re
from pathlib import Path
from collections import defaultdict

import pandas as pd

HERE = Path(__file__).parent
RAW_PATH = HERE.parent / "private-data" / "relationships_by_sheet.xlsx"
OUT_DIR = HERE.parent / "app" / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Macro-construct labels (canonical names for the taxonomy already coded
# in the dataset). NOTE the raw sheet names use "BRA" for brand associations;
# the theory-lens working doc used "SME"/"ENG" inconsistently for engagement —
# canonicalised here to ENG. See the data-governance note in etl/README.md.
NODE_LABELS = {
    "OSM": "Owned Social Media",
    "ENG": "Social Media Engagement",
    "ESM": "Earned Social Media",
    "BRA": "Brand Associations",
    "CBB": "Consumer Buying Behavior",
}

MACRO_COLS = [
    ("Socialmediaactivities1", "OSM"),
    ("Consumerengagement2", "ENG"),
    ("Brandimage3", "BRA"),
    ("Earnedsocialmedia4", "ESM"),
    ("Priceimage5", "PriceImage"),
    ("Pricefairness6", "PriceFairness"),
    ("Purchaseintention7", "PI"),
    ("Sales8", "Sales"),
]

# Columns that are safe to publish (citation + evidence-relevant fields only).
# Anything not listed here — the QA/notes columns, the ~150 derived dummy
# columns used for internal meta-regression — is dropped before writing JSON.
SAFE_COLS = [
    "ID", "Authors", "Year", "Journal", "Correlation", "N", "Method",
    "Country", "Industry", "PlattformChannel", "Typeofdata",
    "samples_studies", "Esstandardnew", "SE",
]


def null_pos_neg(r, ns_flag):
    if pd.notna(ns_flag) and ns_flag == 1:
        return "null"
    if r > 0.05:
        return "positive"
    if r < -0.05:
        return "negative"
    return "null"


def pooled_r(effects):
    """Inverse-variance weighted pooled correlation, falling back to a
    simple N-weighted mean when SE is missing."""
    num, den = 0.0, 0.0
    any_se = False
    for e in effects:
        se = e.get("SE")
        r = e.get("Esstandardnew") if e.get("Esstandardnew") is not None else e.get("Correlation")
        if se and se > 0:
            w = 1.0 / (se ** 2)
            any_se = True
        else:
            w = e.get("N", 1)
        num += w * r
        den += w
    return round(num / den, 3) if den else None


def build():
    if not RAW_PATH.exists():
        raise SystemExit(
            f"Raw file not found at {RAW_PATH}.\n"
            "Put your private relationships_by_sheet.xlsx in /private-data "
            "(this folder is git-ignored) and re-run."
        )

    xl = pd.ExcelFile(RAW_PATH)
    link_summaries = []
    papers_by_link = {}
    all_papers_global = {}  # dedupe across sheets for overview stats
    year_counts = defaultdict(lambda: {"papers": set(), "effects": 0})
    construct_link_count = defaultdict(int)

    for sheet in xl.sheet_names:
        src, dst = sheet.split("_to_")
        df = xl.parse(sheet)

        effects = []
        paper_rows = defaultdict(list)  # id -> list of effect dicts for that paper

        for _, row in df.iterrows():
            r = float(row["Correlation"])
            ns_flag = row.get("NS")
            sign = null_pos_neg(r, ns_flag)
            eff = {
                "id": int(row["ID"]),
                "Correlation": r,
                "N": int(row["N"]) if pd.notna(row["N"]) else None,
                "Esstandardnew": float(row["Esstandardnew"]) if pd.notna(row.get("Esstandardnew")) else None,
                "SE": float(row["SE"]) if pd.notna(row.get("SE")) else None,
                "sign": sign,
            }
            effects.append(eff)
            paper_rows[int(row["ID"])].append({**eff, **{c: row.get(c) for c in SAFE_COLS if c in df.columns}})

        k = len(paper_rows)
        n_effects = len(effects)
        total_n = sum(
            v[0]["N"] for v in paper_rows.values() if v[0]["N"]
        )  # one N per paper (avoid double counting within-paper reuse)
        pos = sum(1 for e in effects if e["sign"] == "positive")
        neg = sum(1 for e in effects if e["sign"] == "negative")
        null_ = sum(1 for e in effects if e["sign"] == "null")
        rs = [e["Correlation"] for e in effects]

        link_summaries.append({
            "link": sheet,
            "source": src, "target": dst,
            "source_label": NODE_LABELS.get(src, src),
            "target_label": NODE_LABELS.get(dst, dst),
            "k_papers": k,
            "n_effects": n_effects,
            "total_N": total_n,
            "pooled_r": pooled_r(effects),
            "r_min": round(min(rs), 3),
            "r_max": round(max(rs), 3),
            "positive": pos, "negative": neg, "null": null_,
        })
        construct_link_count[src] += 1
        construct_link_count[dst] += 1

        papers_out = []
        for pid, rows in paper_rows.items():
            first = rows[0]
            year = int(first["Year"]) if pd.notna(first.get("Year")) else None
            papers_out.append({
                "id": pid,
                "authors": first.get("Authors"),
                "year": year,
                "journal": first.get("Journal"),
                "method": first.get("Method"),
                "country": first.get("Country"),
                "industry": first.get("Industry"),
                "platform": first.get("PlattformChannel"),
                "n": first.get("N"),
                "n_effects": len(rows),
                "r_values": [round(x["Correlation"], 3) for x in rows],
            })
            if year:
                year_counts[year]["papers"].add(pid)
                year_counts[year]["effects"] += len(rows)
            all_papers_global[pid] = {
                "authors": first.get("Authors"), "year": year, "journal": first.get("Journal"),
            }
        papers_out.sort(key=lambda p: (p["year"] or 0))
        papers_by_link[sheet] = papers_out

    # ---- overview stats ----
    overview = {
        "total_unique_papers": len(all_papers_global),
        "total_links": len(link_summaries),
        "total_effects": sum(l["n_effects"] for l in link_summaries),
        "year_min": min(y for y in year_counts if y),
        "year_max": max(y for y in year_counts if y),
        "total_positive": sum(l["positive"] for l in link_summaries),
        "total_negative": sum(l["negative"] for l in link_summaries),
        "total_null": sum(l["null"] for l in link_summaries),
    }

    timeline = [
        {"year": y, "papers": len(v["papers"]), "effects": v["effects"]}
        for y, v in sorted(year_counts.items())
    ]

    constructs = [
        {"code": k, "label": v, "n_links": construct_link_count.get(k, 0)}
        for k, v in NODE_LABELS.items()
    ]

    # ---- write curated, public-safe JSON ----
    (OUT_DIR / "overview.json").write_text(json.dumps(overview, indent=2))
    (OUT_DIR / "links.json").write_text(json.dumps(link_summaries, indent=2))
    (OUT_DIR / "timeline.json").write_text(json.dumps(timeline, indent=2))
    (OUT_DIR / "constructs.json").write_text(json.dumps(constructs, indent=2))
    (OUT_DIR / "papers_by_link.json").write_text(json.dumps(papers_by_link, indent=2, default=str))

    print(f"Wrote curated JSON for {len(link_summaries)} links, "
          f"{overview['total_unique_papers']} unique papers, "
          f"{overview['total_effects']} effects to {OUT_DIR}")


if __name__ == "__main__":
    build()
