export default function EvidenceBar({ positive, negative, null: nullCount, showLabels = false }) {
  const total = positive + negative + nullCount || 1;
  const pct = (n) => (n / total) * 100;
  return (
    <div>
      <div className="evbar">
        {positive > 0 && <div className="seg pos" style={{ width: `${pct(positive)}%` }} />}
        {negative > 0 && <div className="seg neg" style={{ width: `${pct(negative)}%` }} />}
        {nullCount > 0 && <div className="seg null" style={{ width: `${pct(nullCount)}%` }} />}
      </div>
      {showLabels && (
        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12.5 }}>
          <span className="pill pos">{positive} positive</span>
          <span className="pill neg">{negative} negative</span>
          <span className="pill null">{nullCount} null</span>
        </div>
      )}
    </div>
  );
}
