# NeuraTrack — CAC Written Submission Responses

Drafted against the **official 2026 rules** (extracted from the rules PDF) and cross-checked line by line against the code audit. Every factual claim here is one the repo supports.

The rules say: *"Demonstration Videos and Submission Answers will be reviewed and evaluated by the Member."* The answers are judged, not filed.

---

## Two rules findings before the answers

### Your team is exactly at the eligibility threshold

> "At least half of teammates on any team must live or attend school in the **same** Congressional District."
> — 2026 CAC Rules, §1 Eligibility, Teams

Four-person team, two living in MD-07. Two of four is exactly half, so **"at least half" is satisfied and MD-07 is valid.** But you have zero margin. If either of those two addresses is wrong, or one teammate gets dropped from the registration, you fall below half and the entry is ineligible in MD-07. Confirm both MD-07 home addresses with 9-digit ZIPs before you submit — registration asks for the 9-digit ZIP, Congressional District, and Member of Congress for both home *and* school.

Note the school address field will say MD-03 for all four of you. That's expected and fine; the team qualifies on residence, not school.

### Your video is missing a required element

The rules list six things the video **must** contain:

1. Name(s) of each participant ✓
2. Name of the app ✓
3. Purpose, in one clear sentence ✓
4. **Target audience** ✓
5. **The tools and coding languages used** ← ✗ **you don't say these**
6. Showcase the functionality ✓

The shooting script names MediaPipe and `signal.js` but never says the words **JavaScript, React, or Swift**. That's a stated requirement, and it's free to fix. In Act 4, change Shravan's first line to:

> "`signal.js` — 342 lines of JavaScript, no dependencies."

And in Act 4's last line, Akhil already says "our iPhone version" — make it:

> "Thirty-seven signal tests. And our Swift port runs the same math —"

Two words, requirement met.

Also worth knowing: *"Video submissions which do not adhere to the time constraints may be penalized by the judges at their discretion."* Penalized at discretion, not auto-disqualified. Still: stay under 3:00.

---

## The six questions

Official wording from the 2026 rules. The rules say "a series of questions **similar to** the following," so the live form may differ slightly — adapt, don't paste blindly.

The 2026 rules don't publish character limits. The 2019 rules used 200 characters for inspiration and 1,500 for the technical difficulty. I've given a short and a long version where the limit is likely to bite.

---

### 1. What is the title of your app?

> NeuraTrack

---

### 2. Explain the app's purpose.

**Short (≈140 characters, if the form asks for one sentence):**

> NeuraTrack measures hand movement with a regular camera, so people with movement disorders can track their symptoms between doctor visits.

**Longer, if there's room:**

> NeuraTrack measures hand movement with a regular camera, so people with movement disorders can track their symptoms between doctor visits.
>
> It runs five guided check-ins — resting hand, outstretched hand, finger tapping, palm rotations, and a spiral trace — and turns each one into numbers you can compare over time: peak tremor frequency, motion amplitude, tap rate, how much tapping shrinks over ten seconds, and how far a traced spiral drifts from the ideal. Everything runs in the browser. There's no account and nothing is uploaded.
>
> It is a monitoring tool, not a diagnostic one. It doesn't tell you whether you have a disease, and we've been careful not to build anything that implies it does.

---

### 3. What inspired you to create this app?

**Short (≈200 characters):**

> My grandfather has Parkinson's. His neurologist sees him twice a year and asks how he's been doing — and nobody actually knows, because nothing in between gets measured.

**Longer:**

> My grandfather has Parkinson's. His neurologist sees him twice a year and asks how he's been doing, and the honest answer is that nobody knows. His hands are different on different days. None of it gets written down, so the appointment runs on whoever's memory is least unreliable that morning.
>
> We looked for something he could use at home and mostly found two kinds of things: wearables that cost money and need charging, and apps that promise to detect Parkinson's from a photo. He wasn't going to wear a ring every day, and we didn't believe the second category.
>
> So we built the boring version instead — something that measures the same thing the same way every week and hands you a number. Not a diagnosis. A record.

---

### 4. What technical/coding difficulty did you face in programming your app, and how did you address this technical challenge?

*This is where the points are. The rubric's top Code descriptor is "Explanation of code indicates immense understanding," and the winner pages I read for competing Parkinson's apps name no tools, no datasets, and no technical problems at all.*

**Full answer (1,452 characters — fits the old 1,500 limit):**

> The hard part was that a webcam lies about time.
>
> To find a tremor frequency you run an FFT, and an FFT assumes your samples are evenly spaced. Webcam frames are not. The browser hands you frames whenever it feels like it — dropped frames, variable exposure, the laptop throttling. If you assume 30 FPS and the camera actually delivered 23 with a gap in the middle, the FFT still returns a confident number. It's just wrong, and nothing about it looks wrong.
>
> We fixed it in two places. First, we resample the landmark positions onto a uniform grid using the frame rate we actually observed, not an assumed one — `resampleToUniformGrid` in `src/lib/signal.js`. Second, we wrote a quality gate that runs before any interpretation: under 24 observed FPS, under 85% hand coverage, under 8 seconds of tracking, or any gap over 250 ms, and the recording is rejected instead of analyzed. The comment we left in the code is "Never fill long gaps then interpret the manufactured signal as evidence."
>
> It would have been easier to interpolate across the gaps and always produce a result. But a health app that quietly invents a number is worse than one that says it couldn't measure you, so we made it refuse.
>
> The rest of the pipeline is ours too: linear detrend, Hann window, zero-pad to a power of two, then a radix-2 Cooley-Tukey FFT we wrote by hand, with parabolic interpolation across the peak bin to get sub-bin frequency resolution. 37 tests cover it.

