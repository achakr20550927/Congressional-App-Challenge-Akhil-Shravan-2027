// model.js — pure-JS inference for the trained NeuraTrack model.
//
// Loads the small logistic-regression bundle exported by
// training/train_classifier.py and runs a standardize → linear → softmax
// forward pass. No TensorFlow.js: the model is a few matrices, so a trivial
// hand-written forward pass keeps the production bundle tiny and dependency-
// free while being byte-for-byte equivalent to sklearn's predict_proba.
//
// The shipped model (neuratrack-pads-model.json) was trained on the REAL PADS
// smartwatch dataset (PhysioNet: 79 Healthy vs 319 Parkinson's/Essential-
// Tremor/Atypical patients) using only sensor-transferable frequency-domain
// features. It runs as a cross-check on the rest/postural tremor tasks. Its
// output is a signal-resemblance probability — descriptive-of-signal, never a
// diagnosis. See training/train_pads_real.py and classifier.js.

let modelPromise = null;

/** Fetch + cache the model bundle. Returns null if unavailable (caller falls back to rules). */
export function loadModel(url = "/models/neuratrack-pads-model.json") {
  if (modelPromise) return modelPromise;
  modelPromise = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return modelPromise;
}

const TASK_KEY_MAP = {
  rest: "rest_tremor",
  postural: "postural_tremor",
  tap: "finger_tapping",
  pronation: "pronation_supination",
  spiral: "spiral_drawing",
};

/**
 * Assembles the feature vector in the exact order the model was trained on
 * (numeric features first, then the task one-hot), from an app TaskResult
 * plus the extra runtime signals the app computes.
 */
function assembleFeatures(model, { result, peakProminence, quality }) {
  const taskKey = TASK_KEY_MAP[result.task] || "rest_tremor";
  const numeric = {
    dominant_frequency_hz: result.frequencyHz ?? 0,
    spectral_concentration: peakProminence ?? 0,
    tremor_band_power_ratio: result.tremorBandPowerRatio ?? 0,
    amplitude_pct_hand_width: result.amplitudePctHand ?? 0,
    tap_rate_hz: result.tapRateHz ?? 0,
    tap_decrement_pct: result.tapDecrementPct ?? 0,
    spiral_rmse_norm: result.spiralDeviationScore ?? 0,
    left_right_asymmetry_pct: result.asymmetryIndex != null ? result.asymmetryIndex * 100 : 0,
    quality_score: quality ? quality.qualityScore ?? (quality.qualityOk ? 0.9 : 0.5) : 0.9,
    visibility_pct: quality ? (quality.coverage ?? 1) * 100 : 100,
  };
  // The PADS model's task one-hot uses the app's short task names (rest/postural).
  const taskToken = model.tasks.includes(result.task) ? result.task : taskKey;
  const vec = model.numericFeatures.map((k) => numeric[k] ?? 0);
  for (const t of model.tasks) vec.push(t === taskToken ? 1 : 0);
  return vec;
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((v) => v / sum);
}

/**
 * Runs one sub-model (e.g. "signal_label" or "safety_rating").
 * @returns {{label:string, confidence:number, probs:Object, contributions:Array}}
 */
export function runModel(model, subModelName, ctx) {
  const sub = model.models[subModelName];
  const feats = assembleFeatures(sub, ctx);

  // Standardize with the stored train-set mean/std.
  const z = feats.map((v, i) => (v - sub.mean[i]) / sub.std[i]);

  // Linear: logits[c] = intercept[c] + sum_i coef[c][i] * z[i]
  const logits = sub.coef.map((row, c) => row.reduce((acc, w, i) => acc + w * z[i], sub.intercept[c]));
  const probs = softmax(logits);

  let bestIdx = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[bestIdx]) bestIdx = i;
  const label = sub.labels[bestIdx];

  // Per-feature contribution to the winning class = coef[best][i] * z[i].
  // Positive contributions are what pushed the prediction toward this label —
  // an honest, model-derived importance signal (unlike a hand-assigned one).
  const contributions = sub.featureNames
    .map((name, i) => ({ feature: name, contribution: sub.coef[bestIdx][i] * z[i] }))
    .filter((c) => c.contribution > 0.05)
    .sort((a, b) => b.contribution - a.contribution);

  const probMap = {};
  sub.labels.forEach((l, i) => (probMap[l] = Number(probs[i].toFixed(3))));

  return { label, confidence: Number(probs[bestIdx].toFixed(2)), probs: probMap, contributions };
}
