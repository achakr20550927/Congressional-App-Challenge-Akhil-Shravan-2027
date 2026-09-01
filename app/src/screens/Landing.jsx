import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAppState } from "../context/AppStateContext.jsx";
import TaskIcon from "../components/TaskIcon.jsx";
import { BrandMark, Wordmark } from "../components/Brand.jsx";

const TASKS = ["rest", "postural", "tap", "pronation", "spiral"];

export default function Landing() {
  const { t } = useAppState();
  const navigate = useNavigate();

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-shell landing-nav-inner">
          <a className="landing-brand" href="#top" aria-label={t("appName")}><BrandMark /><Wordmark appName={t("appName")} /></a>
          <nav className="landing-links" aria-label="Landing navigation"><a href="#how">How it works</a><a href="#analysis">What you get</a><a href="#privacy">Privacy</a></nav>
          <button className="btn landing-nav-cta" onClick={() => navigate("/consent")}>{t("ctaTryNow")}</button>
        </div>
      </header>

      <main>
        <section id="top" className="landing-hero landing-shell">
          <motion.div className="landing-hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
            <span className="landing-kicker"><i /> Private, camera-only movement tracking</span>
            <h1>See movement<br /><em>more clearly.</em></h1>
            <p>{t("heroLede")}</p>
            <div className="landing-actions"><button className="btn landing-primary" onClick={() => navigate("/consent")}>{t("ctaTryNow")}</button><a className="landing-text-link" href="#how">Explore the assessment <span>↘</span></a></div>
            <div className="landing-assurances" aria-label="Product assurances"><span>No account</span><span>Nothing uploaded</span><span>Works in your browser</span></div>
          </motion.div>

          <motion.div className="landing-visual" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8, delay: .1 }}>
            <video className="landing-video-blur" src="/media/dna.mp4" muted playsInline autoPlay loop aria-hidden="true" />
            <video className="landing-video" src="/media/dna.mp4" muted playsInline autoPlay loop aria-label="Abstract DNA strand animation" />
            <div className="landing-visual-shade" />
            <div className="landing-live-card"><span className="landing-live-dot" /><div><small>ON-DEVICE ANALYSIS</small><strong>Video never leaves your browser</strong></div></div>
            <div className="landing-signal-card"><span>Signal quality</span><strong>Ready</strong><svg viewBox="0 0 180 36" aria-hidden="true"><path d="M2 23 C14 22 18 10 29 19 S48 27 59 15 S75 8 87 21 S105 28 116 14 S135 10 145 20 S162 25 178 12" /></svg></div>
          </motion.div>
        </section>

        <section className="landing-proof"><div className="landing-shell landing-proof-grid"><div><strong>5</strong><span>guided motor tasks</span></div><div><strong>42</strong><span>landmarks across two hands</span></div><div><strong>100%</strong><span>local processing</span></div><div><strong>0</strong><span>wearables required</span></div></div></section>

        <section id="how" className="landing-section landing-shell">
          <div className="landing-section-head"><span className="landing-kicker">A calmer check-in</span><h2>From camera to a useful trend<br />in about one minute.</h2><p>Guided capture, transparent signal processing, and plain-language context—without pretending a webcam can make a diagnosis.</p></div>
          <div className="landing-flow">{[["01", "Position", "A visual guide helps you frame one or both hands with a live quality check."],["02", "Measure", "Landmark motion is stabilized, normalized to hand size, and analyzed on this device."],["03", "Understand", "See motion maps, signal clarity, frequency structure, and changes from your own baseline."]].map(([n,title,body]) => <article key={n}><span>{n}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
        </section>

        <section className="landing-section landing-tasks-wrap"><div className="landing-shell">
          <div className="landing-section-head landing-head-row"><div><span className="landing-kicker">The assessment</span><h2>Five tasks. One consistent baseline.</h2></div><p>Repeat the same short movements over time so your history becomes more useful than a single snapshot.</p></div>
          <div className="landing-task-grid">{TASKS.map((task,index) => <article className="landing-task" key={task}><div className="landing-task-top"><span>0{index + 1}</span><TaskIcon task={task} size={30} /></div><h3>{t(`task${cap(task)}Title`)}</h3><p>{t(`task${cap(task)}Desc`)}</p></article>)}</div>
        </div></section>

        <section id="analysis" className="landing-section landing-shell landing-analysis">
          <div className="landing-analysis-copy"><span className="landing-kicker">Results that explain themselves</span><h2>See the signal,<br />not a mystery score.</h2><p>Every result separates recording quality from the movement itself, then shows which measurements shaped the explanation.</p><ul><li>Spatial motion heatmap and trace</li><li>Frequency spectrum with the dominant band highlighted</li><li>Left–right comparison when both hands are visible</li><li>Plain-language next steps and model limitations</li></ul></div>
          <div className="landing-analysis-ui" aria-label="Example analysis dashboard">
            <div className="analysis-ui-head"><div><small>REST TREMOR · EXAMPLE</small><strong>Movement stayed within your recent range</strong></div><span>Good capture</span></div>
            <div className="analysis-ui-grid"><div className="analysis-map"><span>Motion map</span><div className="heat heat-a" /><div className="heat heat-b" /><svg viewBox="0 0 300 180"><path d="M33 126 C72 104 72 49 116 70 S163 145 202 101 S240 41 270 64" /></svg></div><div className="analysis-metrics"><div><small>Dominant rhythm</small><strong>4.8 <i>Hz</i></strong></div><div><small>Signal clarity</small><strong>82 <i>%</i></strong></div><div><small>Asymmetry</small><strong>Low</strong></div></div><div className="analysis-spectrum"><span>Frequency structure</span><div className="bars">{[22,34,26,48,82,66,41,28,19,14,11,8].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div><div className="axis"><span>2 Hz</span><span>8 Hz</span><span>15 Hz</span></div></div></div>
          </div>
        </section>

        <section id="privacy" className="landing-section landing-shell"><div className="landing-privacy"><div><span className="landing-kicker">Designed for trust</span><h2>Your movement data stays yours.</h2></div><div className="landing-privacy-grid"><article><span>01</span><h3>Local by default</h3><p>Camera frames are processed in memory and are never stored or uploaded.</p></article><article><span>02</span><h3>Honest uncertainty</h3><p>Low-quality recordings ask you to try again instead of presenting false confidence.</p></article><article><span>03</span><h3>Built for a conversation</h3><p>NeuraTrack monitors change over time. A licensed clinician interprets what it means.</p></article></div></div></section>

        <section className="landing-final landing-shell"><span className="landing-kicker">Start with a baseline</span><h2>A clearer picture begins<br />with one check-in.</h2><button className="btn landing-primary" onClick={() => navigate("/consent")}>{t("ctaTryNow")}</button><footer><span>© 2026 NeuraTrack</span><span>Monitoring tool—not a diagnosis.</span><span>Congressional App Challenge</span></footer></section>
      </main>
    </div>
  );
}

function cap(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
