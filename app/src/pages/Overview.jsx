import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { useOverview, useLinks, useTimeline, useTheoriesGlobal } from "../lib/data";
import FunnelDiagram from "../components/FunnelDiagram";
import EvidenceBar from "../components/EvidenceBar";
import { linkLabel } from "../lib/data";

export default function Overview() {
  const { data: overview } = useOverview();
  const { data: links } = useLinks();
  const { data: timeline } = useTimeline();
  const { data: theories } = useTheoriesGlobal();

  return (
    <>
      <header className="hero container">
        <h1>How owned social media moves the needle on buying behavior.</h1>
        <p className="lede">
          An evidence map of the published literature linking owned social media to
          engagement, earned media, brand associations, and purchase behavior — every
          relationship, every theory invoked to explain it, and where the evidence
          agrees or disagrees.
        </p>

        {overview && (
          <div className="stat-row">
            <div className="stat"><div className="n">{overview.total_unique_papers}</div><div className="label">papers</div></div>
            <div className="stat"><div className="n">{overview.total_effects.toLocaleString()}</div><div className="label">coded effects</div></div>
            <div className="stat"><div className="n">{overview.total_links}</div><div className="label">relationships mapped</div></div>
            <div className="stat"><div className="n">{overview.year_min}–{overview.year_max}</div><div className="label">years covered</div></div>
            <div className="stat"><div className="n">{Math.round((overview.total_positive / (overview.total_positive + overview.total_negative + overview.total_null)) * 100)}%</div><div className="label">positive effects</div></div>
          </div>
        )}
      </header>

      <section className="section container">
        <div className="section-head">
          <h2>The evidence network</h2>
          <span className="sub">Edge thickness = number of papers · color = pooled direction. Click to explore.</span>
        </div>
        <FunnelDiagram links={links} />
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>Relationships</h2>
          <Link to="/links" className="back">View all →</Link>
        </div>
        <div className="link-grid">
          {links && links.map((l) => (
            <Link to={`/links/${l.link}`} key={l.link} className="link-card">
              <div className="path">{linkLabel(l)}</div>
              <div className="meta">k={l.k_papers} papers · pooled r={l.pooled_r ?? "n/a"}</div>
              <EvidenceBar positive={l.positive} negative={l.negative} null={l.null} />
            </Link>
          ))}
        </div>
      </section>

      {timeline && (
        <section className="section container">
          <div className="section-head">
            <h2>Literature over time</h2>
            <span className="sub">Papers and coded effects by publication year</span>
          </div>
          <div className="card" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }} />
                <Line type="monotone" dataKey="papers" stroke="var(--accent)" strokeWidth={2} dot={false} name="Papers" />
                <Line type="monotone" dataKey="effects" stroke="var(--pos)" strokeWidth={1.5} dot={false} name="Effects" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {theories && (
        <section className="section container">
          <div className="section-head">
            <h2>Most-invoked theories</h2>
            <Link to="/theories" className="back">View all →</Link>
          </div>
          <div className="chips">
            {theories.slice(0, 14).map((t) => (
              <span key={t.theory} className="chip"><b>{t.n_papers}</b>&nbsp; {t.theory}</span>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer container">
      <p className="note">
        This site shows aggregated, citation-level evidence derived from an ongoing literature
        review. The underlying coded dataset and extraction methodology are not published here.
      </p>
    </footer>
  );
}
