# NeuraTrack — CAC Shooting Script (HCC production)

Companion docs: [cac-video-playbook.md](cac-video-playbook.md) (rubric + research), [cac-video-script-final.md](cac-video-script-final.md) (claims audit — still binding, read it).

**Runtime target: 2:50.** Rules say 1:00–3:00, and *"Video submissions which do not adhere to the time constraints may be penalized by the judges at their discretion."*

### The six elements the rules require in the video

Verbatim from the 2026 rules, §4. Miss one and you've dropped points for nothing.

| # | Required | Where it lands below |
|---|---|---|
| 1 | The name(s) of each participant | Act 1 (spoken, two) + end card (all four) |
| 2 | The name of the app | Act 1 |
| 3 | Purpose, **in one clear sentence** | Act 2, first sentence |
| 4 | Target audience | Act 2, second sentence |
| 5 | **The tools and coding languages used** | Act 3 (MediaPipe) + Act 4 (JavaScript, Swift) |
| 6 | Showcase the functionality | Act 3 |

Element 5 is the one that's easy to fluff — naming a library is not naming a language. The script says **JavaScript** and **Swift** out loud in Act 4. Keep those words in.

---

## What I actually did and did not analyze

Straight about the limits, because you should know how much weight to put on this.

**I cannot watch video.** No editing, pacing-of-cuts, or color judgments from me.

**The past-winners page has no videos on it.** I checked. `congressionalappchallenge.us/students/past-winners/` is eleven year-links; each year is a table of districts; each district page is a *press release* with the student's written quotes. No embedded players, no video links. There is no page where anyone can watch all winner videos — they're scattered across individual members' press releases, and most were never published at all.

**What I did get:** the complete narration of the **2025 overall national winner** (WaterWise, Advika Rastogi, KY-02, 3:06), captured by playing it with captions on and scraping the caption track. Plus the written descriptions and student quotes from the Parkinson's-adjacent district winners. That's one deeply-analyzed winning script, not two hundred. Everything below is labeled by evidence strength.

---

## What the national winner's script actually does

Reconstructed structure of the 3:06 winner, with timings:

| Segment | Share | What happens |
|---|---|---|
| Name, app name, purpose | ~0:15 | "Hello, my name is Advika Rastogi and this is my app, WaterWise, a **Kentucky-built** system addressing… water scarcity and inefficient irrigation." |
| Problem + statistic | ~0:25 | "agriculture consuming nearly 70% of the world's fresh water… guesswork isn't just inefficient, it threatens food security." |
| Technical approach | **~1 sentence** | "I built a model that combines machine learning and differential equations to predict exactly when crops need water." |
| **Guided demo** | **~1:40 — over half the video** | Screen-by-screen tour: login, homepage, drought map, analysis tool, prediction, dashboard, community forum, education section, quiz, impact page. |
| **Third-party testimonials** | ~0:20 | Three other people's voices praising the app. |
| Impact close | ~0:20 | Global stat + "sustainable water use can start **right here at home**." |

### Five things I'd actually change because of this

1. **The demo should be the majority of your runtime.** The winner gave it 54%. Your V2 gave it ~33%. This also loads the Function and UI criteria, which are 10 of 30 points.

2. **The code explanation is where you can beat the national winner outright.** They spent *one sentence* on technical approach. The rubric's 5-point Code descriptor is "Explanation of code indicates immense understanding." The national winner would have scored maybe a 3 there. This is open ground.

3. **Get other people on camera using it.** The winner used three testimonial voices, and separate past-winner commentary says showing people already using your app raises your chances "exponentially." **You are standing on a community college campus.** Nobody else submitting this year has easier access to willing adult strangers. This is your single biggest unique advantage tonight — see §Unique Moves.

4. **Weave the district through, don't state it once.** The winner says "Kentucky-built," "Kentucky farmers," "right here at home." You have a complication here (school in MD-03, registered MD-07), so you can't lean on the school. Lean on Maryland and on the person — your grandfather.

