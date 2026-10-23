import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext.jsx';
import AppIcon from './AppIcon.jsx';

const NAV=[['/app','home','Overview'],['/history','history','Journal'],['/export','report','Reports'],['/evidence','science','Research'],['/settings','settings','Settings']];
export default function Layout({children}) {
  const {profile,mode,setMode}=useAppState(); const location=useLocation();
  const [install,setInstall]=useState(null), [online,setOnline]=useState(navigator.onLine);
  useEffect(()=>{ const handler=e=>{e.preventDefault();setInstall(e);}; const status=()=>setOnline(navigator.onLine);
    window.addEventListener('beforeinstallprompt',handler); window.addEventListener('online',status);window.addEventListener('offline',status);
    return ()=>{window.removeEventListener('beforeinstallprompt',handler);window.removeEventListener('online',status);window.removeEventListener('offline',status);};
  },[]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[location.pathname]);
  const current=NAV.find(n=>n[0]===location.pathname)?.[2] || (location.pathname.includes('capture')?'Check-in':'Recording');
  return <div className="app-shell workspace-shell">
    <a href="#main" className="skip-link">Skip to content</a>
    <aside className="workspace-sidebar">
      <Link to="/app" className="workspace-brand"><span className="brand-symbol"><AppIcon size={24}/></span>neura<span>track</span><sup>LAB</sup></Link>
      <p className="sidebar-caption">YOUR WORKSPACE</p>
      <nav aria-label="Workspace">{NAV.map(([to,icon,label])=><NavLink key={to} to={to}><AppIcon name={icon}/>{label}{to==='/evidence'&&<span className="nav-dot"/>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-block"><AppIcon name="shield"/><div><strong>Private by design</strong><p>Your recordings stay on this device. No video is saved.</p></div></div>
      <Link to="/settings" className="profile-link"><span className="avatar">{profile?.name?.[0]?.toUpperCase()||'N'}</span><div><strong>{profile?.name||'Your workspace'}</strong><small>Local profile · {mode==='clinician'?'Review':'Personal'} view</small></div></Link></div>
    </aside>
    <div className="workspace-main">
      <header className="workspace-topbar"><Link to="/app" className="mobile-brand"><span className="brand-symbol"><AppIcon/></span>neuratrack</Link><span className="desktop-breadcrumb">Workspace <span>/</span> {current}</span>
        <div className="topbar-actions"><span className="local-status"><i/>{online?'On-device':'Offline'}</span>{install&&<button className="icon-button" title="Install NeuraTrack" aria-label="Install NeuraTrack" onClick={async()=>{await install.prompt();setInstall(null);}}><AppIcon name="download"/></button>}
          <div className="view-switch" aria-label="Workspace view"><button aria-pressed={mode==='patient'} onClick={()=>setMode('patient')}>Personal</button><button aria-pressed={mode==='clinician'} onClick={()=>setMode('clinician')}>Review</button></div>
        </div>
      </header>
      <main id="main" className="workspace-content">{children}</main>
      <footer className="workspace-footer"><span>Observe. Understand. Share.</span><Link to="/evidence">Research prototype · Not a diagnostic device</Link></footer>
    </div>
    <nav className="workspace-dock" aria-label="Mobile navigation">{NAV.filter(n=>n[0]!=='/evidence').map(([to,icon,label])=><NavLink key={to} to={to}><AppIcon name={icon}/><span>{label}</span></NavLink>)}</nav>
  </div>;
}
