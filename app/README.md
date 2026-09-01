# NeuraTrack v2.0

Camera-only neuromotor monitoring PWA. Built from `NeuraTrack_PRD.docx` and
`NeuraTrack_Design_System.docx`. Monitoring tool — not a diagnosis.

## Run it

```bash
cd app
npm install
npm run dev       # http://localhost:5173
npm run build     # production static build -> dist/
npm run preview   # serve the production build locally
npm run test:signal  # unit tests for the FFT/signal-processing core
```

Deploy `dist/` to any static host (Vercel, Netlify, GitHub Pages, Cloudflare
Pages) — there is no server or database. **Camera access requires HTTPS in
production** (localhost is exempt), so pick a host that gives you TLS for free
(all of the above do).

## What's implemented (maps to PRD §5 Full Feature List)

- Onboarding: consent gate, local-only profile, camera permission + hand-scale
  calibration with lighting check.
- All 5 tasks: rest tremor, postural tremor, finger-tap (with amplitude
  decrement), pronation-supination, spiral drawing (mouse/touch/trackpad).
- Bilateral (two-hand) tracking + asymmetry index wherever both hands are seen.
- Real FFT-based frequency/amplitude analysis (Hann-windowed, resampled onto a
  uniform grid to correct webcam frame jitter) — unit-tested in
  `src/lib/test-signal.mjs`.
- Real-time 3D hand skeleton (Three.js) with a calm-blue → hot-amber jitter
  heatmap, plus a data-driven 3D "tremor signature" phase-space plot per result.
- Local history in IndexedDB, trend charts, CSV export, and a client-side PDF
  clinician report (jsPDF) — no video/images ever included.
- Patient/Clinician mode toggle, large-text mode, reduced-motion (both
  system-level and manual), English + Spanish UI.
- Installable PWA with offline caching of the app shell, MediaPipe model, and
  fonts after first load.

## v2.1 — plain-language feedback update

- **Check-in rating**: every result now leads with a traffic-light tier
  (Steady / Keep an eye on it / Worth a conversation / Try again) in plain
  words, encoded by shape + color + text (never color alone). Stored on each
  saved record.
- **Education panel**: each result includes a "What can this mean?" section —
  benign causes (caffeine, stress, cold, fatigue, medicines) get equal billing
  with the patterns doctors actually watch for.
- **Recording quality gate**: fps + hand-visibility are measured per
  recording; low-quality recordings say so instead of presenting confident
  numbers, and very poor ones get a "Try again" rating.
- **Live steadiness chart fixed**: previously plotted the absolute
  fingertip-to-wrist distance (i.e., hand size — meaningless ~0.48 readings).
  Now plots detrended fingertip deviation as % of hand width.
- **Hand overlay alignment fixed**: the live skeleton is now drawn on a 2D
  canvas in video pixel coordinates (same layout + mirroring as the video),
  so it lands exactly on the hand. The 3D phase-space plot remains on the
  results card.
- **Slow-movement label**: dominant rhythms under ~3.5 Hz are now correctly
  described as ordinary slow movement/drift, not flagged as "atypical
  tremor" — this was the most common confusing result for healthy users.

## v2.2 — trained model

The app now ships an actual **trained model** (`public/models/neuratrack-model.json`,
~6 KB) instead of only the rule engine:

- Multinomial logistic regression, two heads — `signal_label` (steady /
  tremor_like / bradykinesia_like / irregular_motion / poor_quality) and
  `safety_rating` (steady / keep_an_eye / worth_conversation / try_again) —
  trained by `../training/train_classifier.py`.
- Runs fully on-device as a tiny JS forward pass (`src/lib/model.js`), no
  TensorFlow.js in the bundle. The forward pass is verified to match sklearn's
  probabilities exactly.
- The model drives the check-in rating, confidence, and a model-derived
  feature-importance breakdown; the rule engine still produces the precise
  descriptive copy and is the automatic fallback if the model file ever fails
  to load (offline-safe).
- A coherence guard prevents a reassuring finding from carrying an alarming
  rating without a concrete reason (asymmetry or low recording quality).

**Honesty:** this v1.0.0 model was trained on the provided workbook's
**synthetic** feature data (`is_synthetic=True`). It learned that generator's
rules, not verified patient physiology, and the app says so in clinician-mode
detail on every result. Held-out test accuracy is ~0.91 (signal) / ~0.86
(safety) against the synthetic labels. To make it a real clinical tool,
retrain on a labeled real dataset with the same pipeline (see
`../training/README.md`) — no app code changes needed.

