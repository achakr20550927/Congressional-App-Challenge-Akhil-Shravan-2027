import { BrandMark, Wordmark } from "./Brand.jsx";
import SignalLattice from "./SignalLattice.jsx";
import { Link } from "react-router-dom";

export default function OnboardingShell({ step, eyebrow, title, body, children }) {
  return (
    <main className="onboarding-shell">
      <section className="onboarding-story" aria-hidden="true">
        <SignalLattice />
        <div className="onboarding-brand"><BrandMark size={34} /><Wordmark /></div>
        <div className="onboarding-story-copy">
          <span className="mono">PRIVATE MOVEMENT INTELLIGENCE</span>
          <p>Five guided tasks. Camera or touch. Clear measurements, with their limitations in view.</p>
        </div>
        <div className="onboarding-trust"><i /> Processing stays on this device</div>
      </section>
      <section className="onboarding-panel">
        <div className="onboarding-panel-inner">
          <Link to="/welcome" className="onboarding-home">← Back to NeuraTrack home</Link>
          <div className="onboarding-progress" aria-label={`Setup step ${step} of 2`}>
            {[1, 2].map((item) => <i key={item} className={item <= step ? "active" : ""} />)}
            <span className="mono">STEP 0{step} / 02</span>
          </div>
          <span className="eyebrow mono">{eyebrow}</span>
          <h1>{title}</h1>
          {body && <p className="onboarding-lede">{body}</p>}
          <div className="onboarding-content">{children}</div>
        </div>
      </section>
    </main>
  );
}
