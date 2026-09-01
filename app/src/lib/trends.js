// trends.js — longitudinal "trend intelligence" over a person's own history.
//
// Turns a list of same-task TaskResults into a plain-language read on whether
// a metric is holding steady, drifting, or improving — and, critically, only
// calls a change "real" when it is large relative to that person's own
// session-to-session variability. A single noisy reading never triggers an
// alarming trend. Everything here is descriptive of the person's own numbers
// over time; it is never a diagnosis.

function mean(a) {
  return a.reduce((s, v) => s + v, 0) / a.length;
}
function std(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}

// Ordinary least squares slope of y over x (x in ms). Returns slope per week.
function slopePerWeek(points) {
  const n = points.length;
  if (n < 2) return 0;
  const mx = mean(points.map((p) => p.x));
  const my = mean(points.map((p) => p.y));
  let num = 0, den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  const perMs = den === 0 ? 0 : num / den;
  return perMs * (7 * 24 * 60 * 60 * 1000);
}

// Per-task: which metric defines "the trend", how to read it, and whether a
// rise is the concerning direction.
const METRIC = {
  rest: { field: "frequencyHz", unit: "Hz", digits: 1, valid: (v) => v > 0, label: { en: "rest-tremor frequency", es: "frecuencia del temblor en reposo" } },
  postural: { field: "frequencyHz", unit: "Hz", digits: 1, valid: (v) => v > 0, label: { en: "postural-tremor frequency", es: "frecuencia del temblor postural" } },
  pronation: { field: "frequencyHz", unit: "Hz", digits: 1, valid: (v) => v > 0, label: { en: "rotation rate", es: "ritmo de rotación" } },
  tap: { field: "tapDecrementPct", unit: "%", digits: 0, valid: (v) => v != null, higherIsWorse: true, label: { en: "tapping amplitude decrement", es: "disminución de amplitud del golpeteo" } },
  spiral: { field: "spiralDeviationScore", unit: "%", scale: 100, digits: 0, valid: (v) => v != null, higherIsWorse: true, label: { en: "spiral path deviation", es: "desviación del trazo en espiral" } },
};

const COPY = {
  en: {
    stable: (m) => `Your ${m} has held steady across these sessions — the natural session-to-session wobble, nothing more.`,
    changing: (m, dir, pct) => `Your ${m} has been trending ${dir} — about ${pct}% per week, which is larger than your usual session-to-session variation. A real trend, not noise. Keep tracking, and mention a sustained change to a clinician.`,
    tooFew: (n) => `Only ${n} session${n === 1 ? "" : "s"} so far — a couple more and NeuraTrack can tell a real trend from normal day-to-day variation.`,
    up: "upward",
    down: "downward",
    streak: (n) => `${n}-session tracking streak — consistency is exactly what makes these trends trustworthy.`,
    changePoint: (when) => `A noticeable shift started around ${when}. Worth noting when it began.`,
  },
  es: {
    stable: (m) => `Tu ${m} se ha mantenido estable en estas sesiones — la variación natural entre sesiones, nada más.`,
    changing: (m, dir, pct) => `Tu ${m} ha ido en tendencia ${dir} — cerca de ${pct}% por semana, mayor que tu variación habitual entre sesiones. Una tendencia real, no ruido. Sigue registrando y menciona un cambio sostenido a un profesional médico.`,
    tooFew: (n) => `Solo ${n} sesión${n === 1 ? "" : "es"} hasta ahora — con un par más, NeuraTrack podrá distinguir una tendencia real de la variación diaria normal.`,
    up: "ascendente",
    down: "descendente",
    streak: (n) => `Racha de ${n} sesiones de seguimiento — la constancia es justo lo que hace confiables estas tendencias.`,
    changePoint: (when) => `Un cambio notable comenzó alrededor de ${when}. Vale la pena anotar cuándo empezó.`,
  },
};

/**
 * @param {string} task
 * @param {object[]} history - TaskResults for this task, any order
 * @param {'en'|'es'} language
 * @returns {null | {status, headline, streak, changePoint}}
 */
export function analyzeTaskTrend(task, history, language = "en") {
  const spec = METRIC[task];
  const copy = COPY[language] || COPY.en;
  if (!spec || !history) return null;

  const series = history
    .filter((r) => spec.valid(r[spec.field]))
    .map((r) => ({ x: new Date(r.recordedAt).getTime(), y: r[spec.field] * (spec.scale || 1) }))
    .sort((a, b) => a.x - b.x);

  if (series.length < 3) {
    return { status: "too-few", headline: copy.tooFew(series.length), streak: series.length, changePoint: null };
  }

  const ys = series.map((p) => p.y);
  const baseline = mean(ys);
  const variability = std(ys);
  const slopeWk = slopePerWeek(series);
  const pctPerWeek = baseline !== 0 ? (slopeWk / baseline) * 100 : 0;

  // A trend is "real" only if the total modeled change across the observed
  // span exceeds ~1 standard deviation of this person's own readings — i.e.
  // it stands out from their normal wobble.
  const spanWeeks = (series[series.length - 1].x - series[0].x) / (7 * 24 * 60 * 60 * 1000) || 1;
  const modeledChange = Math.abs(slopeWk * spanWeeks);
  const isReal = variability > 0 && modeledChange > variability;

  const label = spec.label[language] || spec.label.en;
  let status = "stable";
  let headline = copy.stable(label);
  if (isReal) {
    status = "changing";
    const dir = slopeWk >= 0 ? copy.up : copy.down;
    headline = copy.changing(label, dir, Math.abs(pctPerWeek).toFixed(0));
  }

  // Change-point: the point where consecutive-session jump is largest, if it
  // dominates the rest of the jumps.
  let changePoint = null;
  if (series.length >= 4) {
    let maxJump = 0, idx = -1;
    for (let i = 1; i < series.length; i++) {
      const j = Math.abs(series[i].y - series[i - 1].y);
      if (j > maxJump) {
        maxJump = j;
        idx = i;
      }
    }
    if (idx > 0 && maxJump > variability * 1.5) {
      const when = new Date(series[idx].x).toLocaleDateString(language === "es" ? "es" : "en");
      changePoint = copy.changePoint(when);
    }
  }

  return {
    status,
    headline,
    streak: series.length,
    streakNote: series.length >= 3 ? copy.streak(series.length) : null,
    changePoint,
    pctPerWeek,
    baseline,
    unit: spec.unit,
  };
}
