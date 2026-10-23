# NeuraTrack v3 — implementation and release status

## Delivered

- App-like responsive workspace with desktop sidebar, mobile navigation dock, local profile, Personal/Review views, and home-screen installation.
- Five-task capture lifecycle: camera permission, countdown, timed recording, quality checks, local save, repeat, cancellation, and camera-track cleanup. Spiral tracing brings the pad into view on mobile.
- Selected-hand identity, 21 real estimated landmarks, aspect-correct image geometry, timestamp-aware resampling, per-recording palm scale, and explicit rejection of unreliable recordings.
- Useful result evidence: time series with scrubber, spectrum bars, binned motion density, tap-cycle bars, spiral guide comparisons, units, quality provenance, and explanation without a disease score.
- Reopenable IndexedDB recordings, notes, JSON/CSV export, quality-aware history comparisons, and legacy-protocol labels.
- Rebuilt paginated PDF reports with local Unicode font, charts, quality details, and long notes; visually checked all three pages of a long-note fixture.
- Reconciled landing-page claims and linked interactive sample results. Native scrolling and pointer behavior; no scroll hijacking.
- Production service worker caches routes, local fonts, research report, and PDF dependencies. Fixed a Vary: Origin cache mismatch that prevented offline modules from loading.
- Updated dependencies, reproducible tests, GitHub Actions workflow, installation/hosting documentation, and dataset/license disclosures.

## Training completed

Command: `python3 training/benchmark_pads.py`.

398 participants, 3,980 PADS smartwatch recordings, 80 features, 287 fits. One row per participant; nested 5 outer / 3 inner stratified folds; train-only preprocessing; three candidate model families. The first 0.5 seconds of each recording are excluded per the dataset authors’ vibration-artifact guidance.

Simple baseline ROC-AUC **0.797**; expanded pipeline **0.874**. Participant-bootstrap 95% interval **0.834–0.910**. Final selected estimator: logistic regression. Report: `app/public/models/research-evaluation.json`. Local fitted artifact: `training/.cache/pads-research-model.joblib`. Raw data and fitted model are not committed.

This is smartwatch participant-condition classification, **not webcam diagnostic accuracy**. No PADS classifier is applied to camera or drawing results. Bootstrap intervals do not include retraining uncertainty. The dataset is CC BY-NC-SA 4.0; appropriate rights are needed before commercial reuse.

## Verification

- Final browser run: **38 passed, 10 explicitly skipped, 0 failed**. Production build succeeds.
- 37 signal checks, 8 measurement regression tests, and 2 storage/PDF tests.
- Browser suite: onboarding, return visits, deletion, view persistence, recordings/notes, JSON/CSV/PDF downloads, invalidated PDF regeneration, spiral success/retry, camera captures/cancellation/permission errors, route cleanup, accessibility scans, responsive widths, and production offline navigation.
- Four projects: Chromium desktop, Chromium mobile emulation, WebKit, Firefox. Camera fixture tests run in Chromium desktop/mobile only; ten other-engine camera cases are explicitly skipped.
- Real MediaPipe runtime and model loaded; a blank frame returned zero detected hands. This is an integration smoke test, not hand-tracking accuracy validation.
- Desktop/mobile dashboard and result screenshots inspected; long-note PDF rendered and inspected.
- Dependency audit: zero reported vulnerabilities.
- Figma mobile concept: https://www.figma.com/design/9hYP5MBViu5zX8rKZABrWu?node-id=4-2

## Boundaries before release

1. **Clinical validation remains undone.** Requires appropriately consented, clinician-labeled webcam data, paired reference measurements, independent participants/devices, locked test sets, and prospective review. No Parkinson’s detection accuracy can honestly be promised from this implementation.
2. **Physical-device testing remains required.** Browser emulation is not an iPhone/Android camera study. Verify lighting, handedness, occlusion, older devices, camera latency, interruptions, and home-screen install lifecycle.
3. **Local-first, not a cloud clinical service.** Personal/Review are presentation modes, not authenticated patient/clinician roles. No multi-patient backend, cloud sync, or access-control boundary is claimed. A cloud clinical workflow needs explicit hosting/auth/privacy decisions and security review.
4. **Storage is device/origin-specific.** Browser clearing or eviction can remove data; export important records. Camera model/WASM startup needs connectivity. Decorative video is not part of the offline shell.
5. **Localization is partial.** New workspace is English; older onboarding/settings retain partial Spanish.
6. Google Drive was disconnected; clinician notes could not be read. Existing clinical feedback has not been invented.
7. The research dataset’s non-commercial license is a commercial-launch gate, independent of software quality.

## Run

```sh
cd "/Users/akhil/CAC Neuratrack APP/app"
npm ci
npm run dev
```

Use the printed URL. `/demo` is a simulated preview; `/evidence` shows actual research metrics.

```sh
npm test
npx playwright install chromium firefox webkit
npm run test:e2e
npm run build
npm run preview
```
