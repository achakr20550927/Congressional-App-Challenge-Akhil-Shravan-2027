import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext.jsx";
import { BrandMark } from "../components/Brand.jsx";

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
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 96, paddingBottom: 96 }}>
      <div className="stack" style={{ alignItems: "flex-start", marginBottom: 32 }}>
        <BrandMark size={40} />
        <h1 style={{ fontSize: 34 }}>{t("consentTitle")}</h1>
      </div>

      <div className="card stack" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 17, color: "var(--ink-soft)" }}>{t("consentBody")}</p>
      </div>

      <label className="checkbox-row card" style={{ cursor: "pointer", marginBottom: 24 }}>
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
    </div>
  );
}
