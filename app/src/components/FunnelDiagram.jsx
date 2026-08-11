import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Fixed layout — five macro-constructs, positioned to read left-to-right
// as a funnel: owned media drives engagement/earned media, which build
// brand associations, which drive buying behavior.
const POS = {
  OSM: { x: 70, y: 210 },
  ENG: { x: 300, y: 95 },
  ESM: { x: 300, y: 325 },
  BRA: { x: 545, y: 210 },
  CBB: { x: 780, y: 210 },
};

const CURVE = new Set(["OSM_to_BRA", "OSM_to_CBB", "ENG_to_CBB", "ESM_to_CBB"]);

function pathFor(link) {
  const a = POS[link.source];
  const b = POS[link.target];
  if (!CURVE.has(link.link)) {
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  }
  // arc long "skip" edges above or below the direct nodes to reduce clutter
  const midY = (a.y + b.y) / 2;
  const bend = link.link === "ENG_to_CBB" ? -70 : link.link === "ESM_to_CBB" ? 70 : link.source === "OSM" && link.target === "CBB" ? 145 : -145;
  const cx = (a.x + b.x) / 2;
  const cy = midY + bend;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export default function FunnelDiagram({ links }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  if (!links) return null;

  const maxK = Math.max(...links.map((l) => l.k_papers));
  const nodeWeight = {};
  links.forEach((l) => {
    nodeWeight[l.source] = (nodeWeight[l.source] || 0) + l.k_papers;
    nodeWeight[l.target] = (nodeWeight[l.target] || 0) + l.k_papers;
  });
  const maxNode = Math.max(...Object.values(nodeWeight));

  return (
    <svg viewBox="0 0 850 420" style={{ width: "100%", height: "auto" }} role="img" aria-label="Evidence network across the five macro-constructs">
      {links.map((l) => {
        const strokeW = 1.5 + (l.k_papers / maxK) * 9;
        const isHover = hovered === l.link;
        const color = l.pooled_r == null ? "var(--null)" : l.pooled_r > 0.02 ? "var(--pos)" : l.pooled_r < -0.02 ? "var(--neg)" : "var(--null)";
        return (
          <path
            key={l.link}
            d={pathFor(l)}
            fill="none"
            stroke={color}
            strokeOpacity={isHover ? 0.95 : 0.38}
            strokeWidth={isHover ? strokeW + 2 : strokeW}
            strokeLinecap="round"
            style={{ cursor: "pointer", transition: "stroke-width .12s ease, stroke-opacity .12s ease" }}
            onMouseEnter={() => setHovered(l.link)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate(`/links/${l.link}`)}
          >
            <title>{`${l.source_label} → ${l.target_label}: k=${l.k_papers} papers, pooled r=${l.pooled_r ?? "n/a"}`}</title>
          </path>
        );
      })}

      {Object.entries(POS).map(([code, p]) => {
        const r = 26 + ((nodeWeight[code] || 0) / maxNode) * 22;
        return (
          <g
            key={code}
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/links?construct=${code}`)}
          >
            <circle cx={p.x} cy={p.y} r={r} fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.6" />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)" fontFamily="var(--font)">
              {code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
