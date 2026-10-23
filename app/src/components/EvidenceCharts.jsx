import { useState } from 'react';

function ChartFrame({title,kicker,caption,children}) {return <figure className="signal-panel"><div className="panel-heading"><h3>{title}</h3><span>{kicker}</span></div>{children}<figcaption>{caption}</figcaption></figure>;}

export function LinePlot({points=[],xLabel='Seconds',yLabel='Relative motion',color='#9ee4d4',marker=null}) {
  if(points.length<2) return <div className="chart-empty">Complete a recording to see your signal.</div>;
  const ys=points.map(p=>p.y),xs=points.map(p=>p.x),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const spanY=maxY-minY||1,spanX=maxX-minX||1;
  const x=v=>48+(v-minX)/spanX*500,y=v=>164-(v-minY)/spanY*130;
  const path=points.map((p,i)=>`${i?'L':'M'}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  return <svg className="signal-svg" viewBox="0 0 580 210" role="img" aria-label={`${yLabel} by ${xLabel}`}>
    {[0,1,2,3].map(i=><g key={i}><line x1="48" x2="548" y1={34+i*43.33} y2={34+i*43.33} stroke="#20313c"/><text x="39" y={38+i*43.33} textAnchor="end">{(maxY-spanY*i/3).toFixed(2)}</text></g>)}
    <path d={`${path}L${x(maxX)},164L48,164Z`} fill={color} opacity=".05"/>
    <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    {marker!=null&&<line x1={x(marker)} x2={x(marker)} y1="25" y2="170" stroke="#e3b99c" strokeDasharray="4 4"/>}
    {[0,.25,.5,.75,1].map(v=><text key={v} x={48+v*500} y="184" textAnchor="middle">{(minX+spanX*v).toFixed(1)}</text>)}<text x="298" y="205" textAnchor="middle">{xLabel}</text>
  </svg>;
}

export function DensityMap({points=[],guide=null}) {
  const [hover,setHover]=useState(null);
  if(points.length<2) return <div className="chart-empty">No trajectory available.</div>;
  const all=guide?[...points,...guide]:points;
  const minX=Math.min(...all.map(p=>p.x)),maxX=Math.max(...all.map(p=>p.x)),minY=Math.min(...all.map(p=>p.y)),maxY=Math.max(...all.map(p=>p.y));
  const span=Math.max(maxX-minX,maxY-minY,.0001)*1.12,cx=(maxX+minX)/2,cy=(maxY+minY)/2;
  const project=p=>({x:40+((p.x-cx)/span+.5)*320,y:24+((p.y-cy)/span+.5)*240});
  const cells=new Array(20*15).fill(0);
  points.forEach(p=>{const a=project(p);const ix=Math.max(0,Math.min(19,Math.floor((a.x-40)/16))),iy=Math.max(0,Math.min(14,Math.floor((a.y-24)/16)));cells[iy*20+ix]++;});
  const max=Math.max(...cells,1);
  return <><svg className="density-svg" viewBox="0 0 400 296" role="img" aria-label={guide?'Recorded spiral and guide':'Relative hand position density: each cell reports its share of tracked frames'}>
    {cells.map((n,i)=><rect key={i} x={40+(i%20)*16} y={24+Math.floor(i/20)*16} width="14" height="14" rx="3" fill={n?`hsl(${174-(n/max)*140} 60% ${20+(n/max)*48}%)`:'#14232e'} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(null)}><title>{n} frames · {(n/points.length*100).toFixed(1)}% of tracked samples</title></rect>)}
    {guide&&<polyline points={guide.map(p=>{const a=project(p);return `${a.x},${a.y}`;}).join(' ')} fill="none" stroke="#9bb6c5" strokeWidth="1.3" strokeDasharray="3 3"/>}
    {guide&&<polyline points={points.map(p=>{const a=project(p);return `${a.x},${a.y}`;}).join(' ')} fill="none" stroke="#9ee4d4" strokeWidth="1.7"/>}
    <text x="200" y="288" textAnchor="middle">{guide?'Dashed: guide · Solid: recorded trace':'Horizontal / vertical position (relative scale)'}</text>
  </svg><div className="density-legend"><span>Less time</span><i/><span>More time</span></div><small className="chart-readout">{hover!=null?`${hover} frames · ${(hover/points.length*100).toFixed(1)}% of tracked samples`:'Each cell counts recorded samples; colors are not health ratings.'}</small></>;
}

export default function EvidenceCharts({result:r}) {
  const [moment,setMoment]=useState(0);
  const trace=r.trace||[],spectrum=r.spectrum||[],points=r.trajectoryPoints||[];
  const peak=Math.max(...spectrum.map(p=>p.mag*p.mag),1e-15);
  return <div className="report-charts">
    {trace.length>1&&<ChartFrame title={r.task==='tap'?'Finger opening':'Recorded signal'} kicker="TIME SERIES" caption={r.task==='pronation'?'Normalized palm-normal component; not an angle in degrees.':r.task==='tap'?'Thumb–index opening relative to projected palm length.':'Principal-axis hand displacement, relative to median projected palm length.'}>
      <LinePlot points={trace.map(p=>({x:p.t,y:p.value}))} marker={moment}/><label className="signal-scrubber"><span>Inspect {moment.toFixed(1)} s</span><input aria-label="Inspect signal time" type="range" min="0" max={trace.at(-1).t} step=".1" value={moment} onChange={e=>setMoment(Number(e.target.value))}/><output>{trace.reduce((best,p)=>Math.abs(p.t-moment)<Math.abs(best.t-moment)?p:best,trace[0]).value.toFixed(4)}</output></label>
    </ChartFrame>}
    {spectrum.length>0&&<ChartFrame title="Frequency fingerprint" kicker="RELATIVE POWER" caption="Bars show squared spectral magnitude, normalized to the highest peak. A peak is not a diagnosis.">
      <svg className="signal-svg" viewBox="0 0 580 240" role="img" aria-label="Frequency spectrum"><line x1="36" y1="198" x2="558" y2="198" stroke="#304552"/>{spectrum.map((p,i)=><rect key={i} x={36+i/spectrum.length*522} y={198-p.mag*p.mag/peak*162} width={Math.max(1,522/spectrum.length-1)} height={p.mag*p.mag/peak*162} rx="1" fill={Math.abs(p.freq-(r.frequencyHz||0))<.35?'#e3b99c':'#7cc8f0'}><title>{p.freq.toFixed(2)} Hz · {(p.mag*p.mag/peak*100).toFixed(1)}% of peak</title></rect>)}{[0,.25,.5,.75,1].map(v=><text key={v} x={36+v*522} y="220" textAnchor="middle">{(spectrum[0].freq+(spectrum.at(-1).freq-spectrum[0].freq)*v).toFixed(1)}</text>)}<text x="298" y="238" textAnchor="middle">Frequency (Hz)</text></svg>
    </ChartFrame>}
    {points.length>1&&<ChartFrame title={r.task==='spiral'?'Your path, in context':'Motion density'} kicker={r.task==='spiral'?'TRACE + GUIDE':'SPATIAL DISTRIBUTION'} caption="The plot auto-scales to this recording. Compare numeric amplitudes—not heatmap size—between sessions."><DensityMap points={points} guide={r.guide}/></ChartFrame>}
    {!!r.cycles?.length&&<ChartFrame title="Tap-by-tap" kicker="OPENING AMPLITUDE" caption="Each bar represents an opening-to-closure movement; incomplete edge cycles are excluded."><div className="tap-bars">{r.cycles.map((p,i)=><div key={i} style={{height:`${Math.max(2,p.amplitude/Math.max(...r.cycles.map(c=>c.amplitude))*100)}%`}} title={`Tap ${i+1}: ${p.amplitude.toFixed(3)} palm lengths`}><span>{i+1}</span></div>)}</div></ChartFrame>}
  </div>;
}
