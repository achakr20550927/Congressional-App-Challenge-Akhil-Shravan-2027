/** Circular progress ring for the recording countdown — continuous, non-verbal feedback. */
export default function ProgressRing({ pct, size = 64, label, dark = true }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, pct)));
  const trackColor = dark ? "#3A4A42" : "var(--hair)";
  const labelColor = dark ? "#DAD2C2" : "var(--ink-soft)";
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth="4" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--terra)"
          strokeWidth="4"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
      {label && (
        <div className="mono" style={{ color: labelColor, marginTop: 6 }}>
          {label}
        </div>
      )}
    </div>
  );
}
