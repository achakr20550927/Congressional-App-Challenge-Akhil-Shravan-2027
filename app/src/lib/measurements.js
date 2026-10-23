import { analyzeTremor, resampleToUniformGrid, analyzeSpiralDeviation } from './signal.js';

export const PROTOCOL = 'camera-v3';
export const TASKS = [
  { key:'rest', title:'Resting hand', subtitle:'A quiet moment for your hand.', duration:10, instruction:'Rest your forearm and hand comfortably on a support. Keep the whole hand visible and relaxed. Keep the phone still.', metric:'Motion amplitude' },
  { key:'postural', title:'Outstretched hand', subtitle:'Measure movement while holding a pose.', duration:10, instruction:'Hold one hand out in front of you, palm down, with all fingers visible. Keep the camera stationary and hold a comfortable, consistent pose.', metric:'Motion amplitude' },
  { key:'tap', title:'Finger tapping', subtitle:'Discover your tapping rhythm.', duration:10, instruction:'With the palm facing the camera, tap your index finger and thumb together. Open them widely between taps. Continue at a comfortable, consistent pace.', metric:'Tap rate' },
  { key:'pronation', title:'Palm rotations', subtitle:'Explore changes in hand orientation.', duration:10, instruction:'Keep your elbow supported. Slowly turn your palm up and down. Keep the full hand visible. This orientation measurement is experimental, not a clinical rotation score.', metric:'Orientation rhythm' },
  { key:'spiral', title:'Spiral trace', subtitle:'Follow a path, see the details.', duration:30, instruction:'Start at the center and follow the spiral outward in one continuous stroke. Use the same finger, stylus, or mouse for future comparisons.', metric:'Path deviation' },
];
export const taskInfo = key => TASKS.find(t=>t.key===key);
export const median = arr => { const a=[...arr].sort((x,y)=>x-y); return a.length ? (a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2 : 0; };

// Hand identity is a label, NEVER an array index. MediaPipe may reorder its
// detections on every frame. Ambiguous or incomplete detections are rejected.
export function selectHand(result, hand='Right') {
  const i=(result?.handednesses || []).findIndex(h=>h[0]?.categoryName===hand && h[0]?.score>=.65);
  const points=result?.landmarks?.[i];
  if (!points || points.length!==21 || points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)) return null;
  return {points, world:result.worldLandmarks?.[i]};
}

export function frameSample(result, hand, t, aspect=1) {
  const h=selectHand(result,hand); if(!h) return null;
  // Image x and y are normalized by DIFFERENT image dimensions. Express y
  // in image-width units before distance, PCA, or scale calculations.
  const p=h.points.map(p=>({x:p.x,y:p.y*aspect,z:p.z||0}));
  const scale=Math.hypot(p[9].x-p[0].x,p[9].y-p[0].y);
  if(scale<.025) return null;
  const center=p.reduce((a,p)=>({x:a.x+p.x/21,y:a.y+p.y/21}),{x:0,y:0});
  const w=h.world || p;
  const a={x:w[5].x-w[0].x,y:w[5].y-w[0].y,z:w[5].z-w[0].z};
  const b={x:w[17].x-w[0].x,y:w[17].y-w[0].y,z:w[17].z-w[0].z};
  const normal={x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x};
  const norm=Math.hypot(normal.x,normal.y,normal.z);
  return {t,...center,scale,tapDistance:Math.hypot(p[8].x-p[4].x,p[8].y-p[4].y),orientation:norm ? normal.z/norm : 0};
}

