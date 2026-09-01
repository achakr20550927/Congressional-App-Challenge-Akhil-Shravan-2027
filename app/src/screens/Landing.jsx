import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, useMotionValueEvent } from "motion/react";
import { useAppState } from "../context/AppStateContext.jsx";
import { Reveal, Stagger, StaggerItem, WordRise, CountUp, Magnetic } from "../components/motion/primitives.jsx";
import TaskIcon from "../components/TaskIcon.jsx";
import { BrandMark, Wordmark } from "../components/Brand.jsx";
import { getLenis } from "../components/motion/SmoothScroll.jsx";

/**
 * Landing v5 — "Slideshow over the strand".
 *
 * NOTHING on this page visibly scrolls. The layout is a deck of FIXED,
 * full-viewport slides stacked in the same place; an invisible spacer gives
 * the page scroll length, and scroll progress only DISSOLVES one slide out
 * and the next in (pure opacity, zero translation) — like advancing a
 * presentation. Between slides the content passes through near-dark, leaving
 * a beat where only the DNA strand is visible.
 *
 * The DNA video (portrait phone aspect) is rendered twice from one file:
 *  - BG layer: object-fit cover, heavily blurred + darkened — extends the
 *    clip's own light field across the whole display so there is no visible
 *    "phone video" column or hard cut-off.
 *  - FG layer: object-fit contain at natural scale (the strand is never
 *    zoomed or cropped vertically), with feathered side edges that melt into
 *    the blurred fill.
 * Both layers are scroll-scrubbed in lockstep: still when idle, winding only
 * while you scroll.
 *
 * Mobile (<901px) and reduced-motion fall back to a normal stacked page.
 */

const SLIDE_COUNT = 7;

