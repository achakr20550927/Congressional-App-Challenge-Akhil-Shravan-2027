import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext.jsx';
import { getSessionHistory, exportCsv, downloadBlob } from '../lib/storage.js';
import { TASKS, taskInfo } from '../lib/measurements.js';
import { LinePlot } from '../components/EvidenceCharts.jsx';
import AppIcon from '../components/AppIcon.jsx';

export default function History() {
  const {mode}=useAppState();const [records,setRecords]=useState([]),[task,setTask]=useState('rest'),[hand,setHand]=useState('Right'),[range,setRange]=useState('90'),[error,setError]=useState(''),[qualityOnly,setQualityOnly]=useState(false),[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;getSessionHistory().then(r=>active&&setRecords(r)).catch(()=>active&&setError('Could not read local recordings.')).finally(()=>active&&setLoading(false));return()=>{active=false;};},[]);
  const filtered=useMemo(()=>records.filter(r=>(task==='all'||r.task===task)&&(hand==='all'||r.hand===hand||r.task==='spiral')&&(!qualityOnly||r.qualityOk===true)&&(!range||Date.now()-new Date(r.recordedAt)<Number(range)*86400000)).reverse(),[records,task,hand,range,qualityOnly]);
  const metric=task==='tap'?'tapRateHz':task==='spiral'?'meanDeviationPctRadius':task==='pronation'?'frequencyHz':'rmsAmplitude';
  const expectedProtocol=task==='spiral'?'drawing-v3':'camera-v3';
  const eligible=filtered.filter(r=>r.qualityOk===true&&r.protocolVersion===expectedProtocol&&Number.isFinite(r[metric])).slice().reverse();
  const inputTypes=new Set(eligible.map(r=>r.inputType).filter(Boolean));
  const comparable=task!=='all'&&(task==='spiral'?inputTypes.size<=1:hand!=='all');
  const label=task==='tap'?'Taps per second':task==='spiral'?'Mean distance (% radius)':task==='pronation'?'Orientation peak (Hz)':'RMS motion (% palm length)';
  const chart=eligible.map(r=>({x:new Date(r.recordedAt).getTime()/86400000,y:r[metric]*(metric==='rmsAmplitude'?100:1)}));
  const day0=chart[0]?.x||0;
  async function download(){try{downloadBlob(await exportCsv(filtered.map(r=>r.id)),'neuratrack-journal.csv');}catch{setError('Export failed. Please try again.');}}
  return <div className="workspace-page"><header className="page-heading"><div><span className="overline">YOUR RECORDING JOURNAL</span><h1>Notice the bigger picture.</h1><p>Keep the measurements. Add the context. Compare like with like.</p></div><button className="btn btn-ghost" disabled={!filtered.length} onClick={download}><AppIcon name="download"/>Export CSV</button></header>
    <div className="journal-filters"><label>Task<select aria-label="Task" value={task} onChange={e=>setTask(e.target.value)}><option value="all">All tasks</option>{TASKS.map(t=><option value={t.key} key={t.key}>{t.title}</option>)}</select></label><label>Hand<select aria-label="Hand" value={hand} onChange={e=>setHand(e.target.value)}><option value="all">Both / unspecified</option><option>Right</option><option>Left</option></select></label><label>Time range<select aria-label="Time range" value={range} onChange={e=>setRange(e.target.value)}><option value="7">Past week</option><option value="30">Past month</option><option value="90">Past 90 days</option><option value="">All time</option></select></label>{mode==='clinician'&&<label className="checkbox-row"><input type="checkbox" checked={qualityOnly} onChange={e=>setQualityOnly(e.target.checked)}/>Quality-passed only</label>}</div>
    {error&&<p role="alert" className="notice warning">{error}</p>}
    <section className="panel history-plot"><div className="panel-heading"><h3>{task==='all'?'Select one task to compare':label}</h3><span>{eligible.length} CURRENT-PROTOCOL RECORDINGS</span></div>{comparable&&chart.length>=2?<LinePlot points={chart.map(p=>({...p,x:p.x-day0}))} xLabel="Days since first displayed recording" yLabel={label}/>:<div className="empty-inline"><AppIcon name="history" size={32}/><h3>{!comparable?'Keep the comparison consistent.':'A trend needs another check-in.'}</h3><p>{!comparable?'Choose a single task and hand. Drawing comparisons also require the same input type.':'At least two quality-passed recordings of the same task, hand, and protocol are needed.'}</p></div>}<p className="subtle-caption">A change is not a diagnosis or proof of improvement. Camera distance, lighting, effort, and timing matter. Older protocols and failed quality checks are excluded from this chart.</p></section>
    <div className="section-title"><h2>Recordings</h2><span>{filtered.length} shown</span></div>
    <section className="panel recording-list">{loading?<p role="status">Opening journal…</p>:!filtered.length?<div className="empty-inline"><h3>No recordings in this view.</h3><p>Try another filter, or make your first check-in.</p><Link className="btn btn-primary" to="/app">Choose a task</Link></div>:filtered.map(r=><Link to={`/results/${r.id}`} key={r.id} className="recording-row"><span className="recording-icon"><AppIcon name={r.task==='spiral'?'activity':'hand'}/></span><div><strong>{taskInfo(r.task)?.title||r.task}</strong><small>{new Date(r.recordedAt).toLocaleString()} · {r.hand||r.inputType||'Unspecified hand'}{r.notes?' · Note added':''}</small></div><span className={`status-label ${r.qualityOk===false?'status-retry':''}`}>{!r.protocolVersion?'Legacy':r.qualityOk?'Recorded':'Repeat needed'}</span><AppIcon name="arrow" size={16}/></Link>)}</section></div>;
}
