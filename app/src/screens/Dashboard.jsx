import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext.jsx";
import { getSessionHistory } from "../lib/storage.js";
import TaskIcon from "../components/TaskIcon.jsx";
import { Stagger, StaggerItem } from "../components/motion/primitives.jsx";

const TASKS = [
  { key: "rest", titleKey: "taskRestTitle", descKey: "taskRestDesc" },
  { key: "postural", titleKey: "taskPosturalTitle", descKey: "taskPosturalDesc" },
  { key: "tap", titleKey: "taskTapTitle", descKey: "taskTapDesc" },
  { key: "pronation", titleKey: "taskPronationTitle", descKey: "taskPronationDesc" },
  { key: "spiral", titleKey: "taskSpiralTitle", descKey: "taskSpiralDesc" },
];

export default function Dashboard() {
  const { t, profile, mode } = useAppState();
  const navigate = useNavigate();
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getSessionHistory().then((results) => {
      setHistory(results);
      if (results.length) setLastResult(results[results.length - 1]);
    });
  }, []);

  return (
    <div className="wrap dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-orb" aria-hidden="true" />
        <div>
          <span className="eyebrow mono">{mode === "clinician" ? "Clinical review workspace" : profile?.name ? `Welcome back, ${profile.name}` : "Your private workspace"}</span>
          <h1>{mode === "clinician" ? "Assessment overview" : t("dashboardTitle")}</h1>
          <p>{mode === "clinician" ? "Review recording quality, recent findings, and task coverage before a supervised assessment." : t("dashboardLede")}</p>
        </div>
        <Link to="/history" className="btn btn-ghost">
          {t("viewHistory")}
        </Link>
      </section>

      {mode === "clinician" && (
        <section className="clinician-overview" aria-label="Clinical session summary">
          <div><span className="mono">RECORDINGS</span><strong>{history.length}</strong><p>Stored on this device</p></div>
          <div><span className="mono">TASK COVERAGE</span><strong>{new Set(history.map((item) => item.task)).size}/5</strong><p>Distinct assessments</p></div>
          <div><span className="mono">QUALITY PASS</span><strong>{history.length ? `${Math.round(history.filter((item) => item.qualityOk !== false).length / history.length * 100)}%` : "—"}</strong><p>Usable recordings</p></div>
          <div><span className="mono">LATEST STATUS</span><strong className="clinician-status">{lastResult?.rating || "No data"}</strong><p>{lastResult ? new Date(lastResult.recordedAt).toLocaleDateString() : "Run an assessment"}</p></div>
        </section>
      )}

      {lastResult && (
        <div className="last-session">
          <span className="mono">{t("lastSession")}</span>
          <strong>{TASKS.find((tk) => tk.key === lastResult.task)?.titleKey ? t(TASKS.find((tk) => tk.key === lastResult.task).titleKey) : lastResult.task}</strong>
          {lastResult.frequencyHz ? <span className="data">{lastResult.frequencyHz.toFixed(2)} Hz</span> : null}
          <span className="data-sm">
            {new Date(lastResult.recordedAt).toLocaleDateString()}
          </span>
        </div>
      )}

      <div className="section-heading">
        <div><span className="eyebrow mono">{mode === "clinician" ? "Supervised capture" : "Check in"}</span><h2>{mode === "clinician" ? "Start an assessment" : "Choose an assessment"}</h2></div>
        <p>{mode === "clinician" ? "Use the standardized task instructions and review quality before interpreting a result." : "Each check-in takes about a minute. Your video stays on this device."}</p>
      </div>
      <Stagger className="task-grid" gap={0.06}>
        {TASKS.map((task) => (
          <StaggerItem key={task.key}>
            <button
              className="task-tile"
              onClick={() => navigate(`/capture/${task.key}`)}
            >
              <span className="task-icon-shell"><TaskIcon task={task.key} /></span>
              <h3>{t(task.titleKey)}</h3>
              <p>
                {t(task.descKey)}
              </p>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
