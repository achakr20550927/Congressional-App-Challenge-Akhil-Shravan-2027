import { BrandMark, Wordmark } from "./Brand.jsx";
import SignalLattice from "./SignalLattice.jsx";

export default function OnboardingShell({ step, eyebrow, title, body, children }) {
  return (
    <main className="onboarding-shell">
      <section className="onboarding-story" aria-hidden="true">
        <SignalLattice />
        <div className="onboarding-brand"><BrandMark size={34} /><Wordmark /></div>
        <div className="onboarding-story-copy">
          <span className="mono">PRIVATE MOVEMENT INTELLIGENCE</span>
          <p>Five guided tasks. Camera-only capture. Clear explanations that never pretend to be a diagnosis.</p>
        </div>
        <div className="onboarding-trust"><i /> Processing stays on this device</div>
      </section>
      <section className="onboarding-panel">
        <div className="onboarding-panel-inner">
          <div className="onboarding-progress" aria-label={`Setup step ${step} of 3`}>
            {[1, 2, 3].map((item) => <i key={item} className={item <= step ? "active" : ""} />)}
            <span className="mono">STEP 0{step} / 03</span>
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
