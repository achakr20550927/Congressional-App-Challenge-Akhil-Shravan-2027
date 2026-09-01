import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

/**
 * Lenis smooth-scroll provider. Gives the whole site the buttery,
 * momentum-based scroll feel that premium motion sites use, and exposes the
 * instance on window so scroll-driven components (hero, scrollytelling) can
 * read a single source of truth. Fully disabled under prefers-reduced-motion
 * so we never fight a user who asked for calm.
 */
let lenisSingleton = null;
export function getLenis() {
  return lenisSingleton;
}

export default function SmoothScroll({ children }) {
  const location = useLocation();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisSingleton = lenis;
    window.__lenis = lenis;

    let raf;
    function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisSingleton = null;
    };
  }, []);

  // Reset scroll to top on route change (Lenis + SPA don't do this for free).
  useEffect(() => {
    if (lenisSingleton) lenisSingleton.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [location.pathname]);

  return children;
}
