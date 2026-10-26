const { app, BrowserWindow, protocol, net, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

app.setName('NeuraTrack');
if (process.env.NEURATRACK_TEST_DATA) app.setPath('userData', process.env.NEURATRACK_TEST_DATA);
protocol.registerSchemesAsPrivileged([{scheme:'neuratrack',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true}}]);
const origin='neuratrack://app';
const dist=path.resolve(__dirname,'../dist');
let window;
function local(url) { try {const u=new URL(url);return u.protocol==='neuratrack:'&&u.host==='app';}catch{return false;} }
function openWindow(){
  window=new BrowserWindow({title:'NeuraTrack',width:430,height:900,minWidth:360,minHeight:640,useContentSize:true,backgroundColor:'#050b14',autoHideMenuBar:true,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  window.webContents.setWindowOpenHandler(({url})=>{
    // Only these reference sites can open outside the application.
    try {const u=new URL(url);if(u.protocol==='https:'&&['physionet.org','www.ninds.nih.gov'].includes(u.hostname))shell.openExternal(url);}catch{}
    return {action:'deny'};
  });
  window.webContents.on('will-navigate',(event,url)=>{if(!local(url))event.preventDefault();});
  window.webContents.session.setPermissionCheckHandler((contents,permission,requestingOrigin,details)=>permission==='media'&&details.mediaType==='video'&&local(requestingOrigin)&&local(contents?.getURL()));
  window.webContents.session.setPermissionRequestHandler(async(contents,permission,callback,details)=>{
    if(permission!=='media'||!local(contents.getURL())||!local(details.requestingUrl)||!details.mediaTypes?.includes('video')||details.mediaTypes.includes('audio')){callback(false);return;}
    const {response}=await dialog.showMessageBox(window,{type:'question',buttons:['Not now','Allow camera'],defaultId:0,cancelId:0,title:'Camera access',message:'Allow NeuraTrack to use your camera for this check-in?',detail:'Frames are processed on this device. No video is saved or uploaded.'});
    callback(response===1);
  });
  window.on('closed',()=>{window=null;});
  window.loadURL(origin+'/welcome');
}
app.whenReady().then(()=>{
  if(!fs.existsSync(path.join(dist,'index.html')))throw new Error('Build the app first: npm run build');
  protocol.handle('neuratrack',async request=>{
    const url=new URL(request.url);
    if(!local(request.url))return new Response('Forbidden',{status:403});
    let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return new Response('Invalid path',{status:400});}
    let file=path.resolve(dist,'.'+pathname);
    if(path.relative(dist,file).startsWith('..'))return new Response('Forbidden',{status:403});
    if(!fs.existsSync(file)||!fs.statSync(file).isFile()){
      if(path.extname(pathname))return new Response('Not found',{status:404});
      file=path.join(dist,'index.html');
    }
    const response=await net.fetch(pathToFileURL(file).href,{headers:request.headers});
    if(file.endsWith('.html')){
      const headers=new Headers(response.headers);
      headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
      return new Response(response.body,{status:response.status,headers});
    }
    return response;
  });
  openWindow();
  app.on('activate',()=>{if(!window)openWindow();});
}).catch(error=>{dialog.showErrorBox('NeuraTrack could not start',error.message);app.quit();});
app.on('window-all-closed',()=>app.quit());
