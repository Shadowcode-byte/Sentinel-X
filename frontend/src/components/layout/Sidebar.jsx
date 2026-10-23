
import { motion } from "motion/react";
import { NavLink } from "react-router-dom";

import {
  Activity,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Gauge,
  LayoutDashboard,
  Network,
  Radar,
  ScrollText,
  ShieldCheck,
  Siren,
} from "lucide-react";

import SentinelMark from "../ui/SentinelMark";

const navigation = [
  { label: "Command Center", icon: LayoutDashboard, path: "/" },
  { label: "Network Monitor", icon: Network, path: "/network" },
  { label: "Threat Detection", icon: Radar, path: "/detections" },
  { label: "Incidents", icon: Siren, path: "/incidents" },
  { label: "Risk Intelligence", icon: Gauge, path: "/risk" },
  { label: "Forensics", icon: FileSearch, path: "/forensics" },
  { label: "Security Audit", icon: ShieldCheck, path: "/audit" },
  { label: "Reports", icon: ScrollText, path: "/reports" },
];

function Sidebar({
  backendOnline,
  collapsed = false,
  onToggle = () => {},
  onNavigate = () => {},
}) {
  return (
    <aside
      className="command-sidebar"
      aria-label="Sentinel-X sidebar"
    >
      {/* Expand / Collapse Button */}
      <button
        type="button"
        className="sx-sidebar-toggle"
        onClick={onToggle}
        aria-label={
          collapsed ? "Expand sidebar" : "Collapse sidebar"
        }
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={16} />
        ) : (
          <ChevronLeft size={16} />
        )}
      </button>

      {/* Sentinel-X Branding */}
      <div className="sidebar-brand">
        <motion.div
          className="brand-emblem"
          animate={
            backendOnline
              ? {
                  boxShadow: [
                    "0 0 12px rgba(215,255,87,0.04)",
                    "0 0 26px rgba(215,255,87,0.12)",
                    "0 0 12px rgba(215,255,87,0.04)",
                  ],
                }
              : {
                  boxShadow: "0 0 0 rgba(215,255,87,0)",
                }
          }
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <SentinelMark size={31} animated={true} />
        </motion.div>

        <div className="sidebar-brand-copy">
          <div className="sidebar-brand-name">SENTINEL-X</div>
          <div className="sidebar-brand-subtitle">
            DEFENSE SYSTEM
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-section-label">
        01 / COMMAND
      </div>

      <nav
        className="command-nav"
        aria-label="Sentinel-X command navigation"
      >
        {navigation.map((item, index) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              onClick={onNavigate}
              className={({ isActive }) =>
                `command-nav-item ${isActive ? "active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    className="nav-link-content"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.035 * index,
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ x: 3 }}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </motion.div>

                  {isActive && (
                    <motion.i
                      layoutId="active-navigation"
                      className="nav-active-indicator"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Telemetry Marker */}
      <div className="sidebar-system-marker">
        <span>SX</span>
        <i />
        <strong>FIELD NODE // 01</strong>
      </div>

      {/* Security Engine Status */}
      <div
        className={`sidebar-engine ${
          backendOnline ? "engine-online" : "engine-offline"
        }`}
      >
        <div className="engine-head">
          <Activity size={14} strokeWidth={1.5} />
          <span>SECURITY ENGINE</span>
        </div>

        <div className="engine-state">
          <motion.i
            animate={
              backendOnline
                ? {
                    opacity: [0.35, 1, 0.35],
                    scale: [1, 1.25, 1],
                  }
                : {
                    opacity: 0.3,
                    scale: 1,
                  }
            }
            transition={{
              duration: backendOnline ? 1.6 : 0,
              repeat: backendOnline ? Infinity : 0,
              ease: "easeInOut",
            }}
          />

          <strong>
            {backendOnline ? "OPERATIONAL" : "DISCONNECTED"}
          </strong>
        </div>

        <div className="engine-meter">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: backendOnline ? "100%" : "0%",
            }}
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </div>

        <div className="engine-meta">
          <span>CORE</span>
          <strong>
            {backendOnline ? "READY" : "OFFLINE"}
          </strong>
        </div>

        <div className="engine-meta engine-meta-secondary">
          <span>MODE</span>
          <strong>
            {backendOnline ? "LIVE" : "—"}
          </strong>
        </div>
      </div>

      {/* Build Signature */}
      <div className="sidebar-build">
        <span>SX // 0.1.0</span>
        <span>INTERNAL</span>
      </div>
    </aside>
  );
}

export default Sidebar;
