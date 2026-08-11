import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  useLinks, usePapersByLink, useTheoriesByLink, useTheoryCoverage, linkLabel,
} from "../lib/data";
import EvidenceBar from "../components/EvidenceBar";
import { Footer } from "./Overview";

export default function LinkDetail() {
  const { linkId } = useParams();
  const { data: links } = useLinks();
  const { data: papersByLink } = usePapersByLink();
  const { data: theoriesByLink } = useTheoriesByLink();
  const { data: coverage } = useTheoryCoverage();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("year");
  const [sortDir, setSortDir] = useState("desc");

  const summary = links?.find((l) => l.link === linkId);
  const papers = papersByLink?.[linkId] || [];
  const theories = theoriesByLink?.[linkId] || [];
  const cov = coverage?.[linkId];

  const filtered = useMemo(() => {
    let out = papers;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (p) =>
          (p.authors || "").toLowerCase().includes(q) ||
          (p.journal || "").toLowerCase().includes(q) ||
          (p.theories_raw || "").toLowerCase().includes(q)
      );
    }
    out = [...out].sort((a, b) => {
      const va = a[sortKey] ?? -Infinity;
      const vb = b[sortKey] ?? -Infinity;
      return sortDir === "desc" ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
    });
    return out;
  }, [papers, query, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  if (!summary) return <div className="container" style={{ padding: 80 }}>Loading…</div>;

  return (
    <>
      <header className="hero container" style={{ paddingBottom: 24 }}>
        <RouterLink to="/links" className="back">← All relationships</RouterLink>
        <h1 style={{ fontSize: 38, marginTop: 14 }}>{linkLabel(summary)}</h1>
        <div className="stat-row">
          <div className="stat"><div className="n">{summary.k_papers}</div><div className="label">papers</div></div>
          <div className="stat"><div className="n">{summary.n_effects}</div><div className="label">coded effects</div></div>
          <div className="stat"><div className="n">{summary.pooled_r ?? "—"}</div><div className="label">pooled r</div></div>
          <div className="stat"><div className="n">{summary.r_min} … {summary.r_max}</div><div className="label">range</div></div>
        </div>
        <div style={{ marginTop: 28, maxWidth: 420 }}>
          <EvidenceBar positive={summary.positive} negative={summary.negative} null={summary.null} showLabels />
        </div>
      </header>

      <section className="section container">
        <div className="section-head">
          <h2>Theoretical lenses used</h2>
          {cov && (
            <span className="sub">
              Theory data processed for {cov.papers_with_theory_data} of {cov.papers_total} papers on this relationship
            </span>
          )}
        </div>
        {theories.length ? (
          <div className="chips">
            {theories.map((t) => (
              <span key={t.theory} className="chip"><b>{t.n_papers}</b>&nbsp; {t.theory}</span>
            ))}
          </div>
        ) : (
          <p className="note">No theory narrative has been processed for this relationship yet.</p>
        )}
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>Papers</h2>
          <input
            className="search"
            style={{ maxWidth: 280 }}
            placeholder="Filter by author, journal, theory…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("year")}>Year</th>
              <th onClick={() => toggleSort("authors")}>Authors</th>
              <th>Journal</th>
              <th>Method</th>
              <th onClick={() => toggleSort("n_effects")}>Effects</th>
              <th>r values</th>
              <th>Theory</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.year ?? "—"}</td>
                <td style={{ fontWeight: 600, maxWidth: 220 }}>{p.authors}</td>
                <td style={{ color: "var(--ink-soft)" }}>{p.journal}</td>
                <td style={{ color: "var(--ink-soft)", maxWidth: 180 }}>{p.method}</td>
                <td>{p.n_effects}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {p.r_values?.map((r) => (
                    <span key={r} className={`pill ${r > 0.05 ? "pos" : r < -0.05 ? "neg" : "null"}`} style={{ marginRight: 4 }}>{r}</span>
                  ))}
                </td>
                <td style={{ maxWidth: 260, color: "var(--ink-soft)" }}>{p.theories_raw || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Footer />
    </>
  );
}