export function recordingQuality(samples, totalFrames, durationMs=10000) {
  const gaps=samples.slice(1).map((s,i)=>s.t-samples[i].t);
  const observedMs=samples.length>1 ? samples.at(-1).t-samples[0].t : 0;
  const fps=observedMs ? (samples.length-1)/(observedMs/1000) : 0;
  const coverage=totalFrames ? samples.length/totalFrames : 0;
  const maxGapMs=Math.max(samples[0]?.t ?? durationMs,durationMs-(samples.at(-1)?.t ?? 0),...gaps);
  const scale=median(samples.map(s=>s.scale));
  const sizeChange=scale ? (Math.max(...samples.map(s=>s.scale),0)-Math.min(...samples.map(s=>s.scale),Infinity))/scale : 0;
  const reasons=[];
  if(observedMs<8000) reasons.push('Less than 8 seconds of selected-hand tracking.');
  if(fps<24) reasons.push('Tracking was slower than 24 frames per second. Use brighter lighting or another device.');
  if(coverage<.85) reasons.push('The selected hand was not visible in at least 85% of frames.');
  if(maxGapMs>250) reasons.push('A tracking gap exceeded 250 ms. Keep the full hand in view.');
  if(sizeChange>.5) reasons.push('Hand size changed substantially. Keep a consistent camera distance.');
  return {fps,coverage,maxGapMs,observedMs,qualityOk:reasons.length===0,reasons,scale};
}

export function measureTaps(values, fs) {
  if(values.length<4 || fs<=0) return {tapCount:0,tapRateHz:0,tapDecrementPct:null,cycles:[]};
  const sorted=[...values].sort((a,b)=>a-b), low=sorted[Math.floor(values.length*.1)], high=sorted[Math.floor(values.length*.9)];
  const range=high-low;
  if(range<.03) return {tapCount:0,tapRateHz:0,tapDecrementPct:null,cycles:[]};
  const close=low+range*.3, open=low+range*.65;
  let armed=false, peak=-Infinity, last=-Infinity; const cycles=[];
  values.forEach((v,i)=>{
    peak=Math.max(peak,v);
    if(v>=open) armed=true;
    if(armed && v<=close && (i-last)/fs>=.12) {
      cycles.push({t:i/fs,amplitude:peak-v}); armed=false; last=i; peak=v;
    }
  });
  const split=Math.floor(cycles.length/2), avg=a=>a.reduce((s,c)=>s+c.amplitude,0)/a.length;
  const first=avg(cycles.slice(0,split)), second=avg(cycles.slice(split));
  return {tapCount:cycles.length,tapRateHz:cycles.length/(values.length/fs),tapDecrementPct:cycles.length>=6 && first>0 ? (first-second)/first*100 : null,cycles};
}

export function analyzeRecording({samples,totalFrames,task,hand='Right',durationMs=10000}) {
  const quality=recordingQuality(samples,totalFrames,durationMs);
  const base={task,hand,protocolVersion:PROTOCOL,recordedAt:new Date().toISOString(),qualityOk:quality.qualityOk,captureQuality:quality,units:task==='pronation'?'unitless palm-normal orientation proxy (experimental)':'fraction of median projected wrist-to-middle-knuckle length',rating:quality.qualityOk?'measured':'retry',spectrum:[],trace:[],trajectoryPoints:[],notes:''};
  // Never fill long gaps then interpret the manufactured signal as evidence.
  if(!quality.qualityOk) return {...base,patternLabel:'insufficient-quality'};
  const scale=quality.scale;
  const points=samples.map(s=>({...s,x:s.x/scale,y:s.y/scale}));
  const mx=points.reduce((s,p)=>s+p.x,0)/points.length, my=points.reduce((s,p)=>s+p.y,0)/points.length;
  let xx=0,xy=0,yy=0; for(const p of points){xx+=(p.x-mx)**2;yy+=(p.y-my)**2;xy+=(p.x-mx)*(p.y-my);}
  const theta=.5*Math.atan2(2*xy,xx-yy);
  const series=points.map(p=>({t:p.t,value:task==='tap'?p.tapDistance/scale:task==='pronation'?p.orientation:(p.x-mx)*Math.cos(theta)+(p.y-my)*Math.sin(theta)}));
  // Resample only to OBSERVED rate, never to an artificial minimum FPS.
  const fs=Math.min(60,quality.fps), uniform=resampleToUniformGrid(series,fs);
  const maxHz=Math.min(task==='pronation'?6:12,fs*.4);
  const measured=analyzeTremor(uniform,fs,task==='pronation'?.3:2,maxHz);
  const taps=task==='tap'?measureTaps(uniform,fs):{};
  return {...base,...taps,frequencyHz:task==='tap'?null:measured.frequency,rmsAmplitude:task==='pronation'?null:measured.rmsAmplitude,
    peakProminence:measured.peakProminence,tremorBandPowerRatio:measured.tremorBandPowerRatio,
    patternLabel:task==='tap'?'tap-measurement':measured.peakProminence>=.14?'concentrated-rhythm':'distributed-motion',
    spectrum:measured.spectrum,maxAnalyzedHz:maxHz,
    trace:uniform.map((value,i)=>({t:i/fs,value})),trajectoryPoints:points.map(p=>({x:p.x-mx,y:p.y-my,t:p.t/1000}))};
}

