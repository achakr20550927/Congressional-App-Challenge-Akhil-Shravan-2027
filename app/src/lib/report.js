import { taskInfo, describeResult } from './measurements.js';

/** Portable, paginated report. Accept font bytes in tests; browser fetch is local. */
export async function createReport(results, recipientNote = '', fontBytes) {
  if (!results.length) throw new Error('Select at least one recording.');
  const { jsPDF } = await import('jspdf');
  if (!fontBytes) {
    const response = await fetch('/fonts/NotoSans-Regular.ttf');
    if (!response.ok) throw new Error('Report font unavailable. Connect once and retry.');
    fontBytes = new Uint8Array(await response.arrayBuffer());
  }
  let binary = '';
  for (let i=0;i<fontBytes.length;i+=8192) binary += String.fromCharCode(...fontBytes.slice(i,i+8192));
  const doc = new jsPDF({unit:'pt',format:'letter',compress:true});
  doc.addFileToVFS('NotoSans.ttf', btoa(binary)); doc.addFont('NotoSans.ttf','NotoSans','normal');
  doc.setFont('NotoSans');
  const margin=46,width=520,bottom=714;let y=46;
  const nextPage=()=>{doc.addPage();y=46;};
  const room=h=>{if(y+h>bottom)nextPage();};
  function text(value,size=10,color=[58,76,80],after=10){
    doc.setFontSize(size);doc.setTextColor(...color);
    const lines=doc.splitTextToSize(String(value),width);
    for(const line of lines){room(size*1.5);doc.text(line,margin,y);y+=size*1.5;}
    y+=after;
  }
  function heading(label){room(46);y+=10;text(label,15,[24,69,57],12);}
  function rule(){room(15);doc.setDrawColor(208,220,216);doc.line(margin,y,margin+width,y);y+=18;}
  function chart(points,title){
    if(points.length<2)return;room(160);text(title,10,[24,69,57],5);
    const h=90,top=y;const vals=points.map(p=>p.value),max=Math.max(...vals),min=Math.min(...vals),span=max-min||1;
    doc.setDrawColor(223,232,228);doc.rect(margin,top,width,h);
    doc.setDrawColor(36,111,91);doc.setLineWidth(.9);
    points.forEach((p,i)=>{if(!i)return;const px=margin+(i-1)/(points.length-1)*width, x=margin+i/(points.length-1)*width;doc.line(px,top+h-(points[i-1].value-min)/span*h,x,top+h-(p.value-min)/span*h);});
    y+=h+16;text(`Range ${min.toFixed(4)} to ${max.toFixed(4)}. Time ${points[0].t.toFixed(1)} to ${points.at(-1).t.toFixed(1)} seconds.`,8,[83,101,102],5);
  }
  text('NEURATRACK / MOVEMENT JOURNAL',10,[36,111,91],6);
  text('Recording report',25,[24,46,47],10);
  text(`Generated ${new Date().toLocaleString()} | ${results.length} recording${results.length===1?'':'s'}`,9);
  text('Research prototype - not a diagnostic device. These measurements cannot diagnose or rule out Parkinson’s disease, determine disease severity, or replace clinical assessment.',10,[105,65,39]);
  if(recipientNote){heading('Cover note');text(recipientNote.slice(0,500));}
  rule();
  for(const [index,r] of results.entries()){
    if(index)nextPage();
    heading(`${index+1}. ${taskInfo(r.task)?.title||r.task}`);
    text(`${new Date(r.recordedAt).toLocaleString()} | ${r.hand||r.inputType||'Unspecified hand'} | ${r.protocolVersion||'Legacy protocol'}`,9);
    text(!r.protocolVersion?'Legacy recording: not comparable with current-protocol measurements.':r.qualityOk?'Recording passed engineering quality checks. This is not a health rating.':'Insufficient recording quality. Measurements withheld from interpretation.',10,[105,65,39]);
    if(r.qualityOk&&r.protocolVersion){
      const rows = r.task==='spiral'?[['Mean guide distance',r.meanDeviationPctRadius,'% of guide radius'],['Turns traced',r.spiralTurns,'turns']]:r.task==='tap'?[['Tap count',r.tapCount,'taps'],['Tap pace',r.tapRateHz,'taps/second'],['Tap size decrease',r.tapDecrementPct,'% (negative = increase)']]:[['Largest spectral peak',r.frequencyHz,'Hz'],['RMS motion',r.rmsAmplitude==null?null:r.rmsAmplitude*100,'% projected palm length'],['Single-bin concentration',r.peakProminence==null?null:r.peakProminence*100,'% of analyzed band power']];
      for(const [label,value,unit] of rows)text(`${label}: ${Number.isFinite(value)?value.toFixed(2)+' '+unit:'not available'}`,11);
      text(describeResult(r).body,10);
      chart(r.trace||[],'Recorded signal (task-specific relative units; not a health score)');
    }
    const q=r.captureQuality;
    heading('Recording integrity');
    if(Number.isFinite(q?.fps))text(`Tracking ${q.fps.toFixed(1)} fps | selected-hand visibility ${(q.coverage*100).toFixed(1)}% | longest gap ${q.maxGapMs?.toFixed(0)??'unknown'} ms`,9);
    for(const reason of q?.reasons||[])text(reason,9,[105,65,39]);
    text(r.units||'See task-specific metric units. Input device and setup affect comparisons.',9);
    if(r.notes){heading('Context supplied by the user');text(r.notes.slice(0,2000),10);}
    rule();text('If symptoms are new, persistent, worsening, or affecting daily activities, discuss them with a licensed clinician regardless of this recording. No smartwatch research classifier was applied to this result.',9);
  }
  const pages=doc.getNumberOfPages();
  for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFontSize(8);doc.setTextColor(86,105,105);doc.text('Local export - contains private measurements and any notes you included.',margin,749);doc.text(`${page} / ${pages}`,566,749,{align:'right'});}
  return doc.output('blob');
}
