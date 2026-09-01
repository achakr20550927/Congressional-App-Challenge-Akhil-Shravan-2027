import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../context/AppStateContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  startCameraStream,
  initHandLandmarker,
  detectFrame,
  CameraError,
} from "../lib/capture.js";
import {
  resampleToUniformGrid,
  analyzeTremor,
  analyzeTapDecrement,
  analyzeSpiralDeviation,
  computeAsymmetryIndex,
  generateIdealSpiral,
} from "../lib/signal.js";
import { extractFeatureVector, loadClassifier, classifyPattern } from "../lib/classifier.js";
import { buildInterpretation } from "../lib/interpretation.js";
import { saveTaskResult, getSessionHistory } from "../lib/storage.js";
import {
  createHandOverlay2D,
  createTremorSignaturePlot,
  renderSpectrumChart,
  renderAmplitudeChart,
  pushAmplitudeSample,
} from "../lib/render3d.js";
import Countdown from "../components/Countdown.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import MetricCard from "../components/MetricCard.jsx";
import DisclaimerBanner from "../components/DisclaimerBanner.jsx";

const RECORD_MS = 10000;
const SPIRAL_MAX_MS = 30000;

const TASK_META = {
  rest: { titleKey: "taskRestTitle", guideKey: "taskRestGuide", mode: "camera", band: [2, 15] },
  postural: { titleKey: "taskPosturalTitle", guideKey: "taskPosturalGuide", mode: "camera", band: [2, 15] },
  tap: { titleKey: "taskTapTitle", guideKey: "taskTapGuide", mode: "camera-tap", band: null },
  pronation: { titleKey: "taskPronationTitle", guideKey: "taskPronationGuide", mode: "camera", band: [0.5, 8] },
  spiral: { titleKey: "taskSpiralTitle", guideKey: "taskSpiralGuide", mode: "canvas", band: null },
};