**If the limit is tighter (≈600 characters):**

> A webcam lies about time. An FFT assumes evenly spaced samples, and webcam frames aren't — dropped frames, variable exposure, throttling. Assume 30 FPS when the camera gave you 23 and the FFT still returns a confident, wrong number.
>
> We resample onto a uniform grid at the frame rate we actually observed, and we added a quality gate that rejects a recording outright — under 24 FPS, under 85% hand coverage, any gap over 250 ms — rather than interpolating across holes. A health app that quietly invents a number is worse than one that admits it couldn't measure you.

---

### 5. What did you learn while participating in the CAC? What was your biggest takeaway?

> That the hardest part of a health app is deciding what you're not allowed to claim.
>
> We benchmarked our feature pipeline against PADS, a public PhysioNet dataset of 469 participants recorded on smartwatches. We analyzed 398 of them and got a nested cross-validated ROC-AUC of 0.874 for telling Parkinson's participants from healthy ones. That's a real result and we were proud of it.
>
> Then we had to sit with what it isn't. It's smartwatch data, not webcam data. It classifies a participant, not a recording. It says nothing about whether our camera measurements are accurate, because nobody has tested that. So the model is flagged `webcamValidated: false` in our own code, it is never applied to anything a user records, and the app has a page that says so in plain language.
>
> It would have been easy to write "87% accurate" on the landing page. Several apps in this space do. Learning to not do that — and to build the refusal into the code instead of just the marketing — was the bigger lesson than any of the signal processing.
>
> We also got email back from neurologists we cold-emailed, which we didn't expect. Dr. Irene Litvan helped us think about tremor measurement, and Dr. Sarah Marie Brooker, a movement disorders physician at Northwestern, looked at which motor tasks we'd chosen. Experts answer high schoolers more often than you'd think.

---

### 6. What would you change about your app if you were to create a 2.0 version?

*Naming your real gaps is a strength here. A judge who opens the repo will find exactly these, and finding them already acknowledged reads very differently from finding them hidden.*

> Three things, in order.
>
> **Validate the camera measurements against a reference.** This is the real gap. We've shown our pipeline works on smartwatch data and that it produces stable, repeatable numbers from a webcam, but nobody has checked a NeuraTrack reading against an accelerometer or a clinician's rating on the same hand at the same time. Until that exists, every number is a consistent measurement rather than a validated one. It's the first thing we'd do with access to a lab.
>
> **Finish bilateral comparison.** Asymmetry between hands is a useful early signal in Parkinson's, and it's our obvious next measurement. We wrote and tested the function — `computeAsymmetryIndex` — but never wired it into the analysis path, so the column exists in our CSV export and is always empty. We'd rather say that than leave it looking finished.
>
> **Make the trend view actually statistical.** Right now the app plots your recordings and lets you look. It doesn't tell you whether a change is real or just noise from lighting, distance, or effort, and we deliberately didn't claim it does. Version 2 would fit a slope with a confidence interval and only call something a change when it clears the measurement variability.
>
> Smaller: palm rotation is still an experimental orientation proxy rather than a real rotation count, and resting-hand and outstretched-hand currently run identical math with different instructions. Both deserve measurements of their own.

---

## Consistency check — video vs. written answers

Judges see both. These are the places they could contradict each other.

| Claim | Video says | Answers say | Match |
|---|---|---|---|
| PADS participants | 469 recorded, 398 analyzed | 469 recorded, 398 analyzed | ✓ |
| ROC-AUC | 0.874 | 0.874 | ✓ |
| What the model is for | smartwatch, never applied to camera | same, with `webcamValidated: false` | ✓ |
| Task count | five check-ins | five, named | ✓ |
| FFT | hand-written radix-2 | hand-written radix-2, 37 tests | ✓ |
| Quality gate | "we refuse to interpret" | same, with thresholds | ✓ |
| Privacy | nothing uploaded, IndexedDB | nothing uploaded, no account | ✓ |
| Diagnosis | "doesn't diagnose anything" | "monitoring tool, not diagnostic" | ✓ |
| Experts | Litvan, Brooker | Litvan, Brooker | ✓ |

**Do not** let these drift into the answers: Chart.js (never ships), "AI model analyzes your hand" (no model runs), "detects trends" (that code is unimported), "works offline" (first camera use pulls MediaPipe from CDNs), "42 landmarks across two hands" (one hand, 21 landmarks), or bilateral asymmetry as a shipped feature.

---

## Before you submit

- [ ] Both MD-07 teammates' 9-digit ZIPs verified — you're at exactly half, no margin
- [ ] All four participants registered
- [ ] Video says **JavaScript** and **Swift** out loud (required element, currently missing)
- [ ] Video names the target audience out loud
- [ ] Video under 3:00
- [ ] Video on YouTube/Vimeo set to **Public**
- [ ] Repo link accessible to judges
- [ ] Answers trimmed to whatever limits the live form imposes
- [ ] Submitted before **12:00 PM EDT, Monday, October 26, 2026**

---

## Source

2026 CAC Rules, §1 Eligibility, §4 Submissions (Demonstration Video + Questions), §5 Deadline: [congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf](https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf)
