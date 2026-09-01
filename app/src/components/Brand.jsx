export function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="var(--ink)" />
      <g fill="none" stroke="var(--canvas)" strokeWidth="2.2" strokeLinecap="round">
        <path d="M32 40 C 30 30, 26 22, 18 16" />
        <path d="M32 40 C 31.5 28, 30 18, 27 10" />
        <path d="M32 40 C 32 28, 32 18, 32 8" />
        <path d="M32 40 C 32.5 28, 34 18, 37 10" />
        <path d="M32 40 C 34 30, 38 22, 46 16" />
      </g>
      <circle cx="32" cy="42" r="4.5" fill="var(--terra)" />
    </svg>
  );
}

export function Wordmark({ appName = "NeuraTrack" }) {
  const split = Math.max(1, appName.length - 5);
  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: 20,
      }}
    >
      {appName.slice(0, split)}
      <span style={{ color: "var(--green)" }}>{appName.slice(split)}</span>
    </span>
  );
}

export default function Brand({ appName }) {
  return (
    <span className="row" style={{ gap: 10 }}>
      <BrandMark />
      <Wordmark appName={appName} />
    </span>
  );
}
