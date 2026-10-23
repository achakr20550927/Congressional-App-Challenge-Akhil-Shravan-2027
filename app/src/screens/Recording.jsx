import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getResult } from '../lib/storage.js';
import { analyzeRecording } from '../lib/measurements.js';
import ResultView from '../components/ResultView.jsx';

export function sampleResult() {
  const samples=Array.from({length:300},(_,i)=>{const t=i/30;return {t:t*1000,x:.5+.004*Math.sin(2*Math.PI*5*t)+.0005*Math.sin(2*Math.PI*.4*t),y:.4+.001*Math.cos(2*Math.PI*5*t),scale:.2,orientation:0,tapDistance:.1};});
  return analyzeRecording({samples,totalFrames:300,task:'rest',hand:'Right'});
}
export default function Recording({demo=false}) {
  const {id}=useParams();const [result,setResult]=useState(demo?sampleResult():null),[error,setError]=useState('');
  useEffect(()=>{if(demo)return;let live=true;setResult(null);setError('');getResult(id).then(r=>{if(!live)return;r?setResult(r):setError('This recording is not on this device.');}).catch(()=>live&&setError('Your journal could not be opened. Check browser storage permissions.'));return()=>{live=false;};},[id,demo]);
  if(error)return <div className="workspace-page"><h1>Recording unavailable</h1><p role="alert">{error}</p><Link to="/history">Back to journal</Link></div>;
  return <div className="workspace-page">{result?<ResultView key={id||'demo'} result={result} demo={demo}/>:<p role="status">Opening recording…</p>}</div>;
}
