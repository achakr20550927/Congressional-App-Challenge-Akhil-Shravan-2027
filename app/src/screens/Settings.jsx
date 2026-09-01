import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { languages } from "../i18n/strings.js";

export default function Settings() {
  const { t, profile, saveProfile, settings, updateSettings, clearAllData } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name || "");
  const [confirmingClear, setConfirmingClear] = useState(false);

  function handleNameBlur() {
    if (name.trim() && name.trim() !== profile?.name) {
      saveProfile({ ...profile, name: name.trim() });
      showToast(t("resultsSaved"));
    }
  }

  function handleLanguageChange(code) {
    saveProfile({ ...profile, language: code });
  }

  async function handleClearData() {
    await clearAllData();
    navigate("/");
  }

  return (
    <div className="wrap settings-page">
      <header className="app-page-header">
        <span className="eyebrow mono">Personal workspace</span>
        <h1>{t("settingsTitle")}</h1>
        <p>Adjust your local profile, accessibility preferences, and device data.</p>
      </header>
      <div className="settings-grid">

      <Section title={t("settingsProfile")}>
        <div className="field">
          <label htmlFor="name">{t("settingsDisplayName")}</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={handleNameBlur} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="lang">{t("settingsLanguage")}</label>
          <select id="lang" value={profile?.language || "en"} onChange={(e) => handleLanguageChange(e.target.value)}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section title={t("settingsAccessibility")}>
        <ToggleRow label={t("settingsLargeText")} checked={settings.largeText} onChange={(v) => updateSettings({ largeText: v })} />
        <ToggleRow
          label={t("settingsReducedMotion")}
          checked={settings.reducedMotion}
          onChange={(v) => updateSettings({ reducedMotion: v })}
          help={t("settingsReducedMotionHelp")}
        />
      </Section>

      <AccessibilityShowcase t={t} />

      <Section title={t("settingsCamera")}>
        <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => navigate("/calibrate")}>
          {t("settingsRecalibrate")}
        </button>
      </Section>

      <Section title={t("settingsData")}>
        {!confirmingClear && (
          <button className="btn btn-danger" style={{ width: "100%" }} onClick={() => setConfirmingClear(true)}>
            {t("settingsClearData")}
          </button>
        )}
        {confirmingClear && (
          <div className="stack">
            <p style={{ color: "var(--error)" }}>{t("settingsClearDataConfirm")}</p>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmingClear(false)}>
                {t("settingsCancel")}
              </button>
              <button className="btn btn-danger" onClick={handleClearData}>
                {t("settingsClearDataConfirmBtn")}
              </button>
            </div>
          </div>
        )}
      </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="card stack settings-card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ToggleRow({ label, checked, onChange, help }) {
  return (
    <div className="spread">
      <div>
        <p>{label}</p>
        {help && (
          <p className="data-sm" style={{ color: "var(--ink-soft)" }}>
            {help}
          </p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 999,
          border: "none",
          background: checked ? "var(--green)" : "var(--hair)",
          position: "relative",
          cursor: "pointer",
          flex: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 150ms var(--ease-out)",
          }}
        />
      </button>
    </div>
  );
}

const A11Y_ITEMS = [
  { key: "Contrast", shape: "circle" },
  { key: "Shapes", shape: "diamond" },
  { key: "Targets", shape: "triangle" },
  { key: "Keyboard", shape: "square" },
  { key: "Motion", shape: "circle" },
  { key: "Lang", shape: "diamond" },
];

function ShapeGlyph({ shape }) {
  const s = 16;
  const c = "var(--green)";
  if (shape === "circle") return <svg width={s} height={s} aria-hidden="true"><circle cx="8" cy="8" r="7" fill={c} /></svg>;
  if (shape === "diamond") return <svg width={s} height={s} aria-hidden="true"><rect x="3" y="3" width="10" height="10" fill={c} transform="rotate(45 8 8)" /></svg>;
  if (shape === "triangle") return <svg width={s} height={s} aria-hidden="true"><polygon points="8,1 15,15 1,15" fill={c} /></svg>;
  return <svg width={s} height={s} aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill={c} /></svg>;
}

function AccessibilityShowcase({ t }) {
  return (
    <section className="card stack settings-card settings-card-featured">
      <div>
        <h3>{t("a11yShowcaseTitle")}</h3>
        <p className="data-sm" style={{ color: "var(--ink-soft)", marginTop: 4 }}>
          {t("a11yShowcaseLede")}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {A11Y_ITEMS.map((item) => (
          <div key={item.key} className="row" style={{ gap: 12, alignItems: "flex-start" }}>
            <span style={{ marginTop: 2, flex: "none" }}>
              <ShapeGlyph shape={item.shape} />
            </span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{t(`a11y${item.key}`)}</p>
              <p className="data-sm" style={{ color: "var(--ink-soft)" }}>
                {t(`a11y${item.key}Desc`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
