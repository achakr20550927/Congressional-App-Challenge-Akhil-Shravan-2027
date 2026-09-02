// classifier.js — on-device pattern-recognition module (PRD §9.3, §9.5).
//
// HONESTY NOTE (read before changing labels or wording): NeuraTrack's product
// pillar is "clinically grounded, not clinically overclaiming." This module
// never outputs a disease name or a diagnosis — only a descriptive label for
// the *signal itself* (e.g. "rest-dominant, 4-6 Hz band"), plus a confidence
// score and a feature-importance breakdown, exactly like the PRD specifies.
//
// TWO-LAYER DESIGN: when a trained model is available (see model.js), it
// decides the coarse signal class + safety rating + confidence. The
// literature-informed rule engine below always runs too, and produces the
// precise task-specific descriptive label that drives the detailed
// explanation copy (interpretation.js). If the model file fails to load, the
// rule engine's own class is used — so the app degrades gracefully offline
// or if the model is ever removed.
//
// The shipped cross-check model is trained on real PADS participant recordings
// and is evaluated with subject-separated group validation. It remains a
// signal-resemblance model—not a diagnostic model—and can be retrained with
// the reproducible PADS pipeline in training/train_pads_real.py.
import { loadModel, runModel } from "./model.js";

export const FEATURE_ORDER = [
  "frequency",
  "rmsAmplitude",
  "tapRateHz",
  "tapDecrementPct",
  "spiralDeviationScore",
  "asymmetryIndex",
];

// Below this energy-concentration ratio (0-1 scale, see signal.js's
// analyzeTremor peakProminence), the "dominant frequency" is not
// distinguishable from a flat/noisy spectrum. Pure noise typically lands
// well under 0.12; a genuine oscillation typically lands at 0.2+.
const PROMINENCE_THRESHOLD = 0.14;
// A concentration at or above this level counts as a maximally "clear" peak
// for confidence-scaling purposes — used to normalize prominence into 0-1.
const PROMINENCE_CLEAR = 0.35;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Normalizes an energy-concentration ratio into a 0-1 "how clear is this peak" score. */
function prominenceScore(prominence) {
  return clamp(prominence / PROMINENCE_CLEAR, 0, 1);
}

/**
 * Produces a fixed-order numeric vector plus a presence mask so a model
 * knows which entries are real vs. zero-filled for the current task.
 * @param {object} result - a TaskResult-shaped object
 */
export function extractFeatureVector(result) {
  const raw = {
    frequency: result.frequencyHz ?? 0,
    rmsAmplitude: result.rmsAmplitude ?? 0,
    tapRateHz: result.tapRateHz ?? 0,
    tapDecrementPct: result.tapDecrementPct ?? 0,
    spiralDeviationScore: result.spiralDeviationScore ?? 0,
    asymmetryIndex: result.asymmetryIndex ?? 0,
  };
  const vector = FEATURE_ORDER.map((k) => raw[k]);
  const mask = FEATURE_ORDER.map((k) => (result[keyToResultField(k)] != null ? 1 : 0));
  return { vector, mask, order: FEATURE_ORDER };
}

function keyToResultField(k) {
  return (
    {
      frequency: "frequencyHz",
      rmsAmplitude: "rmsAmplitude",
      tapRateHz: "tapRateHz",
      tapDecrementPct: "tapDecrementPct",
      spiralDeviationScore: "spiralDeviationScore",
      asymmetryIndex: "asymmetryIndex",
    }[k] || k
  );
}

/**
 * Loads the trained model bundle (model.js). Returns a classifier handle
 * carrying either the loaded model or null; classifyPattern uses the model
 * when present and falls back to the rule engine otherwise.
 */
export async function loadClassifier(modelUrl = "/models/neuratrack-pads-model.json") {
  const model = await loadModel(modelUrl).catch(() => null);
  return { kind: model ? "pads-real-v2" : "heuristic-v2", model, order: FEATURE_ORDER };
}

