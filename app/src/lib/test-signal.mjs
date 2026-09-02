// Plain-Node unit tests for signal.js — no test framework dependency, per
// PRD §13.1's pattern: synthetic input with a known correct answer, asserted
// with zero dependencies. Run with: node src/lib/test-signal.mjs
import {
  analyzeTremor,
  analyzeTapDecrement,
  resampleToUniformGrid,
  analyzeSpiralDeviation,
  computeAsymmetryIndex,
  generateIdealSpiral,
} from "./signal.js";
import { readFileSync } from "node:fs";
import { runModel } from "./model.js";

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error("FAIL:", msg);
  }
}

function approx(a, b, eps) {
  return Math.abs(a - b) <= eps;
}

// --- analyzeTremor: synthetic 5 Hz sine wave ---
{
  const fs = 60;
  const durationSec = 4;
  const n = fs * durationSec;
  const samples = Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 5 * i) / fs));
  const { frequency, rmsAmplitude } = analyzeTremor(samples, fs, 2, 15);
  assert(approx(frequency, 5, 0.3), `5Hz sine: expected ~5Hz, got ${frequency}`);
  assert(rmsAmplitude > 0.5, `5Hz sine: expected non-trivial RMS amplitude, got ${rmsAmplitude}`);
}

// --- analyzeTremor: simulated Parkinsonian-style rest tremor (~4.5 Hz + noise) ---
{
  const fs = 60;
  const n = fs * 3;
  const samples = Array.from(
    { length: n },
    (_, i) => 0.02 * Math.sin((2 * Math.PI * 4.5 * i) / fs) + (Math.random() - 0.5) * 0.002
  );
  const { frequency } = analyzeTremor(samples, fs, 2, 15);
  assert(approx(frequency, 4.5, 0.3), `rest tremor: expected ~4.5Hz, got ${frequency}`);
}

// --- analyzeTremor: off-bin rhythm remains accurate despite linear camera drift ---
{
  const fs = 30;
  const target = 4.73;
  const n = fs * 10;
  const samples = Array.from({ length: n }, (_, i) =>
    0.03 * Math.sin((2 * Math.PI * target * i) / fs) + i * 0.0002
  );
  const { frequency } = analyzeTremor(samples, fs, 2, 15);
  assert(approx(frequency, target, 0.12), `off-bin drift: expected ~${target}Hz, got ${frequency}`);
}

// --- analyzeTremor: still hand, near-zero amplitude ---
{
  const fs = 60;
  const n = fs * 2;
  const samples = Array.from({ length: n }, () => 0.0001 * (Math.random() - 0.5));
  const { rmsAmplitude } = analyzeTremor(samples, fs, 2, 15);
  assert(rmsAmplitude < 0.001, `still hand: expected near-zero RMS, got ${rmsAmplitude}`);
}

// --- analyzeTremor: peakProminence (energy concentration) separates a real
// oscillation from noise, and is robust against noise's own random spikes ---
{
  const fs = 30;
  const n = fs * 10; // matches the app's real 10s-at-30Hz recording shape
  const clean = Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 5 * i) / fs));
  const { peakProminence: cleanProminence } = analyzeTremor(clean, fs, 2, 15);
  assert(cleanProminence > 0.2, `clean 5Hz sine: expected concentrated energy (>0.2), got ${cleanProminence}`);

  // Run several independent noise trials — a peak-to-mean metric would
  // occasionally misfire here due to extreme-value statistics; energy
  // concentration should stay low every time.
  for (let trial = 0; trial < 8; trial++) {
    const noise = Array.from({ length: n }, () => Math.random() - 0.5);
    const { peakProminence: noiseProminence } = analyzeTremor(noise, fs, 2, 15);
    assert(noiseProminence < 0.12, `white noise trial ${trial}: expected low energy concentration (<0.12), got ${noiseProminence}`);
    assert(noiseProminence < cleanProminence, `white noise trial ${trial}: expected flatter spectrum than the clean sine, got ${noiseProminence} vs ${cleanProminence}`);
  }
}

