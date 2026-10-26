import { analyzeRecording } from './measurements.js';

// Explicitly synthetic, deterministic input for previews; never journal data.
export function sampleResult() {
  const samples = Array.from({ length: 300 }, (_, i) => {
    const t = i / 30;
    return { t: t * 1000, x: .5 + .004 * Math.sin(2 * Math.PI * 5 * t) + .0005 * Math.sin(2 * Math.PI * .4 * t), y: .4 + .001 * Math.cos(2 * Math.PI * 5 * t), scale: .2, orientation: 0, tapDistance: .1 };
  });
  return analyzeRecording({ samples, totalFrames: 300, task: 'rest', hand: 'Right' });
}
