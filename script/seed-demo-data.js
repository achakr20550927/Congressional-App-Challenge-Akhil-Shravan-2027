/* NeuraTrack — demo journal seeder (for filming only)
 *
 * Paste this whole file into the DevTools console on http://localhost:5173
 * while `npm --prefix app run dev` is running. Dev mode only — the dynamic
 * /src/... imports do not resolve against a production build.
 *
 * Creates 7 resting-hand + 3 finger-tapping records spread over the last 34
 * days, each its own session. Values were validated against the real
 * analyzeRecording(): all pass the quality gate, rest peak drifts 4.8 -> 5.2 Hz
 * with RMS 1.07% -> 1.84% (a visible trend slope), tap decrement 7.8% -> 18.9%.
 *
 * This is synthetic data. Do not narrate it as real recordings.
 *
 * To wipe it afterwards: Settings -> "Clear all local data".
 */
(async () => {
  const { saveTaskResult } = await import('/src/lib/storage.js');
  const { analyzeRecording } = await import('/src/lib/measurements.js');

  const FPS = 30, N = 300, DAY = 86400000;

  const restSamples = (ampl, freq) =>
    Array.from({ length: N }, (_, i) => {
      const t = i / FPS;
      return {
        t: t * 1000,
        x: 0.5 + ampl * Math.sin(2 * Math.PI * freq * t) + 0.0005 * Math.sin(2 * Math.PI * 0.4 * t),
        y: 0.4 + (ampl / 4) * Math.cos(2 * Math.PI * freq * t),
        scale: 0.2, orientation: 0, tapDistance: 0.1,
      };
    });

  const tapSamples = (freq, decay) =>
    Array.from({ length: N }, (_, i) => {
      const t = i / FPS;
      const env = 1 - decay * (t / 10);
      return {
        t: t * 1000, x: 0.5, y: 0.4, scale: 0.2, orientation: 0,
        tapDistance: 0.105 + 0.075 * env * Math.sin(2 * Math.PI * freq * t),
      };
    });

  const REST = [
    { d: 34, a: 0.0030, f: 4.80, n: 'Morning, before medication.' },
    { d: 28, a: 0.0032, f: 4.85, n: '' },
    { d: 21, a: 0.0036, f: 5.00, n: 'Slept poorly.' },
    { d: 15, a: 0.0039, f: 5.05, n: '' },
    { d: 10, a: 0.0043, f: 5.10, n: 'Afternoon check-in.' },
    { d: 5,  a: 0.0047, f: 5.15, n: '' },
    { d: 1,  a: 0.0052, f: 5.20, n: 'Bringing this to the next appointment.' },
  ];

  const TAP = [
    { d: 28, f: 3.4, k: 0.15, n: '' },
    { d: 15, f: 3.1, k: 0.28, n: 'Right hand felt slower today.' },
    { d: 1,  f: 2.9, k: 0.38, n: '' },
  ];

  let saved = 0;

  for (const p of REST) {
    const r = analyzeRecording({ samples: restSamples(p.a, p.f), totalFrames: N, task: 'rest', hand: 'Right' });
    if (!r.qualityOk) { console.warn('rest record failed quality gate, skipped', p); continue; }
    r.recordedAt = new Date(Date.now() - p.d * DAY).toISOString();
    r.notes = p.n;
    await saveTaskResult(r);
    saved++;
  }

  for (const p of TAP) {
    const r = analyzeRecording({ samples: tapSamples(p.f, p.k), totalFrames: N, task: 'tap', hand: 'Right' });
    if (!r.qualityOk) { console.warn('tap record failed quality gate, skipped', p); continue; }
    r.recordedAt = new Date(Date.now() - p.d * DAY).toISOString();
    r.notes = p.n;
    await saveTaskResult(r);
    saved++;
  }

  console.log(`Seeded ${saved} records. Reload the page, then open /app and /history.`);
  return saved;
})();
