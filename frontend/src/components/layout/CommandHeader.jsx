import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Bell,
  Command,
  Radio,
  Search,
  Shield,
} from "lucide-react";

function CommandHeader({ backendOnline, lastUpdated }) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="command-header">
      <div>
        <div className="header-path">
          <Shield size={13} />
          SENTINEL-X / SOC
        </div>

        <h1>Command Center</h1>
      </div>

      <div className="header-actions">
        <div className="command-search">
          <Search size={14} />
          <span>Search security intelligence</span>

          <kbd>
            <Command size={10} /> K
          </kbd>
        </div>

        <button className="header-icon-button">
          <Bell size={16} />
          <i />
        </button>

        <div className="live-state">
          <motion.i
            animate={
              backendOnline
                ? {
                    scale: [1, 1.35, 1],
                    opacity: [0.5, 1, 0.5],
                  }
                : {}
            }
            transition={{
              duration: 1.6,
              repeat: Infinity,
            }}
          />

          <div>
            <strong>
              {backendOnline ? "LIVE DEFENSE" : "OFFLINE"}
            </strong>

            <span>
              <Radio size={9} />
              {lastUpdated ? "TELEMETRY SYNCED" : "WAITING"}
            </span>
          </div>
        </div>

        <div className="utc-clock">
          <strong>
            {clock.toLocaleTimeString([], {
              hour12: false,
            })}
          </strong>

          <span>LOCAL SYSTEM TIME</span>
        </div>
      </div>
    </header>
  );
}

export default CommandHeader; 