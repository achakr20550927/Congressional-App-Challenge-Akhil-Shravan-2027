/** Pill status chip. Shape (not just color) encodes status for colorblind users. */
export default function StatusChip({ status = "neutral", children }) {
  return (
    <span className={`chip chip-${status}`}>
      <span className="chip-shape" aria-hidden="true" />
      {children}
    </span>
  );
}
