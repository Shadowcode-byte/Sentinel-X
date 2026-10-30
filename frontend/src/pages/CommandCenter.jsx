import { motion } from "motion/react";

import {
  Activity,
  AlertTriangle,
  Database,
  ShieldCheck,
} from "lucide-react";

import SecurityCore from "../components/dashboard/SecurityCore";
import NetworkPulse from "../components/telemetry/NetworkPulse";
import DefenseTopology from "../components/telemetry/DefenseTopology";
import EventStream from "../components/telemetry/EventStream";
import SOCMetrics from "../components/dashboard/SOCMetrics";
import "../styles/SOCMetrics.css";


function normalizeSeverity(value) {
  return String(value || "INFO").toUpperCase();
}


function CommandCenter({
  system,
  events = [],
  backendOnline,
  highSeverityEvents = 0,
  openIncidentCount = 0,
  activeThreats = 0,
  currentRiskScore = null,
  captureActive = false,
  moduleErrors = {},
}) {
  /*
   * =====================================================
   * REAL EVENT-DRIVEN THREAT STATE
   * =====================================================
   *
   * The backend system/status endpoint still contains a
   * temporary threat_level value.
   *
   * Sentinel-X therefore derives the Command Center state
   * from the real persisted security events.
   */

  const criticalEvents = events.filter(
    (event) =>
      normalizeSeverity(event.severity) ===
      "CRITICAL"
  ).length;


  const highEvents = events.filter(
    (event) =>
      normalizeSeverity(event.severity) ===
      "HIGH"
  ).length;


  const mediumEvents = events.filter(
    (event) =>
      normalizeSeverity(event.severity) ===
      "MEDIUM"
  ).length;


  const elevatedEvents =
    criticalEvents +
    highEvents;


  /*
   * Use the locally calculated value instead of relying
   * completely on the highSeverityEvents prop.
   */

  const effectiveHighSeverity =
    Math.max(
      highSeverityEvents || 0,
      elevatedEvents
    );


  /*
   * =====================================================
   * OPERATIONAL THREAT LEVEL
   * =====================================================
   */

  let threatLevel = "NOMINAL";


  if (!backendOnline) {
    threatLevel = "UNKNOWN";
  } else if (criticalEvents > 0) {
    threatLevel = "CRITICAL";
  } else if (highEvents > 0) {
    threatLevel = "HIGH";
  } else if (mediumEvents > 0) {
    threatLevel = "ELEVATED";
  }


  /*
   * =====================================================
   * LATEST SECURITY EVENT
   * =====================================================
   */

  const latestEvent =
    events.length > 0
      ? events[0]
      : null;


  const latestDetection =
    events.find(
      (event) =>
        String(
          event.event_type || ""
        )
          .toUpperCase()
          .startsWith("SCAN-001")
    ) || null;


  const monitoringActive = captureActive && !moduleErrors.network;


  return (
    <>
      {/* ===================================================
          STATUS STRIP
          =================================================== */}

      <motion.section
        className="status-strip"
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
      >
        <StatusItem
          icon={Activity}
          color={
            monitoringActive
              ? "green"
              : "red"
          }
          label="PACKET CAPTURE"
          value={
            moduleErrors.network
              ? "UNKNOWN"
              : monitoringActive
              ? "ACTIVE"
              : "STANDBY"
          }
        />


        <div className="status-divider" />


        <StatusItem
          icon={Database}
          color="green"
          label="SECURITY EVENTS"
          value={events.length}
        />


        <div className="status-divider" />


        <StatusItem
          icon={AlertTriangle}
          color={
            effectiveHighSeverity > 0
              ? "red"
              : "green"
          }
          label="HIGH SEVERITY"
          value={
            effectiveHighSeverity
          }
        />


        <div className="status-divider" />


        <StatusItem
          icon={ShieldCheck}
          color={
            backendOnline
              ? "green"
              : "red"
          }
          label="DEFENSE ENGINE"
          value={
            backendOnline
              ? "ONLINE"
              : "OFFLINE"
          }
        />


        <div className="strip-classification">
          INTERNAL // SENTINEL-X
        </div>
      </motion.section>


      {/* ===================================================
          PRIMARY SECURITY GRID
          =================================================== */}

      {/* SENTINEL-X 2.0 - SOC METRICS */}

      <SOCMetrics
        activeThreats={activeThreats}
        openIncidentCount={openIncidentCount}
        currentRiskScore={currentRiskScore}
        captureActive={captureActive}
        moduleErrors={moduleErrors}
      />
      <section className="primary-grid">
        <SecurityCore
          threatLevel={threatLevel}
          currentRiskScore={currentRiskScore}
          backendOnline={backendOnline}
          eventCount={events.length}
          captureActive={captureActive}
          networkStatusUnavailable={Boolean(moduleErrors.network)}
        />


        <NetworkPulse
          eventCount={events.length}
          captureActive={captureActive}
          networkStatusUnavailable={Boolean(moduleErrors.network)}
          backendOnline={backendOnline}
        />
      </section>


      {/* ===================================================
          SECONDARY INTELLIGENCE GRID
          =================================================== */}

      <section className="secondary-grid">
        <DefenseTopology
          backendOnline={
            backendOnline
          }
        />


        <div className="intelligence-stack">
          <ThreatMatrix
            events={events}
            criticalEvents={
              criticalEvents
            }
            highEvents={
              highEvents
            }
            mediumEvents={
              mediumEvents
            }
          />


          <EndpointIntelligence
            backendOnline={
              backendOnline
            }
            threatLevel={
              threatLevel
            }
            eventCount={
              events.length
            }
            latestEvent={
              latestEvent
            }
            latestDetection={
              latestDetection
            }
          />
        </div>
      </section>


      {/* ===================================================
          SECURITY EVENT STREAM
          =================================================== */}

      <EventStream
        events={events}
      />


      {/* ===================================================
          FOOTER
          =================================================== */}

      <footer className="command-footer">
        <span>
          SENTINEL-X // UNIFIED SECURITY OPERATIONS
        </span>

        <span>
          ENGINE{" "}
          {backendOnline
            ? "ONLINE"
            : "OFFLINE"}{" "}
          // BUILD 0.1.0
        </span>
      </footer>
    </>
  );
}