## v2.2 — real-data model + trend intelligence

- **Real PADS-trained model.** `training/train_pads_real.py` extracts
  sensor-transferable features (dominant frequency, spectral concentration,
  3–7 Hz tremor-band power ratio) from the **real** PADS smartwatch dataset
  (PhysioNet: 79 Healthy vs 319 Parkinson's / Essential-Tremor / Atypical
  patients) and trains a logistic-regression tremor-reference model, exported
  to `app/public/models/neuratrack-pads-model.json` and run in-browser by
  `src/lib/model.js` (no TensorFlow.js). Honest held-out metrics, **subject-
  level split** (no leakage): ROC AUC **0.80 per person across tasks**, 0.67
  per single recording. It runs as a labeled cross-check on the rest/postural
  tasks; the rule engine still drives the finding + rating (it's calibrated to
  real webcam feature scales). The current model is selected with 5-fold,
  stratified subject-level cross-validation and then refit on all 3,980 usable
  recordings from 398 PADS participants; its aggregated participant AUC is
  **0.733**. Retrain with `cd training && python3
  train_pads_real.py`.
- **Trend intelligence** (`src/lib/trends.js`): per-task longitudinal read —
  stable vs. a real trend (only flagged when the modeled change exceeds the
  person's own session-to-session variability), change-point detection, and a
  tracking streak. Shown as a card on History when a single task is selected.
- **Landing impact band**: access-gap + real-model-validation stats, sourced
  and honestly disclaimed.
- **Accessibility showcase** in Settings: a judge-facing panel making the
  built-in a11y (WCAG AA contrast, shape-not-color, 44px targets, keyboard/SR,
  reduced motion, EN/ES) explicit.

Why the earlier synthetic model was demoted: it was trained on the workbook's
`is_synthetic=True` data whose `spectral_concentration` scale didn't match real
webcam values, so it collapsed to "steady" on real recordings. The PADS model
uses only features that physically transfer between a wrist sensor and a
webcam fingertip track, which is why it works on real inputs.

## v4.0 — "Bioluminescent" DNA-video landing

Complete landing redesign around the user-supplied DNA loop
(`public/media/dna.mp4`, portrait 1080×1920, 5.1s seamless loop):

- **The video is a fixed, full-viewport background behind the ENTIRE page** —
  object-fit: cover centers the strand mid-screen; every section scrolls over
  it. It loops continuously, drifts subtly with the pointer, and **scroll
  velocity drives its playbackRate** (1.0× idle → ~2.6× under fast scroll,
  settling back when you stop) — verified live.
- **Theme sampled from the video itself**: near-black navy `#050B14`, ocean
  `#16273E`, ice cyan `#8FD9FF`/`#D7F0FF`. Scoped to `.lv4` — the in-app
  screens keep the light Calm Precision system.
- Hero headline uses `mix-blend-mode: exclusion` so the strand's bright coils
  invert through the letterforms; sections are dark glass (blur + cyan
  hairlines); scrolly steps get a glowing cyan progress line.
- **Cursor fixed**: v1's thin ring was effectively invisible. v2 is a white
  five-petal flower glyph + dot with `mix-blend-mode: exclusion` (visible on
  any background), spring-trailing with a slow spin, growing on interactive
  targets. Off on touch/reduced-motion.
- Autoplay resilience: muted+playsinline autoplay plus a retry on first
  pointer/key/wheel/touch interaction for strict webviews.
- The previous Three.js helix (`NeuralHelix.jsx`) and `CinematicBand.jsx`
  remain in the repo but are no longer used by the landing.

Note: the Figma MCP connector reads existing Figma files (none was provided)
and cannot generate assets — the flower cursor is a hand-drawn inline SVG.

## v3.0 — dynamic UI overhaul

A full motion redesign of the marketing/landing surface, keeping the light,
neutral "Calm Precision" palette but making it genuinely dynamic:

- **Real-time scroll-driven 3D hero** (`components/motion/NeuralHelix.jsx`): a
  neural double-helix of glowing nodes rendered in Three.js that rotates on its
  X-axis and pushes the camera through as you scroll — the "DNA rotating on
  scroll" effect, done in real time so it's crisp, themeable, and free. Pauses
  rendering when scrolled offscreen (IntersectionObserver) for battery/perf.
- **Custom cursor + magnetic buttons** (`CursorFX.jsx`, `Magnetic`): a trailing
  ring + tracked-point dot echoing the brand mark; buttons pull toward the
  cursor. Auto-disabled on touch and under `prefers-reduced-motion`.
- **Buttery smooth scroll** via Lenis (`SmoothScroll.jsx`), reduced-motion safe.
- **Scrollytelling** how-it-works with a scroll-drawn progress line and
  per-step reveal; **word-by-word headline rise**; **count-up impact stats**;
  **auto-marquee** task strip; morphing sticky nav; grain + gradient-mesh.
- **Cinematic image bands** (`CinematicBand.jsx`) using two on-brand images
  generated via Higgsfield's `z_image` model, matched to the palette
  (`public/media/helix.webp`, `hand.webp`), with parallax + scrim.
- Dashboard task cards get staggered entrance + hover-lift.

Toolkit: `motion` (framer-motion) + `lenis`. All motion respects
`prefers-reduced-motion`. `WordRise` uses a CSS keyframe (framer animates
percentage-y transforms unreliably).

**On the requested Higgsfield VIDEO:** video models (kling, etc.) are gated
behind a paid Higgsfield plan — on the free plan they return
`job_minimum_basic_plan_required` regardless of credits, so no video was
generated. The real-time Three.js hero delivers the same "rotating helix on
scroll" concept (arguably better: interactive, crisp, zero cost). Image
generation *is* free-eligible (`z_image`, ~0.15 credits each) — that's what the
two cinematic bands use. To add a scroll-scrubbed video later, upgrade to a
Basic plan, generate a seamless clip, and drop it into a `<video>` layer in the
hero with its `currentTime` driven by `scrollYProgress`.

**On Figma for image generation:** the Figma MCP tools are for *reading* Figma
designs (Dev Mode), not generating images — Figma has no image-generation API.
On-brand imagery here comes from Higgsfield `z_image` instead.

## Scroll-scrubbed DNA background (landing v4.1)

The landing's DNA video (`public/media/dna.mp4`) never autoplays. It is a
scroll-scrubbed film strip: whole-page scroll progress maps to
`video.currentTime` (lerped, and seeks are throttled with `!video.seeking` so
the decoder is never overwhelmed). Still when you stop, winds as you scroll.
Reduced-motion shows the static first frame.

**Optional but recommended:** re-encode the clip all-intra so every frame is a
keyframe — this is the standard trick that makes scrub videos butter-smooth,
at the cost of a larger file:

```bash
ffmpeg -i dna.mp4 -an -g 1 -crf 23 -movflags +faststart dna-scrub.mp4
```

Then replace `public/media/dna.mp4` (or update the `src`).

## Scope decisions worth knowing about

1. **The shipped model is trained on synthetic data** (see the v2.2 section
   above). It's a real trained classifier with an honest evaluation, but its
   training labels came from a synthetic generator, not verified patients —
   disclosed in-app. Retrain on a real labeled dataset to make it clinical.
   The rule engine remains as the offline fallback and still produces the
   descriptive copy. Labels are always signal-descriptive, never a diagnosis.
2. **Pronation-supination** is measured via thumb-tip lateral displacement (a
   webcam has no depth/IMU sensor to directly measure forearm rotation) —
   a reasonable, literature-adjacent proxy, not a lab-grade goniometer reading.
3. Config (profile, language, calibration, consent) lives in `localStorage`;
   Session/TaskResult history lives in IndexedDB. Both are "this device only,"
   just split by access pattern (small keys vs. queryable records).

## Before you ship this

- **App icons**: `public/icons/*.png` are placeholder-quality renders of the
  brand mark generated programmatically. Swap in your final art if you want a
  polished install icon.
- **Test on a real camera**: I built and smoke-tested every screen in a
  sandboxed browser with no camera, which exercises the full UI and the
  camera-denied recovery path but not live hand-tracking. Before your demo,
  run through all 5 tasks on your actual laptop/phone camera.
- **Cross-browser pass** (PRD §13.2): try Chrome, Safari, and Android Chrome
  at least once each — Safari's WASM/GPU fallback path is implemented but
  untested on real Safari.
- **Pilot feedback** (PRD §13.4): the PRD calls for testing with 2-3 real
  users early, not at the end.
- If you want the *real* trained classifier eventually, that's a separate,
  standalone offline project: pull mPower/PADS, extract the six features in
  `FEATURE_ORDER` (classifier.js), train a small model, export it with the
  TensorFlow.js converter, and swap `loadClassifier()`'s return value.
