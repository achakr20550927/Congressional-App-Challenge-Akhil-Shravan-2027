import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext.jsx";
import OnboardingShell from "../components/OnboardingShell.jsx";

/** PRD §10.2 — blocking screen, must be explicitly acknowledged before any camera access. */
export default function Consent() {
  const { t, acceptConsent } = useAppState();
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  function handleContinue() {
    acceptConsent();
    navigate("/profile");
  }

  return (
    <OnboardingShell step={1} eyebrow="A clear agreement" title={t("consentTitle")} body={t("consentBody")}>
      <div className="privacy-proof-grid">
        <div><strong>0</strong><span>uploads</span></div>
        <div><strong>Local</strong><span>processing</span></div>
        <div><strong>You</strong><span>control deletion</span></div>
      </div>

      <label className="checkbox-row card consent-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          aria-describedby="consent-ack-text"
        />
        <span id="consent-ack-text">{t("consentAck")}</span>
      </label>

      <button className="btn btn-primary" style={{ width: "100%" }} disabled={!checked} onClick={handleContinue}>
        {t("consentContinue")}
      </button>
    </OnboardingShell>
  );
}
