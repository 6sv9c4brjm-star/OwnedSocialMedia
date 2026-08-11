# ETL — updating the site's data

This folder is the **only** code that ever touches your raw research files.
It reads from `../private-data/` (git-ignored, never committed, never
published) and writes curated, aggregated JSON to `../app/public/data/`
(committed, published, safe for a public visitor to see).

## What to put in `private-data/`

This folder does not exist in the repo (it's git-ignored) — create it
locally:

```
private-data/
  relationships_by_sheet.xlsx      # the 10-tab effect-size coded workbook
  narrative_OSM_to_ENG.md          # theory-lens narrative table(s), one per link,
  theories_partial.json            # exported as markdown, or hand-entered as JSON
```

Never move anything from `private-data/` into `app/public/` or `app/src/`
by hand — always go through the scripts below, which explicitly whitelist
which columns/fields are safe to publish.

## Running the pipeline

```bash
cd etl
python3 -m venv .venv && source .venv/bin/activate   # optional
pip install pandas openpyxl

python3 build_data.py       # stage 1: quantitative aggregation
python3 merge_theories.py   # stage 2: merges theory-lens narrative text
```

Then review the diff in `app/public/data/*.json` before committing —
this is your last checkpoint to catch anything that shouldn't be public.

## What gets published vs. what doesn't

**Published (in `app/public/data/*.json`):**
- Pooled statistics per relationship (k, N, pooled r, positive/negative/null counts)
- Per-paper rows: published citation (Authors, Year, Journal), the paper's own
  coded correlation(s) and N, method, country, industry, platform
- Theory names and how often each is invoked, per relationship
- The five macro-construct labels

**Never published:**
- The raw 227-column coded workbook itself, in any form
- Internal QA/notes columns (`Salvonotes`, `Somethingtocheck`, `Suspiciuscorrelations`)
- The ~150 derived dummy/meta-regression columns used for internal analysis
- The extraction protocol documents
- Anything not explicitly selected in `SAFE_COLS` in `build_data.py`

If you want to publish *less* than this (e.g. no citations, pooled stats
only), trim `SAFE_COLS` and the `papers_out.append(...)` block in
`build_data.py`. If you want to publish *more*, add fields there deliberately
— don't widen scope by editing the JSON output by hand.

## Current coverage

As of this build, full theory-narrative text has been processed for one
relationship (`OSM_to_ENG`, 91 papers). The other 8 narrative-covered
relationships have partial coverage (a handful of papers each) via
`theories_partial.json`, as a proof of concept. `OSM_to_BRA` has no
narrative theory data yet — process its docx working table the same way
and add it to get full coverage.

To raise coverage: export more rows from your narrative docx tables into
markdown (same 7-column format: ID | Authors | Context | Theories | Methods
| Findings | N effects) and either add a new `narrative_<LINK>.md` file
(auto-parsed) or extend `theories_partial.json` directly, then re-run
`merge_theories.py`.
