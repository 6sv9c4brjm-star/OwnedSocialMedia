# Relationship Atlas

An interactive, static website mapping the evidence linking owned social
media → engagement / earned media → brand associations → consumer buying
behavior, built from a coded literature review. React + static JSON,
deployed on GitHub Pages, no backend, no database, no paid infrastructure.

```
theory-atlas/
├── app/                  React app (Vite). This is what gets deployed.
│   ├── public/data/      curated, public-safe JSON — the ONLY data that ships
│   └── src/
├── etl/                  scripts that turn your private raw data into app/public/data
├── private-data/         (you create this locally — never committed, see etl/README.md)
└── .github/workflows/    auto-build + deploy to GitHub Pages on every push
```

## Privacy model, in one paragraph

Your raw coded dataset (the 227-column workbook, extraction protocols, QA
notes) never leaves your machine. `etl/build_data.py` and
`etl/merge_theories.py` read it locally and write out aggregated,
citation-level JSON to `app/public/data/` — that folder is what gets
committed and published. A visitor to the deployed site can only ever see
what's in those JSON files: pooled statistics, individual paper
citations with their coded effect sizes, and theory names — never the raw
workbook, internal notes, or the extraction methodology itself. See
`etl/README.md` for the exact whitelist.

This is enforced two ways: `.gitignore` excludes `/private-data/` at the
repo level, and `SAFE_COLS` in `build_data.py` explicitly whitelists which
columns are even eligible to be read into the output — nothing is published
by default.

---

## Part 1 — set up an anonymous GitHub identity

1. Go to github.com and create a **new account** with an email address not
   tied to your name or institution (a fresh Proton/Gmail alias works).
   Pick a neutral username, e.g. `relationship-atlas` or similar — not
   your own name or handle.
2. In that account: **Settings → Emails → Keep my email addresses
   private**. Note the `noreply` address GitHub shows you
   (`ID+username@users.noreply.github.com`).
3. On your machine, set git to use that identity **only for this
   project** (don't change your global git config):
   ```bash
   cd theory-atlas
   git init
   git config user.name "Relationship Atlas"
   git config user.email "ID+username@users.noreply.github.com"
   ```
4. Settings → Emails → also enable **"Block command line pushes that
   expose my email"**, as a backstop.

## Part 2 — create the repository

1. On the anonymous account, create a new **public** repository named
   `theory-atlas` (or update `base` in `app/vite.config.js` and the
   `--repo-name` below to match whatever you name it).
2. Double-check the repository description, About section, and social
   preview image are empty or neutral — GitHub pre-fills some of these
   from account info in a few flows.

## Part 3 — push the code

```bash
cd theory-atlas
git add -A
git status   # confirm private-data/ does NOT appear in this list
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<anon-username>/theory-atlas.git
git push -u origin main
```

If `private-data/` ever shows up in `git status`, stop — do not commit —
and check your `.gitignore` is in place before proceeding.

## Part 4 — enable GitHub Pages

1. In the repo: **Settings → Pages → Build and deployment → Source →
   GitHub Actions**. (Not "Deploy from a branch" — the included workflow
   handles the build for you.)
2. Push to `main` (or re-run the "Deploy to GitHub Pages" workflow from
   the **Actions** tab) — it will build `app/` and publish `app/dist/`.
3. Your site will be live at `https://<anon-username>.github.io/theory-atlas/`.

`app/vite.config.js` has `base: "/theory-atlas/"` — if you rename the
repo, update that to match, or the site will load with broken asset paths.

## Part 5 — verify anonymity before sharing the link

- Open the deployed site and view page source — confirm no author name,
  email, or institution appears anywhere.
- Check `app/public/data/*.json` in the repo on GitHub — this is exactly
  what a visitor can see. Read through it once as if you were a stranger.
- `index.html` already sets `<meta name="robots" content="noindex">` to
  keep the site out of search engines while you're not ready for it to be
  found; remove that line when you want it indexed.
- Don't link to the repo from your personal GitHub account, personal
  site, or social profiles while anonymity matters.

---

## Updating the data later

1. Update your literature review / re-export the workbook and narrative
   tables into `private-data/` (this folder stays local, never committed).
2. `cd etl && python3 build_data.py && python3 merge_theories.py`
3. Review the diff in `app/public/data/*.json`.
4. `git add app/public/data && git commit -m "Update data" && git push`
   — the Actions workflow rebuilds and redeploys automatically.

## Running locally during development

```bash
cd app
npm install
npm run dev       # http://localhost:5173
```

---

## What's built vs. what's an extension point

**Built and working, on real (aggregated) data:**
- Overview: headline stats, the five-construct evidence network diagram, literature-over-time chart, top theories
- Relationships: sortable list + detail page per relationship (pooled r, evidence direction split, papers table, theories used)
- Theories: cross-relationship theory frequency and drill-down

**Scoped out of this build — flagged in the earlier data-model review as
needing either a product decision or more source-data processing before
they're worth building:**
- **Micro-construct canonicalization** (e.g. "brand trust" / "consumer
  brand trust" → one canonical construct) — not done in the source data
  yet; the site currently navigates at the macro-construct level (OSM,
  ENG, ESM, BRA, CBB) only.
- **Full theory-narrative coverage** — only `OSM_to_ENG` is fully
  processed (91/91 papers); the rest are partial. See `etl/README.md`.
- **Moderators** — only exist as free text inside "Key findings" in the
  source data, not structured; not surfaced as a filter.
- **Psychological mechanisms** (claimed/measured/tested) — the funnel's
  mediating macro-constructs (ENG, ESM, BRA) function as mechanisms
  structurally, but true process-level mechanisms only exist as prose;
  not built as a separate entity.
- **A dedicated Constructs page** — `constructs.json` is generated and
  ready to use, but no page consumes it yet.
- **Data-confidence badges** — the source workbook has QA-flag columns
  (`Suspiciuscorrelations`, etc.); these are excluded from output
  entirely rather than surfaced, per the "don't disclose internal notes"
  requirement. If you'd rather show a "flagged for review" badge without
  disclosing *why*, that's a small addition to `build_data.py`.
- **Global filters** (year range, country, industry, method) mentioned in
  the original spec aren't wired up in the UI yet, though the underlying
  per-paper data already carries these fields.
