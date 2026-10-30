import { API_BASE } from "../services/apiConfig";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useOutletContext } from "react-router-dom";

import {
  motion,
  useReducedMotion,
} from "motion/react";

import "../styles/NetworkOperations.css";
import "../styles/ProtocolFilter.css";
import ProtocolFilter from "../components/telemetry/ProtocolFilter";
import PacketRateAnalytics from "../components/telemetry/PacketRateAnalytics";
import FlowInspector from "../components/telemetry/FlowInspector";
import "../styles/FlowInspector.css";
import "../styles/PacketRateAnalytics.css";

import {
  Activity,
  ArrowRight,
  CircleDot,
  Crosshair,
  Database,
  Monitor,
  Network,
  Radio,
  Server,
  ShieldCheck,
  Terminal,
  Wifi,
} from "lucide-react";





const EMPTY_TELEMETRY = {
  mode: "live",
  live: false,
  interface: "Wi-Fi",
  monitored_host: "UNKNOWN",

  total_packets_seen: 0,
  monitored_packets: 0,
  ignored_packets: 0,
  active_flows: 0,

  protocols: {
    TCP: 0,
    UDP: 0,
    DNS: 0,
    ICMP: 0,
  },

  mdns_packets: 0,
  connections: [],
};


const EMPTY_SENSOR_STATUS = {
  status: "standby",
  collector: "scapy",
  packet_sensor: "unknown",
  capture_active: false,
  interface: null,
  interface_name: "Wi-Fi",
  interface_description: "Unknown network adapter",
  monitored_host: "UNKNOWN",
};


function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}


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


function resolvePort(connection) {
  if (!connection) {
    return "-";
  }

  if (connection.direction === "OUTBOUND") {
    return connection.destination_port ?? "-";
  }

  if (connection.direction === "INBOUND") {
    return connection.source_port ?? "-";
  }

  return (
    connection.destination_port ??
    connection.source_port ??
    "-"
  );
}


