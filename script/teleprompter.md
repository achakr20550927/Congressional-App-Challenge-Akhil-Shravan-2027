# NeuraTrack — Production Script

**Runtime 2:52** · 489 words · 20 lines · 8 locations
**Cast:** AKHIL (10 lines, 255 words) · SHRAVAN (10 lines, 234 words) · one HCC participant (unscripted)

Lines are numbered **A1–A10** and **S1–S10** so the shooting order and the story order refer to the same thing.

Read at a normal talking pace. Timings assume ~185 words/minute, the pace the 2025 national winner used. Slow to 165 and you land at 3:09, which is over the limit.

---

## Locations

| # | Setting | Shots | Why there |
|---|---|---|---|
| **A** | Quiet study nook or library corner, warm lamp, dark simple background | 1 | Intimate. The cold open should feel like a kitchen table, not a campus tour |
| **B** | **Dwight A. Burrill Galleria** — two-story windowed atrium | 2, 3 | Daylight and depth behind you. Reads "real institution" |
| **C** | Student lounge / café seating | 9 | Where approachable people actually sit |
| **D** | Empty classroom or study room with a whiteboard | 12 | The algorithm explanation |
| **E** | Small quiet carpeted room, door closed | all screen capture + **all voiceover** | Echo kills audio. Never record VO in an atrium |
| **F** | **Health Sciences Building** hallway or lobby | 17 | Clinical context for free |
| **G** | **Science Engineering & Technology (SET)** building lobby | 15 | Clean modern backdrop for the two-device shot |
| **H** | **Horowitz Center** colonnade / campus green | 19, 20 | Wide, bright, institutional close |

I verified these buildings exist from public sources. I could not verify access or hours — confirm on the ground, and have a fallback for any locked door.

---

## Shooting order — by location

Shoot in this order, not story order. Group A/B/C/H while campus is alive and lit; E can be done at 2am.

### Block 1 — **C · Student lounge** · do this first, it expires
Shot 9. Everything else survives until midnight; willing strangers do not.

### Block 2 — **B · Galleria** (daylight)
Shots 2, 3. Two-shot and Akhil single.

### Block 3 — **H · Campus green / colonnade** (golden hour)
Shots 19, 20. The close.

### Block 4 — **F · Health Sciences** + **G · SET lobby**
Shots 17, 15. Two quick singles.

### Block 5 — **A · Quiet nook**
Shot 1. Needs dark, so do it after sunset.

### Block 6 — **D · Classroom whiteboard**
Shot 12.

### Block 7 — **E · Quiet room** (as late as you like)
All screen capture: shots 4, 5, 6, 7, 8, 10, 13, 14, 16, 18. Then every voiceover line in one sitting.

---

## The script — story order

### SHOT 1 · 0:00 · Location A — quiet nook
**On camera:** hand insert, then AKHIL single
**Camera:** Start tight on a hand at rest with a visible tremor. No UI, 3 seconds, hold still. Pull back to reveal the laptop with the mint skeleton tracking it live. Cut to Akhil, seated, chest-up, lamp off to one side.
**Audio:** First two sentences as voiceover over the hand. Cut to Akhil on camera at "His doctor asks."

> **A1 — AKHIL**
> My grandfather has Parkinson's. Between neurology visits — sometimes four months apart — his symptoms change, and nothing records it. His doctor asks how he's been doing, and the honest answer is that nobody knows.

*This is the whole video. If these fifteen seconds land, a judge watches everything after it differently. Don't perform it — say it the way you'd say it at a lunch table.*

---

### SHOT 2 · 0:11 · Location B — Galleria
**On camera:** BOTH, two-shot
**Camera:** Waist-up, both of you, standing. Glass and the second floor visible behind. Stand at least 6 feet off the window or you'll silhouette.

> **S1 — SHRAVAN**
> I'm Shravan Yoagentharan, this is Akhil Chakravarthy, and we're two of the four students who built NeuraTrack — Centennial High School, competing in Maryland's 7th District.

*Say "competing in" — don't say the school is in MD-07. It isn't.*

---

### SHOT 3 · 0:20 · Location B — Galleria
**On camera:** AKHIL single, then cut to screen
**Visual:** Title card "NeuraTrack" over `01-hero/dna-loop.mp4`, 2 seconds. Then the `/app` dashboard.

> **A2 — AKHIL**
> NeuraTrack measures hand movement using nothing but a camera. No wearable, no account, nothing uploaded. It's for people tracking a movement disorder between appointments — and for the neurologist who sees them twice a year and has to guess at the ten months in between.