export function analyzeDrawing(path,guide,inputType='unknown') {
  const measurement=analyzeSpiralDeviation(path,guide);
  const radius=Math.max(...guide.map(p=>Math.hypot(p.x,p.y)));
  const outer=Math.max(0,...path.map(p=>Math.hypot(p.x,p.y)))/radius;
  const reasons=[];
  if(path.length<40 || measurement.loopCount<3 || outer<.8) reasons.push('Complete at least three turns and reach the outside of the spiral.');
  if(measurement.drawDurationMs<2000) reasons.push('The trace was too short to compare reliably.');
  return {task:'spiral',protocolVersion:'drawing-v3',recordedAt:new Date().toISOString(),inputType,qualityOk:!reasons.length,
    captureQuality:{qualityOk:!reasons.length,reasons},rating:reasons.length?'retry':'measured',patternLabel:'drawing-measurement',
    spiralDeviationScore:measurement.normalizedDeviationScore,spiralTurns:measurement.loopCount,
    meanDeviationPctRadius:measurement.meanDeviationPx/radius*100,trace:[],spectrum:[],
    trajectoryPoints:path.map(p=>({x:p.x/radius,y:p.y/radius,t:(p.t-path[0].t)/1000})),guide:guide.map(p=>({x:p.x/radius,y:p.y/radius})),notes:''};
}

export function describeResult(r) {
  if(!r.qualityOk) return {title:'Let’s get a clearer recording.',body:'There is not enough reliable data to interpret this check-in. No health conclusion is made.',points:r.captureQuality?.reasons || ['Repeat with the full hand in view.']};
  if(r.task==='spiral') return {title:'Your trace, measured.',body:`The average distance from the guide was ${Number(r.meanDeviationPctRadius||0).toFixed(1)}% of its radius across ${Number(r.spiralTurns||0).toFixed(1)} turns.`,points:['This measures drawing accuracy, not Parkinson’s risk.','Compare only the same input device and drawing protocol.']};
  if(r.task==='tap') return {title:`${r.tapCount} taps captured.`,body:`Your average pace was ${Number(r.tapRateHz).toFixed(2)} taps per second. ${r.tapDecrementPct==null?'Not enough complete taps to estimate size change.':`Tap size changed by ${Math.abs(r.tapDecrementPct).toFixed(0)}% (${r.tapDecrementPct>=0?'smaller':'larger'}) between halves.`}`,points:['Effort, fatigue, pain, and tracking noise affect these measurements.','A tapping measurement alone cannot identify a neurological condition.']};
  return {title:r.task==='pronation'?'An experimental orientation measurement.':r.patternLabel==='concentrated-rhythm'?'A repeating rhythm stood out.':'Motion was spread across frequencies.',
    body:r.frequencyHz?`The largest spectral peak was at ${r.frequencyHz.toFixed(2)} Hz, within the measured ${r.task==='pronation'?'0.3':'2'}–${r.maxAnalyzedHz.toFixed(1)} Hz range. That is a signal measurement, not a disease label.`:'No measurable peak was found in the analyzed frequency range.',
    points:[r.task==='pronation'?'Camera-estimated palm orientation is not a validated measure of forearm rotation.':'Movement of the camera, voluntary movement, and landmark jitter can also produce peaks.',
    'A low-motion recording cannot rule out Parkinson’s or another condition.']};
}
