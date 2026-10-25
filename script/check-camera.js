/* NeuraTrack — camera pre-flight (run this before you film Act III)
 *
 * Paste into the DevTools console on http://localhost:5173 in the browser you
 * will actually film in, with `npm --prefix app run dev` running.
 *
 * Put your hand in frame and keep it there for ~5 seconds while it runs.
 *
 * It exercises the real path: getUserMedia -> the app's own initHandLandmarker()
 * -> detectForVideo across 60 frames. It stops the camera when done.
 *
 * PASS looks like: handFoundFrames well above 50, landmarks 21, fps >= 24.
 *  - fps below 24 -> the app's own quality gate will reject your take. More light.
 *  - handFoundFrames near 0 -> reframe: whole hand visible, palm toward camera.
 *  - INIT FAILED -> no network. The MediaPipe runtime and model come from
 *    jsDelivr and storage.googleapis.com on first use; they are not bundled.
 */
(async () => {
  let stream, video;
  try {
    const { initHandLandmarker } = await import('/src/lib/capture.js');

    console.log('Requesting camera…');
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      audio: false,
    });

    video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    await new Promise((r) => (video.readyState >= 2 ? r() : (video.onloadeddata = r)));

    const track = stream.getVideoTracks()[0];
    console.log('Camera:', track.label, track.getSettings());

    console.log('Loading MediaPipe (first run downloads ~7.8 MB)…');
    const t0 = performance.now();
    const landmarker = await initHandLandmarker({ numHands: 2, delegate: 'GPU' });
    console.log(`Landmarker ready in ${Math.round(performance.now() - t0)} ms`);

    console.log('Hold your hand in frame…');
    let handFound = 0, landmarkCount = 0, handedness = new Set();
    const start = performance.now();
    for (let i = 0; i < 60; i++) {
      const res = landmarker.detectForVideo(video, performance.now());
      if (res.landmarks && res.landmarks.length) {
        handFound++;
        landmarkCount = res.landmarks[0].length;
        if (res.handedness?.[0]?.[0]) handedness.add(res.handedness[0][0].categoryName);
      }
      await new Promise((r) => requestAnimationFrame(r));
    }
    const elapsed = (performance.now() - start) / 1000;

    const report = {
      handFoundFrames: `${handFound}/60`,
      landmarks: landmarkCount,
      handedness: [...handedness].join(', ') || 'none',
      fps: +(60 / elapsed).toFixed(1),
      verdict:
        handFound >= 50 && landmarkCount === 21 && 60 / elapsed >= 24
          ? 'PASS — safe to film'
          : 'CHECK — see notes at the top of this file',
    };
    console.table(report);
    return report;
  } catch (e) {
    console.error('PRE-FLIGHT FAILED:', e.name, e.message);
    return { error: `${e.name}: ${e.message}` };
  } finally {
    if (video) video.pause();
    if (stream) stream.getTracks().forEach((t) => t.stop());
    console.log('Camera released.');
  }
})();