*Required element: this is where you state the target audience. Don't trim that clause away.*

---

### SHOT 4 · 0:34 · Location E — screen capture
**On camera:** nobody · **Audio:** voiceover
**Visual:** One unbroken recording. Dashboard → "Resting hand" → Enable camera → **hold on the chip flipping `HAND NOT VISIBLE` → `HAND FOUND`** → 3-2-1 cover → the 10.0s countdown with "Live movement" drawing underneath.
**Setup:** Run `plan/check-camera.js` first. Seed the journal with `plan/seed-demo-data.js` before any shot showing history.

> **S2 — SHRAVAN**
> This is the resting-hand check-in. MediaPipe gives us twenty-one hand landmarks every frame, and we draw them live so you can watch tracking lock on.

---

### SHOT 5 · 0:43 · Location E — screen capture
**Visual:** Same take continuing. Countdown running, waveform drawing.

> **A3 — AKHIL**
> Ten seconds. The panel underneath is the actual motion of the hand, plotted in real time.

---

### SHOT 6 · 0:48 · Location E — screen capture
**Visual:** `Checking signal quality` → hard cut to the result. Zoom so the numbers are legible at phone size.

> **A4 — AKHIL**
> Peak frequency, five point zero hertz. Motion amplitude. Peak concentration — how much of the energy sits in one narrow band. And the frequency fingerprint, with the dominant peak highlighted.

*Read the numbers off your own screen. If your take says 5.2, say 5.2.*

---

### SHOT 7 · 0:57 · Location E — screen capture
**Visual:** 4s of the "Tap-by-tap" bars, then 4s of the spiral with the guide overlay.

> **S3 — SHRAVAN**
> Finger tapping counts taps and measures whether they shrink. Spiral trace compares your path against a perfect spiral. Five check-ins, same protocol every time.

---

### SHOT 8 · 1:05 · Location C — student lounge
**On camera:** AKHIL single, handheld
**Camera:** Looser, slightly moving. This should look less composed than the Galleria shots — that's the point.

> **A5 — AKHIL**
> We brought it to Howard Community College and handed it to people who'd never seen it.

---

### SHOT 9 · 1:10 · Location C — student lounge · **THE SHOT THAT EXPIRES**
**On camera:** the participant
**Camera:** Over their shoulder. Frame their hand, the skeleton tracking it, and the number appearing. Then turn the camera around for one sentence from them.

> **UNSCRIPTED** — one sentence, their own words. Do not write this for them.

**How to ask:** say it's for a congressional competition, say it takes ten seconds, say nothing is uploaded and no video is saved. All true, and it's the easiest consent conversation you'll have. Aim for someone 40+, ideally with a parent or grandparent who has a tremor. If they say no, ask the next person. You need one yes.

*The national winner used three testimonial voices. Past-winner advice says showing people already using your app raises your chances "exponentially." Nobody filming in a bedroom tonight can match this.*

---

### SHOT 10 · 1:18 · Location E — screen capture
**Visual:** `/history`. The trend reading 1.07 → 1.84 across 33 days, with the honest caption visible underneath.

> **S4 — SHRAVAN**
> Do it weekly and you get something that didn't exist before — a record you can hand your doctor.

---

### SHOT 12 · 1:25 · Location D — whiteboard
**On camera:** SHRAVAN at the board
**Camera:** Wide enough to see the whole drawing. Draw it in three strokes before you roll: a wiggly hand-motion trace → an arrow labeled **FFT** → a spectrum with one tall peak marked **5 Hz**. Then film yourself talking over it.

> **S5 — SHRAVAN**
> A tremor is periodic, so position tells you very little — frequency tells you everything. Here's how the number is actually made.

*Almost nobody does a whiteboard. It turns "we used signal processing" into visible understanding, which is literally what the Code criterion rewards.*

---

### SHOT 13 · 1:32 · Location E — screen capture
**Visual:** Your real editor, `app/src/lib/signal.js` open, cursor moving. One continuous capture — do not animate this.
**Cursor target:** scroll to the normalization and PCA section.

> **S6 — SHRAVAN**
> `signal.js` — three hundred forty-two lines of JavaScript, no dependencies. Normalize by palm size so distance from the camera doesn't matter, PCA for the axis the hand is really moving along—

*Required element: "JavaScript" is the coding language the rules ask for. Keep the word in.*

---