5. **You can talk faster than I first budgeted.** The winner runs ~185 words per minute. My earlier 150 wpm estimate was conservative. At 185 wpm, 2:50 is roughly **520 words**, not 390. The script below uses that.

### The competitive fact that should worry you

**MeloCognia** won Illinois-16 with this, verbatim from their winner page:

> "The inspiration behind MeloCognia comes from my grandpa's experience with Parkinson's."

Plus wanting an app that "doesn't require complex equipment, expensive procedures, or multiple specialist visits."

That is your cold open and your no-wearables pitch, already a winning entry. Three other Parkinson's apps won districts recently too. **The grandfather story gets you to parity, not ahead.**

What MotionBloom, MeloCognia, and Synapse Match pages name for tools, languages, datasets, or consulted experts: **nothing.** Not one. That's the gap you walk through — the code walkthrough, PADS, and two named clinicians.

---

## Unique moves — things only you can do, ranked

**1. Film a real stranger using it. (Do this first; it is the highest-value shot available.)**
Student lounge or the two-story windowed atrium. Ask an adult — ideally 40+, ideally someone with a parent or grandparent with a tremor — to do one 10-second resting-hand check-in. Film over their shoulder: their hand, the skeleton tracking it, the number appearing. Get one clean sentence from them on camera.

Why it beats everything else: the rubric's top Impact descriptor rewards impact being *explained*; a real user demonstrates it instead. The national winner did exactly this with three voices. No bedroom-filmed submission can match it.

Ask permission plainly, say it's for a congressional competition, say nothing is uploaded and no video is saved — which is true and is the easiest consent conversation you'll ever have. If they decline, ask the next person. You need one yes.

**2. Whiteboard the FFT in an empty classroom.**
Find an unlocked classroom or study room with a whiteboard. Draw it in three strokes: wiggly hand-motion trace → arrow labeled "FFT" → a spectrum with one tall peak at 5 Hz. Talk over it.

Almost nobody does this. It converts "we used signal processing" into visible understanding, which is literally the Code criterion's language. Costs ten minutes.

**3. Shoot the clinical-context frame in the Health Sciences building.**
HCC has a Health Sciences Building with labs for nursing and allied health training. If a hallway, lobby, or open lab is accessible, one establishing shot there frames NeuraTrack as a clinical-adjacent tool for free. Do not stage a fake patient or wear scrubs — that's fabrication. An honest hallway shot is fine; a staged clinical encounter is not.

**4. Side-by-side laptop and iPhone running the same app.**
You have a real SwiftUI port that matches the browser math to 1e-8. Put both devices in one frame. Cross-platform parity in a single shot, no narration needed beyond one clause.

**5. The outdoor close on the campus green.**
The Horowitz Center's entrance colonnade and the campus green give you a wide, bright, institutional-looking final frame. Shoot the closing two-shot there in daylight.

---

## Locations at HCC

I verified these exist from public sources; I could not verify current access, hours, or naming, so confirm on the ground.

| Need | Place | Why | Watch for |
|---|---|---|---|
| Cold open, intimate | Quiet study nook, warm lamp | Tight, soft, personal. Beats a bright atrium for the grandfather line. | Keep background dark and simple |
| Both of you, intro | **Dwight A. Burrill Galleria** — two-story windowed atrium | Depth + daylight behind you reads "real institution" | Stand 6+ ft off the glass or you'll silhouette |
| Real user shot | Lounge / atrium seating | Where approachable people actually sit | Get verbal consent on camera |
| Screen capture | Any quiet room | Record screen separately, voiceover later | Never film a monitor with a camera |
| Whiteboard | Empty classroom / study room | Code explanation | Check the room isn't booked |
| Clinical frame | **Health Sciences Building** | Context for free | Don't stage a patient encounter |
| Tech backdrop | **Science Engineering and Technology (SET) building** | Modern, clean | Daylight hours |
| Close | **Horowitz Center** colonnade / campus green | Wide, bright, institutional | Golden hour; avoid midday overhead sun |

