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
  const { t, profile } = useAppState();
  const navigate = useNavigate();
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    getSessionHistory().then((results) => {
      if (results.length) setLastResult(results[results.length - 1]);
    });
  }, []);

  return (
    <div className="wrap dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-orb" aria-hidden="true" />
        <div>
          <span className="eyebrow mono">{profile?.name ? `Welcome back, ${profile.name}` : "Your private workspace"}</span>
          <h1>{t("dashboardTitle")}</h1>
          <p>{t("dashboardLede")}</p>
        </div>
        <Link to="/history" className="btn btn-ghost">
          {t("viewHistory")}
        </Link>
      </section>

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
        <div><span className="eyebrow mono">Check in</span><h2>Choose an assessment</h2></div>
        <p>Each check-in takes about a minute. Your video stays on this device.</p>
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
