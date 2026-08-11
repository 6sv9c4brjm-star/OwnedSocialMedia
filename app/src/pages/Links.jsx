import { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLinks, linkLabel } from "../lib/data";
import EvidenceBar from "../components/EvidenceBar";
import { Footer } from "./Overview";

export default function Links() {
  const { data: links } = useLinks();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const constructFilter = params.get("construct");
  const [sortKey, setSortKey] = useState("k_papers");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    if (!links) return [];
    let out = links;
    if (constructFilter) {
      out = out.filter((l) => l.source === constructFilter || l.target === constructFilter);
    }
    out = [...out].sort((a, b) => {
      const va = a[sortKey] ?? -Infinity;
      const vb = b[sortKey] ?? -Infinity;
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return out;
  }, [links, constructFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <>
      <header className="hero container" style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 38 }}>Relationships</h1>
        <p className="lede">Every coded relationship between the five macro-constructs, with pooled effect direction and evidence volume.</p>
        {constructFilter && (
          <div style={{ marginTop: 16 }}>
            <span className="chip">Filtered to <b>{constructFilter}</b></span>{" "}
            <button className="back" style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 8 }} onClick={() => setParams({})}>
              Clear filter
            </button>
          </div>
        )}
      </header>

      <section className="container" style={{ paddingBottom: 56 }}>
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("link")}>Relationship</th>
              <th onClick={() => toggleSort("k_papers")}>Papers (k)</th>
              <th onClick={() => toggleSort("n_effects")}>Effects</th>
              <th onClick={() => toggleSort("pooled_r")}>Pooled r</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.link} className="clickable" onClick={() => navigate(`/links/${l.link}`)}>
                <td style={{ fontWeight: 600 }}>{linkLabel(l)}</td>
                <td>{l.k_papers}</td>
                <td>{l.n_effects}</td>
                <td>{l.pooled_r ?? "—"}</td>
                <td style={{ minWidth: 160 }}><EvidenceBar positive={l.positive} negative={l.negative} null={l.null} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Footer />
    </>
  );
}
