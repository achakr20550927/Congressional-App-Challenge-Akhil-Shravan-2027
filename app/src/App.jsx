import { Navigate, Route, Routes } from "react-router-dom";
import { useAppState } from "./context/AppStateContext.jsx";
import Layout from "./components/Layout.jsx";

import Landing from "./screens/Landing.jsx";
import Consent from "./screens/Consent.jsx";
import ProfileSetup from "./screens/ProfileSetup.jsx";
import CameraCalibration from "./screens/CameraCalibration.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import TaskCapture from "./screens/TaskCapture.jsx";
import History from "./screens/History.jsx";
import ClinicianExport from "./screens/ClinicianExport.jsx";
import Settings from "./screens/Settings.jsx";

/** Enforces PRD §6.1's onboarding order: consent -> profile -> calibration -> app. */
function RequireOnboarding({ children, needsCalibration = true }) {
  const { hasConsent, hasProfile, hasCalibration } = useAppState();
  if (!hasConsent) return <Navigate to="/consent" replace />;
  if (!hasProfile) return <Navigate to="/profile" replace />;
  if (needsCalibration && !hasCalibration) return <Navigate to="/calibrate" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/consent" element={<Consent />} />
      <Route
        path="/profile"
        element={
          <RequireOnboardingConsentOnly>
            <ProfileSetup />
          </RequireOnboardingConsentOnly>
        }
      />
      <Route
        path="/calibrate"
        element={
          <RequireOnboarding needsCalibration={false}>
            <CameraCalibration />
          </RequireOnboarding>
        }
      />
      <Route
        path="/app"
        element={
          <RequireOnboarding>
            <Layout>
              <Dashboard />
            </Layout>
          </RequireOnboarding>
        }
      />
      <Route
        path="/capture/:task"
        element={
          <RequireOnboarding>
            <Layout>
              <TaskCapture />
            </Layout>
          </RequireOnboarding>
        }
      />
      <Route
        path="/history"
        element={
          <RequireOnboarding>
            <Layout>
              <History />
            </Layout>
          </RequireOnboarding>
        }
      />
      <Route
        path="/export"
        element={
          <RequireOnboarding>
            <Layout>
              <ClinicianExport />
            </Layout>
          </RequireOnboarding>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireOnboarding needsCalibration={false}>
            <Layout>
              <Settings />
            </Layout>
          </RequireOnboarding>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RequireOnboardingConsentOnly({ children }) {
  const { hasConsent } = useAppState();
  if (!hasConsent) return <Navigate to="/consent" replace />;
  return children;
}
