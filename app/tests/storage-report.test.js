import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {saveTaskResult,getResult,getSessionHistory,updateResultNotes,exportCsv,clearAllLocalData} from '../src/lib/storage.js';
import {createReport} from '../src/lib/report.js';
import {analyzeRecording} from '../src/lib/measurements.js';

test('local recordings, notes, CSV safety, selection and atomic deletion',async()=>{
  await clearAllLocalData();
  const record=await saveTaskResult({task:'spiral',recordedAt:new Date().toISOString(),qualityOk:true,protocolVersion:'drawing-v3',meanDeviationPctRadius:2.1,notes:'=HYPERLINK("unsafe")'});
  assert.equal((await getResult(record.id)).meanDeviationPctRadius,2.1);
  assert.equal((await getSessionHistory()).length,1);
  const csv=await (await exportCsv()).text();assert.match(csv,/'=HYPERLINK/);assert.match(csv,/meanDeviationPctRadius/);
  assert.equal((await (await exportCsv([])).text()).split('\n').length,1);
  await updateResultNotes(record.id,'Café, fatigue\nNo medication changes.');
  assert.equal((await getResult(record.id)).notes,'Café, fatigue\nNo medication changes.');
  await assert.rejects(()=>updateResultNotes(record.id,'a'.repeat(2001)));
  await assert.rejects(()=>updateResultNotes('missing','note'));
  await clearAllLocalData();assert.equal((await getSessionHistory()).length,0);
});

test('paginated PDF includes Unicode context and long notes without clipping',async()=>{
  const font=await readFile(new URL('../public/fonts/NotoSans-Regular.ttf',import.meta.url));
  await assert.rejects(()=>createReport([], '',font));
  const samples=Array.from({length:300},(_,i)=>({t:i/30*1000,x:.5+.004*Math.sin(2*Math.PI*5*i/30),y:.4,scale:.2,orientation:0,tapDistance:.1}));
  const r=analyzeRecording({samples,totalFrames:300,task:'rest'});
  const notes='Café après exercice. Patient context, not a clinical conclusion. '.repeat(30);
  const blob=await createReport([{...r,notes},{...r,task:'tap',tapCount:20,tapRateHz:2,notes:'José: compared with the same setup.'}], 'Prepared for discussion, not diagnosis.',font);
  const bytes=Buffer.from(await blob.arrayBuffer());assert.ok(bytes.length>10000);assert.equal(bytes.subarray(0,4).toString(),'%PDF');
  await mkdir('test-results/pdf-qa',{recursive:true});await writeFile('test-results/pdf-qa/report.pdf',bytes);
});
