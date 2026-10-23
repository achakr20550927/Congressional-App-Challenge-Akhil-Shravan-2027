import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { startCameraStream, initHandLandmarker, detectFrame, HAND_CONNECTIONS } from '../lib/capture.js';
import { frameSample, analyzeRecording, analyzeDrawing, taskInfo, selectHand } from '../lib/measurements.js';
import { generateIdealSpiral } from '../lib/signal.js';
import { saveTaskResult } from '../lib/storage.js';
import AppIcon from '../components/AppIcon.jsx';
import { LinePlot } from '../components/EvidenceCharts.jsx';
import ResultView from '../components/ResultView.jsx';

export default function TaskCapture() {
  const {task}=useParams(), meta=taskInfo(task), navigate=useNavigate();
  const [flow,setFlow]=useState('instructions'),[camera,setCamera]=useState('idle'),[error,setError]=useState('');
  const [hand,setHand]=useState('Right'),[visible,setVisible]=useState(false),[remaining,setRemaining]=useState(meta?.duration||10);
  const [count,setCount]=useState(3),[live,setLive]=useState([]),[result,setResult]=useState(null),[saveError,setSaveError]=useState('');
  const video=useRef(null),canvas=useRef(null),spiral=useRef(null),stream=useRef(null),tracker=useRef(null);
  const alive=useRef(true),generation=useRef(0),raf=useRef(0),state=useRef('instructions'),selected=useRef(hand);
  const started=useRef(0),frames=useRef(0),samples=useRef([]),path=useRef([]),guide=useRef([]),drawing=useRef(false),inputType=useRef('unknown'),finishRef=useRef(null);
  selected.current=hand;
  function transition(next){state.current=next;setFlow(next);}
  function stopCamera(){cancelAnimationFrame(raf.current);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCamera('idle');}
  useEffect(()=>{
    alive.current=true;
    return ()=>{alive.current=false;generation.current++;cancelAnimationFrame(raf.current);stream.current?.getTracks().forEach(t=>t.stop());};
  },[]);
  useEffect(()=>{
    const hide=()=>{if(document.hidden && ['recording','countdown'].includes(state.current)){stopCamera();transition('instructions');setError('Check-in interrupted when the app left the foreground. Please try again.');}};
    document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);
  },[]);
  useEffect(()=>{
    if(flow!=='countdown')return;
    setCount(3);let n=3;
    const timer=setInterval(()=>{n--;setCount(n);if(n<=0){clearInterval(timer);beginRecording();}},1000);
    return()=>clearInterval(timer);
  },[flow]);
  useEffect(()=>{
    if(flow!=='recording')return;
    const timer=setInterval(()=>{const elapsed=performance.now()-started.current;setRemaining(Math.max(0,meta.duration-elapsed/1000));if(elapsed>=meta.duration*1000)finishRef.current();},100);
    return()=>clearInterval(timer);
  },[flow,meta?.duration]);
  useEffect(()=>{finishRef.current=finish;});

  async function enableCamera(){
    const token=++generation.current;setError('');setCamera('requesting');
    try{
      const s=await startCameraStream({audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30}}});
      if(!alive.current||token!==generation.current){s.getTracks().forEach(t=>t.stop());return;}
      stream.current?.getTracks().forEach(t=>t.stop());stream.current=s;
      const v=video.current;v.srcObject=s;
      await v.play();
      const model=await initHandLandmarker({numHands:2});
      if(!alive.current||token!==generation.current){s.getTracks().forEach(t=>t.stop());return;}
      tracker.current=model;setCamera('ready');
      canvas.current.width=v.videoWidth;canvas.current.height=v.videoHeight;
      let previousTime=-1,previousPaint=0;
      const tick=()=>{
        if(!alive.current||token!==generation.current)return;
        try{
          if(v.readyState>=2&&v.currentTime!==previousTime){
            previousTime=v.currentTime;const now=performance.now(),detected=detectFrame(model,v,now);
            const chosen=selectHand(detected,selected.current);setVisible(!!chosen);
            drawOverlay(detected);
            if(state.current==='recording'){
              const elapsed=now-started.current;frames.current++;
              const sample=frameSample(detected,selected.current,elapsed,v.videoHeight/v.videoWidth);
              if(sample)samples.current.push(sample);
              if(now-previousPaint>150){previousPaint=now;setLive(samples.current.slice(-90).map(p=>({x:p.t/1000,y:task==='tap'?p.tapDistance/p.scale:p.x/p.scale})));}
            }
          }
          raf.current=requestAnimationFrame(tick);
        }catch{stopCamera();transition('instructions');setError('Hand tracking stopped unexpectedly. Try reopening the camera.');}
      };
      cancelAnimationFrame(raf.current);tick();
    }catch(err){
      if(!alive.current||token!==generation.current)return;
      stopCamera();
      setError(err.kind==='denied'?'Camera permission was denied. Allow access in your browser’s site settings, then try again.':err.kind==='not-found'?'No camera is available. You can still try the spiral trace.':err.kind==='in-use'?'The camera is busy in another app. Close that app and retry.':'The camera or tracking model could not start. Check your connection and camera permissions, then retry.');
    }
  }

  function drawOverlay(detected){
    const c=canvas.current;if(!c)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
    const h=selectHand(detected,selected.current);if(!h)return;
    ctx.strokeStyle='#a5e2cf';ctx.lineWidth=2;
    for(const [a,b] of HAND_CONNECTIONS){ctx.beginPath();ctx.moveTo(h.points[a].x*c.width,h.points[a].y*c.height);ctx.lineTo(h.points[b].x*c.width,h.points[b].y*c.height);ctx.stroke();}
    for(const p of h.points){ctx.beginPath();ctx.arc(p.x*c.width,p.y*c.height,3,0,Math.PI*2);ctx.fillStyle='#effff9';ctx.fill();}
  }
  function beginRecording(){
    (task==='spiral'?spiral.current:video.current)?.scrollIntoView({block:'center',behavior:'instant'});
    frames.current=0;samples.current=[];path.current=[];drawing.current=false;setLive([]);started.current=performance.now();setRemaining(meta.duration);transition('recording');
  }
  async function finish(){
    if(state.current!=='recording')return;
    transition('analyzing');drawing.current=false;
    stopCamera();
    try{
      const measured=task==='spiral'?analyzeDrawing(path.current,guide.current,inputType.current):analyzeRecording({samples:samples.current,totalFrames:frames.current,task,hand:selected.current,durationMs:10000});
      let saved=measured;
      try{saved=await saveTaskResult(measured);setSaveError('');}
      catch{setSaveError('This recording could not be saved. Keep this screen open and export your measurements before leaving.');}
      if(!alive.current)return;
      setResult(saved);transition('result');
    }catch{if(alive.current){setError('The recording could not be analyzed. Please repeat the task.');transition('instructions');}}
  }
  useEffect(()=>{
    if(task!=='spiral'||!spiral.current||flow==='result')return;
    const c=spiral.current;
    const resize=()=>{
      if(state.current==='recording'&&path.current.length){transition('instructions');setError('Screen size changed during the trace. Start again so the guide stays consistent.');path.current=[];}
      const b=c.getBoundingClientRect();c.width=b.width;c.height=b.height;
      guide.current=generateIdealSpiral({turns:4,growth:Math.min(b.width,b.height)*.41/(8*Math.PI),points:720});
      drawSpiral();
    };
    const obs=new ResizeObserver(resize);obs.observe(c);resize();return()=>obs.disconnect();
  },[task,flow==='result']);
  function drawSpiral(){
    const c=spiral.current;if(!c)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.translate(c.width/2,c.height/2);
    const draw=(pts,color,dash)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash(dash);ctx.stroke();};
    draw(guide.current,'#647e8a',[4,5]);draw(path.current,'#ace6d2',[]);ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fillStyle='#e3b99c';ctx.fill();ctx.restore();
  }
  function pointer(e){
    const b=spiral.current.getBoundingClientRect();return {x:e.clientX-b.left-b.width/2,y:e.clientY-b.top-b.height/2,t:performance.now()};
  }
  function down(e){
    if(state.current!=='recording'||drawing.current||e.isPrimary===false)return;
    e.preventDefault();spiral.current.setPointerCapture(e.pointerId);drawing.current=true;path.current=[pointer(e)];inputType.current=e.pointerType||'unknown';drawSpiral();
  }
  function move(e){if(!drawing.current||state.current!=='recording')return;e.preventDefault();path.current.push(pointer(e));drawSpiral();}
  function up(e){if(!drawing.current)return;path.current.push(pointer(e));drawing.current=false;finishRef.current();}
  function cancel(){generation.current++;stopCamera();transition('instructions');setRemaining(meta.duration);setVisible(false);}
  if(!meta)return <div className="workspace-page"><h1>Task not found</h1><Link to="/app">Choose a check-in</Link></div>;
  if(flow==='result'&&result)return <div className="workspace-page"><ResultView result={result} saveError={saveError}/><div className="result-actions"><button className="btn btn-primary" onClick={()=>{setResult(null);setVisible(false);setLive([]);transition('instructions');}}>Repeat this task <AppIcon name="arrow"/></button><button className="btn btn-ghost" onClick={()=>navigate('/app')}>Another check-in</button></div></div>;
  const busy=['recording','countdown','analyzing'].includes(flow);
  return <div className="workspace-page capture-workspace">
    <header className="page-heading"><div><Link className="overline" to="/app">← ALL CHECK-INS</Link><h1>{meta.title}</h1><p>{meta.subtitle}</p></div><span className="pill">{task==='spiral'?'TOUCH + MOUSE':'CAMERA'} · {meta.duration} SEC</span></header>
    <ol className="capture-steps" aria-label="Check-in progress">{['Prepare','Record','Understand'].map((s,i)=><li key={s} aria-current={(i===0&&!busy)||(i===1&&busy)?'step':undefined}><span>{i+1}</span>{s}</li>)}</ol>
    <div className="capture-work-grid">
      <div className="capture-main-column">
        <div className="camera-stage">
          {task==='spiral'?<canvas ref={spiral} className="spiral-pad" aria-label="Trace the four-turn spiral starting at the center" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{drawing.current=false;cancel();setError('Trace interrupted. Please try again.');}}/>:<><video ref={video} muted playsInline autoPlay/><canvas ref={canvas} className="landmark-overlay"/>{camera!=='ready'&&<div className="camera-placeholder"><div className="camera-target"><AppIcon name="hand" size={52}/></div><h3>{camera==='requesting'?'Preparing your camera…':'Your hand. Your data.'}</h3><p>21 tracked landmarks.<br/>Processed on this device, never recorded as video.</p>{camera!=='requesting'&&<button className="btn btn-primary" onClick={enableCamera}><AppIcon name="camera"/>Enable camera</button>}</div>}</>}
          <div className="stage-top"><span><i className={flow==='recording'?'record-dot':''}/>{flow==='recording'?'MEASURING':'PRIVATE SESSION'}</span><span>{task==='spiral'?'4 TURNS':camera==='ready'?(visible?'HAND FOUND':'HAND NOT VISIBLE'):'CAMERA OFF'}</span></div>
          {flow==='countdown'&&<div className="countdown-cover" aria-live="polite"><strong>{count}</strong><span>Get comfortable. We’ll start automatically.</span></div>}
          {flow==='recording'&&<div className="recording-timer"><span>{remaining.toFixed(1)}s</span><progress value={meta.duration-remaining} max={meta.duration} aria-label="Recording progress"/></div>}
          {flow==='analyzing'&&<div className="countdown-cover" role="status"><strong>…</strong><span>Checking signal quality</span></div>}
        </div>
        <div className="stage-caption"><AppIcon name="shield" size={16}/><span>No raw video or hand landmarks are saved. Only derived measurements.</span></div>
        {task!=='spiral'&&<section className="panel live-panel"><div className="panel-heading"><h3>Live movement</h3><span>{flow==='recording'?'RECORDING':'WAITING FOR CHECK-IN'}</span></div><LinePlot points={live} yLabel={task==='tap'?'Finger opening / palm length':'Hand center / palm length'}/></section>}
      </div>
      <aside className="capture-instructions">
        <section className="panel"><span className="overline">BEFORE YOU BEGIN</span><h2>A consistent setup<br/>makes a difference.</h2><p>{meta.instruction}</p>
          {task!=='spiral'&&<><label className="field-label" htmlFor="record-hand">Hand to measure</label><select id="record-hand" value={hand} disabled={busy} onChange={e=>{setHand(e.target.value);setVisible(false);}}><option>Right</option><option>Left</option></select><p className="subtle-caption">Confirm the overlay follows your selected hand. Handedness is estimated by the tracker.</p></>}
          <ul className="setup-checklist"><li><AppIcon name="check"/>Use even, bright lighting</li><li><AppIcon name="check"/>Keep your device stationary</li><li><AppIcon name="check"/>Use the same setup each time</li></ul>
          {error&&<p className="notice warning" role="alert">{error}</p>}
          <div className="capture-controls">{!busy&&<button className="btn btn-primary" disabled={task!=='spiral'&&(camera!=='ready'||!visible)} onClick={()=>{setError('');task==='spiral'?beginRecording():transition('countdown');}}>Start {meta.duration}-second check-in <AppIcon name="arrow"/></button>}{busy&&<button className="btn btn-ghost" disabled={flow==='analyzing'} onClick={cancel}>Cancel check-in</button>}{!busy&&camera==='ready'&&<button className="quiet-link" onClick={cancel}>Turn camera off</button>}</div>
        </section>
        <section className="quality-explainer"><AppIcon name="activity"/><h3>Quality comes first.</h3><p>{task==='spiral'?'We check that you traced enough of the spiral before showing a comparison.':'We check frame rate, tracking gaps, hand visibility, and camera distance before interpreting the signal.'}</p><Link to="/evidence">Understand our approach →</Link></section>
      </aside>
    </div>
  </div>;
}
