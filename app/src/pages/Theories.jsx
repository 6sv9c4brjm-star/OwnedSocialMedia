import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTheoriesGlobal, useLinks } from "../lib/data";
import { Footer } from "./Overview";

export default function Theories() {
  const { data: theories } = useTheoriesGlobal();
  const { data: links } = useLinks();
  const [query, setQuery] = useState("");

  const linkLookup = useMemo(() => {
    const m = {};
    (links || []).forEach((l) => { m[l.link] = l; });
    return m;
  }, [links]);

  const filtered = useMemo(() => {
    if (!theories) return [];
    if (!query.trim()) return theories;
    const q = query.toLowerCase();
    return theories.filter((t) => t.theory.toLowerCase().includes(q));
  }, [theories, query]);

  return (
    <>
      <header className="hero container" style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: 38 }}>Theories</h1>
        <p className="lede">
          Theoretical lenses invoked across the literature, and which relationships each one has
          been used to explain. Coverage is partial while the theory-extraction pass is ongoing —
          see each relationship page for processed-paper counts.
        </p>
        <input
          className="search"
          style={{ maxWidth: 360, marginTop: 20 }}
          placeholder="Search theories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <section className="container" style={{ paddingBottom: 56 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Theory</th>
              <th>Papers</th>
              <th>Relationships explained</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.theory}>
                <td style={{ fontWeight: 600, maxWidth: 320 }}>{t.theory}</td>
                <td>{t.n_papers}</td>
                <td>
                  <div className="chips">
                    {t.links.map((code) => (
                      <Link to={`/links/${code}`} key={code} className="chip">
                        {linkLookup[code] ? `${linkLookup[code].source} → ${linkLookup[code].target}` : code}
                      </Link>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Footer />
    </>
  );
}
