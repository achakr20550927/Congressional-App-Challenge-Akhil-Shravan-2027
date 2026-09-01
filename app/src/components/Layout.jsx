import TopNav from "./TopNav.jsx";
import BottomNav from "./BottomNav.jsx";

/** Persistent chrome for all post-onboarding screens (PRD §10, Design System §4). */
export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <TopNav />
      <main id="main" className="app-content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
