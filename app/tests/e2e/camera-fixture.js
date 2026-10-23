// Test-only camera and landmark source. Never bundled into production.
export const HAND_CONNECTIONS=[[0,9],[4,8]];
export async function startCameraStream(){
  if(window.__fixture==='denied'){const e=new Error('denied');e.kind='denied';throw e;}
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');
  const timer=setInterval(()=>{ctx.fillStyle='#233b43';ctx.fillRect(0,0,640,480);ctx.fillStyle='#acd9ca';ctx.fillRect((performance.now()/10)%600,100,30,30);},16);
  const stream=canvas.captureStream(30);window.__streams=[...(window.__streams||[]),stream];
  for(const track of stream.getTracks()){const stop=track.stop.bind(track);track.stop=()=>{clearInterval(timer);stop();};}
  return stream;
}
export async function initHandLandmarker(){return {};}
export function detectFrame(_,video,t){
  if(window.__fixture==='missing')return {landmarks:[],handednesses:[]};
  const shift=.004*Math.sin(t/1000*2*Math.PI*5);
  const p=Array.from({length:21},(_,i)=>({x:.5+(i%4)*.02+shift,y:.5-Math.floor(i/4)*.025,z:0}));
  p[0]={x:.5+shift,y:.7,z:0};p[9]={x:.5+shift,y:.45,z:0};p[4]={x:.4+shift,y:.4,z:0};p[8]={x:.4+shift+.06+.04*Math.cos(t/1000*2*Math.PI*2),y:.4,z:0};
  const hands=[p,p.map(q=>({...q,x:q.x-.25}))],labels=[[{categoryName:'Right',score:.99}],[{categoryName:'Left',score:.99}]];
  if(Math.floor(t/100)%2){hands.reverse();labels.reverse();}
  return {landmarks:hands,handednesses:labels};
}
