// fft.js — small, dependency-free signal-processing core for NeuraTrack.
// Pure functions, no DOM/browser APIs, so this file can be unit-tested with
// plain Node (see test-fft.js) and imported unmodified into the browser app.

/**
 * Iterative radix-2 Cooley-Tukey FFT.
 * re/im are Float64Array (or plain arrays) of equal length, length MUST be a power of 2.
 * Transforms in place.
 */
export function fftInPlace(re, im) {
  const n = re.length;
  if (n & (n - 1)) throw new Error("fftInPlace: length must be a power of 2, got " + n);
  if (n <= 1) return;

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  // Butterfly stages
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

/**
 * Hann window — reduces spectral leakage from the non-periodic recording window.
 */
function hann(n) {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

/**
 * Analyze a 1D time series (e.g. a fingertip's x-coordinate over time) and return
 * the dominant oscillation frequency within [minHz, maxHz], its magnitude, the
 * signal's RMS amplitude (detrended), and the full magnitude spectrum for charting.
 *
 * @param {number[]} samples - evenly-sampled signal values
 * @param {number} sampleRateHz - samples per second
 * @param {number} minHz
 * @param {number} maxHz
 */
export function analyzeTremor(samples, sampleRateHz, minHz = 2, maxHz = 15) {
  const n = samples.length;
  if (n < 4) return { frequency: 0, magnitude: 0, rmsAmplitude: 0, spectrum: [] };

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
  // remaining entries are zero-padded by default (Float64Array init)

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

  return { frequency: bestFreq, magnitude: bestMag === -Infinity ? 0 : bestMag, rmsAmplitude, spectrum };
}

/**
 * Finger-tap task helper: given the finger-to-thumb distance over time, count taps
 * (local minima below a threshold) and compare tap amplitude in the first half of
 * the recording vs. the second half — amplitude decrement across a tapping task is
 * a classic bradykinesia indicator in the MDS-UPDRS exam.
 */
export function analyzeTapDecrement(distanceSeries, sampleRateHz) {
  const n = distanceSeries.length;
  if (n < 4) return { tapCount: 0, tapRateHz: 0, amplitudeDecrementPct: 0 };

  const maxD = Math.max(...distanceSeries);
  const minD = Math.min(...distanceSeries);
  const range = maxD - minD || 1;
  const closedThreshold = minD + range * 0.35; // "pinch closed" threshold

  const tapAmplitudes = [];
  let inTap = false;
  let localPeak = -Infinity; // max distance seen since the hand last opened
  let troughSinceTap = Infinity; // min distance seen during the current closed phase
  for (let i = 0; i < n; i++) {
    const d = distanceSeries[i];
    if (d <= closedThreshold) {
      inTap = true;
      troughSinceTap = Math.min(troughSinceTap, d);
    } else {
      if (inTap) {
        // just reopened after a tap — record that tap's peak-to-trough amplitude
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