// Maps the model's coarse signal class + task to the precise descriptive
// label the interpretation copy is keyed on.
const MODEL_LABEL_MAP = {
  rest: {
    steady: "no-significant-rest-tremor",
    tremor_like: "rest-dominant-4-6hz",
    bradykinesia_like: "rest-oscillation-atypical-band",
    irregular_motion: "rest-oscillation-atypical-band",
  },
  postural: {
    steady: "no-significant-postural-tremor",
    tremor_like: "postural-dominant-6-12hz",
    bradykinesia_like: "postural-oscillation-atypical-band",
    irregular_motion: "postural-oscillation-atypical-band",
  },
  tap: {
    steady: "tap-rhythm-regular",
    bradykinesia_like: "tap-amplitude-decrement",
    irregular_motion: "tap-rate-reduced",
    tremor_like: "tap-rate-reduced",
    poor_quality: "tap-insufficient-data",
  },
  pronation: {
    steady: "rotation-rhythm-regular",
    bradykinesia_like: "slow-rotation-pace",
    irregular_motion: "no-consistent-rotation-rhythm",
    tremor_like: "rotation-rhythm-regular",
  },
  spiral: {
    steady: "fine-motor-path-controlled",
    irregular_motion: "fine-motor-notable-deviation",
    bradykinesia_like: "fine-motor-mild-deviation",
    tremor_like: "fine-motor-mild-deviation",
  },
};

const MODEL_SAFETY_MAP = {
  steady: "steady",
  keep_an_eye: "watch",
  worth_conversation: "discuss",
  try_again: "retry",
};

// Reassuring/steady-class descriptive labels (kept in sync with
// interpretation.js STEADY_LABELS) — used only to check model-vs-rule agreement.
const REASSURING_LABELS = new Set([
  "no-significant-rest-tremor",
  "no-significant-postural-tremor",
  "slow-movement-not-tremor",
  "tap-rhythm-regular",
  "rotation-rhythm-regular",
  "slow-rotation-pace",
  "fine-motor-path-controlled",
]);

const FEATURE_NAME_TO_KEY = {
  dominant_frequency_hz: "frequency",
  amplitude_pct_hand_width: "rmsAmplitude",
  tap_rate_hz: "tapRateHz",
  tap_decrement_pct: "tapDecrementPct",
  spiral_rmse_norm: "spiralDeviationScore",
  left_right_asymmetry_pct: "asymmetryIndex",
  spectral_concentration: "frequency",
};

/**
 * Runs the REAL PADS-trained tremor model as a cross-check. It only covers the
 * rest/postural tremor tasks it was trained on (tasksCovered), and returns the
 * probability that this recording resembles clinically-noted tremor recordings.
 * Returns null when no model is loaded or the task isn't covered (caller then
 * shows no cross-check).
 */
function classifyWithModel(clf, context) {
  const model = clf?.model;
  if (!model) return null;
  const { task = "rest", peakProminence = 0, result, quality } = context;
  if (!model.tasksCovered?.includes(task)) return null;

  const ctx = { result: { ...result, task }, peakProminence, quality };
  const out = runModel(model, "tremor_reference", ctx);
  return {
    modelSignal: out.label, // 'steady' | 'tremor_like'
    pTremor: out.probs.tremor_like ?? 0,
    confidence: out.confidence,
    contributions: out.contributions,
    version: model.version,
    metrics: model.metrics || null,
  };
}

