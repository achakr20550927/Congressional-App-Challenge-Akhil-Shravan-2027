import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext.jsx';
import AppIcon from './AppIcon.jsx';
import Brand from './Brand.jsx';

const NAV=[['/app','home','Overview'],['/history','history','Journal'],['/export','report','Reports'],['/evidence','science','Research'],['/settings','settings','Settings']];
export default function Layout({children}) {
  const {mode,setMode}=useAppState(); const location=useLocation();
  const [install,setInstall]=useState(null),[online,setOnline]=useState(navigator.onLine);
  const [phone,setPhone]=useState(()=>new URLSearchParams(window.location.search).get('preview')==='phone');
  useEffect(()=>{const handler=e=>{e.preventDefault();setInstall(e);};const status=()=>setOnline(navigator.onLine);
    window.addEventListener('beforeinstallprompt',handler);window.addEventListener('online',status);window.addEventListener('offline',status);
    return()=>{window.removeEventListener('beforeinstallprompt',handler);window.removeEventListener('online',status);window.removeEventListener('offline',status);};
  },[]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});document.querySelector('.phone-preview')?.scrollTo(0,0);},[location.pathname]);
  return <div className="app-presentation">
    <div className="preview-toolbar"><Link to="/welcome">← NeuraTrack home</Link><button aria-pressed={phone} onClick={()=>setPhone(!phone)}>{phone?'Exit phone preview':'Phone preview'}</button></div>
    <div className={phone?'app-frame phone-preview':'app-frame'}>
      <div className="app-shell workspace-shell classic-shell">
        <a href="#main" className="skip-link">Skip to content</a>
        <header className="classic-topbar"><Link to="/app" className="classic-brand" aria-label="NeuraTrack"><Brand appName="NeuraTrack"/></Link>
          <nav className="classic-desktop-nav" aria-label="Workspace">{NAV.map(([to,,label])=><NavLink key={to} to={to}>{label}</NavLink>)}</nav>
          <div className="topbar-actions"><span className="local-status">{online?'On-device':'Offline'}</span>{install&&<button className="icon-button" aria-label="Install NeuraTrack" onClick={async()=>{await install.prompt();setInstall(null);}}><AppIcon name="download"/></button>}
            <div className="view-switch" aria-label="Workspace view"><button aria-pressed={mode==='patient'} onClick={()=>setMode('patient')}>Personal</button><button aria-pressed={mode==='clinician'} onClick={()=>setMode('clinician')}>Review</button></div>
          </div>
        </header>
        <div className="workspace-main"><main id="main" className="workspace-content">{children}</main><footer className="workspace-footer"><span>NeuraTrack · On-device movement analysis</span><Link to="/evidence">Research prototype · Not a diagnostic device</Link></footer></div>
        <nav className="workspace-dock" aria-label="Mobile navigation">{NAV.filter(n=>n[0]!=='/evidence').map(([to,icon,label])=><NavLink key={to} to={to}><AppIcon name={icon}/><span>{label}</span></NavLink>)}</nav>
      </div>
    </div>
  </div>;
}