### SHOT 14 · 1:41 · Location E — screen capture
**Visual:** Cursor on `fftInPlace`, then the Hann window loop, then the parabolic interpolation lines.
**Audio note:** S6 ends on a dash and A6 picks it up. Record them back to back so the handoff sounds like one thought.

> **A6 — AKHIL**
> —then our own radix-two FFT. Hann window, zero-pad to a power of two, parabolic interpolation across the peak bin for sub-bin resolution.

---

### SHOT 15a · 1:48 · Location E — screen capture
**Visual:** Cursor on `recordingQuality()`. Let the thresholds be readable.

> **S7 — SHRAVAN**
> And before any of that runs, this quality gate. Low frame rate, dropped tracking, a gap over two hundred fifty milliseconds — we refuse to interpret the recording rather than guess at it.

**Optional cutaway:** `02-ios-screens/09-quality-gate-lets-get-clearer-recording.png` — the app actually declining to produce a number. An app that refuses is a flex.

---

### SHOT 15b · 1:58 · Location G — SET lobby
**On camera:** nobody · **Audio:** voiceover
**Visual:** Terminal showing `npm run test:signal` → `37 passed, 0 failed`. Then cut to the laptop and the iPhone side by side on a table, same screen on both.

> **A7 — AKHIL**
> Thirty-seven signal tests. And our Swift port for iPhone runs the same math — we check its output against browser fixtures to one part in a hundred million.

*Required element: "Swift" is your second coding language. Keep it.*

---

### SHOT 16 · 2:07 · Location E — screen capture
**Visual:** `/evidence`. Hold on the ROC curve.

> **A8 — AKHIL**
> We checked our feature pipeline against real patient data — PADS, on PhysioNet. Four hundred sixty-nine participants recorded on smartwatches; we analyzed three hundred ninety-eight. Nested cross-validation, ROC-AUC zero point eight seven four.

---

### SHOT 16b · 2:16 · Location E — screen capture
**Visual:** Scroll so the "What is not proven" panel is visibly on screen while Shravan speaks. The limitation should be readable, not just spoken.

> **S8 — SHRAVAN**
> And to be clear about what that is — it's a smartwatch research benchmark. It is never applied to your camera recording, and the app says so right here.

*Volunteering your own limitation is the strongest credibility move in the video. Every competing Parkinson's winner page names no dataset at all.*

---

### SHOT 17 · 2:25 · Location F — Health Sciences hallway
**On camera:** AKHIL single
**Camera:** Chest-up, hallway depth behind. **Do not stage a patient, do not wear scrubs.** An honest hallway shot is fine; a staged clinical encounter is fabrication.
**Visual:** Cut to one expert email held 3 seconds, readable, then a clean card with both names and affiliations.

> **A9 — AKHIL**
> Dr. Irene Litvan advised us on tremor measurement. Dr. Sarah Marie Brooker, a movement-disorders physician at Northwestern, reviewed our task list.

---

### SHOT 18 · 2:32 · Location E — screen capture
**Visual:** Zoom on the permanent caption under the live video — **"No raw video or hand landmarks are saved. Only derived measurements."** Then DevTools → Application → IndexedDB → `neuratrack`, showing the actual rows.

> **S9 — SHRAVAN**
> No account, no upload. Video and landmarks are discarded in memory — only the derived numbers persist, in your browser.

*Real database rows instead of an animated lock icon is the difference between asserting privacy and demonstrating it.*

---

### SHOT 19 · 2:38 · Location H — campus green
**On camera:** BOTH, two-shot, laptop between you
**Camera:** Wider than the Galleria shot. Golden hour, sun behind the camera. Relaxed — you're done.

> **A10 — AKHIL**
> NeuraTrack doesn't diagnose anything. It gives my grandfather and his neurologist a record that didn't exist before.

---

### SHOT 20 · 2:44 · Location H — campus green
**On camera:** BOTH

> **S10 — SHRAVAN**
> Shravan and Akhil, Centennial High School. Thanks for watching.

**END CARD · 2:47, hold 3s:**
NeuraTrack · **all four participants' full names** · Centennial High School · Maryland's 7th Congressional District · repo URL

**[2:52 END]**

---

## Akhil — line sheet

**A1** *(Loc A, on camera)* My grandfather has Parkinson's. Between neurology visits — sometimes four months apart — his symptoms change, and nothing records it. His doctor asks how he's been doing, and the honest answer is that nobody knows.

**A2** *(Loc B, on camera)* NeuraTrack measures hand movement using nothing but a camera. No wearable, no account, nothing uploaded. It's for people tracking a movement disorder between appointments — and for the neurologist who sees them twice a year and has to guess at the ten months in between.

