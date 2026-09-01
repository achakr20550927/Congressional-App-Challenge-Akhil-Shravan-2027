import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor v2 — a white five-petal flower glyph with a center dot,
 * rendered with mix-blend-mode: exclusion so it is ALWAYS visible: white over
 * dark backgrounds, inverted-dark over light ones. (v1's thin green ring was
 * effectively invisible on busy/dark surfaces — the flower is a solid glyph.)
 * The flower spring-trails the pointer and spins slowly; a precise dot rides
 * exactly on the hotspot. Grows on interactive targets; [data-magnetic]
 * elements pull it toward their center. Never rendered on touch devices or
 * under prefers-reduced-motion. The native cursor remains visible; these are
 * decorative companions, never a replacement for the system pointer.
 */
export default function CursorFX() {
  const dotRef = useRef(null);
  const flowerRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || isTouch) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("cursor-fx-on");

    const dot = dotRef.current;
    const flower = flowerRef.current;
    // The first effect only enables rendering. This effect runs after React
    // has committed the flower/dot nodes, which also keeps Strict Mode from
    // starting an animation loop against null refs in development.
    if (!dot || !flower) return undefined;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let fx = mx, fy = my;
    let spin = 0;
    let raf;

    function onMove(e) {
      mx = e.clientX;
      my = e.clientY;
      const target = e.target.closest?.("[data-magnetic]");
      if (target) {
        const r = target.getBoundingClientRect();
        mx += (r.left + r.width / 2 - mx) * 0.3;
        my += (r.top + r.height / 2 - my) * 0.3;
      }
    }
    function onOver(e) {
      const hovering = !!e.target.closest?.(
        "a, button, [role='button'], [data-cursor='grow'], input, select, textarea, label, summary"
      );
      flower.style.setProperty("--flower-scale", hovering ? "1.7" : "1");
    }
    function loop() {
      fx += (mx - fx) * 0.16;
      fy += (my - fy) * 0.16;
      spin += 0.35;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      flower.style.transform = `translate3d(${fx}px, ${fy}px, 0) rotate(${spin}deg) scale(var(--flower-scale, 1))`;
      raf = requestAnimationFrame(loop);
    }
    function onLeave() {
      dot.style.opacity = "0";
      flower.style.opacity = "0";
    }
    function onEnter() {
      dot.style.opacity = "1";
      flower.style.opacity = "1";
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.documentElement.classList.remove("cursor-fx-on");
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={flowerRef} className="cursor-flower" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="white">
          {/* five-petal flower glyph */}
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="17" cy="9.5" rx="4.6" ry="8" transform={`rotate(${a} 17 17)`} />
          ))}
          <circle cx="17" cy="17" r="3.4" fill="white" />
        </svg>
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
