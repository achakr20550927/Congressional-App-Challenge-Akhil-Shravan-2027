import { useEffect, useRef, useState } from "react";

/** 3-2-1 numerals, scale-and-fade in the capture viewport (Design System §5). */
export default function Countdown({ from = 3, onDone }) {
  const [n, setN] = useState(from);

  // The capture screen re-renders on every video frame (hand-tracking updates
  // chips/scene state ~30-60x/sec), which recreates the inline onDone
  // function each time. Keeping the latest callback in a ref — instead of in
  // the effect's dependency array — means this timer only restarts when `n`
  // actually changes, not on every parent re-render. Without this, the timer
  // was being cleared and restarted so often it never survived long enough
  // to fire, and the countdown froze on its starting number.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (n <= 0) {
      onDoneRef.current?.();
      return;
    }
    const id = setTimeout(() => setN((v) => v - 1), 800);
    return () => clearTimeout(id);
  }, [n]);

  if (n <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        pointerEvents: "none",
      }}
      aria-live="assertive"
    >
      <span
        key={n}
        className="data"
        style={{
          fontSize: 96,
          color: "var(--canvas)",
          animation: "countdown-pulse 800ms var(--ease-out)",
        }}
      >
        {n}
      </span>
      <style>{`
        @keyframes countdown-pulse {
          0% { opacity: 0; transform: scale(0.6); }
          30% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
