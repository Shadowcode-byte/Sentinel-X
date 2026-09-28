import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";

import "./App.css";

import AppLayout from "./components/layout/AppLayout";

import CommandCenter from "./pages/CommandCenter";
import NetworkOperations from "./pages/NetworkOperations";
import ThreatDetection from "./pages/ThreatDetection";
import Incidents from "./pages/Incidents";
import RiskIntelligence from "./pages/RiskIntelligence";
import Forensics from "./pages/Forensics";
import SecurityAudit from "./pages/SecurityAudit";
import Reports from "./pages/Reports";

import { useSentinelData } from "./hooks/useSentinelData";


function App() {
  const sentinelData = useSentinelData();

  if (sentinelData.loading) {
    return <BootScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AppLayout
              backendOnline={sentinelData.backendOnline}
              lastUpdated={sentinelData.lastUpdated}
              sentinelData={sentinelData}
            />
          }
        >
          <Route
            path="/"
            element={
              <CommandCenter
                system={sentinelData.system}
                events={sentinelData.events}
                backendOnline={sentinelData.backendOnline}
                highSeverityEvents={
                  sentinelData.highSeverityEvents
                }
              />
            }
          />

          <Route
            path="/network"
            element={<NetworkOperations />}
          />

          <Route
            path="/detections"
            element={<ThreatDetection />}
          />

          <Route
            path="/incidents"
            element={<Incidents />}
          />

          <Route
            path="/risk"
            element={<RiskIntelligence />}
          />

          <Route
            path="/forensics"
            element={<Forensics />}
          />

          <Route
            path="/audit"
            element={<SecurityAudit />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


function BootScreen() {
  return (
    <div className="boot-screen">
      <div className="boot-grid" />

      <motion.div
        className="boot-core"
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="boot-ring"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <ShieldCheck size={35} />

        <strong>SENTINEL-X</strong>

        <span>INITIALIZING DEFENSE GRID</span>
      </motion.div>
    </div>
  );
}

export default App;