# NeuraTrack — Congressional App Challenge Video Playbook

Research basis: official 2026 CAC rules, the official CAC judging rubric (2021 rubric guide, still the published sample rubric), district judging-criteria pages, the 2025 winners list, and the 2025 overall national winner's video.

---

## 0. Two blocking facts — read first

### Deadline: Monday, October 26, 2026, 12:00 PM ET
Confirmed on the official CAC FAQ ("Register online and submit app by October 26, 2026") and across district pages, most of which specify 12:00 PM ET. One outlier page (Khanna) lists Oct 30 — that appears to be stale 2025 text. **Submissions cannot be modified after the period closes.**

Practical consequence: you have one evening. Every recommendation below is ordered by points-per-hour.

### MD-07 is a valid registration — but one sentence must change
**Resolved:** you registered in MD-07 because two of your four teammates live there. CAC rules let a student compete in the district where they **live** or where they **attend school**, in one district only, so a teammate's MD-07 residence is a legitimate basis. MD-07 stands.

The problem is attribution. Centennial High School, 4300 Centennial Lane, Ellicott City (ZIP 21042), is in **Maryland's 3rd District** (Rep. Sarah Elfreth), not the 7th:

- Howard County's own My Neighborhood address lookup returns Congressional District 3 for the school.
- Maryland Code § 8-704 defines MD-03 as *all of* Howard County plus parts of Anne Arundel.
- ZIP-level sources put 21042 entirely inside MD-03.
- Howard County polling-place pages assign 21042 precincts to District 3.

Your V2 script says "We're from Centennial High School in Maryland's 7th District." That construction is false and your judging panel is local to MD-07 — the one audience that knows Howard County isn't theirs. Keep the two facts separate: *"at Centennial High School, competing in Maryland's 7th District."*

**Second issue, and the one I'd actually worry about:** only you two appear on camera, and you both live in MD-03. Your two MD-07 teammates are registered participants *and* they are the sole reason MD-07 is your district. A video that names two MD-03 students, submitted to MD-07, is internally inconsistent with its own registration. The rules require participants' names in the video — so name all four on the end card and have Shravan say "two of the four students who built NeuraTrack." Two seconds, gap closed. You stay the only two on camera.

---

## 1. The actual rubric — 30 points, six categories

This is the official CAC rubric, extracted from the published PDF. Two categories of 15, each made of three 1–5 criteria.

### CONCEPT — 15 points

| Criterion | 1 | 3 | 5 |
|---|---|---|---|
| **Ideology** | Does not address an issue or need | Issue or need is moderately relevant | Issue or need is extremely relevant |
| **Impact** | App is unoriginal or does not aim to be impactful | App lacks a clear explanation of impact | Immense creativity featured as impact is explained |
| **Structure** | Video does not follow time limit and/or is difficult to view | Video is mostly organized, explains some aspects | **Video is innovative and engaging** |

### TECHNOLOGY — 15 points

| Criterion | 1 | 3 | 5 |
|---|---|---|---|
| **Function** | App lacks any functionality | App works, yet encounters errors | **App is functional with complex features** |
| **Code** | **Video does not explain code** | Code is partially explained, some confusion | **Explanation of code indicates immense understanding** |
| **UI** | App lacks design, difficult to use | Navigable with basic access to features | App is highly innovative in design and interface |

### The single most important consequence

**One sixth of the total score — 5 of 30 points — is "Code."** Its 1-point descriptor is literally *"Video does not explain code."*

Your current script never shows or explains a single line of code. On this rubric that is a 1 or 2 out of 5. That is the largest, cheapest, fastest point gain available to you tonight, and almost no high-school submission does it well.

Second consequence: "Structure" rewards *"innovative and engaging"* video, so production does count — but see §3 for how little it actually took to win nationally.

Third: "Function" tops out at *"functional with complex features"*, and CAC explicitly permits mock-ups. So you must make it unmistakable that this is **running software, live, not a mock-up**. Uncut screen recording does that; polished motion graphics actively work against it.

---

## 2. What the field looks like — and why it matters for your positioning

The 2025 winners list (partial — A through NC alone) contains **25+ health apps**. Among district winners in recent cycles:

- **MotionBloom** (NC-02) — Parkinson's tremor data logger + rehab system, wearable ring.
- **MeloCognia** (IL-16) — ML voice analysis for early Parkinson's detection.
- **Synapse Match** (CA-10) — AI identifying early-stage Parkinson's from survey, voice, and motor diagnostics.
- **Kenna Zhang** (2024) — drawing samples and voice recordings for early Parkinson's signs.

**"AI app that detects Parkinson's" is a saturated genre.** A judge in your district may well have seen one before. "We built a health app with machine learning" is not a differentiator in 2026.

What you actually have that those four do not:

