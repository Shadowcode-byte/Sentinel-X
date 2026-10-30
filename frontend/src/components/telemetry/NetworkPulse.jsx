import { API_BASE } from "../../services/apiConfig";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  motion,
  useReducedMotion,
} from "motion/react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Activity,
  Radio,
  Signal,
} from "lucide-react";




const MAX_SAMPLES = 18;


/*
 * =========================================================
 * NETWORK PULSE
 * =========================================================
 *
 * Live packet-rate visualization.
 *
 * Instead of using hard-coded demo values, Sentinel-X
 * samples the real monitored packet counter exposed by
 * FastAPI and calculates packets observed between polls.
 */

function NetworkPulse({
  eventCount = 0,
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

    monitored_packets: 0,

    total_packets_seen: 0,

    tracked_flows: 0,

    active_flows: 0,

    detection_count: 0,
  });


  const [
    sensorStatus,
    setSensorStatus,
  ] = useState({
    capture_active: false,

    packet_sensor: "unknown",

    interface_name: "Wi-Fi",

    collector: "scapy",
  });


  const [
    samples,
    setSamples,
  ] = useState([]);


  const [
    networkApiOnline,
    setNetworkApiOnline,
  ] = useState(false);


  const previousPacketCount =
    useRef(null);


  /*
   * =====================================================
   * LIVE TELEMETRY POLLING
   * =====================================================
   */

  useEffect(() => {
    let mounted = true;


    async function loadTelemetry() {
      try {
        const [
          telemetryResponse,
          statusResponse,
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
        ]);


        if (
          !telemetryResponse.ok ||
          !statusResponse.ok
        ) {
          throw new Error(
            "Sentinel-X Network API unavailable."
          );
        }


        const telemetryData =
          await telemetryResponse.json();

        const statusData =
          await statusResponse.json();


        if (!mounted) {
          return;
        }


        setTelemetry(
          telemetryData
        );

        setSensorStatus(
          statusData
        );

        setNetworkApiOnline(
          true
        );


        /*
         * Calculate packets received since the
         * previous frontend poll.
         */

        const currentPackets =
          Number(
            telemetryData
              .monitored_packets || 0
          );


        let packetDelta = 0;


        if (
          previousPacketCount
            .current !== null
        ) {
          packetDelta =
            currentPackets -
            previousPacketCount
              .current;


          /*
           * A telemetry reset can make the counter
           * smaller than the previous value.
           */

          if (packetDelta < 0) {
            packetDelta = 0;
          }
        }


        previousPacketCount.current =
          currentPackets;


        const now =
          new Date();


        const label =
          now.toLocaleTimeString(
            [],
            {
              minute: "2-digit",
              second: "2-digit",
            }
          );


        setSamples(
          (previousSamples) => {
            const nextSamples = [
              ...previousSamples,

              {
                time: label,
                value: packetDelta,
              },
            ];


            return nextSamples.slice(
              -MAX_SAMPLES
            );
          }
        );
      } catch (error) {
        if (!mounted) {
          return;
        }


        console.error(
          "Sentinel-X Network Pulse error:",
          error
        );


        setNetworkApiOnline(
          false
        );
      }
    }


    loadTelemetry();


    const interval =
      window.setInterval(
        loadTelemetry,
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
   * LIVE VALUES
   * =====================================================
   */

  const currentSignal =
    samples.length > 0
      ? samples[
          samples.length - 1
        ].value
      : 0;


  const peakSignal =
    samples.length > 0
      ? Math.max(
          ...samples.map(
            (point) =>
              point.value
          ),
          0
        )
      : 0;


  const chartMaximum =
    Math.max(
      peakSignal,
      10
    );


  const chartMidpoint =
    Math.max(
      Math.round(
        chartMaximum / 2
      ),
      1
    );


  const captureActive =
    Boolean(
      sensorStatus.capture_active
    ) &&
    Boolean(
      telemetry.live
    );


  const sensorReady =
    sensorStatus.packet_sensor ===
    "ready";


  const trackedFlows =
    telemetry.tracked_flows ??
    telemetry.active_flows ??
    0;


  const interfaceName =
    sensorStatus.interface_name ||
    telemetry.interface ||
    "Wi-Fi";


  return (
    <motion.section
      className="telemetry-card network-pulse network-instrument"
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
        delay: 0.12,
        ease: [
          0.16,
          1,
          0.3,
          1,
        ],
      }}
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="telemetry-card-header">
        <div>
          <span className="micro-label">
            02 / NETWORK TELEMETRY
          </span>

          <h3>
            Network Pulse
          </h3>
        </div>


        <div className="network-header-controls">
          <div className="network-data-mode">
            {captureActive
              ? "LIVE TELEMETRY"
              : sensorReady
              ? "SENSOR STANDBY"
              : "SENSOR OFFLINE"}
          </div>


          <motion.div
            className="telemetry-icon"
            animate={
              reduceMotion
                ? {}
                : {
                    scale:
                      captureActive
                        ? [
                            1,
                            1.08,
                            1,
                          ]
                        : 1,

                    opacity:
                      captureActive
                        ? [
                            0.65,
                            1,
                            0.65,
                          ]
                        : 0.4,
                  }
            }
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Activity
              size={18}
              strokeWidth={1.5}
            />
          </motion.div>
        </div>
      </div>


      {/* =====================================================
          LIVE READOUT
          ===================================================== */}

      <div className="network-readout-strip">
        <div className="network-readout-primary">
          <span>
            PACKET DELTA
          </span>

          <strong>
            {currentSignal.toLocaleString()}
          </strong>

          <small>
            / 2 SEC
          </small>
        </div>


        <div className="network-readout-secondary">
          <div>
            <span>
              PEAK
            </span>

            <strong>
              {peakSignal.toLocaleString()}
            </strong>
          </div>


          <div>
            <span>
              FLOWS
            </span>

            <strong>
              {Number(
                trackedFlows
              ).toLocaleString()}
            </strong>
          </div>


          <div>
            <span>
              LINK
            </span>

            <strong
              className={
                captureActive
                  ? "online-text"
                  : ""
              }
            >
              {captureActive
                ? "LIVE"
                : networkApiOnline
                ? "READY"
                : "OFFLINE"}
            </strong>
          </div>
        </div>
      </div>


      {/* =====================================================
          LIVE CHART
          ===================================================== */}

      <div className="pulse-chart">
        <div className="network-chart-label chart-label-top">
          {chartMaximum.toLocaleString()}
        </div>


        <div className="network-chart-label chart-label-mid">
          {chartMidpoint.toLocaleString()}
        </div>


        <div className="network-chart-label chart-label-bottom">
          0
        </div>


        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart
            data={samples}
            margin={{
              top: 12,
              right: 8,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="sxTelemetryGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#d7ff57"
                  stopOpacity={0.22}
                />

                <stop
                  offset="45%"
                  stopColor="#d7ff57"
                  stopOpacity={0.07}
                />

                <stop
                  offset="100%"
                  stopColor="#d7ff57"
                  stopOpacity={0}
                />
              </linearGradient>


              <filter
                id="sxSignalGlow"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur
                  stdDeviation="2.2"
                  result="blur"
                />

                <feMerge>
                  <feMergeNode in="blur" />

                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>


            <CartesianGrid
              stroke="rgba(236,232,217,0.045)"
              strokeDasharray="2 7"
              vertical={false}
            />


            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#555a49",
                fontSize: 7,
                fontFamily:
                  "Cascadia Code, Consolas, monospace",
              }}
              interval="preserveStartEnd"
            />


            <YAxis
              domain={[
                0,
                chartMaximum,
              ]}
              hide
            />


            <ReferenceLine
              y={chartMidpoint}
              stroke="rgba(236,232,217,0.07)"
              strokeDasharray="3 7"
            />


            <Tooltip
              cursor={{
                stroke:
                  "rgba(215,255,87,0.18)",

                strokeWidth: 1,

                strokeDasharray:
                  "3 4",
              }}
              content={
                <SentinelTooltip />
              }
            />


            <Area
              type="monotone"
              dataKey="value"
              stroke="#d7ff57"
              strokeWidth={1.7}
              fill="url(#sxTelemetryGradient)"
              filter="url(#sxSignalGlow)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#080906",
                stroke: "#d7ff57",
                strokeWidth: 2,
              }}
              isAnimationActive={
                !reduceMotion
              }
              animationDuration={
                500
              }
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>


        {/* Moving sensor scan */}

        {!reduceMotion &&
          captureActive && (
            <motion.div
              className="chart-scan"
              initial={{
                left: "0%",
              }}
              animate={{
                left: [
                  "0%",
                  "100%",
                ],
              }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <span className="chart-scan-head" />
            </motion.div>
          )}


        {/* Live sensor marker */}

        <motion.div
          className="network-live-marker"
          animate={
            reduceMotion ||
            !captureActive
              ? {}
              : {
                  opacity: [
                    0.45,
                    1,
                    0.45,
                  ],

                  scale: [
                    0.9,
                    1.15,
                    0.9,
                  ],
                }
          }
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        >
          <span />

          {captureActive
            ? "LIVE SENSOR"
            : "SENSOR READY"}
        </motion.div>
      </div>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="telemetry-footer">
        <div>
          <Signal
            size={11}
            strokeWidth={1.5}
          />

          <span>
            PACKETS
          </span>

          <strong>
            {Number(
              telemetry.monitored_packets ||
                0
            ).toLocaleString()}
          </strong>
        </div>


        <div>
          <Radio
            size={11}
            strokeWidth={1.5}
          />

          <span>
            SENSOR
          </span>

          <strong
            className={
              captureActive
                ? "online-text"
                : ""
            }
          >
            {captureActive
              ? "ACTIVE"
              : sensorReady
              ? "READY"
              : "OFFLINE"}
          </strong>
        </div>


        <div>
          <Activity
            size={11}
            strokeWidth={1.5}
          />

          <span>
            SOURCE
          </span>

          <strong>
            NPCAP
          </strong>
        </div>
      </div>


      {/* Technical footer signature */}

      <div className="network-instrument-signature">
        <span>
          SX // SENSOR CHANNEL 01
        </span>

        <span>
          {captureActive
            ? `NPCAP // ${interfaceName.toUpperCase()} // LIVE`
            : networkApiOnline
            ? `NPCAP // ${interfaceName.toUpperCase()} // STANDBY`
            : "NPCAP // OFFLINE"}
        </span>
      </div>
    </motion.section>
  );
}


function SentinelTooltip({
  active,
  payload,
}) {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }


  const point =
    payload[0];


  const sample =
    point.payload;


  return (
    <div className="sx-chart-tooltip">
      <div className="sx-chart-tooltip-head">
        LIVE SENSOR SAMPLE
      </div>


      <div className="sx-chart-tooltip-row">
        <span>
          PACKETS
        </span>

        <strong>
          {Number(
            point.value || 0
          ).toLocaleString()}
        </strong>
      </div>


      <div className="sx-chart-tooltip-row">
        <span>
          TIME
        </span>

        <strong>
          {sample?.time ||
            "--:--"}
        </strong>
      </div>


      <div className="sx-chart-tooltip-row">
        <span>
          SOURCE
        </span>

        <strong>
          NPCAP
        </strong>
      </div>
    </div>
  );
}


export default NetworkPulse;