// --- analyzeTapDecrement: synthetic tap sequence with known decrement ---
{
  const fs = 60;
  const tapHz = 3;
  const n = fs * 4;
  const samples = Array.from({ length: n }, (_, i) => {
    const decay = 1 - (i / n) * 0.5; // amplitude shrinks 50% across the recording
    const phase = (2 * Math.PI * tapHz * i) / fs;
    return 0.5 + 0.4 * decay * Math.sin(phase);
  });
  const { tapCount, tapRateHz, amplitudeDecrementPct } = analyzeTapDecrement(samples, fs);
  assert(tapCount >= 8, `tap decrement: expected several taps, got ${tapCount}`);
  assert(approx(tapRateHz, tapHz, 1), `tap decrement: expected ~${tapHz}Hz tap rate, got ${tapRateHz}`);
  assert(amplitudeDecrementPct > 20, `tap decrement: expected >20% decrement, got ${amplitudeDecrementPct}`);
}

// --- resampleToUniformGrid: jittered timestamps resample to a clean uniform sine ---
{
  const trueHz = 5;
  const jittered = [];
  let t = 0;
  for (let i = 0; i < 200; i++) {
    t += 1000 / 60 + (Math.random() - 0.5) * 4; // +-2ms jitter around 60fps
    jittered.push({ t, value: Math.sin((2 * Math.PI * trueHz * t) / 1000) });
  }
  const resampled = resampleToUniformGrid(jittered, 60);
  assert(resampled.length > 100, `resample: expected a full-length series, got ${resampled.length}`);
  const { frequency } = analyzeTremor(resampled, 60, 2, 15);
  assert(approx(frequency, trueHz, 0.3), `resample: expected ~${trueHz}Hz after resampling, got ${frequency}`);
}

// --- analyzeSpiralDeviation: a perfect trace of the ideal spiral has ~0 deviation ---
{
  const ideal = generateIdealSpiral({ turns: 3, growth: 2, points: 300 });
  const perfectPath = ideal.map((p, i) => ({ x: p.x, y: p.y, t: i * 16 }));
  const { meanDeviationPx, normalizedDeviationScore } = analyzeSpiralDeviation(perfectPath, ideal);
  assert(meanDeviationPx < 0.5, `spiral: perfect trace expected ~0 deviation, got ${meanDeviationPx}`);
  assert(normalizedDeviationScore < 0.05, `spiral: perfect trace expected low normalized score, got ${normalizedDeviationScore}`);
}

// --- analyzeSpiralDeviation: a shaky/offset trace has meaningfully higher deviation ---
{
  const ideal = generateIdealSpiral({ turns: 3, growth: 2, points: 300 });
  const shakyPath = ideal.map((p, i) => ({
    x: p.x + (Math.random() - 0.5) * 8,
    y: p.y + (Math.random() - 0.5) * 8,
    t: i * 16,
  }));
  const { meanDeviationPx } = analyzeSpiralDeviation(shakyPath, ideal);
  assert(meanDeviationPx > 1, `spiral: shaky trace expected noticeable deviation, got ${meanDeviationPx}`);
}

// --- computeAsymmetryIndex: known ratios ---
{
  assert(computeAsymmetryIndex(10, 10) === 0, "asymmetry: equal values should be 0");
  assert(approx(computeAsymmetryIndex(10, 5), 0.6667, 0.001), "asymmetry: 10 vs 5 should be ~0.667");
  assert(computeAsymmetryIndex(0, 0) === 0, "asymmetry: both-zero should not divide by zero");
  assert(computeAsymmetryIndex(-5, 100) <= 1, "asymmetry: result must clamp to [0,1]");
}

// --- shipped PADS bundle: inference stays finite, normalized, and explainable ---
{
  const bundle = JSON.parse(readFileSync(new URL("../../public/models/neuratrack-pads-model.json", import.meta.url), "utf8"));
  const out = runModel(bundle, "tremor_reference", {
    result: { task: "rest", frequencyHz: 5, tremorBandPowerRatio: 0.82 },
    peakProminence: 0.42,
    quality: { qualityScore: 0.95, coverage: 0.98 },
  });
  const probabilitySum = Object.values(out.probs).reduce((sum, value) => sum + value, 0);
  assert(Number.isFinite(out.confidence), "PADS model: confidence should be finite");
  assert(approx(probabilitySum, 1, 0.002), `PADS model: probabilities should sum to 1, got ${probabilitySum}`);
  assert(out.contributions.length > 0, "PADS model: should return model-derived explanation drivers");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
