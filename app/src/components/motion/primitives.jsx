import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, animate } from "motion/react";

const EASE = [0.16, 1, 0.3, 1];

/** Fade + rise + subtle blur-in on scroll into view. The workhorse reveal. */
export function Reveal({ children, delay = 0, y = 28, as = "div", className, style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Staggered container — children reveal in sequence. */
export function Stagger({ children, className, style, gap = 0.08 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{ show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style, y = 24 }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{ hidden: { opacity: 0, y, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } } }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Headline whose words rise from behind a mask, one after another. Uses a pure
 * CSS keyframe (motion.css .rise-anim) — framer-motion animates percentage-based
 * y transforms unreliably, whereas a masked CSS keyframe is rock-solid,
 * GPU-cheap, and fires on mount for above-the-fold content.
 */
export function WordRise({ text, className, style, delay = 0 }) {
  const words = text.split(" ");
  return (
    <span className={className} style={style}>
      {words.map((w, i) => (
        <span key={i} className="rise-line" style={{ display: "inline-block", verticalAlign: "top" }}>
          <span className="rise-word rise-anim" style={{ animationDelay: `${delay + i * 0.07}s` }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Number that counts up from 0 when scrolled into view. Preserves prefix/suffix. */
export function CountUp({ value, prefix = "", suffix = "", decimals = 0, className, style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const [display, setDisplay] = useState(prefix + (0).toFixed(decimals) + suffix);

  useEffect(() => {
    if (!inView) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(prefix + value.toFixed(decimals) + suffix);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setDisplay(prefix + v.toFixed(decimals) + suffix),
    });
    return () => controls.stop();
  }, [inView, value, prefix, suffix, decimals]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  );
}

/** Button/link that springs toward the cursor for a magnetic feel. */
export function Magnetic({ children, strength = 0.35, className, style, as = "div", ...rest }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });
  const MotionTag = motion[as] || motion.div;

  function onMove(e) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <MotionTag
      ref={ref}
      data-magnetic
      className={className}
      style={{ ...style, x: sx, y: sy, display: "inline-flex" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
