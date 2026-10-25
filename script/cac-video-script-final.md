# NeuraTrack — Final CAC Video Script

Target 2:50. Hard ceiling 3:00. Companion to [cac-video-playbook.md](cac-video-playbook.md).

Every claim below was checked against the source. Narration word counts assume ~150 wpm. Total narration ≈ 392 words ≈ 2:37, leaving ~15s for title cards and breathing room.

> **District: MD-07, and the phrasing matters.** You registered in MD-07 because two teammates live there — that's a valid basis under the rules, which let you compete where you live *or* attend school. But Centennial High School is in MD-03, so never say "Centennial High School in Maryland's 7th District." That single sentence would be false, and a local MD-07 panel is exactly the audience that would catch it. The script below says "at Centennial High School, competing in Maryland's 7th District" — accurate, and it keeps the two facts separate.
>
> **Name all four participants.** The rules require participants' names in the video. Only you two are on camera, which is fine — but your two MD-07 teammates are registered participants *and* they are the reason MD-07 is your district. If the video names only two students, both from MD-03, the submission reads as inconsistent with its own registration. Fix: put all four names on the end card, and have Shravan say "a four-person team." Costs you two seconds and closes the gap entirely.

---

## Claims audit — fix these before you say them on camera

Your V2 script contains six statements the code does not support. This is the part that matters most, because a judge who checks your repo and finds the narration overstated it does more damage than a plain video.

| V2 script said | Reality in the code | Say instead |
|---|---|---|
| "validated our signal processing against the PADS dataset — real de-identified data from 469 Parkinson's patients… our metrics are grounded in actual clinical recordings" | PADS has 469 participants; the benchmark analyzed **398**. And it validates a **smartwatch** condition classifier — `webcamValidated: false`, `deployment: "Research only. Not used to classify webcam recordings."` It is never applied to a camera recording. | "469 participants in PADS, we analyzed 398. It's a smartwatch benchmark — it is not applied to your camera recording." |
| "React, MediaPipe, **Chart.js**, Python/scikit-learn, IndexedDB" | chart.js and three.js are in `package.json` but **never ship** — no chunk is emitted in the production build. Every chart is hand-written SVG in `components/EvidenceCharts.jsx`. | Drop Chart.js. "Hand-written SVG charts and a hand-written FFT" is both truer and a stronger answer on the Code criterion. |
| "four standard clinical motor tasks" | There are **five** (`TASKS` in `lib/measurements.js:3-9`). | "Five check-ins." |
| "rest **and** postural tremor — detecting involuntary oscillations with the hand at rest or held against gravity" | `rest` and `postural` run **identical math**. Only the instruction text differs. No gravity-specific processing. | Show one of them. Don't imply two analyses. |
| "finger tapping **and pronation-supination** — measuring rhythm, speed, and whether movement decays over time" | Decrement is a **tapping-only** metric, and `null` under 6 cycles. Pronation computes a palm-normal z-component; its own `units` string reads `"unitless palm-normal orientation proxy (experimental)"` and the result headline is "An experimental orientation measurement." | Attribute decrement to tapping only. Either cut pronation or call it experimental. |
| "turns any laptop or phone camera into a quantitative neuromotor assessment tool" | Jargon. Judges are specified as having "basic familiarity with computer programming," not neurology. | "Measures hand movement using nothing but your camera." |

Three more traps the audit flagged that aren't in your V2 but are easy to drift into while narrating:

- **Never say "AI model analyzes your hand."** No model runs in the shipped app. `classifier.js`, `interpretation.js`, `model.js`, `trends.js` are unimported dead code, and `classifier.js:166` would refuse to run anyway. It's FFT plus thresholds — say that.
- **Never say "detects trends" or "tells real change from noise."** The trend logic lives in the dead `trends.js`. The running app plots raw points under the caption "A change is not a diagnosis or proof of improvement."
- **Never say "fully offline."** The shell works offline, but first camera use downloads the MediaPipe WASM + model from jsDelivr and Google CDNs. Say "nothing is uploaded" — which is airtight — not "works offline."

Also: the Landing page proof strip says "42 landmarks across two hands." `selectHand()` picks **one** hand and everything downstream analyzes **21** landmarks. Don't read that number off your own landing page.

---

## The script

### ACT I — 0:00–0:17 · Cold open
*Buys: Ideology, rules compliance*

