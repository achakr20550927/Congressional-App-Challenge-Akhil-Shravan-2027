import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext.jsx";
import { languages } from "../i18n/strings.js";
import { BrandMark } from "../components/Brand.jsx";

const CONDITIONS = [
  { value: "", labelKey: null },
  { value: "essential_tremor", labelKey: "conditionEssentialTremor" },
  { value: "parkinsons", labelKey: "conditionParkinsons" },
  { value: "stroke", labelKey: "conditionStroke" },
  { value: "other", labelKey: "conditionOther" },
  { value: "prefer_not", labelKey: "conditionPrefer_not" },
];

/** PRD §10.3 — minimal local-only profile, no email or password ever. */
export default function ProfileSetup() {
  const { t, profile, saveProfile, language } = useAppState();
  const [name, setName] = useState(profile?.name || "");
  const [condition, setCondition] = useState(profile?.condition || "");
  const [lang, setLang] = useState(language);
  const navigate = useNavigate();

  function handleContinue(e) {
    e.preventDefault();
    if (!name.trim()) return;
    saveProfile({ name: name.trim(), condition, language: lang });
    navigate("/calibrate");
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 96, paddingBottom: 96 }}>
      <div className="stack" style={{ alignItems: "flex-start", marginBottom: 32 }}>
        <BrandMark size={40} />
        <h1 style={{ fontSize: 34 }}>{t("profileTitle")}</h1>
        <p style={{ color: "var(--ink-soft)" }}>{t("profileBody")}</p>
      </div>

      <form className="card" onSubmit={handleContinue}>
        <div className="field">
          <label htmlFor="displayName">{t("profileNameLabel")}</label>
          <input
            id="displayName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("profileNamePlaceholder")}
            required
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="condition">{t("profileConditionLabel")}</label>
          <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.labelKey ? t(c.labelKey) : "—"}
              </option>
            ))}
          </select>
          <p className="data-sm" style={{ color: "var(--ink-soft)" }}>
            {t("profileConditionHelp")}
          </p>
        </div>

        <div className="field">
          <label htmlFor="language">{t("profileLanguageLabel")}</label>
          <select id="language" value={lang} onChange={(e) => setLang(e.target.value)}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={!name.trim()}>
          {t("continueBtn")}
        </button>
      </form>
    </div>
  );
}
