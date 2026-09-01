import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route-level scroll restoration. The old global Lenis instance intercepted
 * wheel input and could stall the fixed landing deck after one transition.
 * Native scrolling is faster, accessible, and deterministic across browsers.
 */
let lenisSingleton = null;
export function getLenis() {
  return lenisSingleton;
}

export default function SmoothScroll({ children }) {
  const location = useLocation();

  // Reset scroll to top on route change (Lenis + SPA don't do this for free).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return children;
}