**Light and sound, in order of how much they'll cost you:**
- Audio first. Record voiceover indoors on a phone held 8 inches away, in a small carpeted room. Atriums are echo chambers — never record final voiceover in one.
- Outdoors: shoot with the sun behind the camera, not behind you.
- Indoors: face a window. Never stand with a window behind you.
- Screen capture at 1080p minimum, and zoom on any number you say aloud.

---

## The script — 2:50

**489 words of narration.** Every claim checked against the source. **Read the claims audit in [cac-video-script-final.md](cac-video-script-final.md) before recording.**

### Timing — read this, it's tight

| Your pace | Narration | + ~12s of title card, soundbite, holds | Verdict |
|---|---|---|---|
| 200 wpm (fast) | 2:26 | **2:38** | comfortable |
| 185 wpm (the national winner's pace) | 2:38 | **2:50** | on target |
| 165 wpm (nervous, careful) | 2:57 | **3:09** | **over the limit** |

Most people slow down on camera. If you read this at a careful, deliberate pace you will blow past 3:00, and the rules say late videos "may be penalized by the judges at their discretion."

**Time yourself reading it aloud before you record anything.** If you land over 2:50, cut in this order:

1. Akhil's Act 2 line (45 words, the longest in the script) — drop the clause after the em-dash: end at "between appointments."
2. The expert line in Act 5 (21 words) — cut Brooker, keep Litvan.
3. Shravan's Act 3 closing line (19 words) — the trend point is already visible on screen.

That's 55 words, about 18 seconds. **Never cut** the quality-gate line or the real-user shot.

### 1 · 0:00–0:16 — Cold open
**Location:** quiet nook, warm lamp, dark background. Then two-shot in the Galleria.
**Visual:** Tight on a hand at rest with a slight tremor, 3s, no UI. Pull back to the laptop with the mint skeleton tracking it live. Cut to both of you.

> **AKHIL:** "My grandfather has Parkinson's. Between neurology visits — sometimes four months apart — his symptoms change, and nothing records it. His doctor asks how he's been doing, and the honest answer is that nobody knows."
>
> **SHRAVAN:** "I'm Shravan Yoagentharan, this is Akhil Chakravarthy, and we're two of the four students who built NeuraTrack — Centennial High School, competing in Maryland's 7th District."

*The added third sentence is the differentiator from MeloCognia: not "my grandfather has Parkinson's" but "the measurement doesn't exist."*

### 2 · 0:16–0:34 — What it is
**Location:** Galleria, two-shot. **Visual:** Title card "NeuraTrack" over `01-hero/dna-loop.mp4` (2s), then `/app`.

> **AKHIL:** "NeuraTrack measures hand movement using nothing but a camera. No wearable, no account, nothing uploaded. It's for people tracking a movement disorder between appointments — and for the neurologist who sees them twice a year and has to guess at the ten months in between."

### 3 · 0:34–1:42 — Demo, 68 seconds
**Location:** screen capture + the real-user shot. **This is the longest block on purpose.**

**Visual:** One continuous recording. Dashboard → "Resting hand" → Enable camera → **hold on `HAND NOT VISIBLE` → `HAND FOUND`** → 3-2-1 → the 10.0s countdown with "Live movement" drawing underneath → `Checking signal quality` → hard cut to result.

> **SHRAVAN:** "This is the resting-hand check-in. MediaPipe gives us twenty-one hand landmarks every frame, and we draw them live so you can watch tracking lock on."
>
> **AKHIL:** "Ten seconds. The panel underneath is the actual motion of the hand, plotted in real time."

**Visual:** Result view, zoomed so numbers are legible.

> **AKHIL:** "Peak frequency, five point zero hertz. Motion amplitude. Peak concentration — how much of the energy sits in one narrow band. And the frequency fingerprint, with the dominant peak highlighted."

**Visual:** 4s tap "Tap-by-tap" bars, 4s spiral with guide overlay.

> **SHRAVAN:** "Finger tapping counts taps and measures whether they shrink. Spiral trace compares your path against a perfect spiral. Five check-ins, same protocol every time."

**Visual — THE UNIQUE SHOT:** over-the-shoulder, a real person at HCC doing a check-in. Their hand, the skeleton, the number.

> **AKHIL:** "We brought it to Howard Community College and handed it to people who'd never seen it."
>
> **REAL USER, on camera, their own words:** *(one sentence — don't script this)*

**Visual:** `/history` trend, 1.07 → 1.84 over 33 days, honest caption visible.

> **SHRAVAN:** "Do it weekly and you get something that didn't exist before — a record you can hand your doctor."

### 4 · 1:42–2:14 — Code, 32 seconds
**Location:** whiteboard, then your editor.
**Visual:** 8s whiteboard — wiggly trace → "FFT" arrow → spectrum with one tall peak. Then screen capture of `app/src/lib/signal.js`, cursor moving.

> **SHRAVAN:** "A tremor is periodic, so position tells you very little — frequency tells you everything. Here's how the number is actually made."
>
> **SHRAVAN:** "`signal.js` — 342 lines of JavaScript, no dependencies. Normalize by palm size so distance from the camera doesn't matter, PCA for the axis the hand is really moving along—"
>
> **AKHIL:** "—then our own radix-2 FFT. Hann window, zero-pad to a power of two, parabolic interpolation across the peak bin for sub-bin resolution."
>
> **SHRAVAN:** "And before any of that runs, this quality gate. Low frame rate, dropped tracking, a gap over 250 milliseconds — we refuse to interpret the recording rather than guess at it."
>
> **AKHIL:** "Thirty-seven signal tests. And our Swift port for iPhone runs the same math — we check its output against browser fixtures to one part in a hundred million."

**Cursor targets:** `fftInPlace` · Hann window loop · parabolic interpolation lines · `recordingQuality()` · terminal showing `npm run test:signal` → `37 passed, 0 failed`.
**Visual on the last line:** laptop and iPhone side by side, same screen.

### 5 · 2:14–2:36 — Validation and experts
**Location:** screen capture of `/evidence`; Health Sciences building hallway for the expert card.
**Visual:** ROC curve, then scroll so "What is not proven" is visibly on screen while Shravan speaks.

> **AKHIL:** "We checked our feature pipeline against real patient data — PADS, on PhysioNet. 469 participants recorded on smartwatches; we analyzed 398. Nested cross-validation, ROC-AUC 0.874."
>
> **SHRAVAN:** "And to be clear about what that is — it's a smartwatch research benchmark. It is never applied to your camera recording, and the app says so right here."
>
> **AKHIL:** "Dr. Irene Litvan advised us on tremor measurement. Dr. Sarah Marie Brooker, a movement-disorders physician at Northwestern, reviewed our task list."

*Volunteering the limitation is the strongest credibility move in the video. It also separates you from every entry whose winner page names no dataset and no expert.*

### 6 · 2:36–2:50 — Privacy and close
**Location:** screen capture, then campus green / Horowitz colonnade.
**Visual:** zoom on the permanent caption under the live video — **"No raw video or hand landmarks are saved. Only derived measurements."** Then DevTools → Application → IndexedDB → `neuratrack`. Then both of you outside.

> **SHRAVAN:** "No account, no upload. Video and landmarks are discarded in memory — only the derived numbers persist, in your browser."
>
> **AKHIL:** "NeuraTrack doesn't diagnose anything. It gives my grandfather and his neurologist a record that didn't exist before."
>
> **SHRAVAN:** "Shravan and Akhil, Centennial High School. Thanks for watching."

**End card, 3s:** NeuraTrack · **all four participants' full names** · Centennial High School · Maryland's 7th Congressional District · repo URL.

Showing the real IndexedDB rows instead of an animated lock icon is the difference between asserting privacy and demonstrating it.

---

## Asset manifest — `plan/video-assets/`

35 MB collected and renamed. I viewed every one of these; captions are what's actually in the frame.

**`01-hero/`**
- `hand-with-landmarks.webp` (2048×1536) — real hand, mint landmark dots, warm background. **Your best still.** Title-card background.
- `dna-loop.mp4` (4.6 MB) — the DNA loop from the landing page.
- `helix.webp` (2048×1152) — helix illustration.
- `test-fixture-two-hands.jpg` (720×382) — two hands on white. Test fixture; fine as a texture, not as a product shot.

**`02-ios-screens/`** — iPhone 17 Pro, 1206×2622, real app
- `00-iphone-homescreen-app-installed.png` — **NeuraTrack's icon on an actual iPhone home screen.** Strong "this is a real app" beat.
- `01-welcome-see-movement-clearly.png` — the welcome screen. Best-looking frame in the repo.
- `02-assessment-list-five-tasks.png` — "A moment for you." all five tasks listed.
- `03-analysis-resting-hand-metrics.png` — **Largest spectral peak 5.00 Hz · RMS 1.06% palm length · Single-bin concentration 36.96%.** Use when you say the numbers.
- `04-analysis-motion-density-spectrum.png` — Motion density + Frequency spectrum charts.
- `05-spiral-trace-follow-your-own-line.png` — spiral task with the drawn spiral.
- `06-reports-your-data-in-your-hands.png` — PDF / CSV / JSON export.
- `07-journal-empty-state.png` — "Your journal."
- `08-explainer-camera-to-useful-trend.png` — **"From camera to a useful trend"** with 01 Position / 02 Measure / 03 Understand and "Five tasks. One consistent baseline." A ready-made explainer slide; use it under Act 3's task narration.
- `09-quality-gate-lets-get-clearer-recording.png` — the app **refusing** a recording: "Let's get a clearer recording… The trace was too short to compare reliably." Cut to this on the quality-gate line in Act 4. Showing your app decline to produce a number is a flex.
- `10-welcome-back-your-space.png` — journal setup.

**`03-ios-motion/`** — real screen recordings from the iOS UI test runs, 1206×2622
- `run-a-13.6s.mp4`, `run-b-11.7s.mp4`, `run-c-11.6s.mp4` — navigation b-roll. Check which is cleanest before cutting.

**`04-web/`**
- `web-landing-fullpage.png` (860×1800) — full landing page scroll.

**`05-mockups-DO-NOT-CLAIM-AS-APP/`** — four light-theme concept mockups (`bilateral-protocol`, `pro-dashboard`, `world-class-dashboard`, `spiral-assessment`). **These are static HTML concepts, not your running app.** Bilateral asymmetry in particular is *not implemented* — the CSV column is always empty. Showing these while narrating "our app" is a false claim a judge could catch by opening the repo. Safest: don't use them.

**`06-unusable-do-not-film/`** — `camera-unavailable-error.png` and `text-overflow-bug-large-type.png` (the large-type setting breaks "NeuraTrack" into "NeuraTr ack"). Kept so you don't grab them by accident.

### Not in the folder, deliberately
`ios/build/packages/checkouts/mediapipe/**` holds ~150 images that look like yours in a file listing but are **Google's MediaPipe test fixtures** — `dino.jpg`, `lenna.png`, `sergey.png`, Google logos, and photos of strangers' hands from the gesture-recognizer training data. Third-party content and other people's faces. Don't use any of them.

---

## Tonight's order

1. **Real-user shot at HCC** — while people are still on campus. Everything else can be done at 2 AM; this cannot. *(~30 min)*
2. **Whiteboard + code walkthrough** — while you're sharp. *(~40 min)*
3. **Campus exteriors and two-shots** — while there's light. *(~30 min)*
4. **Screen captures** — seed the journal first with `plan/seed-demo-data.js`, run `plan/check-camera.js` before the live take. *(~45 min)*
5. **Voiceover** — small carpeted room, phone 8 inches away. *(~30 min)*
6. **Edit** — cut on sentences. Watch once at 2:50 with a stopwatch. *(~90 min)*
7. **Upload Public.** Title: `NeuraTrack — Shravan Yoagentharan & Akhil Chakravarthy | Congressional App Challenge 2026`
8. **Submit before 12:00 PM ET.**

If you run out of time, cut Act 5's expert card and the clinical-context frame first. **Never cut the real-user shot or the code walkthrough** — those are the two things nobody else has.
