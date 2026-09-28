import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "motion/react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crosshair,
  Database,
  Eye,
  Radar,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Target,
  Wifi,
} from "lucide-react";


const API_BASE = "http://127.0.0.1:8000";


function formatTime(value) {
  if (!value) {
    return "--:--:--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--:--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}


function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString();
}


function normalizeSeverity(value) {
  return String(value || "INFO").toUpperCase();
}


function ThreatDetection() {
  const [events, setEvents] = useState([]);

  const [networkStatus, setNetworkStatus] =
    useState(null);

  const [networkTelemetry, setNetworkTelemetry] =
    useState(null);

  const [apiOnline, setApiOnline] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState(null);


  /*
   * =====================================================
   * LIVE SENTINEL-X DATA
   * =====================================================
   */

  useEffect(() => {
    let mounted = true;


    async function loadDetectionData() {
      try {
        const [
          eventsResponse,
          statusResponse,
          telemetryResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE}/api/v1/events`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `${API_BASE}/api/v1/network/status`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `${API_BASE}/api/v1/network/telemetry`,
            {
              cache: "no-store",
            }
          ),
        ]);


        if (
          !eventsResponse.ok ||
          !statusResponse.ok ||
          !telemetryResponse.ok
        ) {
          throw new Error(
            "Sentinel-X detection services unavailable."
          );
        }


        const eventsData =
          await eventsResponse.json();

        const statusData =
          await statusResponse.json();

        const telemetryData =
          await telemetryResponse.json();


        if (!mounted) {
          return;
        }


        setEvents(
          Array.isArray(eventsData)
            ? eventsData
            : []
        );

        setNetworkStatus(statusData);

        setNetworkTelemetry(
          telemetryData
        );

        setApiOnline(true);

        setLastUpdated(
          new Date()
        );
      } catch (error) {
        if (!mounted) {
          return;
        }


        console.error(
          "Sentinel-X detection data error:",
          error
        );

        setApiOnline(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }


    loadDetectionData();


    const interval =
      window.setInterval(
        loadDetectionData,
        2000
      );


    return () => {
      mounted = false;

      window.clearInterval(
        interval
      );
    };
  }, []);


  /*
   * =====================================================
   * EVENT METRICS
   * =====================================================
   */

  const metrics = useMemo(() => {
    const result = {
      total: events.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };


    for (const event of events) {
      const severity =
        normalizeSeverity(
          event.severity
        );


      if (severity === "CRITICAL") {
        result.critical += 1;
      } else if (severity === "HIGH") {
        result.high += 1;
      } else if (severity === "MEDIUM") {
        result.medium += 1;
      } else if (severity === "LOW") {
        result.low += 1;
      } else {
        result.info += 1;
      }
    }


    return result;
  }, [events]);


  const scanEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          String(
            event.event_type || ""
          )
            .toUpperCase()
            .startsWith("SCAN-001")
      ),
    [events]
  );


  const latestDetection =
    scanEvents[0] || null;


  const captureActive =
    Boolean(
      networkStatus?.capture_active
    );


  const detectorActive =
    networkStatus?.detection_engine ===
    "active";


  const monitoredHost =
    networkStatus?.monitored_host ||
    networkTelemetry?.monitored_host ||
    "UNKNOWN";


  const trackedFlows =
    networkTelemetry?.tracked_flows ??
    networkTelemetry?.active_flows ??
    0;


  const inMemoryDetections =
    networkTelemetry?.detection_count ??
    0;


  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        "--td-acid": "#d7ff57",
        "--td-cream": "#ece8d9",
        "--td-muted": "#9a9e89",
        "--td-dim": "#747966",
        "--td-purple": "#9b82ff",
        "--td-red": "#ff6258",
        "--td-amber": "#ffbd59",
        "--td-line":
          "rgba(232,230,211,0.11)",

        width: "100%",
        paddingBottom: "32px",
        color: "var(--td-cream)",
      }}
    >
      {/* ===================================================
          HERO
          =================================================== */}

      <section
        style={{
          position: "relative",
          overflow: "hidden",

          minHeight: "215px",
          padding: "34px 36px",

          border:
            "1px solid var(--td-line)",

          background:
            "radial-gradient(circle at 82% 0%, rgba(155,130,255,.10), transparent 31%), linear-gradient(135deg, rgba(18,21,14,.97), rgba(8,9,6,.99))",

          display: "flex",
          alignItems: "flex-end",
          justifyContent:
            "space-between",
          gap: "35px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",

              color:
                "var(--td-purple)",

              fontFamily:
                "var(--font-tech)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: ".13em",
            }}
          >
            <Radar
              size={14}
              strokeWidth={1.5}
            />

            03 / THREAT DETECTION
          </div>


          <h2
            style={{
              margin:
                "18px 0 13px",

              color:
                "var(--td-cream)",

              fontSize:
                "clamp(42px,5vw,68px)",

              fontWeight: 420,
              lineHeight: 0.9,
              letterSpacing:
                "-0.05em",
            }}
          >
            THREAT

            <span
              style={{
                display: "block",

                color: "#969a84",

                fontWeight: 320,
              }}
            >
              DETECTION
            </span>
          </h2>


          <p
            style={{
              maxWidth: "650px",
              margin: 0,

              color: "#a1a58f",

              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            Rule-based network detection,
            security-event correlation and
            monitored endpoint analysis from
            the Sentinel-X defense pipeline.
          </p>
        </div>


        <div
          style={{
            minWidth: "300px",

            border:
              "1px solid var(--td-line)",

            background:
              "rgba(8,10,6,.78)",
          }}
        >
          <StatusRow
            label="DETECTION ENGINE"
            value={
              detectorActive
                ? "ACTIVE"
                : "OFFLINE"
            }
            active={detectorActive}
          />

          <StatusRow
            label="ACTIVE RULE"
            value={
              networkStatus
                ?.detection_rule ||
              "SCAN-001"
            }
            active={detectorActive}
          />

          <StatusRow
            label="EVENT PERSISTENCE"
            value={
              networkStatus
                ?.event_persistence ||
              "UNKNOWN"
            }
            active={
              networkStatus
                ?.event_persistence ===
              "sqlite"
            }
          />
        </div>
      </section>


      {/* ===================================================
          METRICS
          =================================================== */}

      <div
        style={{
          marginTop: "15px",

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit,minmax(150px,1fr))",

          gap: "10px",
        }}
      >
        <MetricCard
          label="TOTAL EVENTS"
          value={metrics.total}
          icon={Database}
        />

        <MetricCard
          label="CRITICAL"
          value={metrics.critical}
          icon={ShieldAlert}
          tone="red"
        />

        <MetricCard
          label="HIGH"
          value={metrics.high}
          icon={AlertTriangle}
          tone="amber"
        />

        <MetricCard
          label="INFO"
          value={metrics.info}
          icon={Activity}
        />

        <MetricCard
          label="SCAN-001"
          value={scanEvents.length}
          icon={Crosshair}
          tone="purple"
        />
      </div>


      {/* ===================================================
          DETECTION ENGINE + SENSOR
          =================================================== */}

      <div
        style={{
          marginTop: "15px",

          display: "grid",

          gridTemplateColumns:
            "minmax(0,1.15fr) minmax(330px,.85fr)",

          gap: "15px",
        }}
      >
        {/* RULE */}

        <section
          style={panelStyle}
        >
          <PanelHeading
            eyebrow="ACTIVE DETECTION RULE"
            title="SCAN-001 // TCP Multi-Port Scan"
            icon={Crosshair}
          />


          <div
            style={{
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "grid",

                gridTemplateColumns:
                  "repeat(auto-fit,minmax(140px,1fr))",

                gap: "10px",
              }}
            >
              <RuleValue
                label="RULE ID"
                value="SCAN-001"
              />

              <RuleValue
                label="SEVERITY"
                value="HIGH"
                tone="amber"
              />

              <RuleValue
                label="PORT THRESHOLD"
                value="8 UNIQUE"
              />

              <RuleValue
                label="TIME WINDOW"
                value="10 SEC"
              />
            </div>


            <div
              style={{
                marginTop: "22px",
                paddingTop: "18px",

                borderTop:
                  "1px solid var(--td-line)",

                display: "flex",
                alignItems:
                  "flex-start",
                gap: "12px",
              }}
            >
              <ShieldCheck
                size={19}
                strokeWidth={1.4}
                color="#d7ff57"
              />

              <div>
                <strong
                  style={{
                    display: "block",

                    color:
                      "var(--td-cream)",

                    fontFamily:
                      "var(--font-tech)",
                    fontSize: "11px",
                  }}
                >
                  DETECTION LOGIC
                </strong>

                <p
                  style={{
                    margin:
                      "7px 0 0",

                    color:
                      "var(--td-muted)",

                    fontSize: "11px",
                    lineHeight: 1.65,
                  }}
                >
                  Sentinel-X observes
                  inbound TCP metadata
                  targeting the protected
                  endpoint. A source
                  contacting eight or more
                  unique destination ports
                  within ten seconds can
                  generate a SCAN-001
                  detection.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* SENSOR */}

        <section
          style={panelStyle}
        >
          <PanelHeading
            eyebrow="SENSOR CONTEXT"
            title="Detection Pipeline"
            icon={Wifi}
          />


          <div
            style={{
              padding:
                "20px 22px",
            }}
          >
            <PipelineRow
              icon={Server}
              label="NETWORK API"
              value={
                apiOnline
                  ? "ONLINE"
                  : "OFFLINE"
              }
              active={apiOnline}
            />

            <PipelineRow
              icon={Wifi}
              label="PACKET CAPTURE"
              value={
                captureActive
                  ? "CAPTURING"
                  : "STANDBY"
              }
              active={captureActive}
            />

            <PipelineRow
              icon={Target}
              label="ENDPOINT"
              value={monitoredHost}
              active={
                monitoredHost !==
                "UNKNOWN"
              }
            />

            <PipelineRow
              icon={Activity}
              label="TRACKED FLOWS"
              value={String(
                trackedFlows
              )}
              active={apiOnline}
            />

            <PipelineRow
              icon={Radar}
              label="MEMORY DETECTIONS"
              value={String(
                inMemoryDetections
              )}
              active={
                inMemoryDetections > 0
              }
            />
          </div>
        </section>
      </div>


      {/* ===================================================
          LATEST SCAN DETECTION
          =================================================== */}

      <section
        style={{
          ...panelStyle,
          marginTop: "15px",
        }}
      >
        <PanelHeading
          eyebrow="DETECTION INTELLIGENCE"
          title="Latest SCAN-001 Alert"
          icon={ShieldAlert}
        />


        {latestDetection ? (
          <div
            style={{
              padding: "22px",

              display: "grid",

              gridTemplateColumns:
                "minmax(150px,.7fr) minmax(150px,.7fr) minmax(120px,.5fr) minmax(250px,1.5fr)",

              gap: "18px",

              alignItems: "center",
            }}
          >
            <DetectionField
              label="SOURCE"
              value={
                latestDetection.source
              }
            />

            <DetectionField
              label="TARGET"
              value={
                latestDetection.target ||
                "-"
              }
            />

            <DetectionField
              label="SEVERITY"
              value={
                normalizeSeverity(
                  latestDetection.severity
                )
              }
              alert
            />

            <div>
              <span
                style={fieldLabelStyle}
              >
                DESCRIPTION
              </span>

              <p
                style={{
                  margin:
                    "6px 0 0",

                  color:
                    "var(--td-muted)",

                  fontSize: "11px",
                  lineHeight: 1.55,
                }}
              >
                {
                  latestDetection.description
                }
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              minHeight: "110px",
              padding: "25px",

              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              gap: "10px",

              color:
                "var(--td-muted)",

              fontFamily:
                "var(--font-tech)",
              fontSize: "10px",
              letterSpacing: ".05em",
            }}
          >
            <Eye
              size={16}
              strokeWidth={1.4}
            />

            NO PERSISTED SCAN-001
            DETECTION AVAILABLE
          </div>
        )}
      </section>


      {/* ===================================================
          EVENT STREAM
          =================================================== */}

      <section
        style={{
          ...panelStyle,
          marginTop: "15px",
          overflow: "hidden",
        }}
      >
        <PanelHeading
          eyebrow="SECURITY EVENT STORE"
          title="Detection Event Stream"
          icon={Database}
        />


        <div
          style={{
            overflowX: "auto",
          }}
        >
          <div
            style={{
              minWidth: "850px",
            }}
          >
            <div
              style={{
                minHeight: "42px",
                padding:
                  "0 22px",

                display: "grid",

                gridTemplateColumns:
                  "80px 130px 95px minmax(150px,1fr) minmax(150px,1fr) 110px",

                alignItems:
                  "center",

                borderBottom:
                  "1px solid var(--td-line)",

                color:
                  "var(--td-dim)",

                background:
                  "rgba(255,255,255,.01)",

                fontFamily:
                  "var(--font-tech)",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing:
                  ".07em",
              }}
            >
              <span>ID</span>
              <span>EVENT</span>
              <span>SEVERITY</span>
              <span>SOURCE</span>
              <span>TARGET</span>
              <span>TIME</span>
            </div>


            {loading ? (
              <EmptyRow
                text="LOADING SECURITY EVENTS"
              />
            ) : events.length === 0 ? (
              <EmptyRow
                text="NO SECURITY EVENTS AVAILABLE"
              />
            ) : (
              events
                .slice(0, 12)
                .map(
                  (
                    event,
                    index
                  ) => (
                    <motion.div
                      key={event.id}
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay:
                          index *
                          0.025,
                      }}
                      style={{
                        minHeight:
                          "51px",

                        padding:
                          "0 22px",

                        display:
                          "grid",

                        gridTemplateColumns:
                          "80px 130px 95px minmax(150px,1fr) minmax(150px,1fr) 110px",

                        alignItems:
                          "center",

                        borderBottom:
                          "1px solid rgba(236,232,217,.055)",

                        fontFamily:
                          "var(--font-tech)",
                        fontSize:
                          "10px",
                      }}
                    >
                      <span
                        style={{
                          color:
                            "var(--td-dim)",
                        }}
                      >
                        {event.id}
                      </span>


                      <strong
                        style={{
                          color:
                            event.event_type
                              ?.toUpperCase()
                              .startsWith(
                                "SCAN-001"
                              )
                              ? "var(--td-purple)"
                              : "var(--td-cream)",
                        }}
                      >
                        {
                          event.event_type
                        }
                      </strong>


                      <SeverityBadge
                        severity={
                          event.severity
                        }
                      />


                      <span
                        style={{
                          color:
                            "var(--td-muted)",
                        }}
                      >
                        {event.source}
                      </span>


                      <span
                        style={{
                          color:
                            "var(--td-muted)",
                        }}
                      >
                        {event.target ||
                          "-"}
                      </span>


                      <span
                        style={{
                          color:
                            "var(--td-dim)",
                        }}
                      >
                        {formatTime(
                          event.created_at
                        )}
                      </span>
                    </motion.div>
                  )
                )
            )}
          </div>
        </div>


        <div
          style={{
            minHeight: "44px",
            padding: "0 22px",

            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "20px",

            color:
              "var(--td-dim)",

            fontFamily:
              "var(--font-tech)",
            fontSize: "9px",
            letterSpacing: ".05em",
          }}
        >
          <span>
            SQLITE // SECURITY_EVENTS
          </span>

          <span>
            {events.length} RECORDS
          </span>
        </div>
      </section>


      {/* ===================================================
          FOOT STATUS
          =================================================== */}

      <div
        style={{
          marginTop: "11px",

          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",

          color: "var(--td-dim)",

          fontFamily:
            "var(--font-tech)",
          fontSize: "9px",
          letterSpacing: ".05em",
        }}
      >
        <span>
          {apiOnline
            ? "DETECTION CHANNEL ONLINE"
            : "DETECTION CHANNEL OFFLINE"}
        </span>

        <span>
          {lastUpdated
            ? `UPDATED ${lastUpdated.toLocaleTimeString()}`
            : "WAITING FOR DATA"}
        </span>
      </div>
    </motion.section>
  );
}


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

const panelStyle = {
  position: "relative",

  border:
    "1px solid var(--td-line)",

  background:
    "linear-gradient(145deg, rgba(17,20,13,.95), rgba(8,9,6,.98))",

  boxShadow:
    "0 18px 50px rgba(0,0,0,.16)",
};


const fieldLabelStyle = {
  color: "var(--td-dim)",

  fontFamily:
    "var(--font-tech)",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: ".08em",
};


function PanelHeading({
  eyebrow,
  title,
  icon: Icon,
}) {
  return (
    <div
      style={{
        minHeight: "72px",
        padding: "18px 22px",

        borderBottom:
          "1px solid var(--td-line)",

        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: "20px",
      }}
    >
      <div>
        <span
          style={fieldLabelStyle}
        >
          {eyebrow}
        </span>

        <h3
          style={{
            margin:
              "6px 0 0",

            color:
              "var(--td-cream)",

            fontSize: "16px",
            fontWeight: 570,
          }}
        >
          {title}
        </h3>
      </div>


      <Icon
        size={18}
        strokeWidth={1.4}
        color="#9b82ff"
      />
    </div>
  );
}


function StatusRow({
  label,
  value,
  active,
}) {
  return (
    <div
      style={{
        minHeight: "48px",
        padding: "0 14px",

        borderBottom:
          "1px solid var(--td-line)",

        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: "15px",

        fontFamily:
          "var(--font-tech)",
      }}
    >
      <span
        style={{
          color:
            "var(--td-dim)",

          fontSize: "9px",
          fontWeight: 650,
          letterSpacing:
            ".07em",
        }}
      >
        {label}
      </span>


      <strong
        style={{
          color: active
            ? "var(--td-acid)"
            : "var(--td-muted)",

          fontSize: "10px",
          fontWeight: 700,
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}) {
  let accent =
    "var(--td-acid)";

  if (tone === "red") {
    accent =
      "var(--td-red)";
  }

  if (tone === "amber") {
    accent =
      "var(--td-amber)";
  }

  if (tone === "purple") {
    accent =
      "var(--td-purple)";
  }


  return (
    <div
      style={{
        minHeight: "105px",
        padding: "16px",

        border:
          "1px solid var(--td-line)",

        background:
          "linear-gradient(145deg, rgba(17,20,13,.95), rgba(8,9,6,.98))",

        display: "flex",
        flexDirection: "column",
        justifyContent:
          "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "10px",
        }}
      >
        <span
          style={{
            color:
              "var(--td-dim)",

            fontFamily:
              "var(--font-tech)",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing:
              ".07em",
          }}
        >
          {label}
        </span>


        <Icon
          size={15}
          strokeWidth={1.4}
          color={accent}
        />
      </div>


      <strong
        style={{
          color: accent,

          fontFamily:
            "var(--font-tech)",
          fontSize: "27px",
          fontWeight: 500,

          fontVariantNumeric:
            "tabular-nums",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function RuleValue({
  label,
  value,
  tone,
}) {
  return (
    <div
      style={{
        minHeight: "72px",
        padding: "13px",

        border:
          "1px solid var(--td-line)",

        background:
          "rgba(255,255,255,.009)",
      }}
    >
      <span
        style={fieldLabelStyle}
      >
        {label}
      </span>


      <strong
        style={{
          display: "block",
          marginTop: "9px",

          color:
            tone === "amber"
              ? "var(--td-amber)"
              : "var(--td-cream)",

          fontFamily:
            "var(--font-tech)",
          fontSize: "12px",
          fontWeight: 650,
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function PipelineRow({
  icon: Icon,
  label,
  value,
  active,
}) {
  return (
    <div
      style={{
        minHeight: "44px",

        borderBottom:
          "1px solid rgba(236,232,217,.065)",

        display: "grid",

        gridTemplateColumns:
          "24px 1fr auto",

        alignItems: "center",
        gap: "9px",
      }}
    >
      <Icon
        size={14}
        strokeWidth={1.4}
        color={
          active
            ? "#d7ff57"
            : "#747966"
        }
      />


      <span
        style={{
          color:
            "var(--td-dim)",

          fontFamily:
            "var(--font-tech)",
          fontSize: "9px",
          fontWeight: 650,
        }}
      >
        {label}
      </span>


      <strong
        style={{
          color: active
            ? "var(--td-acid)"
            : "var(--td-muted)",

          fontFamily:
            "var(--font-tech)",
          fontSize: "10px",
          fontWeight: 650,
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function DetectionField({
  label,
  value,
  alert,
}) {
  return (
    <div>
      <span
        style={fieldLabelStyle}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: "7px",

          color: alert
            ? "var(--td-amber)"
            : "var(--td-cream)",

          fontFamily:
            "var(--font-tech)",
          fontSize: "11px",
          fontWeight: 650,
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function SeverityBadge({
  severity,
}) {
  const normalized =
    normalizeSeverity(
      severity
    );


  let color =
    "#9a9e89";

  if (
    normalized ===
    "CRITICAL"
  ) {
    color = "#ff6258";
  } else if (
    normalized === "HIGH"
  ) {
    color = "#ffbd59";
  } else if (
    normalized ===
    "MEDIUM"
  ) {
    color = "#d7ff57";
  }


  return (
    <strong
      style={{
        color,

        fontFamily:
          "var(--font-tech)",
        fontSize: "9px",
        fontWeight: 750,
        letterSpacing:
          ".05em",
      }}
    >
      {normalized}
    </strong>
  );
}


function EmptyRow({
  text,
}) {
  return (
    <div
      style={{
        minHeight: "100px",

        display: "flex",
        alignItems: "center",
        justifyContent:
          "center",
        gap: "8px",

        color:
          "var(--td-dim)",

        fontFamily:
          "var(--font-tech)",
        fontSize: "10px",
      }}
    >
      <RefreshCw
        size={14}
        strokeWidth={1.4}
      />

      {text}
    </div>
  );
}


export default ThreatDetection;