function classifyRestOrPostural(task, f, prominence) {
  const isRest = task === "rest";
  const [bandLo, bandHi] = isRest ? [4, 6] : [6, 12];
  const bandCenter = (bandLo + bandHi) / 2;
  const noneLabel = isRest ? "no-significant-rest-tremor" : "no-significant-postural-tremor";

  if (prominence < PROMINENCE_THRESHOLD || f.frequency <= 0) {
    const clarity = 1 - clamp(prominence / PROMINENCE_THRESHOLD, 0, 1); // how far below threshold
    return {
      label: noneLabel,
      confidence: clamp(0.55 + clarity * 0.35, 0.45, 0.92),
      rationale: `No spectral peak stood out clearly from background movement (${(prominence * 100).toFixed(0)}% energy concentration, vs. a ${(PROMINENCE_THRESHOLD * 100).toFixed(0)}% threshold for a genuine peak) — this usually means no strong rhythmic oscillation was present during this recording.`,
      drivers: ["frequency"],
    };
  }

  const promScore = prominenceScore(prominence);

  // Rhythms below ~3.5 Hz are slower than the tremor rhythms discussed in
  // the literature — a prominent sub-3.5 Hz "peak" almost always reflects
  // ordinary slow repositioning or drift, not tremor. Without this branch,
  // users doing everything right got a confusing "atypical band" message
  // for what is simply a normally-moving hand.
  if (f.frequency < 3.5) {
    return {
      label: "slow-movement-not-tremor",
      confidence: clamp(0.55 + 0.15 * promScore, 0.5, 0.8),
      rationale: `The dominant movement (${f.frequency.toFixed(1)} Hz) is below the ~3.5 Hz floor of typical tremor rhythms — consistent with slow repositioning or drift rather than tremor.`,
      drivers: ["frequency"],
    };
  }

  if (f.frequency >= bandLo && f.frequency <= bandHi) {
    const closeness = 1 - Math.min(1, Math.abs(f.frequency - bandCenter) / (bandHi - bandLo));
    return {
      label: isRest ? "rest-dominant-4-6hz" : "postural-dominant-6-12hz",
      confidence: clamp(0.55 + 0.25 * closeness + 0.1 * promScore, 0.5, 0.95),
      rationale: `A consistent oscillation at ${f.frequency.toFixed(1)} Hz concentrated ${(prominence * 100).toFixed(0)}% of this recording's in-band spectral energy, within the ${bandLo}-${bandHi} Hz band commonly discussed for ${isRest ? "rest" : "postural"} tremor.`,
      drivers: ["frequency", "rmsAmplitude"],
    };
  }

  if (!isRest && f.frequency >= 4 && f.frequency <= 6) {
    return {
      label: "rest-band-pattern-during-posture",
      confidence: clamp(0.5 + 0.1 * promScore, 0.45, 0.85),
      rationale: `The oscillation detected while the arm was held extended (${f.frequency.toFixed(1)} Hz) fell in the band more commonly discussed for tremor at rest, not the postural band.`,
      drivers: ["frequency"],
    };
  }

  return {
    label: isRest ? "rest-oscillation-atypical-band" : "postural-oscillation-atypical-band",
    confidence: clamp(0.45 + 0.1 * promScore, 0.4, 0.75),
    rationale: `A ${f.frequency.toFixed(1)} Hz oscillation was detected, outside the band most commonly discussed for this task.`,
    drivers: ["frequency"],
  };
}

function classifyTap(f) {
  if (!f.tapRateHz || f.tapRateHz <= 0) {
    return {
      label: "tap-insufficient-data",
      confidence: 0.5,
      rationale: "Not enough distinct taps were detected to assess rhythm or amplitude decrement.",
      drivers: [],
    };
  }
  if (f.tapDecrementPct >= 25) {
    return {
      label: "tap-amplitude-decrement",
      confidence: clamp(0.5 + f.tapDecrementPct / 100, 0.5, 0.95),
      rationale: `Tap amplitude fell by about ${f.tapDecrementPct.toFixed(0)}% from the first half of the recording to the second half.`,
      drivers: ["tapDecrementPct"],
    };
  }
  if (f.tapRateHz < 2.5) {
    return {
      label: "tap-rate-reduced",
      confidence: clamp(0.5 + (2.5 - f.tapRateHz) * 0.2, 0.45, 0.85),
      rationale: `Tap rate averaged about ${f.tapRateHz.toFixed(1)} taps/sec, slower than a typical brisk tapping pace, without a strong amplitude decrement.`,
      drivers: ["tapRateHz"],
    };
  }
  return {
    label: "tap-rhythm-regular",
    confidence: clamp(0.6 + Math.min(1, f.tapRateHz / 5) * 0.2, 0.55, 0.9),
    rationale: `Tap rate stayed steady at about ${f.tapRateHz.toFixed(1)} taps/sec with no notable amplitude decrement across the recording.`,
    drivers: ["tapRateHz", "tapDecrementPct"],
  };
}

function classifyPronation(f, prominence) {
  if (prominence < PROMINENCE_THRESHOLD || f.frequency <= 0) {
    const clarity = 1 - clamp(prominence / PROMINENCE_THRESHOLD, 0, 1);
    return {
      label: "no-consistent-rotation-rhythm",
      confidence: clamp(0.5 + clarity * 0.3, 0.45, 0.85),
      rationale: "No clearly repeating rotation rhythm stood out from the movement — rotations may have been irregular in pace.",
      drivers: ["frequency"],
    };
  }
  const promScore = prominenceScore(prominence);
  if (f.frequency < 1.2) {
    return {
      label: "slow-rotation-pace",
      confidence: clamp(0.5 + 0.1 * promScore, 0.45, 0.8),
      rationale: `A consistent but slow rotation rhythm was detected at about ${f.frequency.toFixed(1)} Hz.`,
      drivers: ["frequency"],
    };
  }
  return {
    label: "rotation-rhythm-regular",
    confidence: clamp(0.55 + 0.2 * promScore, 0.5, 0.9),
    rationale: `A consistent palm-up/palm-down rotation rhythm was detected at about ${f.frequency.toFixed(1)} Hz.`,
    drivers: ["frequency"],
  };
}

