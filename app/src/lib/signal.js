// signal.js — dependency-free signal-processing core for NeuraTrack.
// Pure functions, no DOM/browser APIs, so this module is unit-testable with
// plain Node (see test-signal.mjs) and imported unmodified into the browser app.
//
// fftInPlace / analyzeTremor / analyzeTapDecrement are carried over from the
// original starter fft.js. resampleToUniformGrid, analyzeSpiralDeviation, and
// computeAsymmetryIndex are the v2.0 elevation work (PRD §9.1).

/**
 * Iterative radix-2 Cooley-Tukey FFT. re/im are Float64Array (or plain
 * arrays) of equal length, length MUST be a power of 2. Transforms in place.
 */
export function fftInPlace(re, im) {
  const n = re.length;
  if (n & (n - 1)) throw new Error("fftInPlace: length must be a power of 2, got " + n);
  if (n <= 1) return;

  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k], uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wIm;
        const nextIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
        curIm = nextIm;
      }
    }
  }
}

function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function mean(arr) {
  let s = 0;
  for (const v of arr) s += v;
  return s / arr.length;
}

/** Hann window — reduces spectral leakage from the non-periodic recording window. */
function hann(n) {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

/**
 * Analyze a 1D time series (e.g. a fingertip's x-coordinate over time) and
 * return the dominant oscillation frequency within [minHz, maxHz], its
 * magnitude, the signal's RMS amplitude (detrended), and the full magnitude
 * spectrum for charting.
 *
 * @param {number[]} samples - evenly-sampled signal values
 * @param {number} sampleRateHz - samples per second
 * @param {number} minHz
 * @param {number} maxHz
 */
export function analyzeTremor(samples, sampleRateHz, minHz = 2, maxHz = 15) {
  const n = samples.length;
  if (n < 4) return { frequency: 0, magnitude: 0, rmsAmplitude: 0, spectrum: [], peakProminence: 0 };

  const m = mean(samples);
  const detrended = samples.map((v) => v - m);

  let rmsSum = 0;
  for (const v of detrended) rmsSum += v * v;
  const rmsAmplitude = Math.sqrt(rmsSum / n);

  const nfft = nextPow2(n);
  const win = hann(n);
  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);
  for (let i = 0; i < n; i++) re[i] = detrended[i] * win[i];

  fftInPlace(re, im);

  const spectrum = [];
  let bestFreq = 0, bestMag = -Infinity;
  const half = nfft / 2;
  for (let k = 1; k < half; k++) {
    const freq = (k * sampleRateHz) / nfft;
    const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / nfft;
    if (freq >= minHz && freq <= maxHz) {
      spectrum.push({ freq, mag });
      if (mag > bestMag) {
        bestMag = mag;
        bestFreq = freq;
      }
    }
  }

  const magnitude = bestMag === -Infinity ? 0 : bestMag;

  // Peak prominence: what fraction of the in-band spectrum's total energy is
  // concentrated in the single dominant bin. A real oscillation concentrates
  // most of its energy into a narrow window around the true frequency; pure
  // noise spreads energy roughly evenly across every bin. This is what lets
  // the classifier tell "a rhythm is genuinely present" apart from "we had
  // to report *some* frequency number."
  //
  // We deliberately use an *energy-concentration ratio* (peak energy / total
  // energy) rather than a peak-to-mean magnitude ratio. Peak-to-mean is not
  // robust here: FFT magnitude bins of pure noise are roughly Rayleigh-
  // distributed, and the max of ~100-200 such bins is — by ordinary extreme-
  // value statistics — expected to land several times above the mean purely
  // by chance. A peak-to-mean threshold routinely misclassified pure noise
  // as a confident, real oscillation. Energy concentration doesn't have that
  // failure mode: it's a share of total energy (bounded in [0,1]) that stays
  // low for a flat/noisy spectrum regardless of how many bins are in the
  // band, and only rises when energy is genuinely concentrated in one place.
  let peakProminence = 0;
  let tremorBandPowerRatio = 0;
  if (spectrum.length > 1 && magnitude > 0) {
    const totalEnergy = spectrum.reduce((s, p) => s + p.mag * p.mag, 0);
    peakProminence = totalEnergy > 0 ? (magnitude * magnitude) / totalEnergy : 0;
    // Share of in-band energy that falls in the classic 3-7 Hz tremor band.
    // This is the single strongest transferable feature the real PADS model
    // (training/train_pads_real.py) learned from — computed here identically
    // so the model sees the same feature at serve time as it did in training.
    const tremorEnergy = spectrum.reduce((s, p) => (p.freq >= 3 && p.freq <= 7 ? s + p.mag * p.mag : s), 0);
    tremorBandPowerRatio = totalEnergy > 0 ? tremorEnergy / totalEnergy : 0;
  }

  return { frequency: bestFreq, magnitude, rmsAmplitude, spectrum, peakProminence, tremorBandPowerRatio };
}

/**
 * Finger-tap task helper: given the finger-to-thumb distance over time, count
 * taps (local minima below a threshold) and compare tap amplitude in the
 * first half of the recording vs. the second half — amplitude decrement
 * across a tapping task is a classic bradykinesia indicator in the
 * MDS-UPDRS exam.
 */
