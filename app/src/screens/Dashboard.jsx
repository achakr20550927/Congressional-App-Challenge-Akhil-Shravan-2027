import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext.jsx';
import { getSessionHistory } from '../lib/storage.js';
import { TASKS, taskInfo } from '../lib/measurements.js';
import AppIcon from '../components/AppIcon.jsx';
import TaskIcon from '../components/TaskIcon.jsx';
import { LinePlot } from '../components/EvidenceCharts.jsx';

export default function Dashboard() {
  const {profile,mode}=useAppState();
  const [history,setHistory]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{let live=true; getSessionHistory().then(r=>live&&setHistory(r)).catch(()=>live&&setError('Your journal could not be opened. Check browser storage permissions.')).finally(()=>live&&setLoading(false));return()=>{live=false;};},[]);
  const usable=history.filter(r=>r.qualityOk===true&&r.protocolVersion);
  const recent=history.slice(-3).reverse();
  const coverage=new Set(usable.map(r=>r.task));
  const recentRest=usable.filter(r=>r.task==='rest'&&r.hand==='Right'&&r.protocolVersion==='camera-v3').slice(-12);
  const greeting=mode==='clinician'?'Assessment overview.':profile?.name?`Welcome back, ${profile.name.split(' ')[0]}.`:'Your assessments.';
  return <div className="workspace-page">
    <header className="page-heading"><div><span className="overline">{mode==='clinician'?'REVIEW WORKSPACE':'YOUR MOVEMENT JOURNAL'}</span><h1>{greeting}</h1><p>{mode==='clinician'?'Inspect quality first. Then compare measurements, add context, and prepare a report.':'Small check-ins. A clearer picture of your movement over time.'}</p></div><span className="date-label">{new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',weekday:'short'}).format(new Date())}</span></header>
    {error&&<p role="alert" className="notice warning">{error}</p>}
    <div className="classic-intro"><span className="overline">GUIDED MOVEMENT ASSESSMENT</span><p>Choose a short assessment below. Review your signal, keep a record, and compare the same task over time.</p><Link className="quiet-link" to="/demo">Explore sample analysis →</Link></div>
    <div className="summary-strip"><div><span>RECORDINGS</span><strong>{loading?'—':history.length}</strong><small>On this device</small></div><div><span>QUALITY CHECKED</span><strong>{loading?'—':usable.length}</strong><small>Current-protocol recordings</small></div><div><span>YOUR DATA</span><strong>Local only <AppIcon name="shield" size={19}/></strong><small>No account or upload required</small></div></div>
    <div className="section-title"><div><span className="overline">FIVE WAYS TO CHECK IN</span><h2>Choose an assessment.</h2></div><p>10–30 seconds per task</p></div>
    <div className="assessment-grid">{TASKS.map((task,i)=><Link to={`/capture/${task.key}`} className="assessment-card" key={task.key}><div className="assessment-card-head"><span className="task-icon-shell"><TaskIcon task={task.key}/></span><span className="task-duration">{task.duration}s {coverage.has(task.key)&&<AppIcon name="check" size={14}/>}</span></div><h3>{task.title}</h3><p>{task.subtitle}</p><div className="assessment-card-foot"><span>{task.key==='pronation'?'Experimental':task.key==='spiral'?'Touch or mouse':'Camera-guided'}</span><AppIcon name="arrow" size={18}/></div></Link>)}</div>
    <div className="journal-preview-grid">
      <section className="panel journal-preview"><div className="panel-heading"><h3>Recent check-ins</h3><Link to="/history">Open journal <AppIcon name="arrow" size={16}/></Link></div>{!recent.length?<div className="empty-inline"><AppIcon name="history" size={32}/><h3>No assessments yet.</h3><p>Completed check-ins will appear here. No sample data is added to your journal.</p></div>:recent.map(r=><Link className="recording-row" to={`/results/${r.id}`} key={r.id}><span className="recording-icon"><TaskIcon task={r.task}/></span><div><strong>{taskInfo(r.task)?.title||r.task}</strong><small>{new Date(r.recordedAt).toLocaleString()} · {r.hand||r.inputType||'Legacy protocol'}</small></div><span className={`status-label ${r.qualityOk===false?'status-retry':''}`}>{r.qualityOk===false?'Retry':r.protocolVersion?'Recorded':'Legacy'}</span><AppIcon name="arrow" size={16}/></Link>)}</section>
      <section className="panel"><div className="panel-heading"><h3>Resting-hand amplitude</h3><span>RIGHT HAND</span></div>{recentRest.length>=2?<LinePlot points={recentRest.map((r,i)=>({x:i+1,y:r.rmsAmplitude*100}))} xLabel="Recording number" yLabel="% of projected palm length"/>:<div className="empty-inline"><div className="empty-bars" aria-hidden="true">{[28,44,34,58,46,64,52,70,56].map((h,i)=><i key={i} style={{height:h}}/>)}</div><h3>Your trend appears after two recordings.</h3><p>Two quality-checked right-hand rest recordings unlock this chart. Same setup. Same task.</p></div>}<p className="subtle-caption">Amplitude is not disease severity. Compare only similar recording conditions.</p></section>
    </div>
    <Link className="research-banner" to="/evidence"><span className="research-icon"><AppIcon name="science" size={25}/></span><div><strong>Research & model evaluation</strong><p>See the training data, validation results, and what this app cannot tell you.</p></div><AppIcon name="arrow"/></Link>
    {mode==='clinician'&&<p className="notice">Review view adds quality filters, technical measurements, and report tools. It is not a clinician login or a multi-patient record system.</p>}
  </div>;
}
