
import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  AnimatePresence,
  motion,
} from "motion/react";

import { Menu, X } from "lucide-react";

import Sidebar from "./Sidebar";
import CommandHeader from "./CommandHeader";

import "../../styles/CollapsibleSidebar.css";

// ---------------------------------------------------------
// Sentinel-X Application Layout
// ---------------------------------------------------------

function AppLayout({
  backendOnline,
  lastUpdated,
  sentinelData,
}) {
  const location = useLocation();

  // -------------------------------------------------------
  // Desktop sidebar state
  // -------------------------------------------------------

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(() => {
      try {
        return (
          localStorage.getItem("sentinel-sidebar-collapsed") ===
          "true"
        );
      } catch {
        return false;
      }
    });

  // -------------------------------------------------------
  // Mobile drawer state
  // -------------------------------------------------------

  const [mobileOpen, setMobileOpen] = useState(false);

  // -------------------------------------------------------
  // Save sidebar preference
  // -------------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        "sentinel-sidebar-collapsed",
        String(sidebarCollapsed)
      );
    } catch {
      // Storage may be unavailable in restricted browsers.
    }
  }, [sidebarCollapsed]);

  // -------------------------------------------------------
  // Close mobile drawer when route changes
  // -------------------------------------------------------

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // -------------------------------------------------------
  // Escape key closes mobile drawer
  // -------------------------------------------------------

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [mobileOpen]);

  // -------------------------------------------------------
  // Sidebar actions
  // -------------------------------------------------------

  function toggleSidebar() {
    setSidebarCollapsed((current) => !current);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (
    <div
      className={[
        "sentinel-shell",
        sidebarCollapsed ? "sidebar-collapsed" : "",
        mobileOpen ? "sidebar-mobile-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Existing ambient background */}

      <div className="ambient-grid" />
      <div className="ambient-glow glow-one" />
      <div className="ambient-glow glow-two" />

      {/* Mobile navigation toggle */}

      <button
        type="button"
        className="sx-mobile-menu-button"
        onClick={() => setMobileOpen((current) => !current)}
        aria-label={
          mobileOpen
            ? "Close navigation menu"
            : "Open navigation menu"
        }
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <X size={20} />
        ) : (
          <Menu size={20} />
        )}
      </button>

      {/* Mobile overlay */}

      {mobileOpen && (
        <div
          className="sx-mobile-overlay"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Existing sidebar with new controls */}

      <Sidebar
        backendOnline={backendOnline}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onNavigate={closeMobileMenu}
      />

      {/* Existing main content */}

      <main className="command-main">
        <CommandHeader
          backendOnline={backendOnline}
          lastUpdated={lastUpdated}
        />

        <div className="command-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="page-transition"
              initial={{
                opacity: 0,
                y: 12,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                y: -8,
                filter: "blur(3px)",
              }}
              transition={{
                duration: 0.32,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Outlet context={sentinelData} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