1. **Named clinical experts with real credentials who responded to you.** Litvan, Brooker, Palma, Shulman, Rosenthal. Verifiable, specific, and nearly impossible for a competitor to fake.
2. **External dataset validation** against PADS on PhysioNet. Most submissions validate against the authors themselves.
3. **A first-person reason to exist** — Akhil's grandfather. Past-winner commentary specifically credits OtoScan's success to being "grounded in real family experience."
4. **No hardware requirement.** MotionBloom needs a ring. You need a browser. That is a *scale* argument, and scale is an impact argument.

Lead with 1–4, not with "AI health app." Your framing should be **measurement**, not **detection**. Claiming detection/diagnosis invites a judge who knows medicine to discount you; claiming repeatable quantitative tracking between visits is both more defensible and more clearly useful.

---

## 3. What the national winner's video actually looks like

I examined the 2025 overall first-place video (WaterWise, Advika Rastogi, KY-02):

- **Length: 3:06** — slightly over the stated 1–3 minute guidance.
- **404 views, 3 subscribers.** No channel presence.
- **Description, in full:** "Congressional App Challenge 2025 Submission / Advika Rastogi / KY-02". That is it.
- No chapters, no transcript enabled, no captions.

Honest limitation: I could not watch the footage, and I cannot verify its editing or visual style — the transcript was not available. What is verifiable is the packaging, and the packaging is *bare*.

**The inference I'd draw:** the national winner did not out-produce anyone. The rules say plainly, "this is not a video-creation competition." Points came from rubric coverage, not cinematography. If you spend tonight on motion graphics instead of a code walkthrough, you are optimizing the wrong variable.

Also: do not go over 3:00. The winner did, but "Video does not follow time limit" is the explicit 1-point descriptor for Structure. Don't gamble 5 points on precedent. Target **2:40–2:55**.

---

## 4. Diagnosis of your current script

What's already right — keep it:

- Grandfather cold open. Strongest 15 seconds you have. Past winners confirm this works.
- Named experts with credentials. Rare and credible.
- PADS validation mentioned. Genuine differentiator.
- Both members on camera, named. Rules requirement met.
- Privacy section is short. Good — it's not scored.
- Bookending back to the grandfather at the close.

What will cost you points:

| Problem | Rubric cost | Fix |
|---|---|---|
| **No code is ever shown or explained** | Code: 5 → likely 1–2 | §5 Act IV. Non-negotiable. Biggest single win. |
| **"Centennial High School in Maryland's 7th District"** | Credibility with a local panel | Split the facts: "at Centennial High School, competing in Maryland's 7th District." |
| **Only 2 of 4 participants named** | Rules compliance | All four names on the end card; "two of the four students who built NeuraTrack." |
| Tech stack delivered as a "flash" graphic | Code | Stack names are not a code explanation. Flashing logos scores nothing. |
| Expert block is a 55-word name list | Impact | Cut to two named experts + what each changed in the app. A list of five names reads as credential padding; two names plus a concrete design consequence reads as real consultation. |
| "Turns any camera into a quantitative neuromotor assessment tool" | Ideology/Impact | Jargon. Judges are "basic familiarity with programming," not neurologists. Say what it does in one plain sentence. |
| Demo is four tasks in ~45s | Function | Too thin per task. Two tasks shown properly beats four shown shallowly. |
| No visible session-over-session trend | Impact | The longitudinal dashboard *is* the product thesis. Needs real screen time. |
| Expert-quote montage at "0.5–0.7s each" | Structure | Unreadable. Reads as padding. One quote, held 3s. |

---

## 5. The structure that maximizes rubric points

Six beats. Target 2:50. Each beat is annotated with the rubric criterion it is buying.

| Time | Beat | Buys |
|---|---|---|
| 0:00–0:18 | Grandfather cold open + both names, school, district, app name | Ideology, rules compliance |
| 0:18–0:32 | One plain sentence on what it is and who it's for | Ideology, Impact |
| 0:32–1:15 | Live demo, uncut: one tremor task start→finish, then spiral | Function, UI |
| 1:15–1:50 | **Code walkthrough — real editor, real file, real lines** | **Code** |
| 1:50–2:15 | Longitudinal dashboard + PADS validation + two experts | Impact, Function |
| 2:15–2:50 | Privacy in one line, scope limit in one line, close on grandfather | Impact, Structure |

### Act IV is the part you don't currently have

Thirty-five seconds, screen recording of your actual editor, cursor moving on real code. Narrate the *reasoning*, not the syntax. The rubric wants "immense understanding," which means explaining a decision and its tradeoff, not reading a function aloud.

Three things to hit, roughly 12 seconds each:

1. **Why FFT.** Show the transform in your analysis file. "A tremor is a periodic signal, so we don't look at position — we look at the frequency domain. We window the landmark positions, run an FFT, and take the dominant peak. That's how we separate a 4-to-6 hertz Parkinsonian rest tremor from ordinary hand drift."
2. **One real engineering problem you solved.** The strongest candidates are MediaPipe frame-rate jitter (camera timestamps aren't uniform, so you can't assume a fixed sample rate going into an FFT) or landmark smoothing/dropout. Show the code that handles it. This is what separates a 4 from a 5 — it proves you hit a real problem and reasoned through it.
3. **Why on-device.** Point at the storage layer. "Everything runs in the browser and persists locally — that's an architecture decision, not a feature we bolted on."

