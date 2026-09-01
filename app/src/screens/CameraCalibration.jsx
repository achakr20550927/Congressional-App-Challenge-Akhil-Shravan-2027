import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext.jsx";
import { startCameraStream, initHandLandmarker, detectFrame, calibrateHandScale, assessLightingQuality, CameraError } from "../lib/capture.js";
import OnboardingShell from "../components/OnboardingShell.jsx";

const CALIBRATION_MS = 2200;

/** PRD §10.4 — camera permission, then hand-size calibration + lighting check. */
export default function CameraCalibration() {
  const { t, saveCalibration } = useAppState();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [state, setState] = useState("idle"); // idle | requesting | denied | calibrating | poor-light | done
  const [errorKind, setErrorKind] = useState(null);
  const rafRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function start() {
    setState("requesting");
    setErrorKind(null);
    try {
      const stream = await startCameraStream({ video: { width: 640, height: 480 }, audio: false });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await new Promise((res) => (video.onloadedmetadata = res));
      await video.play();

      if (!landmarkerRef.current) {
        landmarkerRef.current = await initHandLandmarker({ numHands: 2, delegate: "GPU" });
      }

      setState("calibrating");
      runCalibrationWindow(video);
    } catch (err) {
      if (err instanceof CameraError) setErrorKind(err.kind);
      else setErrorKind("unknown");
      setState("denied");
    }
  }

  function runCalibrationWindow(video) {
    const frames = [];
    const startTs = performance.now();
    let lastVideoTime = -1;

    function loop() {
      const now = performance.now();
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const result = detectFrame(landmarkerRef.current, video, now);
        frames.push(result);
      }
      if (now - startTs < CALIBRATION_MS) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        finishCalibration(video, frames);
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function finishCalibration(video, frames) {
    const handScale = calibrateHandScale(frames);
    const lighting = assessLightingQuality(video, canvasRef.current);

    if (!handScale) {
      setState("poor-light");
      return;
    }
    if (!lighting.ok) {
      setState("poor-light");
      return;
    }
    saveCalibration(handScale);
    setState("done");
  }

  return (
    <OnboardingShell step={3} eyebrow="Camera calibration" title={t("cameraTitle")} body={t("cameraBody")}>
      <div
        className="card calibration-viewport"
        style={{
          background: "var(--viewport)",
          border: "1px solid var(--viewport-line)",
          aspectRatio: "4/3",
          position: "relative",
          overflow: "hidden",
          marginBottom: 24,
          padding: 0,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: state === "idle" || state === "requesting" ? 0.15 : 0.6 }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {(state === "calibrating") && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "12%",
              border: "2px dashed rgba(255,255,255,0.5)",
              borderRadius: 16,
            }}
          />
        )}
        <div className="mono" style={{ position: "absolute", top: 14, left: 16, color: "#DAD2C2" }}>
          {state === "idle" && "Camera off"}
          {state === "requesting" && t("cameraRequesting")}
          {state === "calibrating" && t("calibrating")}
          {state === "poor-light" && t("calibratePoorLight")}
          {state === "done" && t("calibrated")}
          {state === "denied" && t("cameraDenied")}
        </div>
      </div>

      {state === "idle" && (
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={start}>
          {t("cameraRequest")}
        </button>
      )}

      {state === "denied" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8 }}>
            {errorKind === "not-found" ? t("cameraNotFound") : errorKind === "in-use" ? t("cameraInUse") : t("cameraDeniedHelp")}
          </p>
          <button className="btn btn-ghost" onClick={start}>
            {t("cameraRetry")}
          </button>
        </div>
      )}

      {state === "poor-light" && (
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={start}>
          {t("calibrateRetry")}
        </button>
      )}

      {state === "done" && (
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => navigate("/app")}>
          {t("calibrateContinue")}
        </button>
      )}
    </OnboardingShell>
  );
}
