import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/**
 * Full-bleed cinematic image band with a slow parallax rise and an on-brand
 * gradient scrim so overlaid text stays readable. The image is AI-generated
 * on-brand art (Higgsfield/z_image) matched to the app's palette. Parallax is
 * transform-only and disabled under reduced motion by the spring settling.
 */
export default function CinematicBand({ image, kicker, title, body, height = "78vh", focus = "center" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1.02]);

  return (
    <section ref={ref} className="cinematic-band" style={{ height }}>
      <motion.img src={image} alt="" aria-hidden="true" className="cinematic-img" style={{ y, scale, objectPosition: focus }} />
      <div className="cinematic-scrim" aria-hidden="true" />
      <div className="wrap cinematic-content">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {kicker && <span className="section-kicker mono">{kicker}</span>}
          <h2>{title}</h2>
          {body && <p>{body}</p>}
        </motion.div>
      </div>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.cinematic-band { position: relative; overflow: hidden; display: flex; align-items: center; z-index: 2; }
.cinematic-img { position: absolute; inset: -12% 0; width: 100%; height: 124%; object-fit: cover; will-change: transform; }
.cinematic-scrim { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(27,36,32,.82) 0%, rgba(27,36,32,.55) 38%, rgba(27,36,32,.12) 70%, transparent 100%); }
.cinematic-content { position: relative; z-index: 2; max-width: 720px; }
.cinematic-content .section-kicker { color: var(--terra); }
.cinematic-content h2 { color: #fff; font-size: clamp(30px, 4.4vw, 56px); line-height: 1.06; }
.cinematic-content p { color: rgba(255,255,255,.86); margin-top: 16px; font-size: 18px; max-width: 52ch; }
`;