**VISUAL:** Tight on a hand at rest, slight tremor, no UI. 3s. Pull back to reveal the laptop running `/capture/rest` with the mint 21-point skeleton tracking it live. Cut to both of you.

> **AKHIL:** "My grandfather has Parkinson's. Between neurology visits — sometimes four months apart — his symptoms change, and nothing records it."
>
> **SHRAVAN:** "I'm Shravan Yoagentharan, this is Akhil Chakravarthy, and we're two of the four students who built NeuraTrack — Centennial High School, competing in Maryland's 7th District."

### ACT II — 0:17–0:30 · What it is
*Buys: Ideology, Impact*

**VISUAL:** Title card "NeuraTrack" over the `/welcome` DNA loop (2s), then the `/app` dashboard — "FIVE WAYS TO CHECK IN."

> **AKHIL:** "NeuraTrack is a web app that measures hand movement using nothing but your camera. It's for people tracking a movement disorder between doctor visits. No wearable, no account, no upload."

### ACT III — 0:30–1:13 · Live demo, uncut
*Buys: Function, UI — this is where you prove it isn't a mock-up*

**VISUAL:** One continuous screen recording. Dashboard → "Resting hand" → Enable camera → **hold on the chip flipping `HAND NOT VISIBLE` → `HAND FOUND`** → 3-2-1 cover → the 10.0s countdown with the "Live movement" waveform drawing underneath → `Checking signal quality` → hard cut to the result.

> **SHRAVAN:** "This is the resting-hand check-in. MediaPipe gives us twenty-one hand landmarks per frame, and we draw them live so you can watch tracking lock on."
>
> **AKHIL:** "Ten seconds. The panel underneath is the actual hand motion, plotted in real time."

**VISUAL:** Result view. Zoom so the numbers are legible.

> **AKHIL:** "Peak frequency, four-point-nine hertz. Motion amplitude. Peak concentration — how much of the energy sits in one narrow band. And the frequency fingerprint, with the dominant peak highlighted."
>
> **SHRAVAN:** "Finger tapping counts taps and measures whether they get smaller. Spiral trace compares your path against a perfect spiral."

**VISUAL:** 4s of the tap "Tap-by-tap" bars, 4s of the spiral with the guide overlay.

> Read the real numbers off your own screen. If the recording says 5.2 Hz, say 5.2.

### ACT IV — 1:13–1:48 · Code walkthrough
*Buys: **Code** — the 5 points your V2 script scored ~1 on*

**VISUAL:** Your actual editor. `app/src/lib/signal.js` open, cursor moving, scrolling to each function as it's named. One continuous screen capture, voice over. Do not animate this.

> **SHRAVAN:** "Here's how that number is made. `signal.js` — 342 lines, no dependencies."
>
> **SHRAVAN:** "A tremor is periodic, so we work in the frequency domain. Normalize by palm size so distance from the camera doesn't matter, PCA for the axis the hand is actually moving along—"
>
> **AKHIL:** "—then our own radix-2 FFT. Hann window, zero-pad to a power of two, and parabolic interpolation across the peak bin so we get sub-bin frequency resolution."
>
> **SHRAVAN:** "Before any of that runs, this quality gate. Low frame rate, dropped tracking, a gap over 250 milliseconds — we refuse to interpret the recording rather than guess at it."
>
> **AKHIL:** "Thirty-seven signal tests. And our iOS port runs the same math — we check the Swift output against browser fixtures to one part in a hundred million."

**Cursor targets, in order:** `fftInPlace` · the Hann window loop · the parabolic-interpolation lines · `recordingQuality()` · then a terminal showing `npm run test:signal` → `37 passed, 0 failed`.

The last two beats are what separate a 4 from a 5. A quality gate that *refuses* to produce a number is a judgment call you can defend, and cross-platform numerical parity at 1e-8 is a thing almost no high-school submission has.

### ACT V — 1:48–2:20 · Validation and experts
*Buys: Impact, Function*

**VISUAL:** `/evidence` — "THE EVIDENCE ROOM / Transparency is a feature." Hold on the ROC curve, then scroll to the "What is not proven" panel so the limitations are visibly on screen while Shravan speaks.

> **AKHIL:** "We also checked our feature pipeline against real patient data. PADS, on PhysioNet — 469 participants recorded on smartwatches. We analyzed 398. Nested cross-validation, ROC-AUC 0.874, bootstrap interval 0.834 to 0.910."
>
> **SHRAVAN:** "And to be clear about what that is — it's a smartwatch research benchmark. It is never applied to your camera recording, and the app says so right here."

