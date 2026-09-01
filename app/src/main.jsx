import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AppStateProvider } from "./context/AppStateContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import SmoothScroll from "./components/motion/SmoothScroll.jsx";
import CursorFX from "./components/motion/CursorFX.jsx";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppStateProvider>
        <ToastProvider>
          <SmoothScroll>
            <CursorFX />
            <App />
          </SmoothScroll>
        </ToastProvider>
      </AppStateProvider>
    </BrowserRouter>
  </StrictMode>
);
