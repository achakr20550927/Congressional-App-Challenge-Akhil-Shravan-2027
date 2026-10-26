import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getResult } from '../lib/storage.js';
import { sampleResult } from '../lib/sample.js';
import ResultView from '../components/ResultView.jsx';

export { sampleResult } from '../lib/sample.js';
export default function Recording({demo=false}) {
  const {id}=useParams();const [result,setResult]=useState(demo?sampleResult():null),[error,setError]=useState('');
  useEffect(()=>{if(demo)return;let live=true;setResult(null);setError('');getResult(id).then(r=>{if(!live)return;r?setResult(r):setError('This recording is not on this device.');}).catch(()=>live&&setError('Your journal could not be opened. Check browser storage permissions.'));return()=>{live=false;};},[id,demo]);
  if(error)return <div className="workspace-page"><h1>Recording unavailable</h1><p role="alert">{error}</p><Link to="/history">Back to journal</Link></div>;
  return <div className="workspace-page">{result?<ResultView key={id||'demo'} result={result} demo={demo}/>:<p role="status">Opening recording…</p>}</div>;
}
