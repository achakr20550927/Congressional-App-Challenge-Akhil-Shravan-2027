import { NavLink } from "react-router-dom";
import Brand from "./Brand.jsx";
import { useAppState } from "../context/AppStateContext.jsx";

export default function TopNav() {
  const { t, mode, setMode } = useAppState();

  return (
    <header className="top-nav">
      <div className="wrap top-nav-inner">
        <NavLink to="/app" aria-label={t("appName")} style={{ textDecoration: "none", color: "inherit" }}>
          <Brand appName={t("appName")} />
        </NavLink>

        <nav className="top-nav-actions" aria-label="Primary">
          <div className="top-nav-links nav-desktop-only">
            <NavTab to="/app">{t("navLiveFeed")}</NavTab>
            <NavTab to="/history">{t("navHistory")}</NavTab>
            <NavTab to="/settings">{t("navSettings")}</NavTab>
          </div>

          <div className="mode-switch" role="group" aria-label="Patient or clinician mode">
            <button
              type="button"
              onClick={() => setMode("patient")}
              aria-pressed={mode === "patient"}
              className={`mono${mode === "patient" ? " active" : ""}`}
            >
              {t("patientMode")}
            </button>
            <button
              type="button"
              onClick={() => setMode("clinician")}
              aria-pressed={mode === "clinician"}
              className={`mono${mode === "clinician" ? " active" : ""}`}
            >
              {t("clinicianMode")}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavTab({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
    >
      {children}
    </NavLink>
  );
}