export default function Landing() {
  const { t } = useAppState();
  const navigate = useNavigate();
  const fgRef = useRef(null);
  const bgRef = useRef(null);
  const wrapRef = useRef(null);
  const slideRefs = useRef([]);

  const { scrollYProgress: pageProgress } = useScroll();
  const progressScaleX = useSpring(pageProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const fg = fgRef.current;
    const bg = bgRef.current;
    const wrap = wrapRef.current;
    if (!fg || !bg || !wrap) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slidesOn = window.matchMedia("(min-width: 901px)").matches && !reduce;

    fg.muted = true;
    bg.muted = true;
    fg.pause();
    bg.pause();

    let duration = 0;
    const onMeta = () => (duration = fg.duration || 0);
    if (fg.readyState >= 1) onMeta();
    fg.addEventListener("loadedmetadata", onMeta);

    if (reduce) return () => fg.removeEventListener("loadedmetadata", onMeta);

    let current = 0;
    let px = 0, py = 0, tx = 0, ty = 0;
    let raf;

    function onPointer(e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 12;
      ty = (e.clientY / window.innerHeight - 0.5) * 8;
    }
    window.addEventListener("pointermove", onPointer, { passive: true });

    function loop() {
      const vh = window.innerHeight || 1;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
      const scrollY = window.scrollY;

      // --- scroll-scrubbed strand (both layers in lockstep) ---
      if (duration > 0) {
        const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
        const target = progress * Math.max(0, duration - 0.06);
        current += (target - current) * 0.22;
        if (!fg.seeking && Math.abs(fg.currentTime - current) > 0.012) fg.currentTime = current;
        if (!bg.seeking && Math.abs(bg.currentTime - current) > 0.05) bg.currentTime = current;
      }

      // --- slideshow dissolve: opacity only, nothing ever moves ---
      if (slidesOn) {
        const p = scrollY / vh; // slide index space: slide i centered at p = i
        slideRefs.current.forEach((el, i) => {
          if (!el) return;
          const d = Math.abs(p - i);
          // hold fully visible within ±0.18 of center, dissolve out by ±0.62
          const o = Math.max(0, Math.min(1, 1 - (d - 0.18) / 0.44));
          el.style.opacity = o.toFixed(3);
          el.style.visibility = o <= 0.01 ? "hidden" : "visible";
          el.style.pointerEvents = o > 0.6 ? "auto" : "none";
        });
      }

      // pointer drift on the strand — alive even when idle
      px += (tx - px) * 0.05;
      py += (ty - py) * 0.05;
      wrap.style.transform = `translate3d(${px}px, ${py}px, 0)`;

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      fg.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  function goToSlide(i) {
    const y = i * window.innerHeight;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
  }

  const personas = [
    { tag: "Patient", name: "Diane, 68", body: "Wants to know if her essential tremor is changing before her next appointment, four months out." },
    { tag: "Caregiver", name: "Marcus, 34", body: "A home health aide who needs a fast, repeatable way to log observations across six clients." },
    { tag: "Student", name: "Priya, 17", body: "Learning the MDS-UPDRS motor exam and wants to see it digitized, not just described in a textbook." },
    { tag: "Clinician", name: "Dr. Nguyen", body: "Only sees her patient for fifteen minutes every few months — wants trend data, not a single snapshot." },
  ];
  const tasks = ["rest", "postural", "tap", "pronation", "spiral"];
  const impacts = [
    { value: 10, suffix: "M+", label: t("impactStat1Label"), source: t("impactStat1Source") },
    { value: 34, prefix: "~", suffix: " days", label: t("impactStat2Label"), source: t("impactStat2Source") },
    { value: 0, prefix: "$", label: t("impactStat3Label"), source: t("impactStat3Source") },
    { value: 0.73, decimals: 2, suffix: " AUC", label: t("impactStat4Label"), source: t("impactStat4Source") },
  ];

  const setSlideRef = (i) => (el) => (slideRefs.current[i] = el);

  return (
    <div className="lv5">
      {/* --- the strand: blurred cover fill + contained natural-scale layer --- */}
      <div ref={wrapRef} className="lv5-video-wrap" aria-hidden="true">
        <video ref={bgRef} className="lv5-video-bg" src="/media/dna.mp4" muted playsInline preload="auto" />
        <video ref={fgRef} className="lv5-video-fg" src="/media/dna.mp4" muted playsInline preload="auto" />
      </div>
      <div className="lv5-vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <motion.div className="scroll-progress lv5-progress" style={{ scaleX: progressScaleX, width: "100%" }} aria-hidden="true" />

      <MorphNav t={t} navigate={navigate} />

      {/* scroll length — invisible; slides themselves never move */}
      <div className="lv5-spacer" style={{ height: `${SLIDE_COUNT * 100}vh` }} />

      {/* ---- Slide 0: hero ---- */}
      <section ref={setSlideRef(0)} className="lv5-slide" data-idx="0">
        <div className="wrap lv5-hero-content">
          <div className="lv5-eyebrow mono">
            <span className="lv5-pulse" /> {t("disclaimerShort")}
          </div>
          <h1 className="lv5-title">
            <WordRise text="Your camera," /> <br />
            <WordRise text="a clinical-grade" className="lv5-em" delay={0.12} /> <br />
            <WordRise text="motion exam." delay={0.24} />
          </h1>
          <Reveal delay={0.55} className="lv5-lede">
            {t("heroLede")}
          </Reveal>
          <Reveal delay={0.7}>
            <div className="lv5-actions">
              <Magnetic as="button" className="btn lv5-cta" onClick={() => navigate("/consent")}>
                {t("ctaTryNow")}
              </Magnetic>
              <Magnetic as="button" className="btn lv5-ghost" strength={0.2} onClick={() => goToSlide(1)}>
                {t("ctaHowItWorks")}
              </Magnetic>
            </div>
          </Reveal>
        </div>
        <div className="lv5-scroll-cue mono" aria-hidden="true">
          scroll <span className="lv5-cue-line" />
        </div>
      </section>

      {/* ---- Slide 1: personas ---- */}
      <section ref={setSlideRef(1)} className="lv5-slide" data-idx="1">
        <div className="wrap">
          <div className="lv5-head">
            <span className="lv5-kicker mono">Who it's for</span>
            <h2>{t("whoTitle")}</h2>
            <p>{t("whoLede")}</p>
          </div>
          <div className="lv5-personas">
            {personas.map((p) => (
              <div key={p.name} className="lv5-card">
                <span className="mono lv5-tag">{p.tag}</span>
                <h3>{p.name}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Slide 2: how it works ---- */}
      <section ref={setSlideRef(2)} className="lv5-slide" data-idx="2">
        <div className="wrap">
          <div className="lv5-head">
            <span className="lv5-kicker mono">How it works</span>
            <h2>{t("howTitle")}</h2>
            <p>{t("howLede")}</p>
          </div>
          <div className="lv5-steps">
            <div className="lv5-line-fill" aria-hidden="true" />
            {[
              { n: "01", title: t("step1Title"), body: t("step1Body") },
              { n: "02", title: t("step2Title"), body: t("step2Body") },
              { n: "03", title: t("step3Title"), body: t("step3Body") },
            ].map((s) => (
              <div key={s.n} className="lv5-step">
                <div className="lv5-num mono">{s.n}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Slide 3: task battery ---- */}
      <section ref={setSlideRef(3)} className="lv5-slide" data-idx="3">
        <div className="wrap">
          <div className="lv5-head">
            <span className="lv5-kicker mono">The battery</span>
            <h2>{t("tasksTitle")}</h2>
            <p>{t("tasksLede")}</p>
          </div>
        </div>
        <div className="marquee-mask">
          <div className="marquee">
            {[...tasks, ...tasks].map((task, i) => (
              <div key={i} className="lv5-chip">
                <TaskIcon task={task} size={30} />
                <div>
                  <h3>{t(`task${cap(task)}Title`)}</h3>
                  <p>{t(`task${cap(task)}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Slide 4: impact ---- */}
      <section ref={setSlideRef(4)} className="lv5-slide" data-idx="4">
        <div className="wrap">
          <div className="lv5-head">
            <span className="lv5-kicker mono">Why it matters</span>
            <h2>{t("impactTitle")}</h2>
            <p>{t("impactLede")}</p>
          </div>
          <div className="lv5-impact">
            {impacts.map((im, i) => (
              <div key={i} className="lv5-card lv5-stat">
                <div className="lv5-value">
                  <CountUp value={im.value} prefix={im.prefix || ""} suffix={im.suffix || ""} decimals={im.decimals || 0} />
                </div>
                <p>{im.label}</p>
                <span className="mono lv5-source">{im.source}</span>
              </div>
            ))}
          </div>
          <p className="lv5-disclaimer">{t("impactDisclaimer")}</p>
        </div>
      </section>

      {/* ---- Slide 5: trust ---- */}
      <section ref={setSlideRef(5)} className="lv5-slide" data-idx="5">
        <div className="wrap">
          <div className="lv5-head">
            <span className="lv5-kicker mono">Trust</span>
            <h2>{t("trustTitle")}</h2>
          </div>
          <div className="lv5-claims">
            {[
              [t("trustOnDeviceTitle"), t("trustOnDeviceBody")],
              [t("trustFreeTitle"), t("trustFreeBody")],
              [t("trustHonestTitle"), t("trustHonestBody")],
            ].map(([title, body]) => (
              <div key={title} className="lv5-claim">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Slide 6: closing CTA ---- */}
      <section ref={setSlideRef(6)} className="lv5-slide" data-idx="6">
        <div className="wrap lv5-final">
          <h2>{t("footerCta")}</h2>
          <Magnetic as="button" className="btn lv5-cta" onClick={() => navigate("/consent")}>
            {t("ctaTryNow")}
          </Magnetic>
          <div className="lv5-footer-bottom">
            <span>© 2026 {t("appName")} — a Congressional App Challenge submission</span>
            <span>{t("disclaimerShort")}</span>
          </div>
        </div>
      </section>

      <style>{LV5_CSS}</style>
    </div>
  );
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function MorphNav({ t, navigate }) {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => {
    if (ref.current) ref.current.classList.toggle("scrolled", v > 40);
  });
  return (
    <header ref={ref} className="lv5-nav">
      <div className="wrap lv5-nav-inner">
        <span className="row lv5-brand" style={{ gap: 10 }} data-cursor="grow">
          <BrandMark />
          <Wordmark appName={t("appName")} />
        </span>
        <Magnetic as="button" className="btn lv5-ghost btn-sm" strength={0.25} onClick={() => navigate("/consent")}>
          {t("ctaTryNow")}
        </Magnetic>
      </div>
    </header>
  );
}

const LV5_CSS = `
/* ============ Bioluminescent slideshow (sampled from dna.mp4) ============ */
.lv5 {
  --abyss: #050B14;
  --ice: #8FD9FF;
  --ice-bright: #D7F0FF;
  --line: rgba(143,217,255,.22);
  position: relative;
  background: var(--abyss);
  color: #EAF4FB;
  min-height: 100vh;
}
.lv5 h1, .lv5 h2 { color: #F2FAFF; }
.lv5 .mono { color: rgba(215,240,255,.6); }

/* --- the strand: blurred fill extends the clip across any display --- */
.lv5-video-wrap { position: fixed; inset: 0; z-index: 0; will-change: transform; }
.lv5-video-bg, .lv5-video-fg { position: absolute; inset: 0; width: 100%; height: 100%; }
.lv5-video-bg { object-fit: cover; filter: blur(64px) brightness(.5) saturate(1.25); transform: scale(1.2); }
.lv5-video-fg { object-fit: contain; /* natural scale — the strand is never cropped */
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 14%, #000 86%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, #000 14%, #000 86%, transparent 100%); }
.lv5-vignette { position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: radial-gradient(120% 90% at 50% 42%, transparent 34%, rgba(5,11,20,.66) 100%); }
.lv5 .grain { opacity: .05; mix-blend-mode: overlay; z-index: 2; }
.lv5-progress { background: linear-gradient(90deg, var(--ice), var(--ice-bright)); z-index: 60; }

/* --- nav --- */
.lv5-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: background 300ms var(--ease-out), backdrop-filter 300ms, border-color 300ms; border-bottom: 1px solid transparent; }
.lv5-nav.scrolled { background: rgba(5,11,20,.55); backdrop-filter: blur(16px) saturate(1.2); border-color: var(--line); }
.lv5-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 68px; }
.lv5-brand span { color: #fff !important; }

/* --- slides: fixed layers that ONLY dissolve, never move --- */
.lv5-spacer { pointer-events: none; }
.lv5-slide { position: fixed; inset: 0; z-index: 3; display: flex; flex-direction: column; justify-content: center;
  padding: 92px 0 40px; opacity: 0; visibility: hidden; pointer-events: none; will-change: opacity; }
.lv5-slide[data-idx="0"] { opacity: 1; visibility: visible; pointer-events: auto; }

/* --- hero --- */
.lv5-hero-content { max-width: 900px; }
.lv5-eyebrow { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 26px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; background: rgba(5,11,20,.4); backdrop-filter: blur(8px); }
.lv5-pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--ice); box-shadow: 0 0 0 0 rgba(143,217,255,.6); animation: lv5pulse 2.4s infinite; }
@keyframes lv5pulse { 0%{box-shadow:0 0 0 0 rgba(143,217,255,.6);} 70%{box-shadow:0 0 0 12px rgba(143,217,255,0);} 100%{box-shadow:0 0 0 0 rgba(143,217,255,0);} }
.lv5-title { font-family: var(--font-display); font-style: italic; font-weight: 600;
  font-size: clamp(44px, 7.6vw, 104px); line-height: .98; letter-spacing: -0.02em; margin: 0; color: #fff;
  text-shadow: 0 2px 40px rgba(5,11,20,.9); }
.lv5-em .rise-word { color: var(--ice); }
.lv5-lede { font-size: clamp(17px, 1.6vw, 20px); color: rgba(234,244,251,.84); max-width: 52ch; margin: 26px 0 32px; text-shadow: 0 2px 24px rgba(5,11,20,.85); }
.lv5-actions { display: flex; gap: 14px; flex-wrap: wrap; }
.lv5-cta { background: var(--ice-bright); color: var(--abyss); font-weight: 700; font-size: 16px; box-shadow: 0 0 34px rgba(143,217,255,.35); }
.lv5-cta:hover { background: #fff; }
.lv5-ghost { background: rgba(5,11,20,.35); border: 1.5px solid var(--line); color: #EAF4FB; backdrop-filter: blur(8px); }
.lv5-ghost:hover { border-color: var(--ice); color: var(--ice-bright); }
.lv5-scroll-cue { position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.lv5-cue-line { width: 1px; height: 38px; background: linear-gradient(rgba(215,240,255,.7), transparent); }

/* --- shared slide content --- */
.lv5-head { max-width: 640px; margin: 0 auto 40px; text-align: center; }
.lv5-kicker { display: inline-block; margin-bottom: 14px; color: var(--ice) !important; letter-spacing: .12em; }
.lv5-head h2 { font-family: var(--font-display); font-style: italic; font-weight: 600; font-size: clamp(30px, 4vw, 50px); line-height: 1.08; }
.lv5-head p { color: rgba(234,244,251,.72); margin-top: 14px; font-size: 18px; }

.lv5-card { border: 1px solid var(--line); border-radius: 16px; padding: 24px 20px; height: 100%;
  background: rgba(8,17,30,.6); backdrop-filter: blur(14px) saturate(1.1);
  transition: transform 240ms var(--ease-out), border-color 240ms, box-shadow 240ms; }
.lv5-card:hover { transform: translateY(-6px); border-color: var(--ice); box-shadow: 0 18px 44px rgba(3,8,16,.6), 0 0 24px rgba(143,217,255,.12); }
.lv5-card h3 { font-size: 20px; margin: 0 0 8px; color: #F2FAFF; }
.lv5-card p { color: rgba(234,244,251,.7); font-size: 15px; }
.lv5-tag { display: block; color: var(--ice) !important; margin-bottom: 10px; }
.lv5-personas { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; }

.lv5-steps { position: relative; max-width: 780px; margin: 0 auto; padding-left: 38px; }
.lv5-steps::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: rgba(143,217,255,.15); }
.lv5-line-fill { position: absolute; left: 0; top: 0; width: 2px; height: 100%; background: linear-gradient(var(--ice), var(--ice-bright)); box-shadow: 0 0 12px rgba(143,217,255,.6); }
.lv5-step { display: grid; grid-template-columns: 84px 1fr; gap: 18px; padding: 26px 0; align-items: start; }
.lv5-num { font-size: 38px; color: var(--ice) !important; font-weight: 600; }
.lv5-step h3 { font-size: 24px; margin: 0 0 8px; color: #F2FAFF; }
.lv5-step p { color: rgba(234,244,251,.72); font-size: 16px; max-width: 52ch; }

.lv5-chip { flex: 0 0 320px; display: flex; gap: 16px; align-items: center; border: 1px solid var(--line); border-radius: 16px;
  background: rgba(8,17,30,.62); backdrop-filter: blur(12px); padding: 22px; }
.lv5-chip h3 { font-size: 17px; margin: 0 0 4px; color: #F2FAFF; }
.lv5-chip p { color: rgba(234,244,251,.65); font-size: 14px; }
.lv5-chip svg { filter: drop-shadow(0 0 8px rgba(143,217,255,.4)); }
.lv5-chip svg [stroke] { stroke: var(--ice); }

.lv5-impact { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; }
.lv5-value { font-family: var(--font-display); font-style: italic; font-weight: 600; font-size: 42px; color: var(--ice-bright); line-height: 1; margin-bottom: 12px; font-variant-numeric: tabular-nums; text-shadow: 0 0 26px rgba(143,217,255,.45); }
.lv5-stat p { margin-bottom: 12px; }
.lv5-source { display: block; font-size: 11px; border-top: 1px solid var(--line); padding-top: 10px; }
.lv5-disclaimer { color: rgba(234,244,251,.55); font-size: 13.5px; margin: 22px auto 0; max-width: 62ch; text-align: center; }

.lv5-claims { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; }
.lv5-claim { border-top: 1px solid var(--line); padding-top: 20px; }
.lv5-claim h3 { color: var(--ice-bright); font-size: 20px; margin: 0 0 10px; }
.lv5-claim p { color: rgba(234,244,251,.7); font-size: 15px; }

.lv5-final { text-align: center; max-width: 680px; }
.lv5-final h2 { font-family: var(--font-display); font-style: italic; font-size: clamp(30px, 4vw, 48px); margin-bottom: 26px; }
.lv5-footer-bottom { display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 22px; margin-top: 56px; font-size: 13px; color: rgba(234,244,251,.55); flex-wrap: wrap; gap: 12px; }

/* --- mobile / reduced motion: honest stacked page, no fixed slides --- */
@media (max-width: 900px), (prefers-reduced-motion: reduce) {
  .lv5-spacer { display: none; }
  .lv5-slide { position: relative; inset: auto; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; min-height: 60vh; padding: 100px 0 40px; }
  .lv5-personas, .lv5-impact { grid-template-columns: repeat(2,1fr); }
  .lv5-claims { grid-template-columns: 1fr; }
  .lv5-scroll-cue { display: none; }
}
@media (max-width: 560px) {
  .lv5-personas, .lv5-impact { grid-template-columns: 1fr; }
  .lv5-step { grid-template-columns: 54px 1fr; }
}
`;