**VISUAL:** One expert email, held 3 seconds, readable. Then a clean card with both names and affiliations.

> **AKHIL:** "Dr. Irene Litvan advised us on tremor measurement. Dr. Sarah Marie Brooker, a movement-disorders physician at Northwestern, reviewed our task list."

Two experts with a concrete consequence each, not five names. Volunteering the limitation yourself is the strongest credibility move in the video — it tells a judge you understand your own result.

### ACT VI — 2:20–2:50 · Privacy, scope, close
*Buys: Impact, Structure*

**VISUAL:** Back on `/capture/rest`, zoomed on the permanent caption under the video: **"No raw video or hand landmarks are saved. Only derived measurements."** Then DevTools → Application → IndexedDB → `neuratrack`.

> **SHRAVAN:** "No account, no upload. Video and landmarks are discarded in memory — only the derived numbers persist, in your browser's IndexedDB."

**VISUAL:** Both of you, laptop between you.

> **AKHIL:** "NeuraTrack doesn't diagnose anything. It gives my grandfather and his neurologist a record that didn't exist before."
>
> **SHRAVAN:** "Shravan and Akhil, Centennial High School. Thanks for watching."

**VISUAL:** End card, held 3s — NeuraTrack · **all four participants' full names** · Centennial High School · Maryland's 7th Congressional District · repo URL. Set the two on-camera names first, the other two teammates below them; no need to label who spoke.

Showing the real IndexedDB rows rather than an animated lock icon is the difference between asserting privacy and demonstrating it.

---

## Filming notes from the audit

**Seed the journal before you film anything with history in it.** The dashboard trend needs ≥2 quality-passed `rest`/`Right`/`camera-v3` records or it renders "Your trend appears after two recordings." There's no in-app seeder. Run `npm run dev`, open DevTools, and run this 6–8 times:

```js
const {saveTaskResult} = await import('/src/lib/storage.js');
const {sampleResult} = await import('/src/screens/Recording.jsx');
await saveTaskResult({...sampleResult(), notes:'Reference note for export.'});
```

Dynamic `/src/...` imports only resolve in dev mode, not against a production build. Values come out near-identical, so vary `rmsAmplitude` if you want a visible slope. **Do not narrate seeded data as "my real recordings."**

**Keep the task names consistent with whatever screen is on camera.** The landing page pulls different strings from `i18n/strings.js` ("Rest Tremor", "Finger Tap") than the rest of the app ("Resting hand", "Finger tapping"). Mismatched narration looks like you're reading from a different app.

**Fallback if the camera misbehaves on the day:** `/demo` produces a clean synthetic 5 Hz result that always looks right, with a visible "simulated data" banner. Use it only as a fallback — a live camera take is worth more on Function.

**For a phone-shaped frame without a phone:** the "Phone preview" toolbar button in `Layout.jsx` renders the app at 430px, or `npm start` opens the Electron window at the same width with no browser chrome.

**The iOS port is worth 5–8 seconds** near the Act IV parity line — `ios/build/Native-Welcome.png` and the native Analysis screen are the best-looking frames in the repo. The Simulator has no camera, so film welcome → dashboard → sample result only; live capture needs a physical iPhone and your own signing team. Don't spend deadline-night time on this unless Act IV is already recorded.

**Don't film:** the dead components (`SignalLattice`, `motion/*`, `CameraCalibration`), the legacy `neuratrack-model.json` (labeled `1.0.0-synthetic`), or the Personal/Review toggle framed as a clinician portal — it's a presentation toggle over the same local journal, with no auth or multi-patient storage.

---

## Recording order for tonight

1. **Act IV, the code walkthrough.** 30 min. Highest point value, and you want to be sharp for it.
2. **Act III, live capture.** 45 min. Seed first. Take the clean take.
3. **Act V**, `/evidence` screen capture. 10 min.
4. **Acts I, II, VI** — faces and voiceover. 30 min.
5. **Edit.** 60–90 min. Cut on sentences.
6. **Upload Public**, title `NeuraTrack — Shravan Yoagentharan & Akhil Chakravarthy | Congressional App Challenge 2026`.
7. **Submit well before 12:00 PM ET.**
