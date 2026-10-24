
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  BarChart3,
  Clock3,
  Radio,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MAX_SAMPLES = 40;

function formatRate(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

function PacketRateAnalytics({
  totalPackets = 0,
  captureActive = false,
  telemetryTimestamp = null,
  intervalMs = 1500,
}) {
  const reduceMotion = useReducedMotion();

  const [history, setHistory] = useState([]);
  const [currentRate, setCurrentRate] = useState(0);
  const [peakRate, setPeakRate] = useState(0);

  const previousSample = useRef(null);

  useEffect(() => {
    const timestamp = telemetryTimestamp
      ? Date.parse(telemetryTimestamp)
      : Date.now();

    if (!Number.isFinite(timestamp)) return;

    const packets = Number(totalPackets);

    if (!Number.isFinite(packets) || packets < 0) {
      return;
    }

    if (!captureActive) {
      previousSample.current = null;
      setCurrentRate(0);
      return;
    }

    const previous = previousSample.current;

    previousSample.current = {
      packets,
      timestamp,
    };

    // First sample establishes the baseline.
    if (!previous) return;

    const elapsedSeconds =
      (timestamp - previous.timestamp) / 1000;

    if (elapsedSeconds <= 0) return;

    // Counter reset or new capture session.
    if (packets < previous.packets) {
      setCurrentRate(0);
      setPeakRate(0);
      setHistory([]);
      return;
    }

    const delta = packets - previous.packets;

    const rate = Math.max(
      0,
      delta / elapsedSeconds
    );

    const roundedRate =
      Math.round(rate * 10) / 10;

    setCurrentRate(roundedRate);

    setPeakRate((previousPeak) =>
      Math.max(previousPeak, roundedRate)
    );

    setHistory((previousHistory) => [
      ...previousHistory,
      {
        time: new Date(timestamp).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }
        ),
        timestamp,
        rate: roundedRate,
      },
    ].slice(-MAX_SAMPLES));
  }, [
    totalPackets,
    captureActive,
    telemetryTimestamp,
  ]);

  const averageRate =
    history.length > 0
      ? history.reduce(
          (sum, item) => sum + item.rate,
          0
        ) / history.length
      : 0;

  return (
    <motion.section
      className="sx-packet-analytics"
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 16 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      aria-label="Live packet rate analytics"
    >
      <div className="sx-packet-analytics__header">
        <div>
          <span className="micro-label">
            NETWORK INTELLIGENCE // LIVE
          </span>
          <h3>Packet Rate Analytics</h3>
          <p>
            Real-time packet throughput calculated from
            observed network telemetry.
          </p>
        </div>

        <div
          className={`sx-packet-analytics__status ${
            captureActive ? "is-live" : ""
          }`}
        >
          <Radio size={13} />
          <span>
            {captureActive ? "CAPTURING" : "STANDBY"}
          </span>
        </div>
      </div>

      <div className="sx-packet-analytics__metrics">
        <Metric
          icon={Activity}
          label="CURRENT RATE"
          value={formatRate(currentRate)}
          unit="PKTS/SEC"
        />

        <Metric
          icon={TrendingUp}
          label="PEAK RATE"
          value={formatRate(peakRate)}
          unit="PKTS/SEC"
        />

        <Metric
          icon={BarChart3}
          label="AVERAGE RATE"
          value={formatRate(averageRate)}
          unit="PKTS/SEC"
        />

        <Metric
          icon={Clock3}
          label="SAMPLES"
          value={history.length}
          unit="OBSERVED"
        />
      </div>

      <div className="sx-packet-analytics__chart">
        {history.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={history}
              margin={{
                top: 15,
                right: 15,
                left: -20,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="sxPacketRateGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#d7ff57"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor="#d7ff57"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(215,255,87,0.07)"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                stroke="#747966"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                minTickGap={25}
              />

              <YAxis
                stroke="#747966"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                domain={[0, "auto"]}
              />

              <Tooltip
                contentStyle={{
                  background: "#10160e",
                  border:
                    "1px solid rgba(215,255,87,0.2)",
                  borderRadius: 4,
                  color: "#ece8d9",
                  fontSize: 12,
                }}
                formatter={(value) => [
                  `${formatRate(value)} pkts/sec`,
                  "Packet Rate",
                ]}
              />

              <Area
                type="monotone"
                dataKey="rate"
                stroke="#d7ff57"
                strokeWidth={2}
                fill="url(#sxPacketRateGradient)"
                dot={false}
                isAnimationActive={!reduceMotion}
                animationDuration={350}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="sx-packet-analytics__empty">
            <Activity size={24} strokeWidth={1.2} />

            <strong>
              {captureActive
                ? "COLLECTING TELEMETRY"
                : "PACKET SENSOR STANDBY"}
            </strong>

            <span>
              {captureActive
                ? "Waiting for sufficient samples to calculate packet throughput."
                : "Start packet capture to begin live packet-rate analysis."}
            </span>
          </div>
        )}
      </div>

      <div className="sx-packet-analytics__footer">
        <span>
          SOURCE // SENTINEL-X NETWORK TELEMETRY
        </span>

        <span>
          SAMPLE WINDOW // {MAX_SAMPLES} READINGS
        </span>
      </div>
    </motion.section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
}) {
  return (
    <div className="sx-packet-analytics__metric">
      <div className="sx-packet-analytics__metric-label">
        <Icon size={14} strokeWidth={1.6} />
        <span>{label}</span>
      </div>

      <div className="sx-packet-analytics__metric-value">
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
    </div>
  );
}

export default PacketRateAnalytics;
