import { useEffect, useMemo, useState } from "react";
import { useAppState } from "../context/AppStateContext.jsx";
import { getSessionHistory, exportPdfReport, downloadBlob } from "../lib/storage.js";

/** PRD §10.9 — focused export flow for a print-friendly clinician PDF. */
export default function ClinicianExport() {
  const { t } = useAppState();
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("selecting"); // selecting | generating | ready
  const [blob, setBlob] = useState(null);

  useEffect(() => {
    getSessionHistory().then((r) => {
      setResults(r);
      setSelected(new Set(r.map((x) => x.sessionId)));
    });
  }, []);

  const sessionGroups = useMemo(() => {
    if (!results) return [];
    const bySession = new Map();
    for (const r of results) {
      if (!bySession.has(r.sessionId)) bySession.set(r.sessionId, []);
      bySession.get(r.sessionId).push(r);
    }
    return [...bySession.entries()].sort((a, b) => new Date(b[1][0].recordedAt) - new Date(a[1][0].recordedAt));
  }, [results]);

  function toggle(sessionId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }

  async function generate() {
    setStatus("generating");
    const pdfBlob = await exportPdfReport([...selected], note.trim() || undefined);
    setBlob(pdfBlob);
    setStatus("ready");
  }

  function download() {
    downloadBlob(blob, "neuratrack-report.pdf");
  }

  if (results === null) return <div className="wrap" style={{ paddingTop: 40 }} />;

  return (
    <div className="wrap export-page">
      <header className="app-page-header">
        <span className="eyebrow mono">Portable clinical summary</span>
        <h1>{t("clinicianExportTitle")}</h1>
        <p>{t("clinicianExportBody")}</p>
      </header>

      <div className="card stack export-session-list">
        {sessionGroups.map(([sessionId, group]) => (
          <label key={sessionId} className="checkbox-row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={selected.has(sessionId)} onChange={() => toggle(sessionId)} />
            <span>
              {new Date(group[0].recordedAt).toLocaleString()} — {group.length} task{group.length > 1 ? "s" : ""}
            </span>
          </label>
        ))}
      </div>

      <div className="field">
        <label htmlFor="note">{t("recipientNoteLabel")}</label>
        <input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("recipientNotePlaceholder")} />
      </div>

      {status !== "ready" && (
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={selected.size === 0 || status === "generating"} onClick={generate}>
          {status === "generating" ? t("generating") : t("generatePdf")}
        </button>
      )}
      {status === "ready" && (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ marginBottom: 12 }}>{t("downloadReady")}</p>
          <button className="btn btn-primary" onClick={download}>
            {t("download")}
          </button>
        </div>
      )}
    </div>
  );
}
