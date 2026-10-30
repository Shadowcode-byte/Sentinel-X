import { API_BASE } from "../../services/apiConfig";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  motion,
  useReducedMotion,
} from "motion/react";

import {
  Monitor,
  Network,
  Radar,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";





function DefenseTopology({
  backendOnline = false,
}) {
  const reduceMotion =
    useReducedMotion();


  const [
    telemetry,
    setTelemetry,
  ] = useState({
    live: false,
    interface: "Wi-Fi",
    monitored_host: "UNKNOWN",
    monitored_packets: 0,
    tracked_flows: 0,
    active_flows: 0,
  });


  const [
    networkStatus,
    setNetworkStatus,
  ] = useState({
    capture_active: false,
    packet_sensor: "unknown",
    interface_name: "Wi-Fi",
    monitored_host: "UNKNOWN",
  });


  const [
    events,
    setEvents,
  ] = useState([]);


  const [
    networkApiOnline,
    setNetworkApiOnline,
  ] = useState(false);


  /*
   * =====================================================
   * LIVE TOPOLOGY DATA
   * =====================================================
   */

  useEffect(() => {
    let mounted = true;


    async function loadTopologyData() {
      try {
        const [
          telemetryResponse,
          statusResponse,
          eventsResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE}/api/v1/network/telemetry`,
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
            `${API_BASE}/api/v1/events`,
            {
              cache: "no-store",
            }
          ),
        ]);


        if (
          !telemetryResponse.ok ||
          !statusResponse.ok ||
          !eventsResponse.ok
        ) {
          throw new Error(
            "Sentinel-X topology services unavailable."
          );
        }


        const telemetryData =
          await telemetryResponse.json();

        const statusData =
          await statusResponse.json();

        const eventsData =
          await eventsResponse.json();


        if (!mounted) {
          return;
        }


        setTelemetry(
          telemetryData
        );

        setNetworkStatus(
          statusData
        );

        setEvents(
          Array.isArray(eventsData)
            ? eventsData
            : []
        );

        setNetworkApiOnline(
          true
        );
      } catch (error) {
        if (!mounted) {
          return;
        }


        console.error(
          "Sentinel-X topology error:",
          error
        );

        setNetworkApiOnline(
          false
        );
      }
    }


    loadTopologyData();


    const interval =
      window.setInterval(
        loadTopologyData,
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
   * REAL DETECTION SOURCE
   * =====================================================
   *
   * A remote source is only presented as a threat source
   * when Sentinel-X actually has a persisted SCAN-001
   * security event.
   */

  const latestScanDetection =
    useMemo(
      () =>
        events.find(
          (event) =>
            String(
              event.event_type || ""
            )
              .toUpperCase()
              .startsWith(
                "SCAN-001"
              )
        ) || null,
      [events]
    );


  const captureActive =
    Boolean(
      networkStatus.capture_active
    ) &&
    Boolean(
      telemetry.live
    );


  const monitoredHost =
    telemetry.monitored_host ||
    networkStatus.monitored_host ||
    "UNKNOWN";


  const trackedFlows =
    telemetry.tracked_flows ??
    telemetry.active_flows ??
    0;


  const monitoredPackets =
    telemetry.monitored_packets ||
    0;


  const hasScanDetection =
    Boolean(
      latestScanDetection
    );


  /*
   * Left-side node changes according to real state:
   *
   * Normal:
   * NETWORK TRAFFIC
   *
   * After real SCAN-001:
   * <source IP>
   * SCAN SOURCE
   */

  const sourceTitle =
    hasScanDetection
      ? latestScanDetection.source
      : "NETWORK";


  const sourceSubtitle =
    hasScanDetection
      ? "SCAN SOURCE"
      : "TRAFFIC";


  return (
    <motion.section
      className="telemetry-card defense-topology"
      initial={{
        opacity: 0,
        y: 24,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.7,
        delay: 0.2,
        ease: [
          0.16,
          1,
          0.3,
          1,
        ],
      }}
    >
      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="telemetry-card-header">
        <div>
          <span className="micro-label">
            DEFENSE FABRIC
          </span>

          <h3>
            Live Security Topology
          </h3>
        </div>


        <motion.div
          animate={
            reduceMotion ||
            !captureActive
              ? {}
              : {
                  opacity: [
                    0.55,
                    1,
                    0.55,
                  ],
                }
          }
          transition={{
            duration: 1.8,
            repeat: Infinity,
          }}
        >
          <Radar size={18} />
        </motion.div>
      </div>


      {/* ===================================================
          TOPOLOGY
          =================================================== */}

      <div className="topology-stage">
        <div className="topology-grid" />

        <div className="topology-line line-one" />

        <div className="topology-line line-two" />


        {/* =================================================
            LIVE TRAFFIC PARTICLES
            ================================================= */}

        {!reduceMotion &&
          captureActive && (
            <>
              <motion.div
                className="traffic-particle particle-one"
                animate={{
                  left: [
                    "20%",
                    "49%",
                  ],

                  top: [
                    "46%",
                    "46%",
                  ],

                  opacity: [
                    0,
                    1,
                    1,
                    0,
                  ],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                  ease: "linear",
                }}
              />


              <motion.div
                className="traffic-particle particle-two"
                animate={{
                  left: [
                    "52%",
                    "78%",
                  ],

                  top: [
                    "46%",
                    "46%",
                  ],

                  opacity: [
                    0,
                    1,
                    1,
                    0,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 0.8,
                  ease: "linear",
                }}
              />
            </>
          )}


        {/* =================================================
            SOURCE / NETWORK NODE
            ================================================= */}

        <motion.div
          className={`topology-node kali-node ${
            hasScanDetection
              ? "detected-source"
              : ""
          }`}
          whileHover={{
            scale: 1.06,
          }}
        >
          <div className="node-icon">
            {hasScanDetection ? (
              <ShieldAlert
                size={20}
              />
            ) : (
              <Network
                size={20}
              />
            )}
          </div>


          <strong>
            {sourceTitle}
          </strong>


          <span>
            {sourceSubtitle}
          </span>
        </motion.div>


        {/* =================================================
            WINDOWS PROTECTED ENDPOINT
            ================================================= */}

        <motion.div
          className="topology-node windows-node"
          animate={
            backendOnline
              ? {
                  boxShadow: [
                    "0 0 0 rgba(215,255,87,0)",
                    "0 0 28px rgba(215,255,87,.10)",
                    "0 0 0 rgba(215,255,87,0)",
                  ],
                }
              : {}
          }
          transition={{
            duration: 2.5,
            repeat: Infinity,
          }}
          whileHover={{
            scale: 1.06,
          }}
        >
          <div className="node-icon">
            <Monitor
              size={20}
            />
          </div>


          <strong>
            {monitoredHost}
          </strong>


          <span>
            WINDOWS ENDPOINT
          </span>
        </motion.div>


        {/* =================================================
            SENTINEL-X CORE
            ================================================= */}

        <motion.div
          className="topology-node sentinel-node"
          whileHover={{
            scale: 1.06,
          }}
        >
          <motion.div
            className="node-icon"
            animate={
              reduceMotion
                ? {}
                : {
                    rotate: [
                      0,
                      0.5,
                      0,
                      -0.5,
                      0,
                    ],
                  }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
          >
            <ShieldCheck
              size={20}
            />
          </motion.div>


          <strong>
            SENTINEL-X
          </strong>


          <span>
            {hasScanDetection
              ? "SCAN-001 ACTIVE"
              : "DEFENSE CORE"}
          </span>
        </motion.div>


        {/* =================================================
            FLOW CAPTIONS
            ================================================= */}

        <div className="topology-caption caption-one">
          {hasScanDetection
            ? "DETECTED TRAFFIC"
            : captureActive
            ? "LIVE PACKET FLOW"
            : "NETWORK PATH"}
        </div>


        <div className="topology-caption caption-two">
          {captureActive
            ? "LIVE TELEMETRY"
            : "TELEMETRY"}
        </div>
      </div>


      {/* ===================================================
          STATUS FOOTER
          =================================================== */}

      <div className="topology-status">
        <span>
          <i
            className={
              backendOnline
                ? "active"
                : ""
            }
          />

          ENDPOINT{" "}

          {backendOnline
            ? "CONNECTED"
            : "WAITING"}
        </span>


        <span>
          <i
            className={
              captureActive
                ? "active"
                : "standby"
            }
          />

          {captureActive
            ? `${Number(
                monitoredPackets
              ).toLocaleString()} PACKETS`
            : networkApiOnline
            ? "SENSOR READY"
            : "SENSOR OFFLINE"}
        </span>


        <span>
          <i
            className={
              hasScanDetection
                ? "active"
                : "standby"
            }
          />

          {hasScanDetection
            ? "SCAN-001 DETECTED"
            : `${Number(
                trackedFlows
              ).toLocaleString()} TRACKED FLOWS`}
        </span>
      </div>
    </motion.section>
  );
}


export default DefenseTopology;