export function analyzeTapDecrement(distanceSeries, sampleRateHz) {
  const n = distanceSeries.length;
  if (n < 4) return { tapCount: 0, tapRateHz: 0, amplitudeDecrementPct: 0 };

  const maxD = Math.max(...distanceSeries);
  const minD = Math.min(...distanceSeries);
  const range = maxD - minD || 1;
  const closedThreshold = minD + range * 0.35;

  const tapAmplitudes = [];
  let inTap = false;
  let localPeak = -Infinity;
  let troughSinceTap = Infinity;
  for (let i = 0; i < n; i++) {
    const d = distanceSeries[i];
    if (d <= closedThreshold) {
      inTap = true;
      troughSinceTap = Math.min(troughSinceTap, d);
    } else {
      if (inTap) {
        const peak = localPeak === -Infinity ? maxD : localPeak;
        tapAmplitudes.push(peak - troughSinceTap);
        troughSinceTap = Infinity;
      }
      inTap = false;
      localPeak = d;
    }
  }

  const tapCount = tapAmplitudes.length;
  const durationSec = n / sampleRateHz;
  const tapRateHz = tapCount / durationSec;

  let amplitudeDecrementPct = 0;
  if (tapCount >= 4) {
    const half = Math.floor(tapCount / 2);
    const firstHalf = tapAmplitudes.slice(0, half);
    const secondHalf = tapAmplitudes.slice(half);
    const a1 = mean(firstHalf);
    const a2 = mean(secondHalf);
    if (a1 > 0) amplitudeDecrementPct = ((a1 - a2) / a1) * 100;
  }

  return { tapCount, tapRateHz, amplitudeDecrementPct };
}

/**
 * Linear-interpolates irregularly-timestamped samples onto a uniform grid,
 * correcting for webcam frame-timing jitter before any FFT is run.
 *
 * @param {{t:number, value:number}[]} samples - t in ms, ascending
 * @param {number} targetHz - desired output sample rate
 * @returns {number[]} values on a uniform grid spanning [samples[0].t, samples[last].t]
 */
export function resampleToUniformGrid(samples, targetHz) {
  if (!samples || samples.length < 2) return samples ? samples.map((s) => s.value) : [];
  const t0 = samples[0].t;
  const t1 = samples[samples.length - 1].t;
  const durationSec = (t1 - t0) / 1000;
  const stepMs = 1000 / targetHz;
  const count = Math.max(2, Math.floor((durationSec * 1000) / stepMs) + 1);

  const out = new Array(count);
  let srcIdx = 0;
  for (let i = 0; i < count; i++) {
    const targetT = t0 + i * stepMs;
    while (srcIdx < samples.length - 2 && samples[srcIdx + 1].t < targetT) srcIdx++;
    const a = samples[srcIdx];
    const b = samples[Math.min(srcIdx + 1, samples.length - 1)];
    const span = b.t - a.t || 1;
    const frac = Math.min(1, Math.max(0, (targetT - a.t) / span));
    out[i] = a.value + (b.value - a.value) * frac;
  }
  return out;
}

/**
 * Builds the ideal Archimedes spiral used as the on-screen drawing guide.
 * r = a * theta, sampled densely enough for point-to-curve distance checks.
 */
export function generateIdealSpiral({ turns = 4, growth = 1, points = 720 } = {}) {
  const spiral = [];
  const maxTheta = turns * 2 * Math.PI;
  for (let i = 0; i < points; i++) {
    const theta = (i / (points - 1)) * maxTheta;
    const r = growth * theta;
    spiral.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
  }
  return spiral;
}

function pointToPolylineDistance(p, curve) {
  let best = Infinity;
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i], b = curve[i + 1];
    const abx = b.x - a.x, aby = b.y - a.y;
    const lenSq = abx * abx + aby * aby || 1e-9;
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * abx, cy = a.y + t * aby;
    const dx = p.x - cx, dy = p.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Computes point-to-nearest-curve distance from the user's drawn path to a
 * reference Archimedes spiral, normalized 0-1 by spiral radius.
 *
 * @param {{x:number,y:number,t:number}[]} userPath - centered at the spiral origin, same units as idealSpiral
 * @param {{x:number,y:number}[]} idealSpiral - from generateIdealSpiral()
 */
export function analyzeSpiralDeviation(userPath, idealSpiral) {
  if (!userPath || userPath.length < 2 || !idealSpiral || idealSpiral.length < 2) {
    return { meanDeviationPx: 0, maxDeviationPx: 0, loopCount: 0, drawDurationMs: 0, normalizedDeviationScore: 0 };
  }

  const maxRadius = Math.max(...idealSpiral.map((p) => Math.sqrt(p.x * p.x + p.y * p.y))) || 1;

  let sum = 0;
  let max = 0;
  for (const p of userPath) {
    const d = pointToPolylineDistance(p, idealSpiral);
    sum += d;
    if (d > max) max = d;
  }
  const meanDeviationPx = sum / userPath.length;

  // Loop count via total signed angle traversed around the origin.
  let totalAngle = 0;
  for (let i = 1; i < userPath.length; i++) {
    const a = userPath[i - 1], b = userPath[i];
    const angA = Math.atan2(a.y, a.x);
    const angB = Math.atan2(b.y, b.x);
    let d = angB - angA;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    totalAngle += d;
  }
  const loopCount = Math.abs(totalAngle) / (2 * Math.PI);

  const drawDurationMs = userPath[userPath.length - 1].t - userPath[0].t;
  const normalizedDeviationScore = Math.max(0, Math.min(1, meanDeviationPx / (maxRadius * 0.25)));

  return { meanDeviationPx, maxDeviationPx: max, loopCount, drawDurationMs, normalizedDeviationScore };
}

/**
 * Standard normalized bilateral-asymmetry ratio: |L-R| / ((L+R)/2), clamped to [0,1].
 */
export function computeAsymmetryIndex(leftMetric, rightMetric) {
  const l = Number(leftMetric) || 0;
  const r = Number(rightMetric) || 0;
  const denom = (l + r) / 2;
  if (denom <= 0) return 0;
  return Math.max(0, Math.min(1, Math.abs(l - r) / denom));
}
