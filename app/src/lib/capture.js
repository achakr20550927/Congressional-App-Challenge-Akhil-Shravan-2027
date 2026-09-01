// capture.js — camera access & MediaPipe hand-tracking wrapper (PRD §9.2).
// The WASM runtime and model are fetched from Google's CDN and cached by the
// service worker after first load (see vite.config.js runtimeCaching), so
// only the very first visit needs connectivity (PRD §11.5).

let cachedLandmarkerPromise = null;

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

/**
 * Loads the MediaPipe WASM runtime and the hand_landmarker task model,
 * caching the promise so repeated calls (e.g. re-mounting the capture
 * screen) don't reload it.
 * @param {{numHands?: 1|2, delegate?: 'GPU'|'CPU'}} opts
 */
export async function initHandLandmarker(opts = {}) {
  const { numHands = 2, delegate = "GPU" } = opts;
  if (cachedLandmarkerPromise) return cachedLandmarkerPromise;

  cachedLandmarkerPromise = (async () => {
    const { HandLandmarker, FilesetResolver } = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/vision_bundle.mjs"
    );
    let fileset;
    try {
      fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
      );
      return await HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate,
        },
        runningMode: "VIDEO",
        numHands,
        minHandDetectionConfidence: 0.65,
        minHandPresenceConfidence: 0.65,
        minTrackingConfidence: 0.7,
      });
    } catch (err) {
      if (delegate === "GPU") {
        // Safari / older GPUs: fall back to CPU delegate per PRD §11.4 & §14.
        return await HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands,
          minHandDetectionConfidence: 0.65,
          minHandPresenceConfidence: 0.65,
          minTrackingConfidence: 0.7,
        });
      }
      throw err;
    }
  })();

  return cachedLandmarkerPromise;
}

/** Human-readable classification of getUserMedia failures. */
export class CameraError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // 'denied' | 'not-found' | 'in-use' | 'unknown'
  }
}

/**
 * Wraps getUserMedia with friendly error classification (PRD §9.2, §10.4).
 * @param {MediaStreamConstraints} constraints
 * @returns {Promise<MediaStream>}
 */
export async function startCameraStream(constraints = { video: { width: 640, height: 480 }, audio: false }) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError("unsupported", "Camera access is not supported in this browser.");
  }
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      throw new CameraError("denied", "Camera access was denied.");
    }
    if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
      throw new CameraError("not-found", "No camera was found on this device.");
    }
    if (err.name === "NotReadableError") {
      throw new CameraError("in-use", "The camera appears to be in use by another app.");
    }
    throw new CameraError("unknown", err.message || "Unknown camera error.");
  }
}

/** Thin wrapper around landmarker.detectForVideo(), called once per animation frame. */
export function detectFrame(landmarker, videoEl, timestampMs) {
  return landmarker.detectForVideo(videoEl, timestampMs);
}

function dist3(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/**
 * Median wrist-to-middle-MCP distance across the calibration window; used to
 * normalize every later distance-based feature so results are comparable
 * regardless of how close the user sits to the camera.
 * @param {Array<{landmarks: any[][]}>} frames - results captured during the ~2s calibration window
 */
export function calibrateHandScale(frames) {
  const distances = [];
  for (const f of frames) {
    const lm = f.landmarks && f.landmarks[0];
    if (lm) distances.push(dist3(lm[0], lm[9]));
  }
  if (distances.length === 0) return null;
  return median(distances);
}

/** Simple lighting-quality heuristic from raw video pixel data (PRD §10.4). */
export function assessLightingQuality(videoEl, sampleCanvas) {
  const w = 64, h = 48;
  sampleCanvas.width = w;
  sampleCanvas.height = h;
  const ctx = sampleCanvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  let sum = 0;
  let sumSq = 0;
  const n = w * h;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    sumSq += lum * lum;
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  return { meanLuminance: mean, contrast: Math.sqrt(Math.max(0, variance)), ok: mean > 40 && mean < 235 };
}