Record this as one continuous screen capture with your voice over it. Do not animate it. The authenticity of a real editor is the point.

---

## 6. Production rules — cheap, high-yield

**Do:**
- Record screen at 1080p minimum. Judges watch on laptops; small text is a Structure penalty.
- **Narrate over continuous screen recording.** No dead air — the rubric punishes confusing structure, and silence over a demo reads as a gap.
- Zoom in on numbers when you cite them. If you say "4.7 hertz," 4.7 must be legible on screen at that moment.
- Use an external mic or your phone's voice recorder held close, then sync. Bad audio is the most common unforced error and bleeds into Structure.
- Show your faces at the open and the close. It makes the grandfather story land and satisfies the names requirement visibly.
- One clean title card with app name. One end card with names, school, district.
- Write the script out and read it. Don't improvise — you'll run long.

**Don't:**
- Flash anything under 2 seconds.
- Add background music under narration. It fights the voice and gains nothing.
- Use stock footage of hospitals or elderly hands. It signals "we couldn't show the app."
- Claim diagnosis, detection, or clinical accuracy.
- Exceed 3:00.
- Show a loading state, a console error, or a camera-permission dialog. Re-record the take.

---

## 7. Tonight's execution order

Ordered by points per hour. If you run out of time, stop at the line you reach — everything above it is in the can.

1. **Confirm all four participants are on the registration**, and that the two MD-07 addresses are the ones on file. 10 min. District is settled (MD-07); this is just making the paperwork and the video agree.
2. **Write the final script to time.** 45 min. Read it aloud with a stopwatch. 2:50 hard ceiling.
3. **Record the code walkthrough.** 30 min. This is the differentiator. Do it before you're tired.
4. **Record the app demo, clean takes.** 45 min. Seed enough session history that the dashboard looks real.
5. **Record voiceover and faces.** 30 min.
6. **Edit.** 60–90 min. Cut on sentences, not beats.
7. **Upload to YouTube as Public** (not Unlisted — rules require public). Title: `NeuraTrack — Shravan Yoagentharan & Akhil Chakravarthy | Congressional App Challenge 2026`.
8. **Submit with time to spare.** Registration plus repo link plus the written responses. The portal will be slow at 11 AM on deadline day.

### Don't do tonight
- New features. "Functional with complex features" is judged on what you show working, not on what exists.
- Redesigning the UI.
- Motion graphics or animated diagrams.
- Chasing more expert emails.

---

## 8. Submission checklist

- [ ] MD-07 stated in the video, the written responses, and the registration — and never attributed to the school
- [ ] Video 1:00–3:00, **all four participants' full names** shown (two on camera is fine)
- [ ] App name stated, purpose in one clear sentence
- [ ] Target audience stated
- [ ] Tools and languages stated
- [ ] Functionality demonstrated on real running software
- [ ] **Code shown on screen and explained with reasoning**
- [ ] Uploaded to YouTube or Vimeo, visibility set to **Public**
- [ ] Source code repository accessible to judges
- [ ] Written responses consistent with the video's claims
- [ ] Submitted before Oct 26, 12:00 PM ET

---

## Sources

- [2026 CAC Rules (PDF)](https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf)
- [CAC Judging Rubric (PDF)](https://www.congressionalappchallenge.us/wp-content/uploads/2022/09/CAC-Judging-Rubric.pdf)
- [CAC Frequently Asked Questions](https://www.congressionalappchallenge.us/congress/frequently-asked-questions/)
- [CAC Past Winners](https://www.congressionalappchallenge.us/students/past-winners/) · [2025 Winners](https://www.congressionalappchallenge.us/2025-winners/)
- [WaterWise — 2025 overall winner video](https://www.youtube.com/watch?v=pPRUIzA1NOU) · [Guthrie announcement](https://guthrie.house.gov/news/documentsingle.aspx?DocumentID=390863)
- [Advice from a CAC winner (Angelina Tsuboi)](https://medium.com/@angelinatsuboi/how-to-win-the-congressional-app-challenge-advice-from-a-cac-winner-5779d7a0241d)
- [Ross announcement — MotionBloom, Parkinson's tremor logger](https://ross.house.gov/2026/1/congresswoman-ross-announces-winner-of-2025-congressional-app-challenge)
- [Maryland's 3rd congressional district](https://en.wikipedia.org/wiki/Maryland%27s_3rd_congressional_district) · [Howard County My Neighborhood lookup](https://data.howardcountymd.gov/DataExplorer/MyNeighborhood.aspx)
- [Centennial High School (Maryland)](https://en.wikipedia.org/wiki/Centennial_High_School_(Maryland))
