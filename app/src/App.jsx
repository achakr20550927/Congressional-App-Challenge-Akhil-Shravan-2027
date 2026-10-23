import { lazy, Suspense, Component } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAppState } from './context/AppStateContext.jsx';
import Layout from './components/Layout.jsx';
const Landing=lazy(()=>import('./screens/Landing.jsx'));
const Consent=lazy(()=>import('./screens/Consent.jsx'));
const ProfileSetup=lazy(()=>import('./screens/ProfileSetup.jsx'));
const Dashboard=lazy(()=>import('./screens/Dashboard.jsx'));
const TaskCapture=lazy(()=>import('./screens/TaskCapture.jsx'));
const History=lazy(()=>import('./screens/History.jsx'));
const ClinicianExport=lazy(()=>import('./screens/ClinicianExport.jsx'));
const Settings=lazy(()=>import('./screens/Settings.jsx'));
const Recording=lazy(()=>import('./screens/Recording.jsx'));
const Research=lazy(()=>import('./screens/Research.jsx'));

function RequireProfile({children}) {
  const {hasConsent,hasProfile}=useAppState();
  if(!hasConsent)return <Navigate to="/consent" replace/>;
  if(!hasProfile)return <Navigate to="/profile" replace/>;
  return children;
}
function Home(){const {hasConsent,hasProfile}=useAppState();return hasConsent&&hasProfile?<Navigate to="/app" replace/>:<Landing/>;}
function CaptureRoute(){const {task}=useParams();return <TaskCapture key={task}/>;}
class ErrorBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<main className="workspace-page"><h1>This screen could not open.</h1><p>Your saved recordings have not been deleted. Try reloading the app.</p><button className="btn btn-primary" onClick={()=>location.reload()}>Reload</button></main>:this.props.children;}
}
const wrap=page=><RequireProfile><Layout>{page}</Layout></RequireProfile>;
export default function App(){
  const {hasConsent}=useAppState();
  return <ErrorBoundary><Suspense fallback={<div className="app-loading" role="status"><span/>Opening your workspace…</div>}><Routes>
    <Route path="/" element={<Home/>}/><Route path="/welcome" element={<Landing/>}/>
    <Route path="/consent" element={<Consent/>}/>
    <Route path="/profile" element={hasConsent?<ProfileSetup/>:<Navigate to="/consent" replace/>}/>
    <Route path="/calibrate" element={<Navigate to="/capture/rest" replace/>}/>
    <Route path="/app" element={wrap(<Dashboard/>)}/>
    <Route path="/capture/:task" element={wrap(<CaptureRoute/>)}/>
    <Route path="/history" element={wrap(<History/>)}/>
    <Route path="/export" element={wrap(<ClinicianExport/>)}/>
    <Route path="/settings" element={wrap(<Settings/>)}/>
    <Route path="/results/:id" element={wrap(<Recording/>)}/>
    <Route path="/evidence" element={<Layout><Research/></Layout>}/>
    <Route path="/demo" element={<Layout><Recording demo/></Layout>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Suspense></ErrorBoundary>;
}
