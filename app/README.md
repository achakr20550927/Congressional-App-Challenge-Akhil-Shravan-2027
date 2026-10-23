# NeuraTrack — local-first movement journal

A responsive, installable research prototype built with React, Vite, MediaPipe, IndexedDB, and on-device signal processing. It measures movement; it does **not** diagnose or rule out Parkinson’s disease.

## Run

Use Node 24 and npm:

```sh
cd app
npm ci
npm run dev
```

Open the URL printed in your terminal (normally http://localhost:5173). From this Mac:
```sh
cd "/Users/akhil/CAC Neuratrack APP/app"
npm run dev
```

- `/demo`: interactive, clearly labeled simulated recording; never saved.
- `/evidence`: completed research evaluation and limitations.
- `/app`: personal workspace after consent and local profile setup.
- `/history`: saved recordings, filters, comparable trends, CSV export.
- `/export`: selected-session PDF reports.

## Verify

```sh
npm test
npx playwright install chromium firefox webkit
npm run test:e2e
npm run build
npm run preview
```

The browser suite starts isolated dev/production servers on 5193/4193. Camera journey tests use explicit, test-only synthetic frames/landmarks. They test state, timing, quality gates, persistence, and cleanup—not hand-tracker accuracy. Browser tests run in Chromium, mobile Chromium emulation, Firefox, and WebKit. Physical iOS/Android camera testing remains required. GitHub Actions runs the same suite.

## Product behavior

Five guided tasks: resting hand, outstretched hand, tapping, experimental palm orientation, and spiral tracing. Results show actual traces, frequency bars, spatial density bins, tap cycles, quality checks, notes, and next-step context. Bad-quality recordings are saved as repeat-needed without health interpretation.

Personal and Review are **views of the same local journal**, not patient/clinician authentication. Review exposes protocol provenance, quality filtering, and technical details. No multi-patient database, cloud sync, clinician access control, or telemedicine service is claimed.

Recordings use IndexedDB; profile/settings use localStorage. No video or raw landmark frames are stored. Export important records: browser data can be cleared or evicted. A different browser, device, or origin has a different journal. Clearing local data is destructive and requires confirmation. JSON/CSV/PDF downloads may contain private notes; share deliberately.

## Measurement boundaries

Camera-v3 uses 21 estimated landmarks per hand, handedness labels instead of array positions, aspect-correct 2D geometry, recording-specific projected palm scale, observed timestamps, and gap checks. Engineering gates: 24 observed fps, 85% hand coverage, 8 seconds tracked, no gap over 250 ms, and stable projected hand size. These are not clinical thresholds.

Two-dimensional movement can reflect camera motion, voluntary movement, or landmark jitter. Palm rotation is an experimental orientation proxy, not a validated rotation count or severity score. More interpolated points would not establish better accuracy. No disease probability is shown.

The smartwatch model was trained separately: see [training documentation](../training/README.md). It is never applied to camera recordings. Legacy records are labeled and excluded from current-protocol trends.

## Installation, hosting, and offline

`npm run build` creates `dist/`. Serve it over HTTPS with unknown non-asset routes rewritten to `/index.html`. Camera access requires a secure origin (localhost is allowed for desktop development). Opening an HTTP LAN IP on a phone does not reliably permit camera access; use an HTTPS deployment for real-device tests.

Production includes a standalone manifest, icons, local fonts, lazy routes, and a versioned service worker. After a successful first load, the app shell, journal, reports, demo, and research report work offline. Video decoration and first-time MediaPipe model/WASM setup require a connection. Service-worker updates activate after existing app tabs close; no forced update interrupts recording. Development does not register the service worker.

On supported browsers use Install; on iPhone use Safari Share → Add to Home Screen. This is a PWA, not a published App Store application.

## Sources and release gates

- [MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)
- [PADS dataset and non-commercial license](https://physionet.org/content/parkinsons-disease-smartwatch/1.0.0/)
- [NINDS Parkinson’s information](https://www.ninds.nih.gov/health-information/disorders/parkinsons-disease)

Before medical/commercial deployment: obtain appropriate data/model rights, consented clinician-labeled webcam data, paired reference measurements, participant/device-held-out evaluation, prospective clinical review, privacy/security review, and physical-device validation. Dataset performance is not clinical accuracy.
