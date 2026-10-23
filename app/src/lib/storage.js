// storage.js — local persistence & export module (PRD §9.4, §8).
//
// Session/TaskResult data (the part that needs querying, trending, and
// export) lives in IndexedDB. Small config values (profile, calibration,
// language, consent) live in localStorage via AppStateContext — a pragmatic
// split of the same "everything stays on this device" data model. Raw
// JointFrame data is never persisted here; it exists only in memory during a
// recording (PRD §8).
import { openDB } from "idb";

const DB_NAME = "neuratrack";
const DB_VERSION = 1;

function dbPromise() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("sessions")) {
        const store = db.createObjectStore("sessions", { keyPath: "id" });
        store.createIndex("startedAt", "startedAt");
      }
      if (!db.objectStoreNames.contains("results")) {
        const store = db.createObjectStore("results", { keyPath: "id" });
        store.createIndex("sessionId", "sessionId");
        store.createIndex("task", "task");
        store.createIndex("recordedAt", "recordedAt");
      }
    },
  });
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** @returns {string} a fresh Session id, for callers that need one before saving. */
export function newId() {
  return uuid();
}

/**
 * Writes a completed session (with its TaskResults) to IndexedDB.
 * @param {{id?:string, startedAt?:string, results: object[]}} session
 */
export async function saveSession(session) {
  const db = await dbPromise();
  const id = session.id || uuid();
  const startedAt = session.startedAt || new Date().toISOString();
  const tx = db.transaction(["sessions", "results"], "readwrite");
  await tx.objectStore("sessions").put({ id, startedAt });
  for (const result of session.results || []) {
    const record = { ...result, id: result.id || uuid(), sessionId: id };
    await tx.objectStore("results").put(record);
  }
  await tx.done;
  return id;
}

/** Writes a single TaskResult, creating its parent session record if needed. */
export async function saveTaskResult(result, sessionId) {
  const db = await dbPromise();
  const sid = sessionId || uuid();
  const tx = db.transaction(["sessions", "results"], "readwrite");
  const existing = await tx.objectStore("sessions").get(sid);
  if (!existing) {
    await tx.objectStore("sessions").put({ id: sid, startedAt: new Date().toISOString() });
  }
  const record = { ...result, id: result.id || uuid(), sessionId: sid };
  await tx.objectStore("results").put(record);
  await tx.done;
  return record;
}

export async function getResult(id) {
  const db = await dbPromise();
  return db.get('results', id);
}

export async function updateResultNotes(id, notes) {
  if (typeof notes !== 'string' || notes.length > 2000) throw new Error('Notes must be at most 2,000 characters.');
  const db = await dbPromise();
  const tx = db.transaction('results', 'readwrite');
  const record = await tx.store.get(id);
  if (!record) throw new Error('Recording not found.');
  await tx.store.put({...record, notes});
  await tx.done;
}

/**
 * Queries local history, optionally filtered by task type and date range.
 * @param {string} [_userId] - reserved for a future multi-profile Phase 2; single local profile today.
 * @param {string} [task]
 * @param {number} [rangeDays]
 */
export async function getSessionHistory(_userId, task, rangeDays) {
  const db = await dbPromise();
  let results = await db.getAll("results");
  if (task && task !== "all") results = results.filter((r) => r.task === task);
  if (rangeDays) {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    results = results.filter((r) => new Date(r.recordedAt).getTime() >= cutoff);
  }
  return results.sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
}

function linearRegressionSlope(points) {
  // points: [{x: msSinceEpoch, y: value}] -> slope in y-units per week
  const n = points.length;
  if (n < 2) return 0;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slopePerMs = den === 0 ? 0 : num / den;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return slopePerMs * msPerWeek;
}

/**
 * Fits a simple linear regression to frequency and amplitude over time;
 * returns a rate-of-change-per-week figure used on the Trends screen.
 * @param {object[]} taskResults
 */
export function computeHistoryTrend(taskResults) {
  const freqPoints = taskResults
    .filter((r) => r.frequencyHz != null && r.frequencyHz > 0)
    .map((r) => ({ x: new Date(r.recordedAt).getTime(), y: r.frequencyHz }));
  const ampPoints = taskResults
    .filter((r) => r.rmsAmplitude != null)
    .map((r) => ({ x: new Date(r.recordedAt).getTime(), y: r.rmsAmplitude }));

  const frequencySlopePerWeek = linearRegressionSlope(freqPoints);
  const amplitudeSlopePerWeek = linearRegressionSlope(ampPoints);
  const baselineFreq = freqPoints[0]?.y || 0;
  const baselineAmp = ampPoints[0]?.y || 0;

  return {
    frequencySlopePerWeek,
    amplitudeSlopePerWeek,
    frequencyPctPerWeek: baselineFreq ? (frequencySlopePerWeek / baselineFreq) * 100 : 0,
    amplitudePctPerWeek: baselineAmp ? (amplitudeSlopePerWeek / baselineAmp) * 100 : 0,
    sampleCount: taskResults.length,
  };
}

const TASK_LABELS = {
  rest: "Rest Tremor",
  postural: "Postural Tremor",
  tap: "Finger Tap",
  pronation: "Pronation-Supination",
  spiral: "Spiral Drawing",
};

function csvEscape(v) {
  let s = String(v ?? "");
  if (typeof v === 'string' && /^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Serializes selected sessions/results to a flat CSV for spreadsheet use.
 * @param {string[]} [resultIds] - if omitted, exports full history.
 */
export async function exportCsv(resultIds) {
  const db = await dbPromise();
  let results = await db.getAll("results");
  if (resultIds) {
    const idSet = new Set(resultIds);
    results = results.filter((r) => idSet.has(r.id));
  }
  results.sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

  const headers = [
    "recordedAt",
    "task",
    "frequencyHz",
    "rmsAmplitude",
    "tapRateHz",
    "tapDecrementPct",
    "tapCount", "meanDeviationPctRadius", "spiralTurns",
    "spiralDeviationScore",
    "asymmetryIndex",
    "patternLabel",
    "qualityOk", "protocolVersion", "hand", "inputType", "units", "notes",
  ];
  const lines = [headers.join(",")];
  for (const r of results) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}

/**
 * Renders a print-friendly, single-page-per-session summary (charts + table)
 * to PDF entirely client-side. No raw video or images are ever included.
 * @param {string[]} [sessionIds] - if omitted, includes all sessions.
 * @param {string} [recipientNote]
 */
export async function exportPdfReport(sessionIds, recipientNote) {
  const results = await getSessionHistory();
  const selected = sessionIds ? new Set(sessionIds) : null;
  const { createReport } = await import('./report.js');
  return createReport(results.filter(r => !selected || selected.has(r.sessionId)).reverse(), recipientNote);
}

/** Triggers a browser download for a Blob without any server round-trip. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Clears all local session/result data. Called from Settings' destructive "Clear all local data". */
export async function clearAllLocalData() {
  const db = await dbPromise();
  const tx = db.transaction(['sessions', 'results'], 'readwrite');
  await Promise.all([tx.objectStore('sessions').clear(), tx.objectStore('results').clear()]);
  await tx.done;
}
