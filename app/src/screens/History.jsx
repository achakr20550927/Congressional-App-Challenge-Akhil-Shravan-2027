import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getSessionHistory, computeHistoryTrend, exportCsv, downloadBlob } from "../lib/storage.js";
import { renderTrendChart } from "../lib/render3d.js";
import { analyzeTaskTrend } from "../lib/trends.js";

const TASK_FILTERS = [
  { key: "all", labelKey: "allTasks" },
  { key: "rest", labelKey: "taskRestTitle" },
  { key: "postural", labelKey: "taskPosturalTitle" },
  { key: "tap", labelKey: "taskTapTitle" },
  { key: "pronation", labelKey: "taskPronationTitle" },
  { key: "spiral", labelKey: "taskSpiralTitle" },
];

export default function History() {
  const { t, language } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [filter, setFilter] = useState("all");
  const freqCanvasRef = useRef(null);
  const ampCanvasRef = useRef(null);

  useEffect(() => {
    getSessionHistory().then(setResults);
  }, []);

  const filtered = useMemo(() => {
    if (!results) return [];
    return filter === "all" ? results : results.filter((r) => r.task === filter);
  }, [results, filter]);

  const trend = useMemo(() => computeHistoryTrend(filtered), [filtered]);

  // Trend intelligence only makes sense for a single task (mixing tasks would
  // compare unrelated metrics). Shown when a specific task filter is active.
  const taskTrend = useMemo(
    () => (filter !== "all" ? analyzeTaskTrend(filter, filtered, language) : null),
    [filter, filtered, language]
  );

  useEffect(() => {
    if (!filtered.length) return;
    const withFreq = filtered.filter((r) => r.frequencyHz);
    const withAmp = filtered.filter((r) => r.rmsAmplitude != null);
    if (freqCanvasRef.current && withFreq.length) {
      renderTrendChart(
        freqCanvasRef.current,
        withFreq.map((r) => new Date(r.recordedAt).toLocaleDateString()),
        withFreq.map((r) => r.frequencyHz),
        "#7CC8F0"
      );
    }
    if (ampCanvasRef.current && withAmp.length) {
      renderTrendChart(
        ampCanvasRef.current,
        withAmp.map((r) => new Date(r.recordedAt).toLocaleDateString()),
        withAmp.map((r) => r.rmsAmplitude),
        "#F09E7C"
      );
    }
  }, [filtered]);

  async function handleExportCsv() {
    const blob = await exportCsv(filtered.map((r) => r.id));
    downloadBlob(blob, "neuratrack-history.csv");
    showToast(t("downloadReady"));
  }

  if (results === null) return <div className="wrap" style={{ paddingTop: 40 }} />;

  if (results.length === 0) {
    return (
      <div className="wrap" style={{ paddingTop: 64, textAlign: "center" }}>
        <h1 style={{ marginBottom: 12 }}>{t("historyEmpty")}</h1>
        <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>{t("historyEmptyBody")}</p>
        <button className="btn btn-primary" onClick={() => navigate("/app")}>
          {t("historyRunFirst")}
        </button>
      </div>
    );
  }

  return (
    <div className="wrap history-page">
      <header className="app-page-header app-page-header-row">
        <div><span className="eyebrow mono">Longitudinal view</span><h1>{t("historyTitle")}</h1><p>Your own repeated measurements are more useful than a single snapshot.</p></div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleExportCsv}>
            {t("exportCsv")}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/export")}>
            {t("exportPdf")}
          </button>
        </div>
      </header>

      <div className="history-summary-strip">
        <div><span className="mono">RECORDINGS</span><strong>{results.length}</strong></div>
        <div><span className="mono">TASKS</span><strong>{new Set(results.map((item) => item.task)).size}</strong></div>
        <div><span className="mono">LATEST</span><strong>{new Date(results.at(-1).recordedAt).toLocaleDateString()}</strong></div>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TASK_FILTERS.map((f) => (
          <button
            key={f.key}
            className="mono"
            onClick={() => setFilter(f.key)}
            style={{
              border: `1px solid ${filter === f.key ? "var(--green)" : "var(--hair)"}`,
              borderRadius: 999,
              padding: "8px 16px",
              background: filter === f.key ? "var(--green-tint)" : "var(--paper)",
              color: filter === f.key ? "var(--green)" : "var(--ink-soft)",
              cursor: "pointer",
            }}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {filter === "all" && (
        <p className="data-sm" style={{ color: "var(--ink-soft)", marginBottom: 20 }}>
          {t("trendPickTaskHint")}
        </p>
      )}

      {taskTrend && <TrendIntelligenceCard trend={taskTrend} t={t} />}

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="spread" style={{ marginBottom: 10 }}>
            <h3>{t("freqOverTime")}</h3>
            <TrendBadge value={trend.frequencyPctPerWeek} />
          </div>
          <canvas ref={freqCanvasRef} height={130} />
        </div>
        <div className="card">
          <div className="spread" style={{ marginBottom: 10 }}>
            <h3>{t("ampOverTime")}</h3>
            <TrendBadge value={trend.amplitudePctPerWeek} />
          </div>
          <canvas ref={ampCanvasRef} height={130} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="spread" style={{ padding: 20 }}>
          <h3>{t("sessionHistory")}</h3>
          <span className="mono">{filtered.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hair)" }}>
                {[t("colDate"), t("colTask"), t("colFrequency"), t("colAmplitude"), t("colNotes")].map((h) => (
                  <th key={h} className="mono" style={{ textAlign: "left", padding: "10px 16px" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--canvas-dim)" }}>
                  <td style={{ padding: "12px 16px" }}>{new Date(r.recordedAt).toLocaleDateString()}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="chip chip-neutral">
                      <span className="chip-shape" />
                      {t(TASK_FILTERS.find((f) => f.key === r.task)?.labelKey) || r.task}
                    </span>
                  </td>
                  <td className="data" style={{ padding: "12px 16px" }}>
                    {r.frequencyHz ? `${r.frequencyHz.toFixed(2)} Hz` : "—"}
                  </td>
                  <td className="data" style={{ padding: "12px 16px" }}>
                    {r.rmsAmplitude != null ? r.rmsAmplitude.toFixed(4) : "—"}
                  </td>
                  <td className="data-sm" style={{ padding: "12px 16px", color: "var(--ink-soft)" }}>
                    {r.tapDecrementPct ? `decrement ${r.tapDecrementPct.toFixed(0)}%` : r.spiralDeviationScore != null ? `deviation ${(r.spiralDeviationScore * 100).toFixed(0)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrendBadge({ value }) {
  if (!value || Number.isNaN(value)) return null;
  const down = value < 0;
  return (
    <span className={"chip " + (down ? "chip-good" : "chip-warn")}>
      <span className="chip-shape" />
      {down ? "" : "+"}
      {value.toFixed(1)}% / wk
    </span>
  );
}

const TREND_STYLE = {
  stable: { bg: "var(--green-tint)", border: "var(--green)", icon: "steady" },
  changing: { bg: "var(--terra-tint)", border: "var(--terra)", icon: "changing" },
  "too-few": { bg: "var(--canvas-dim)", border: "var(--hair)", icon: "few" },
};

function TrendIcon({ kind }) {
  const s = 16;
  if (kind === "steady")
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="var(--green)" strokeWidth="2">
        <path d="M2 8h12" />
      </svg>
    );
  if (kind === "changing")
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="var(--terra)" strokeWidth="2">
        <path d="M2 12l5-5 3 3 4-6" />
      </svg>
    );
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="var(--ink-soft)" strokeWidth="2">
      <circle cx="8" cy="8" r="6" strokeDasharray="2 2" />
    </svg>
  );
}

function TrendIntelligenceCard({ trend, t }) {
  const style = TREND_STYLE[trend.status] || TREND_STYLE["too-few"];
  return (
    <div style={{ background: style.bg, border: `1.5px solid ${style.border}`, borderRadius: 12, padding: 18, marginBottom: 24 }}>
      <div className="row" style={{ gap: 8, marginBottom: 6 }}>
        <TrendIcon kind={style.icon} />
        <span className="mono">{t("trendIntelligence")}</span>
      </div>
      <p style={{ fontSize: 16, marginBottom: trend.streakNote || trend.changePoint ? 8 : 0 }}>{trend.headline}</p>
      {trend.changePoint && (
        <p className="data-sm" style={{ color: "var(--ink-soft)", marginBottom: 4 }}>
          {trend.changePoint}
        </p>
      )}
      {trend.streakNote && (
        <p className="data-sm" style={{ color: "var(--ink-soft)" }}>
          {trend.streakNote}
        </p>
      )}
    </div>
  );
}