/* =========================================================
   STATUS ITEM
   ========================================================= */

function StatusItem({
  icon: Icon,
  color,
  label,
  value,
}) {
  return (
    <div className="status-strip-item">
      <span
        className={`status-icon ${color}`}
      >
        <Icon size={14} />
      </span>


      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}


/* =========================================================
   THREAT MATRIX
   ========================================================= */

function ThreatMatrix({
  events,
  criticalEvents,
  highEvents,
  mediumEvents,
}) {
  const infoEvents =
    events.filter(
      (event) =>
        normalizeSeverity(
          event.severity
        ) === "INFO"
    ).length;


  const totalEvents =
    Math.max(
      events.length,
      1
    );


  function matrixWidth(
    count
  ) {
    if (count <= 0) {
      return "3%";
    }


    return `${Math.max(
      12,
      Math.min(
        100,
        Math.round(
          (count / totalEvents) *
            100
        )
      )
    )}%`;
  }


  return (
    <motion.article
      className="intel-card"
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.32,
      }}
    >
      <div>
        <span className="micro-label">
          DETECTION STATUS
        </span>

        <h3>
          Threat Matrix
        </h3>
      </div>


      <div className="threat-matrix">
        <MatrixRow
          label="CRITICAL"
          count={
            criticalEvents
          }
          className="critical"
          width={
            matrixWidth(
              criticalEvents
            )
          }
        />


        <MatrixRow
          label="HIGH"
          count={
            highEvents
          }
          className="high"
          width={
            matrixWidth(
              highEvents
            )
          }
        />


        <MatrixRow
          label="MEDIUM"
          count={
            mediumEvents
          }
          className="high"
          width={
            matrixWidth(
              mediumEvents
            )
          }
        />


        <MatrixRow
          label="INFO"
          count={
            infoEvents
          }
          className="info"
          width={
            matrixWidth(
              infoEvents
            )
          }
        />
      </div>
    </motion.article>
  );
}