function classifySpiral(f) {
  const s = f.spiralDeviationScore;
  if (s <= 0.15) {
    return {
      label: "fine-motor-path-controlled",
      confidence: clamp(0.6 + (0.15 - s) * 2, 0.55, 0.95),
      rationale: `The traced path stayed close to the guide (deviation score ${(s * 100).toFixed(0)}%).`,
      drivers: ["spiralDeviationScore"],
    };
  }
  if (s <= 0.4) {
    return {
      label: "fine-motor-mild-deviation",
      confidence: clamp(0.5 + s * 0.5, 0.5, 0.8),
      rationale: `The traced path drifted noticeably from the guide (deviation score ${(s * 100).toFixed(0)}%).`,
      drivers: ["spiralDeviationScore"],
    };
  }
  return {
    label: "fine-motor-notable-deviation",
    confidence: clamp(0.5 + s * 0.4, 0.55, 0.9),
    rationale: `The traced path deviated substantially from the guide (deviation score ${(s * 100).toFixed(0)}%).`,
    drivers: ["spiralDeviationScore"],
  };
}

/**
 * Runs pattern classification and returns a descriptive-of-signal label —
 * never a disease name — plus a 0-1 confidence and a per-feature importance
 * breakdown. Uses the trained model when loaded (context.result required),
 * otherwise the literature-informed rule engine.
 * @param {object} clf - from loadClassifier()
 * @param {number[]} featureVector - in FEATURE_ORDER
 * @param {{task?: string, peakProminence?: number, result?: object, quality?: object}} [context]
 */
export function classifyPattern(clf, featureVector, context = {}) {
  // ARCHITECTURE (why rules are primary, not the trained model):
  // The cross-check model is trained on the real PADS movement dataset, but
  // PADS uses different sensors and does not provide labels for this webcam
  // capture protocol. The task-specific, webcam-scale rules therefore remain
  // primary; the model is shown separately in clinician mode. A prospective,
  // consented and clinician-labeled webcam dataset is required before ML can
  // safely become the primary decision path.
  const order = clf?.order || FEATURE_ORDER;
  const f = {};
  order.forEach((k, i) => (f[k] = featureVector[i] ?? 0));
  const task = context.task || "rest";
  const prominence = context.peakProminence || 0;

  let result;
  switch (task) {
    case "rest":
    case "postural":
      result = classifyRestOrPostural(task, f, prominence);
      break;
    case "tap":
      result = classifyTap(f);
      break;
    case "pronation":
      result = classifyPronation(f, prominence);
      break;
    case "spiral":
      result = classifySpiral(f);
      break;
    default:
      result = { label: "within-typical-range", confidence: 0.5, rationale: "", drivers: [] };
  }

  const featureImportance = FEATURE_ORDER.map((key) => ({
    feature: key,
    importance: result.drivers.includes(key) ? Number((1 / result.drivers.length).toFixed(2)) : 0,
  }));

  // Run the REAL PADS-trained model as a secondary cross-check (never
  // overrides the finding). Records whether it agrees with the rule engine's
  // steady-vs-not call, which the clinician view surfaces.
  let modelCrossCheck = null;
  if (clf?.model && context.result) {
    const m = classifyWithModel(clf, context);
    if (m) {
      const ruleReassuring = REASSURING_LABELS.has(result.label);
      const modelReassuring = m.modelSignal === "steady";
      modelCrossCheck = {
        signalLabel: m.modelSignal,
        pTremor: Number(m.pTremor.toFixed(2)),
        confidence: m.confidence,
        agrees: ruleReassuring === modelReassuring,
        version: m.version,
        metrics: m.metrics,
        contributions: m.contributions,
      };
    }
  }

  return {
    patternLabel: result.label,
    confidence: Number(result.confidence.toFixed(2)),
    rationale: result.rationale,
    featureImportance,
    source: "rule-engine",
    modelCrossCheck,
    allScores: [{ label: result.label, confidence: Number(result.confidence.toFixed(2)) }],
  };
}