**A3** *(VO)* Ten seconds. The panel underneath is the actual motion of the hand, plotted in real time.

**A4** *(VO)* Peak frequency, five point zero hertz. Motion amplitude. Peak concentration — how much of the energy sits in one narrow band. And the frequency fingerprint, with the dominant peak highlighted.

**A5** *(Loc C, on camera)* We brought it to Howard Community College and handed it to people who'd never seen it.

**A6** *(VO — picks up Shravan's S6 mid-sentence)* —then our own radix-two FFT. Hann window, zero-pad to a power of two, parabolic interpolation across the peak bin for sub-bin resolution.

**A7** *(VO)* Thirty-seven signal tests. And our Swift port for iPhone runs the same math — we check its output against browser fixtures to one part in a hundred million.

**A8** *(VO)* We checked our feature pipeline against real patient data — PADS, on PhysioNet. Four hundred sixty-nine participants recorded on smartwatches; we analyzed three hundred ninety-eight. Nested cross-validation, ROC-AUC zero point eight seven four.

**A9** *(Loc F, on camera)* Dr. Irene Litvan advised us on tremor measurement. Dr. Sarah Marie Brooker, a movement-disorders physician at Northwestern, reviewed our task list.

**A10** *(Loc H, on camera)* NeuraTrack doesn't diagnose anything. It gives my grandfather and his neurologist a record that didn't exist before.

---

## Shravan — line sheet

**S1** *(Loc B, on camera)* I'm Shravan Yoagentharan, this is Akhil Chakravarthy, and we're two of the four students who built NeuraTrack — Centennial High School, competing in Maryland's 7th District.

**S2** *(VO)* This is the resting-hand check-in. MediaPipe gives us twenty-one hand landmarks every frame, and we draw them live so you can watch tracking lock on.

**S3** *(VO)* Finger tapping counts taps and measures whether they shrink. Spiral trace compares your path against a perfect spiral. Five check-ins, same protocol every time.

**S4** *(VO)* Do it weekly and you get something that didn't exist before — a record you can hand your doctor.

**S5** *(Loc D, on camera at whiteboard)* A tremor is periodic, so position tells you very little — frequency tells you everything. Here's how the number is actually made.

**S6** *(VO — ends on a dash, Akhil picks it up)* `signal.js` — three hundred forty-two lines of JavaScript, no dependencies. Normalize by palm size so distance from the camera doesn't matter, PCA for the axis the hand is really moving along—

**S7** *(VO)* And before any of that runs, this quality gate. Low frame rate, dropped tracking, a gap over two hundred fifty milliseconds — we refuse to interpret the recording rather than guess at it.

**S8** *(VO)* And to be clear about what that is — it's a smartwatch research benchmark. It is never applied to your camera recording, and the app says so right here.

**S9** *(VO)* No account, no upload. Video and landmarks are discarded in memory — only the derived numbers persist, in your browser.

**S10** *(Loc H, on camera)* Shravan and Akhil, Centennial High School. Thanks for watching.

---

## Production notes

**Audio is the thing people get wrong.** Every voiceover line in Location E, one sitting, phone 8 inches from your mouth, door closed, soft furnishings in the room. Atriums and hallways echo and you cannot fix it in post. For on-camera lines outdoors, keep the phone close or record a separate audio take and sync.

**Light.** Outdoors, sun behind the camera. Indoors, face a window — never stand with one behind you. The Galleria is beautiful and will silhouette you if you stand against the glass.

**Screen capture at 1080p minimum** and zoom on every number you say aloud. Judges watch on laptops.

**Numbers are written out the way you say them.** "Radix-two," not "radix-2." "Zero point eight seven four," not "0.874." Reading digits off a page is where people stumble.

**Never film a monitor with a camera.** Capture the screen digitally and cut it in.

**Don't film:** a loading state, a console error, a camera-permission dialog, the `camera-unavailable` screen, the large-type text-overflow bug, or any of the four light-theme mockups in `05-mockups-DO-NOT-CLAIM-AS-APP/` — those are static concepts, not your running app.

**If you run long**, cut in this order:
1. **A2** — drop everything after "between appointments"
2. **A9** — cut Brooker, keep Litvan
3. **S4** — the trend is already visible on screen

That's 55 words, about 18 seconds. **Never cut S7** (the quality gate) or **Shot 9** (the HCC participant). Those two are what nobody else in your district will have.
