/** Numeric data readout — always IBM Plex Mono, unit adjacent, never color-alone (Design System §3.4). */
export default function MetricCard({ label, value, unit, sublabel }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="mono" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
        <span className="data data-lg">{value}</span>
        {unit && (
          <span className="mono" style={{ color: "var(--ink-soft)" }}>
            {unit}
          </span>
        )}
      </div>
      {sublabel && (
        <div className="data-sm" style={{ color: "var(--ink-soft)", marginTop: 4 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