function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export default function TaskCapture() {
  const { task } = useParams();
  const meta = TASK_META[task] || TASK_META.rest;
  const { t, device, mode: appMode, language } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [flow, setFlow] = useState("instructions"); // instructions | countdown | recording | analyzing | result
  const [cameraState, setCameraState] = useState("idle"); // idle | requesting | ready | error
  const [cameraError, setCameraError] = useState(null);
  const [handedness, setHandedness] = useState({ left: false, right: false });
  const [progressPct, setProgressPct] = useState(1);
  const [result, setResult] = useState(null);
  const [saveError, setSaveError] = useState(false);

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const overlay2dRef = useRef(null);
  const landmarkerRef = useRef(null);
  const ampCanvasRef = useRef(null);
  const ampChartRef = useRef(null);
  const ampSeriesRef = useRef([]);
  const fingertipWinRef = useRef([]);
  const recordStatsRef = useRef({ frames: 0, withHand: 0 });
  const recordBufferRef = useRef([]);
  const recordStartRef = useRef(0);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const signatureContainerRef = useRef(null);
  const signatureRef = useRef(null);
  const spectrumCanvasRef = useRef(null);

  // Spiral-only refs
  const spiralCanvasRef = useRef(null);
  const spiralPathRef = useRef([]);
  const spiralDrawingRef = useRef(false);
  const idealSpiralRef = useRef(generateIdealSpiral({ turns: 4, growth: 6, points: 720 }));

  const handScale = device?.handScale || 1;

  useEffect(() => {
    setFlow("instructions");
    setResult(null);
    setSaveError(false);
  }, [task]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      overlay2dRef.current?.dispose();
      signatureRef.current?.dispose();
    },
    []
  );

  const startCamera = useCallback(async () => {
    setCameraState("requesting");
    setCameraError(null);
    try {
      const stream = await startCameraStream({ video: { width: 640, height: 480 }, audio: false });
      const video = videoRef.current;
      video.srcObject = stream;
      await new Promise((res) => (video.onloadedmetadata = res));
      await video.play();

      if (!landmarkerRef.current) {
        landmarkerRef.current = await initHandLandmarker({ numHands: 2, delegate: "GPU" });
      }
      if (overlayCanvasRef.current) {
        // Match the canvas's pixel grid to the video frame so normalized
        // landmarks map 1:1 onto the user's actual hand (see render3d.js).
        overlayCanvasRef.current.width = video.videoWidth;
        overlayCanvasRef.current.height = video.videoHeight;
        overlay2dRef.current = createHandOverlay2D(overlayCanvasRef.current);
      }
      setCameraState("ready");
      renderLoop();
    } catch (err) {
      setCameraError(err instanceof CameraError ? err.kind : "unknown");
      setCameraState("error");
    }
  }, []);

  function renderLoop() {
    function tick() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (video && landmarker && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const nowMs = performance.now();
        const res = detectFrame(landmarker, video, nowMs);
        overlay2dRef.current?.draw(res);
        updateHandednessChips(res);

        if (flowRef.current === "recording") {
          recordBufferRef.current.push({ t: nowMs - recordStartRef.current, result: res });
          recordStatsRef.current.frames++;
          if (res.landmarks && res.landmarks.length > 0) recordStatsRef.current.withHand++;
          pushLiveAmplitude(res);
          const elapsed = nowMs - recordStartRef.current;
          const pct = Math.max(0, 1 - elapsed / RECORD_MS);
          setProgressPct(pct);
          if (elapsed >= RECORD_MS) finishRecording();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  // Track current flow in a ref so the rAF closure always sees the latest value.
  const flowRef = useRef(flow);
  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);

  useEffect(() => {
    if (cameraState === "ready" && ampCanvasRef.current && !ampChartRef.current) {
      ampChartRef.current = renderAmplitudeChart(ampCanvasRef.current, t("liveAmpUnit"));
    }
  }, [cameraState]);

  function updateHandednessChips(res) {
    let left = false, right = false;
    (res.handednesses || []).forEach((h) => {
      const label = h[0]?.categoryName;
      if (label === "Left") left = true;
      if (label === "Right") right = true;
    });
    // Only trigger a re-render when the value actually changes — this loop
    // runs once per video frame (~30-60x/sec), and setting state every frame
    // regardless of change was the root cause of the countdown-freeze bug.
    setHandedness((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }

  function pushLiveAmplitude(res) {
    // The original version plotted the ABSOLUTE fingertip-to-wrist distance,
    // which just tracks hand size/position in frame (~0.48 for any hand) and
    // says nothing about tremor. What we actually want is how much the
    // fingertip deviates from its own short-term average — i.e. the jitter —
    // normalized by the calibrated hand scale so the unit ("% of hand
    // width") means the same thing at any distance from the camera.
    const lm = res.landmarks && res.landmarks[0];
    if (!lm || !ampChartRef.current) return;
    const win = fingertipWinRef.current;
    win.push({ x: lm[8].x, y: lm[8].y });
    if (win.length > 15) win.shift();
    if (win.length < 5) return;
    let mx = 0, my = 0;
    for (const p of win) {
      mx += p.x;
      my += p.y;
    }
    mx /= win.length;
    my /= win.length;
    let s = 0;
    for (const p of win) s += (p.x - mx) ** 2 + (p.y - my) ** 2;
    const rms = Math.sqrt(s / win.length);
    const pctOfHand = (rms / handScale) * 100;
    pushAmplitudeSample(ampChartRef.current, ampSeriesRef.current, Number(pctOfHand.toFixed(2)));
  }

  function beginCountdown() {
    setFlow("countdown");
  }

  function onCountdownDone() {
    recordBufferRef.current = [];
    ampSeriesRef.current = [];
    fingertipWinRef.current = [];
    recordStatsRef.current = { frames: 0, withHand: 0 };
    recordStartRef.current = performance.now();
    setProgressPct(1);
    setFlow("recording");
  }

  function perHandSeries(handIndex) {
    const frames = recordBufferRef.current.filter((f) => f.result.landmarks && f.result.landmarks[handIndex]);
    if (frames.length < 8) return null;

    if (meta.mode === "camera-tap") {
      const samples = frames.map((f) => ({ t: f.t, value: dist(f.result.landmarks[handIndex][4], f.result.landmarks[handIndex][8]) / handScale }));
      const uniform = resampleToUniformGrid(samples, 30);
      const { tapCount, tapRateHz, amplitudeDecrementPct } = analyzeTapDecrement(uniform, 30);
      const { rmsAmplitude } = analyzeTremor(uniform, 30, 0, 0.01);
      return { tapCount, tapRateHz, amplitudeDecrementPct, rmsAmplitude, frequency: 0 };
    }

    const samples = frames.map((f) => ({ t: f.t, value: f.result.landmarks[handIndex][8].x / handScale }));
    const uniform = resampleToUniformGrid(samples, 30);
    const [minHz, maxHz] = meta.band;
    const { frequency, rmsAmplitude, spectrum, peakProminence, tremorBandPowerRatio } = analyzeTremor(uniform, 30, minHz, maxHz);
    return { frequency, rmsAmplitude, spectrum, peakProminence, tremorBandPowerRatio };
  }

  async function finishRecording() {
    setFlow("analyzing");
    setTimeout(analyzeSession, 150);
  }

  async function analyzeSession() {
    if (recordBufferRef.current.length < 8) {
      setFlow("instructions");
      showToast(t("captureNotEnoughData"));
      return;
    }
    const hand0 = perHandSeries(0);
    const hand1 = perHandSeries(1);
    const primary = hand0 || hand1;
    if (!primary) {
      setFlow("instructions");
      showToast(t("captureNoHand"));
      return;
    }

    let asymmetryIndex = null;
    if (hand0 && hand1) {
      const metricKey = meta.mode === "camera-tap" ? "amplitudeDecrementPct" : "frequency";
      asymmetryIndex = computeAsymmetryIndex(hand0[metricKey] || hand0.rmsAmplitude, hand1[metricKey] || hand1.rmsAmplitude);
    }

    const taskResult = {
      task,
      frequencyHz: primary.frequency || 0,
      rmsAmplitude: primary.rmsAmplitude || 0,
      // rmsAmplitude is already normalized by hand scale (fraction of hand
      // width); ×100 gives the model's amplitude_pct_hand_width feature.
      amplitudePctHand: (primary.rmsAmplitude || 0) * 100,
      tremorBandPowerRatio: primary.tremorBandPowerRatio || 0,
      tapRateHz: meta.mode === "camera-tap" ? primary.tapRateHz : null,
      tapDecrementPct: meta.mode === "camera-tap" ? primary.amplitudeDecrementPct : null,
      spiralDeviationScore: null,
      asymmetryIndex,
      recordedAt: new Date().toISOString(),
    };

    // Recording quality: real tremor claims need enough frames and enough
    // hand visibility to stand on. Below thresholds, we say so instead of
    // presenting confident numbers (PRD pillar: honestly framed).
    const stats = recordStatsRef.current;
    const fps = stats.frames / (RECORD_MS / 1000);
    const coverage = stats.frames > 0 ? stats.withHand / stats.frames : 0;
    const quality = {
      fps,
      coverage,
      // 0-1 quality score for the model's quality_score feature: blends frame
      // rate (target ~30fps) and hand visibility.
      qualityScore: Math.max(0, Math.min(1, 0.5 * Math.min(1, fps / 24) + 0.5 * coverage)),
      qualityOk: fps >= 12 && coverage >= 0.6,
      lowCoverage: coverage < 0.35,
    };

    await finalizeResult(
      taskResult,
      primary.spectrum || [],
      recordBufferRef.current.map((f) => {
        const lm = f.result.landmarks && f.result.landmarks[0];
        return lm ? { x: lm[8].x - 0.5, y: lm[8].y - 0.5, z: lm[8].z || 0 } : null;
      }).filter(Boolean),
      primary.peakProminence || 0,
      quality
    );
  }

  async function finalizeResult(taskResult, spectrum, trajectoryPoints, peakProminence = 0, quality = null) {
    // Fetch this task's prior history BEFORE saving the new result, so the
    // trend comparison ("vs. your last N sessions") doesn't include itself.
    const priorHistory = await getSessionHistory(null, task, 365).catch(() => []);

    const model = await loadClassifier();
    const { vector } = extractFeatureVector(taskResult);
    const classification = classifyPattern(model, vector, { task, peakProminence, result: taskResult, quality });
    const interpretation = buildInterpretation({ task, result: taskResult, classification, history: priorHistory, language, quality });

    const fullResult = {
      ...taskResult,
      patternLabel: classification.patternLabel,
      confidence: classification.confidence,
      rating: interpretation.rating.tier,
      qualityOk: quality ? quality.qualityOk : true,
    };

    let saved = true;
    try {
      await saveTaskResult(fullResult);
    } catch {
      saved = false;
    }
    setSaveError(!saved);
    setResult({ ...fullResult, classification, interpretation, spectrum, trajectoryPoints });
    setFlow("result");

    requestAnimationFrame(() => {
      if (spectrumCanvasRef.current && spectrum.length) renderSpectrumChart(spectrumCanvasRef.current, spectrum);
      if (signatureContainerRef.current && trajectoryPoints.length > 3) {
        signatureRef.current?.dispose();
        signatureRef.current = createTremorSignaturePlot(signatureContainerRef.current, trajectoryPoints);
      }
    });
  }

  // --- Spiral task handlers ---
  function spiralPointFromEvent(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2, t: performance.now() };
  }

  function drawSpiralGuide(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.beginPath();
    idealSpiralRef.current.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = "rgba(85,80,74,0.35)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawUserPath(ctx, canvas) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.beginPath();
    spiralPathRef.current.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = "#2F5D50";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }

  useEffect(() => {
    if (meta.mode !== "canvas" || flow !== "recording") return;
    const canvas = spiralCanvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const box = canvas.parentElement.getBoundingClientRect();
      canvas.width = box.width;
      canvas.height = box.height;
      const ctx = canvas.getContext("2d");
      drawSpiralGuide(ctx, canvas);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  function spiralPointerDown(e) {
    if (flow !== "recording") return;
    spiralDrawingRef.current = true;
    spiralPathRef.current = [spiralPointFromEvent(e, spiralCanvasRef.current)];
  }
  function spiralPointerMove(e) {
    if (!spiralDrawingRef.current || flow !== "recording") return;
    e.preventDefault();
    spiralPathRef.current.push(spiralPointFromEvent(e, spiralCanvasRef.current));
    const canvas = spiralCanvasRef.current;
    const ctx = canvas.getContext("2d");
    drawSpiralGuide(ctx, canvas);
    drawUserPath(ctx, canvas);
    const elapsed = performance.now() - recordStartRef.current;
    setProgressPct(Math.max(0, 1 - elapsed / SPIRAL_MAX_MS));
  }
  async function spiralPointerUp() {
    if (!spiralDrawingRef.current) return;
    spiralDrawingRef.current = false;
    await analyzeSpiral();
  }

  function beginSpiralRecording() {
    spiralPathRef.current = [];
    recordStartRef.current = performance.now();
    setProgressPct(1);
    setFlow("recording");
  }

  async function analyzeSpiral() {
    setFlow("analyzing");
    const path = spiralPathRef.current;
    if (path.length < 8) {
      setFlow("instructions");
      showToast(t("captureNotEnoughData"));
      return;
    }
    const { normalizedDeviationScore } = analyzeSpiralDeviation(path, idealSpiralRef.current);
    const taskResult = {
      task: "spiral",
      frequencyHz: 0,
      rmsAmplitude: 0,
      tapRateHz: null,
      tapDecrementPct: null,
      spiralDeviationScore: normalizedDeviationScore,
      asymmetryIndex: null,
      recordedAt: new Date().toISOString(),
    };
    setTimeout(() => finalizeResult(taskResult, [], []), 150);
  }

  function resetToInstructions() {
    setResult(null);
    setFlow("instructions");
  }

  const title = t(meta.titleKey);
  const guide = t(meta.guideKey);

  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 30, marginBottom: 20 }}>{title}</h1>

      <div className="capture-layout">
        <div>
          <div
            className={flow === "recording" ? "card-active" : ""}
            style={{
              background: meta.mode === "canvas" ? "var(--paper)" : "var(--viewport)",
              border: meta.mode === "canvas" ? "1px solid var(--hair)" : "1px solid var(--viewport-line)",
              borderRadius: 14,
              aspectRatio: "4/3",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div className="mono" style={{ position: "absolute", top: 16, left: 18, color: meta.mode === "canvas" ? "var(--ink-soft)" : "#DAD2C2", zIndex: 5 }}>
              {t("appName")} — on-device only
            </div>

            {meta.mode !== "canvas" && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: 0.55 }}
              />
            )}
            {/* Skeleton overlay: identical layout + mirroring to the video so
                normalized landmarks land exactly on the user's hand. */}
            {meta.mode !== "canvas" && (
              <canvas
                ref={overlayCanvasRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", pointerEvents: "none" }}
              />
            )}

            {meta.mode === "canvas" && (
              <canvas
                ref={spiralCanvasRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "crosshair", touchAction: "none" }}
                onMouseDown={spiralPointerDown}
                onMouseMove={spiralPointerMove}
                onMouseUp={spiralPointerUp}
                onMouseLeave={spiralPointerUp}
                onTouchStart={spiralPointerDown}
                onTouchMove={spiralPointerMove}
                onTouchEnd={spiralPointerUp}
              />
            )}

            {flow === "countdown" && <Countdown from={3} onDone={onCountdownDone} />}

            {flow === "recording" && (
              <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
                <ProgressRing
                  pct={progressPct}
                  dark={meta.mode !== "canvas"}
                  label={`${Math.max(0, (progressPct * (meta.mode === "canvas" ? SPIRAL_MAX_MS : RECORD_MS)) / 1000).toFixed(1)}s`}
                />
              </div>
            )}
          </div>

          <p className="mono" style={{ marginTop: 12 }}>
            {flow === "instructions" && (meta.mode === "canvas" ? t("captureReadyCanvas") : cameraState === "ready" ? t("captureReady") : "")}
            {flow === "recording" && t("captureRecording")}
            {flow === "analyzing" && t("captureAnalyzing")}
            {flow === "result" && t("captureResultReady")}
          </p>
        </div>

        <div className="stack">
          <div className="card">
            <span className="mono">{t("navLiveFeed")}</span>
            <h3 style={{ marginTop: 6, marginBottom: 8 }}>{title}</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>{guide}</p>
            {meta.mode !== "canvas" && (
              <div className="row" style={{ marginTop: 12, gap: 10 }}>
                <span className={"chip " + (handedness.left ? "chip-good" : "chip-neutral")}>
                  <span className="chip-shape" />
                  {t("leftHand")}
                </span>
                <span className={"chip " + (handedness.right ? "chip-good" : "chip-neutral")}>
                  <span className="chip-shape" />
                  {t("rightHand")}
                </span>
              </div>
            )}
          </div>

          {meta.mode !== "canvas" && (
            <div className="card">
              <h3 style={{ marginBottom: 4 }}>{t("liveAmplitude")}</h3>
              <p className="data-sm" style={{ color: "var(--ink-soft)", marginBottom: 8 }}>
                {t("liveAmplitudeSub")}
              </p>
              <canvas ref={ampCanvasRef} height={120} />
            </div>
          )}

          {flow === "result" && result && (
            <ResultCard result={result} appMode={appMode} saveError={saveError} t={t} spectrumCanvasRef={spectrumCanvasRef} signatureContainerRef={signatureContainerRef} />
          )}
        </div>
      </div>

      <div className="capture-bottombar">
        {meta.mode !== "canvas" && cameraState !== "ready" && (
          <button className="btn btn-ghost" onClick={startCamera} disabled={cameraState === "requesting"}>
            {cameraState === "requesting" ? t("cameraRequesting") : t("captureStartCamera")}
          </button>
        )}

        {meta.mode !== "canvas" && cameraState === "ready" && flow === "instructions" && (
          <button className="btn btn-primary" onClick={beginCountdown}>
            {t("captureStartRecording")}
          </button>
        )}

        {meta.mode === "canvas" && flow === "instructions" && (
          <button className="btn btn-primary" onClick={beginSpiralRecording}>
            {t("captureStartRecording")}
          </button>
        )}

        {flow === "result" && (
          <>
            <button className="btn btn-ghost" onClick={resetToInstructions}>
              {t("runAgain")}
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/app")}>
              {t("runAnother")}
            </button>
          </>
        )}

        {cameraState === "error" && (
          <div className="card">
            <p style={{ marginBottom: 8 }}>
              {cameraError === "not-found" ? t("cameraNotFound") : cameraError === "in-use" ? t("cameraInUse") : t("cameraDeniedHelp")}
            </p>
            <button className="btn btn-ghost" onClick={startCamera}>
              {t("cameraRetry")}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .capture-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
        @media (max-width: 980px) { .capture-layout { grid-template-columns: 1fr; } }
        .capture-bottombar { position: sticky; bottom: 0; background: rgba(5,11,20,.85); backdrop-filter: blur(10px);
          border-top: 1px solid var(--hair); padding: 16px 0; display: flex; justify-content: center; gap: 16px; margin-top: 24px; }
      `}</style>
    </div>
  );
}

function ResultCard({ result, appMode, saveError, t, spectrumCanvasRef, signatureContainerRef }) {
  const isTap = result.task === "tap";
  const isSpiral = result.task === "spiral";
  const isClinician = appMode === "clinician";
  const interp = result.interpretation;

  return (
    <div className="card">
      <h3 style={{ marginBottom: 10 }}>{t("resultsTitle")}</h3>

      {/* Check-in rating FIRST — the one thing a non-technical user needs.
          Shape + color + words together, never color alone. */}
      {interp?.rating && <RatingCard rating={interp.rating} t={t} />}

      {interp?.qualityNote && (
        <div className="card" style={{ marginTop: 14, padding: 14, borderLeft: "3px solid var(--terra)" }}>
          <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>{interp.qualityNote}</p>
        </div>
      )}

      {/* 3D tremor-signature plot only makes sense when a camera trajectory
          was recorded — the spiral task has none, so don't render an empty box. */}
      <div
        ref={signatureContainerRef}
        style={{
          width: "100%",
          aspectRatio: "1/1",
          marginBottom: 12,
          marginTop: 14,
          display: result.trajectoryPoints && result.trajectoryPoints.length > 3 ? "block" : "none",
        }}
      />

      <div className="grid-2" style={{ gap: 10 }}>
        {!isTap && !isSpiral && <MetricCard label={t("metricFrequency")} value={result.frequencyHz ? result.frequencyHz.toFixed(2) : "—"} unit="Hz" />}
        {!isTap && !isSpiral && <MetricCard label={t("metricAmplitude")} value={result.rmsAmplitude ? result.rmsAmplitude.toFixed(4) : "—"} />}
        {isTap && <MetricCard label={t("metricTapRate")} value={result.tapRateHz ? result.tapRateHz.toFixed(2) : "—"} unit="Hz" />}
        {isTap && <MetricCard label={t("metricTapDecrement")} value={result.tapDecrementPct ? result.tapDecrementPct.toFixed(0) : "0"} unit="%" />}
        {isSpiral && <MetricCard label={t("metricSpiralDeviation")} value={result.spiralDeviationScore != null ? (result.spiralDeviationScore * 100).toFixed(0) : "—"} unit="%" />}
        {result.asymmetryIndex != null && <MetricCard label={t("metricAsymmetry")} value={(result.asymmetryIndex * 100).toFixed(0)} unit="%" />}
      </div>

      {result.spectrum && result.spectrum.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <canvas ref={spectrumCanvasRef} height={100} />
        </div>
      )}

      {/* Primary finding — headline + plain-language explanation, task-specific (see interpretation.js) */}
      <div style={{ marginTop: 14, background: "var(--gold-tint)", border: "1px solid var(--gold)", borderRadius: 10, padding: 14 }}>
        <div className="spread">
          <span className="mono">{t("matchStrength")}</span>
          <span className="data">{(result.classification.confidence * 100).toFixed(0)}%</span>
        </div>
        <p style={{ marginTop: 6, fontWeight: 600 }}>{interp?.headline}</p>

        {interp?.whatWeSaw?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <span className="mono">{t("whatWeSaw")}</span>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {interp.whatWeSaw.map((line, i) => (
                <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="data-sm" style={{ color: "var(--ink-soft)", marginTop: 10 }}>
          {t("patternDisclaimer")}
        </p>
      </div>

      {interp?.asymmetryNote && (
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <span className="mono">{t("leftRightComparison")}</span>
          <p style={{ marginTop: 6, fontSize: 14 }}>{interp.asymmetryNote}</p>
        </div>
      )}

      {interp?.trend && (
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <span className="mono">{t("comparedToHistory")}</span>
          <p style={{ marginTop: 6, fontSize: 14 }}>{interp.trend.message}</p>
        </div>
      )}

      {interp?.suggestedNextSteps?.length > 0 && (
        <div className="card" style={{ marginTop: 14, padding: 14, borderLeft: "3px solid var(--green)" }}>
          <span className="mono">{t("suggestedNextSteps")}</span>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {interp.suggestedNextSteps.map((line, i) => (
              <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {interp?.education && (
        <details style={{ marginTop: 14, border: "1px solid var(--hair)", borderRadius: 10, padding: "12px 14px" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 15 }}>{interp.education.title}</summary>
          <ul style={{ margin: "10px 0 4px", paddingLeft: 18 }}>
            {interp.education.bullets.map((line, i) => (
              <li key={i} style={{ marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>
                {line}
              </li>
            ))}
          </ul>
        </details>
      )}

      {isClinician && (
        <div className="card" style={{ marginTop: 14, padding: 14, background: "var(--canvas-dim)" }}>
          <span className="mono">{t("clinicianDetail")}</span>
          <p className="data-sm" style={{ color: "var(--ink-soft)", marginTop: 8 }}>
            <strong>{t("rationale")}:</strong> {result.classification.rationale}
          </p>

          {result.classification.modelCrossCheck && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--hair)" }}>
              <span className="mono">{t("mlCrossCheck")}</span>
              <p className="data-sm" style={{ color: "var(--ink-soft)", marginTop: 6 }}>
                {t("mlModelSays")}{" "}
                <strong>{Math.round(result.classification.modelCrossCheck.pTremor * 100)}%</strong>{" "}
                {t("mlTremorResemblance")} ·{" "}
                {result.classification.modelCrossCheck.agrees ? (
                  <span style={{ color: "var(--green)" }}>{t("mlAgrees")}</span>
                ) : (
                  <span style={{ color: "#f0a886" }}>{t("mlDisagrees")}</span>
                )}
              </p>
              <p className="data-sm" style={{ color: "var(--ink-soft)", marginTop: 4, fontStyle: "italic" }}>
                {t("mlRealNote")}
                {result.classification.modelCrossCheck.metrics
                  ? ` ${t("mlAucNote")} ${result.classification.modelCrossCheck.metrics.subjectAuc} (${t("mlPerPerson")}), ${result.classification.modelCrossCheck.metrics.recordingAuc} (${t("mlPerRecording")}).`
                  : ""}
              </p>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <span className="data-sm" style={{ color: "var(--ink-soft)" }}>
              {t("featureImportance")}
            </span>
            <div className="stack" style={{ gap: 6, marginTop: 6 }}>
              {result.classification.featureImportance
                .filter((fi) => fi.importance > 0)
                .map((fi) => (
                  <div key={fi.feature} className="row" style={{ gap: 8 }}>
                    <span className="mono" style={{ width: 140, flex: "none" }}>
                      {fi.feature}
                    </span>
                    <div style={{ flex: 1, height: 6, background: "var(--hair)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${fi.importance * 100}%`, height: "100%", background: "var(--green)" }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <DisclaimerBanner compact />

      {saveError && (
        <p className="data-sm" style={{ color: "var(--error)", marginTop: 10 }}>
          {t("resultsSaveFailed")}
        </p>
      )}
      {!saveError && (
        <p className="data-sm" style={{ color: "var(--ink-soft)", marginTop: 10 }}>
          {t("resultsSaved")}
        </p>
      )}
    </div>
  );
}

const RATING_STYLE = {
  steady: { bg: "var(--green-tint)", border: "var(--green)", shape: "circle" },
  watch: { bg: "var(--gold-tint)", border: "var(--gold)", shape: "diamond" },
  discuss: { bg: "var(--terra-tint)", border: "var(--terra)", shape: "triangle" },
  retry: { bg: "var(--canvas-dim)", border: "var(--hair)", shape: "square" },
};

function RatingShape({ shape, color }) {
  const s = 14;
  if (shape === "circle") return <svg width={s} height={s} aria-hidden="true"><circle cx={s / 2} cy={s / 2} r={s / 2 - 1} fill={color} /></svg>;
  if (shape === "diamond") return <svg width={s} height={s} aria-hidden="true"><rect x={3} y={3} width={s - 6} height={s - 6} fill={color} transform={`rotate(45 ${s / 2} ${s / 2})`} /></svg>;
  if (shape === "triangle") return <svg width={s} height={s} aria-hidden="true"><polygon points={`${s / 2},1 ${s - 1},${s - 1} 1,${s - 1}`} fill={color} /></svg>;
  return <svg width={s} height={s} aria-hidden="true"><rect x={2} y={2} width={s - 4} height={s - 4} fill={color} /></svg>;
}

function RatingCard({ rating, t }) {
  const style = RATING_STYLE[rating.tier] || RATING_STYLE.retry;
  return (
    <div style={{ background: style.bg, border: `1.5px solid ${style.border}`, borderRadius: 10, padding: 16 }}>
      <div className="row" style={{ gap: 8, marginBottom: 6 }}>
        <RatingShape shape={style.shape} color={style.border} />
        <span className="mono">{t("checkinRating")}</span>
      </div>
      <p style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>{rating.title}</p>
      <p style={{ fontSize: 15 }}>{rating.body}</p>
    </div>
  );
}

function humanizeLabel(label) {
  return String(label || "").split(/[-_]/).join(" ");
}
