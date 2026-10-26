import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useAppState } from "../context/AppStateContext.jsx";
import TaskIcon from "../components/TaskIcon.jsx";
import { BrandMark, Wordmark } from "../components/Brand.jsx";
import EvidenceCharts from "../components/EvidenceCharts.jsx";
import { sampleResult } from "../lib/sample.js";

const TASKS = ["rest", "postural", "tap", "pronation", "spiral"];

export default function Landing() {
  const { t } = useAppState();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const video = useRef(null);
  const sample = useMemo(() => sampleResult(), []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let visible = true;
    let disposed = false;
    const update = () => {
      if (paused || reduceMotion || document.hidden || !visible) element.pause();
      else element.play().catch(error => {
        // StrictMode cleanup and visibility changes can cancel an in-flight
        // play request. That is not a user pause or an autoplay denial.
        if (!disposed && error.name !== 'AbortError') setPaused(true);
      });
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    update();
    return () => { disposed = true; observer.disconnect(); document.removeEventListener('visibilitychange', update); element.pause(); };
  }, [paused, reduceMotion]);

  return (
    <div className="landing landing-restored">
      <a className="skip-link" href="#landing-main">Skip to content</a>
      <header className="landing-nav">
        <div className="landing-shell landing-nav-inner">
          <a className="landing-brand" href="#top" aria-label={t("appName")}><BrandMark /><Wordmark appName={t("appName")} /></a>
          <nav className="landing-links" aria-label="Landing navigation"><a href="#how">How it works</a><a href="#analysis">What you get</a><a href="#privacy">Privacy</a></nav>
          <button className="btn landing-nav-cta" onClick={() => navigate("/consent")}>{t("ctaTryNow")}</button>
        </div>
      </header>

      <main id="landing-main">
        <section id="top" className="landing-hero landing-shell">
          <motion.div className="landing-hero-copy" initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
            <span className="landing-kicker"><i /> Private, camera-only movement tracking</span>
            <h1>See movement<br /><em>more clearly.</em></h1>
            <p>A private movement journal for your camera and touchscreen. Record short guided check-ins, explore the signal, and bring clearer context to your next conversation with a clinician.</p>
            <div className="landing-actions"><button className="btn landing-primary" onClick={() => navigate("/consent")}>{t("ctaTryNow")}</button><a className="landing-text-link" href="#how">Explore the assessment <span>↘</span></a></div>
            <div className="landing-assurances" aria-label="Product assurances"><span>No account</span><span>Nothing uploaded</span><span>Works in your browser</span></div>
          </motion.div>

          <div className="landing-visual" aria-hidden="true">
            <video ref={video} className="landing-video" src="/media/dna.mp4" poster="/media/helix.webp" muted playsInline loop preload="metadata" onError={() => setVideoFailed(true)} />
            <div className="landing-visual-shade" />
          </div>
          <div className="landing-hero-bottom"><a href="#how">Explore below ↓</a>{!reduceMotion && !videoFailed && <button type="button" className="landing-motion-toggle" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Play background animation' : 'Pause background animation'}</button>}</div>
        </section>

        <section className="landing-proof"><div className="landing-shell landing-proof-grid"><div><strong>5</strong><span>guided movement tasks</span></div><div><strong>21</strong><span>estimated landmarks per hand</span></div><div><strong>On device</strong><span>camera processing & journal</span></div><div><strong>Your history</strong><span>exportable PDF, CSV & JSON</span></div></div></section>

        <section id="how" className="landing-section landing-shell">
          <div className="landing-section-head"><span className="landing-kicker">01 / A calmer check-in</span><h2>A small ritual.<br />A clearer record.</h2><p>Choose a short task, follow the guide, and explore what was measured. Repeat with the same setup to build a more useful movement journal.</p></div>
          <div className="landing-flow">{[["01", "Position", "Follow the task guide and keep the selected hand clearly in frame."],["02", "Measure", "Estimated movement is normalized to hand size. Gaps and poor-quality captures are flagged."],["03", "Understand", "Explore the signal, save context, and bring an export to a clinician conversation."]].map(([n,title,body]) => <motion.article key={n} initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .4 }}><span>{n}</span><div><h3>{title}</h3><p>{body}</p></div></motion.article>)}</div>
        </section>

        <section className="landing-section landing-tasks-wrap"><div className="landing-shell">
          <div className="landing-section-head landing-head-row"><div><span className="landing-kicker">The assessment</span><h2>Five tasks. One consistent baseline.</h2></div><p>Repeat the same short movements over time so your history becomes more useful than a single snapshot.</p></div>
          <div className="landing-task-grid">{TASKS.map((task,index) => <article className="landing-task" key={task}><div className="landing-task-top"><span>0{index + 1}</span><TaskIcon task={task} size={30} /></div><h3>{t(`task${cap(task)}Title`)}</h3><p>{t(`task${cap(task)}Desc`)}</p></article>)}</div>
        </div></section>

        <section id="analysis" className="landing-section landing-shell landing-analysis">
          <div className="landing-analysis-copy"><span className="landing-kicker">Results that explain themselves</span><h2>See the signal,<br />not a mystery score.</h2><p>Every result separates recording quality from the movement itself, then shows which measurements shaped the explanation.</p><ul><li>Spatial motion heatmap and trace</li><li>Frequency spectrum with the dominant band highlighted</li><li>Separate recordings for each hand</li><li>Plain-language next steps and model limitations</li></ul><button className="btn landing-primary" onClick={()=>navigate('/demo')}>Explore a sample result →</button></div>
          <div className="landing-analysis-ui" aria-label="Interactive synthetic analysis example">
            <div className="analysis-ui-head"><div><small>SYNTHETIC EXAMPLE / NOT PATIENT DATA</small><strong>The same analysis tools you’ll use in your journal.</strong></div><span>Explore the charts</span></div>
            <EvidenceCharts result={sample} />
          </div>
        </section>

        <section id="privacy" className="landing-section landing-shell"><div className="landing-privacy"><div><span className="landing-kicker">Designed for trust</span><h2>Your movement data stays yours.</h2></div><div className="landing-privacy-grid"><article><span>01</span><h3>Local by default</h3><p>Camera frames are processed in memory and are never stored or uploaded.</p></article><article><span>02</span><h3>Honest uncertainty</h3><p>Low-quality recordings ask you to try again instead of presenting false confidence.</p></article><article><span>03</span><h3>Built for a conversation</h3><p>NeuraTrack monitors change over time. A licensed clinician interprets what it means.</p></article></div></div></section>

        <section className="landing-section landing-shell landing-install"><div><span className="landing-kicker">Keep it close</span><h2>Your journal.<br />On your home screen.</h2><p>Use NeuraTrack in your browser or add it to your phone’s home screen. Your journal stays in this browser on this device—there is no account or automatic cloud sync.</p></div><div><details><summary>Install on iPhone</summary><p>Open your published HTTPS site in Safari. Use Share → Add to Home Screen. Camera assessments still need camera permission.</p></details><details><summary>Install on Android or desktop</summary><p>Use your browser’s Install app option when available. You can also keep using the website without installing anything.</p></details><details><summary>Keep your records safe</summary><p>Export important recordings before clearing browser data or switching devices. The web and native iPhone apps have separate journals.</p></details></div></section>
        <section className="landing-final landing-shell"><span className="landing-kicker">Start with a baseline</span><h2>A clearer picture begins<br />with one check-in.</h2><button className="btn landing-primary" onClick={() => navigate("/consent")}>{t("ctaTryNow")}</button><footer><span>© 2026 NeuraTrack</span><a href="/evidence">Research & limitations</a><span>Monitoring tool—not a diagnosis.</span></footer></section>
      </main>
    </div>
  );
}

function cap(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