/* =========================================================
   MATRIX ROW
   ========================================================= */

function MatrixRow({
  label,
  count,
  className,
  width,
}) {
  return (
    <div>
      <span>
        {label}
      </span>


      <div className="matrix-track">
        <motion.i
          className={
            className
          }
          initial={{
            width: 0,
          }}
          animate={{
            width,
          }}
          transition={{
            duration: 0.8,
          }}
        />
      </div>


      <strong>
        {count}
      </strong>
    </div>
  );
}


/* =========================================================
   ENDPOINT INTELLIGENCE
   ========================================================= */

function EndpointIntelligence({
  backendOnline,
  threatLevel,
  eventCount,
  latestEvent,
  latestDetection,
}) {
  const eventType =
    latestDetection?.event_type ||
    latestEvent?.event_type ||
    "NO ACTIVE DETECTION";


  const eventSeverity =
    latestDetection?.severity ||
    latestEvent?.severity ||
    "NONE";


  const hasHighThreat =
    threatLevel === "HIGH" ||
    threatLevel === "CRITICAL";


  return (
    <motion.article
      className="intel-card endpoint-intel"
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.4,
      }}
    >
      <span className="micro-label">
        PRIMARY ENDPOINT
      </span>


      <div className="endpoint-intel-head">
        <div className="endpoint-symbol">
          <span>
            W
          </span>
        </div>


        <div>
          <h3>
            WINDOWS-TARGET-01
          </h3>

          <p>
            Monitored Security Endpoint
          </p>
        </div>


        <span
          className={`endpoint-state ${
            backendOnline
              ? "connected"
              : ""
          }`}
        >
          {backendOnline
            ? "CONNECTED"
            : "OFFLINE"}
        </span>
      </div>


      <div className="endpoint-intel-grid">
        <div>
          <span>
            AGENT
          </span>

          <strong>
            {backendOnline
              ? "ACTIVE"
              : "OFFLINE"}
          </strong>
        </div>


        <div>
          <span>
            POSTURE
          </span>

          <strong>
            {threatLevel}
          </strong>
        </div>


        <div>
          <span>
            EVENTS
          </span>

          <strong>
            {eventCount}
          </strong>
        </div>
      </div>


      {/* Latest event context */}

      <div
        style={{
          marginTop: "14px",
          paddingTop: "12px",

          borderTop:
            "1px solid rgba(236,232,217,.08)",

          display: "grid",

          gridTemplateColumns:
            "1fr auto",

          alignItems: "center",
          gap: "12px",
        }}
      >
        <div>
          <span
            style={{
              display: "block",

              color: "#747966",

              fontFamily:
                "var(--font-tech)",
              fontSize: "9px",
              fontWeight: 650,
              letterSpacing:
                ".06em",
            }}
          >
            LATEST SECURITY CONTEXT
          </span>


          <strong
            style={{
              display: "block",

              marginTop: "5px",

              color: hasHighThreat
                ? "#ffbd59"
                : "#b0b39f",

              fontFamily:
                "var(--font-tech)",
              fontSize: "10px",
              fontWeight: 650,
            }}
          >
            {eventType}
          </strong>
        </div>


        <span
          style={{
            color: hasHighThreat
              ? "#ffbd59"
              : "#858a75",

            fontFamily:
              "var(--font-tech)",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing:
              ".05em",
          }}
        >
          {normalizeSeverity(
            eventSeverity
          )}
        </span>
      </div>
    </motion.article>
  );
}


export default CommandCenter;