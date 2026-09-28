import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

import Sidebar from "./Sidebar";
import CommandHeader from "./CommandHeader";

function AppLayout({
  backendOnline,
  lastUpdated,
  sentinelData,
}) {
  const location = useLocation();

  return (
    <div className="sentinel-shell">
      <div className="ambient-grid" />
      <div className="ambient-glow glow-one" />
      <div className="ambient-glow glow-two" />

      <Sidebar backendOnline={backendOnline} />

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