function NetworkOperations() {
  const {
    backendOnline = false,
    events = [],
  } = useOutletContext();

  const reduceMotion = useReducedMotion();

  const [selectedProtocol, setSelectedProtocol] = useState("ALL");

  const [telemetry, setTelemetry] = useState(
    EMPTY_TELEMETRY
  );

  const [sensorStatus, setSensorStatus] = useState(
    EMPTY_SENSOR_STATUS
  );

  const [networkApiOnline, setNetworkApiOnline] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(null);


  const eventCount = events.length;


  const latestEvent = useMemo(() => {
    if (!events.length) {
      return null;
    }

    return events[0];
  }, [events]);


  /*
   * =====================================================
   * LIVE NETWORK TELEMETRY
   * =====================================================
   */

  useEffect(() => {
    let mounted = true;


    async function loadNetworkData() {
      try {
        const [
          statusResponse,
          telemetryResponse,
        ] = await Promise.all([
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
          !statusResponse.ok ||
          !telemetryResponse.ok
        ) {
          throw new Error(
            "Sentinel-X Network API unavailable."
          );
        }


        const statusData =
          await statusResponse.json();

        const telemetryData =
          await telemetryResponse.json();


        if (!mounted) {
          return;
        }


        setSensorStatus(statusData);


        setTelemetry({
          ...EMPTY_TELEMETRY,
          ...telemetryData,

          protocols: {
            ...EMPTY_TELEMETRY.protocols,
            ...(telemetryData.protocols || {}),
          },

          connections:
            telemetryData.connections || [],
        });


        setNetworkApiOnline(true);

        setLastUpdated(new Date());
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "Sentinel-X network telemetry error:",
          error
        );

        setNetworkApiOnline(false);
      }
    }


    loadNetworkData();


    const interval = window.setInterval(
      loadNetworkData,
      1500
    );


    return () => {
      mounted = false;

      window.clearInterval(interval);
    };
  }, []);


  /*
   * =====================================================
   * PROTOCOL TELEMETRY
   * =====================================================
   */

  const protocolTelemetry = useMemo(() => {
    const values = [
      {
        protocol: "TCP",
        value: telemetry.protocols.TCP || 0,
      },

      {
        protocol: "UDP",
        value: telemetry.protocols.UDP || 0,
      },

      {
        protocol: "DNS",
        value: telemetry.protocols.DNS || 0,
      },

      {
        protocol: "ICMP",
        value: telemetry.protocols.ICMP || 0,
      },
    ];


    const highest = Math.max(
      ...values.map((item) => item.value),
      1
    );


    return values.map((item) => ({
      ...item,

      percentage:
        item.value === 0
          ? 0
          : Math.max(
              4,
              Math.round(
                (item.value / highest) * 100
              )
            ),
    }));
  }, [telemetry.protocols]);


  /*
   * =====================================================
   * RECENT OBSERVED PORTS
   * =====================================================
   */

  const monitoredPorts = useMemo(() => {
    const ports = [];


    for (const connection of telemetry.connections) {
      const port = resolvePort(connection);


      if (
        port !== "-" &&
        !ports.includes(port)
      ) {
        ports.push(port);
      }


      if (ports.length === 5) {
        break;
      }
    }


    return ports;
  }, [telemetry.connections]);


  /*
   * =====================================================
   * AGGREGATED FLOWS
   * =====================================================
   */

  const protocolCounts = useMemo(() => {
    const connections = telemetry.connections || [];

    const counts = {
      ALL: connections.length,
      TCP: 0,
      UDP: 0,
      DNS: 0,
      ICMP: 0,
    };

    connections.forEach((connection) => {
      const protocol = String(
        connection.protocol || ""
      ).toUpperCase();

      if (Object.prototype.hasOwnProperty.call(counts, protocol)) {
        counts[protocol] += 1;
      }
    });

    return counts;
  }, [telemetry.connections]);

  const filteredConnections = useMemo(() => {
    const connections = telemetry.connections || [];

    if (selectedProtocol === "ALL") {
      return connections;
    }

    return connections.filter(
      (connection) =>
        String(connection.protocol || "").toUpperCase() ===
        selectedProtocol
    );
  }, [telemetry.connections, selectedProtocol]);

  const recentConnections = useMemo(
    () => filteredConnections.slice(0, 8),
    [filteredConnections]
  );


  const captureActive =
    Boolean(sensorStatus.capture_active) &&
    Boolean(telemetry.live);


  const packetSensorReady =
    sensorStatus.packet_sensor === "ready";


  const monitoredHost =
    telemetry.monitored_host ||
    sensorStatus.monitored_host ||
    "UNKNOWN";


  const adapterName =
    sensorStatus.interface_name ||
    telemetry.interface ||
    "Wi-Fi";


  const adapterDescription =
    sensorStatus.interface_description ||
    "Network adapter";


  return (
    <motion.section
      className="network-operations-page"
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* =====================================================
          PAGE HERO
          ===================================================== */}

      <header className="network-ops-hero">
        <div className="network-ops-heading">
          <div className="network-ops-eyebrow">
            <Radio
              size={13}
              strokeWidth={1.5}
            />

            <span>
              02 / NETWORK OPERATIONS
            </span>
          </div>


          <h2>
            NETWORK

            <span>
              OBSERVABILITY
            </span>
          </h2>


          <p>
            Live packet intelligence, endpoint visibility,
            protocol analysis and monitored network traffic
            from the Sentinel-X packet sensor.
          </p>
        </div>


        <div className="network-ops-hero-status">
          <div className="network-ops-status-block">
            <span>
              ENGINE
            </span>

            <strong
              className={
                backendOnline
                  ? "network-state-online"
                  : "network-state-offline"
              }
            >
              {backendOnline
                ? "ONLINE"
                : "OFFLINE"}
            </strong>
          </div>


          <div className="network-ops-status-block">
            <span>
              MONITORED PACKETS
            </span>

            <strong>
              {formatNumber(
                telemetry.monitored_packets
              )}
            </strong>
          </div>


          <div className="network-ops-mode">
            {captureActive
              ? `LIVE CAPTURE // ${adapterName.toUpperCase()}`
              : "PACKET SENSOR // STANDBY"}
          </div>
        </div>
      </header>


      {/* =====================================================
          LIVE NETWORK FABRIC
          ===================================================== */}

      <section className="network-fabric-panel">
        <div className="network-panel-heading">
          <div>
            <span className="micro-label">
              DEFENSE FABRIC
            </span>

            <h3>
              Live Network Path
            </h3>
          </div>


          <div className="network-panel-state">
            <motion.i
              animate={
                reduceMotion || !captureActive
                  ? {}
                  : {
                      opacity: [
                        0.35,
                        1,
                        0.35,
                      ],

                      scale: [
                        1,
                        1.25,
                        1,
                      ],
                    }
              }
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {captureActive
              ? "PACKET SENSOR ACTIVE"
              : networkApiOnline
              ? "SENSOR STANDBY"
              : "SENSOR OFFLINE"}
          </div>
        </div>


        <div className="network-fabric-stage">
          <div className="network-fabric-grid" />


          {/* NETWORK SOURCE */}

          <motion.div
            className="network-machine-node kali-machine"
            initial={{
              opacity: 0,
              x: -30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.15,
              duration: 0.55,
            }}
          >
            <div className="network-machine-icon">
              <Terminal
                size={23}
                strokeWidth={1.4}
              />
            </div>


            <div className="network-machine-copy">
              <span>
                NETWORK TRAFFIC
              </span>

              <strong>
                LIVE SOURCES
              </strong>

              <small>
                INBOUND / OUTBOUND
              </small>
            </div>


            <div className="network-machine-state">
              {captureActive
                ? "LIVE"
                : "READY"}
            </div>
          </motion.div>


          {/* PACKET CHANNEL */}

          <div className="network-link-zone">
            <div className="network-link-meta">
              <span>
                ENDPOINT TRAFFIC
              </span>

              <strong>
                {formatNumber(
                  telemetry.monitored_packets
                )}{" "}
                PACKETS
              </strong>
            </div>


            <div className="network-link-line">
              <div className="network-link-base" />


              {!reduceMotion &&
                captureActive &&
                [0, 1, 2, 3, 4].map(
                  (particle) => (
                    <motion.span
                      key={particle}
                      className="network-packet-particle"
                      initial={{
                        left: "0%",
                        opacity: 0,
                      }}
                      animate={{
                        left: [
                          "0%",
                          "100%",
                        ],

                        opacity: [
                          0,
                          1,
                          1,
                          0,
                        ],
                      }}
                      transition={{
                        duration: 3.4,
                        delay:
                          particle * 0.62,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )
                )}


              <motion.div
                className="network-flow-arrow"
                animate={
                  reduceMotion || !captureActive
                    ? {}
                    : {
                        x: [
                          -3,
                          3,
                          -3,
                        ],
                      }
                }
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ArrowRight
                  size={16}
                  strokeWidth={1.4}
                />
              </motion.div>
            </div>


            <div className="network-port-row">
              {monitoredPorts.length > 0 ? (
                monitoredPorts.map(
                  (port, index) => (
                    <motion.div
                      key={`${port}-${index}`}
                      className="network-port"
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay:
                          0.4 +
                          index * 0.07,
                      }}
                    >
                      <span>
                        PORT
                      </span>

                      <strong>
                        {port}
                      </strong>
                    </motion.div>
                  )
                )
              ) : (
                <div className="network-port">
                  <span>
                    PORT
                  </span>

                  <strong>
                    --
                  </strong>
                </div>
              )}
            </div>
          </div>


          {/* WINDOWS ENDPOINT */}

          <motion.div
            className="network-machine-node windows-machine"
            initial={{
              opacity: 0,
              x: 30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.22,
              duration: 0.55,
            }}
          >
            <div className="network-machine-icon">
              <Monitor
                size={23}
                strokeWidth={1.4}
              />
            </div>


            <div className="network-machine-copy">
              <span>
                MONITORED ENDPOINT
              </span>

              <strong>
                {monitoredHost}
              </strong>

              <small>
                WINDOWS / PRIMARY ASSET
              </small>
            </div>


            <div
              className={`network-machine-state ${
                captureActive
                  ? "connected"
                  : ""
              }`}
            >
              {captureActive
                ? "MONITORED"
                : "STANDBY"}
            </div>
          </motion.div>


          {/* SENTINEL-X SENSOR */}

          <motion.div
            className="network-sensor-hook"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.5,
            }}
          >
            <div className="sensor-hook-line" />


            <div className="sensor-hook-core">
              <ShieldCheck
                size={18}
                strokeWidth={1.4}
              />

              <div>
                <span>
                  SENTINEL-X
                </span>

                <strong>
                  PACKET SENSOR
                </strong>
              </div>
            </div>


            <small>
              NPCAP //{" "}

              {captureActive
                ? "CAPTURING"
                : packetSensorReady
                ? "READY"
                : "OFFLINE"}
            </small>
          </motion.div>
        </div>


        <div className="network-fabric-legend">
          <span>
            <i className="legend-acid" />
            LIVE ENDPOINT TRAFFIC
          </span>

          <span>
            <i className="legend-cream" />
            WINDOWS ASSET
          </span>

          <span>
            <i className="legend-purple" />
            SENTINEL SENSOR
          </span>
        </div>
      </section>


      {/* =====================================================
          PROTOCOL + SENSOR GRID
          ===================================================== */}

      <div className="network-ops-grid">
        {/* PROTOCOL ANALYSIS */}

        <section className="protocol-panel">
          <div className="network-panel-heading">
            <div>
              <span className="micro-label">
                PROTOCOL ANALYSIS
              </span>

              <h3>
                Live Traffic Spectrum
              </h3>
            </div>


            <Activity
              size={18}
              strokeWidth={1.4}
            />
          </div>


          <div className="protocol-spectrum">
            {protocolTelemetry.map(
              (item, index) => (
                <motion.div
                  className="protocol-row"
                  key={item.protocol}
                  initial={{
                    opacity: 0,
                    x: -12,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      0.12 +
                      index * 0.08,
                  }}
                >
                  <div className="protocol-label">
                    <span>
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <strong>
                      {item.protocol}
                    </strong>
                  </div>


                  <div className="protocol-track">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width:
                          `${item.percentage}%`,
                      }}
                      transition={{
                        duration: 0.65,
                        ease: [
                          0.16,
                          1,
                          0.3,
                          1,
                        ],
                      }}
                    />
                  </div>


                  <strong className="protocol-value">
                    {formatNumber(
                      item.value
                    )}
                  </strong>
                </motion.div>
              )
            )}
          </div>


          <div className="protocol-disclaimer">
            <CircleDot
              size={10}
              strokeWidth={1.5}
            />

            <span>
              LIVE NPCAP COUNTERS // ENDPOINT
              FILTER ACTIVE // MDNS{" "}
              {formatNumber(
                telemetry.mdns_packets
              )}
            </span>
          </div>
        </section>


        {/* COLLECTION STATUS */}

        <section className="network-sensor-panel">
          <div className="network-panel-heading">
            <div>
              <span className="micro-label">
                SENSOR CHANNEL
              </span>

              <h3>
                Collection Status
              </h3>
            </div>


            <Wifi
              size={18}
              strokeWidth={1.4}
            />
          </div>


          <div className="sensor-status-core">
            <motion.div
              className="sensor-radar"
              animate={
                reduceMotion || !captureActive
                  ? {}
                  : {
                      rotate: 360,
                    }
              }
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <span />
            </motion.div>


            <div className="sensor-status-center">
              <Network
                size={24}
                strokeWidth={1.3}
              />

              <strong>
                {captureActive
                  ? "LIVE"
                  : networkApiOnline
                  ? "READY"
                  : "OFFLINE"}
              </strong>

              <span>
                {adapterName.toUpperCase()}
              </span>
            </div>
          </div>


          <div className="sensor-status-list">
            <SensorStatus
              icon={Server}
              label="NETWORK API"
              value={
                networkApiOnline
                  ? "ONLINE"
                  : "OFFLINE"
              }
              active={networkApiOnline}
            />


            <SensorStatus
              icon={Radio}
              label="PACKET SENSOR"
              value={
                captureActive
                  ? "CAPTURING"
                  : packetSensorReady
                  ? "READY"
                  : "OFFLINE"
              }
              active={packetSensorReady}
            />


            <SensorStatus
              icon={Monitor}
              label="ENDPOINT"
              value={monitoredHost}
              active={captureActive}
            />


            <SensorStatus
              icon={Database}
              label="RELEVANT"
              value={`${formatNumber(
                telemetry.monitored_packets
              )} PKTS`}
              active={captureActive}
            />
          </div>
        </section>
      </div>


      {/* =====================================================
          AGGREGATED CONNECTION FLOW TABLE
          ===================================================== */}

      {/* SENTINEL-X 2.0 - LIVE PACKET RATE ANALYTICS */}

      <PacketRateAnalytics
        totalPackets={telemetry.total_packets_seen}
        captureActive={captureActive}
        telemetryTimestamp={telemetry.timestamp}
        intervalMs={1500}
      />
      <ProtocolFilter
        selectedProtocol={selectedProtocol}
        onProtocolChange={setSelectedProtocol}
        counts={protocolCounts}
      />

      <section className="network-connections-panel">
        <div className="network-panel-heading">
          <div>
            <span className="micro-label">
              CONNECTION OBSERVATION
            </span>

            <h3>
              Live Endpoint Flows
            </h3>
          </div>


          <div className="network-table-badge">
            {captureActive
              ? `${formatNumber(
                  telemetry.active_flows
                )} ACTIVE FLOWS`
              : "STANDBY"}
          </div>
        </div>


        <div className="network-table">
          <div className="network-table-head network-flow-columns">
            <span>
              LAST SEEN
            </span>

            <span>
              SOURCE
            </span>

            <span>
              DESTINATION
            </span>

            <span>
              PORT
            </span>

            <span>
              PROTOCOL
            </span>

            <span>
              DIRECTION
            </span>

            <span>
              PACKETS
            </span>
          </div>


          {recentConnections.length > 0 ? (
            recentConnections.map(
              (connection, index) => (
                <motion.div
                  className="network-table-row network-flow-columns"
                  key={
                    `${connection.source}-${connection.destination}-${connection.source_port}-${connection.destination_port}-${connection.protocol}-${connection.direction}`
                  }
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index * 0.025,
                  }}
                >
                  <span>
                    {formatTime(
                      connection.last_seen
                    )}
                  </span>


                  <strong>
                    {connection.source}
                  </strong>


                  <strong>
                    {connection.destination}
                  </strong>


                  <span className="table-port">
                    {resolvePort(
                      connection
                    )}
                  </span>


                  <span>
                    {connection.protocol}
                  </span>


                  <span className="table-state">
                    {connection.direction ||
                      "OBSERVED"}
                  </span>


                  <strong className="flow-packet-count">
                    {formatNumber(
                      connection.packets
                    )}
                  </strong>
                </motion.div>
              )
            )
          ) : (
            <div className="stream-empty">
              <Radio size={14} />

              No endpoint flows captured yet.
            </div>
          )}
        </div>


        <div className="network-table-footer">
          <span>
            SENSOR // {adapterName.toUpperCase()}
          </span>


          <span>
            FLOWS{" "}
            {formatNumber(
              telemetry.active_flows
            )}{" "}
            // OBSERVED{" "}
            {formatNumber(
              telemetry.total_packets_seen
            )}{" "}
            // RELEVANT{" "}
            {formatNumber(
              telemetry.monitored_packets
            )}{" "}
            // FILTERED{" "}
            {formatNumber(
              telemetry.ignored_packets
            )}
          </span>
        </div>
      </section>


      {/* =====================================================
          BACKEND EVENT CONTEXT
          ===================================================== */}

      {/* SENTINEL-X 2.0 - ADVANCED FLOW INSPECTION */}

      <FlowInspector
        connections={telemetry.connections}
        captureActive={captureActive}
      />
      <section className="network-event-context">
        <Crosshair
          size={17}
          strokeWidth={1.4}
        />


        <div>
          <span>
            SENTINEL EVENT CONTEXT
          </span>

          <strong>
            {latestEvent
              ? latestEvent.event_type
              : "NO SECURITY EVENTS"}
          </strong>
        </div>


        <p>
          {latestEvent
            ? latestEvent.description
            : captureActive
            ? (
                `Packet sensor active on ${adapterDescription}. ` +
                "No security event has been generated from the current traffic."
              )
            : (
                "Packet sensor is currently in standby."
              )}
        </p>


        <div className="network-event-count">
          {eventCount}

          <span>
            EVENTS
          </span>
        </div>
      </section>


      {/* =====================================================
          UPDATE CONTEXT
          ===================================================== */}

      <div
        style={{
          marginTop: "10px",
          textAlign: "right",
          fontFamily: "var(--font-tech)",
          fontSize: "9px",
          letterSpacing: "0.07em",
          color: "#747966",
        }}
      >
        {lastUpdated
          ? `NETWORK TELEMETRY UPDATED ${lastUpdated.toLocaleTimeString()}`
          : "WAITING FOR NETWORK TELEMETRY"}
      </div>
    </motion.section>
  );
}


function SensorStatus({
  icon: Icon,
  label,
  value,
  active,
}) {
  return (
    <div className="sensor-status-item">
      <Icon
        size={13}
        strokeWidth={1.4}
      />

      <span>
        {label}
      </span>

      <strong
        className={
          active
            ? "network-state-online"
            : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}


export default NetworkOperations;