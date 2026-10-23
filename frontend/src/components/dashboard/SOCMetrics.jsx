
import { motion } from "motion/react";

import {
  Activity,
  AlertTriangle,
  Gauge,
  ShieldAlert,
} from "lucide-react";

const metrics = [
  {
    key: "activeThreats",
    label: "ACTIVE THREATS",
    description: "Unresolved high-severity incidents",
    icon: ShieldAlert,
    tone: "danger",
  },
  {
    key: "openIncidentCount",
    label: "OPEN INCIDENTS",
    description: "Incidents awaiting resolution",
    icon: AlertTriangle,
    tone: "warning",
  },
  {
    key: "currentRiskScore",
    label: "RISK INDEX",
    description: "Highest current incident risk",
    icon: Gauge,
    tone: "risk",
  },
  {
    key: "captureActive",
    label: "PACKET SENSOR",
    description: "Live network capture status",
    icon: Activity,
    tone: "success",
  },
];

function SOCMetrics({
  activeThreats = 0,
  openIncidentCount = 0,
  currentRiskScore = null,
  captureActive = false,
  moduleErrors = {},
}) {
  const values = {
    activeThreats,
    openIncidentCount,
    currentRiskScore,
    captureActive,
  };

  function formatValue(key) {
    if (key === "captureActive") {
      if (moduleErrors.network) {
        return "UNKNOWN";
      }

      return captureActive ? "CAPTURING" : "STANDBY";
    }

    if (key === "currentRiskScore") {
      if (moduleErrors.risk || currentRiskScore == null) {
        return "--";
      }

      return `${Number(currentRiskScore).toFixed(0)}/100`;
    }

    if (
      (key === "activeThreats" ||
        key === "openIncidentCount") &&
      moduleErrors.incidents
    ) {
      return "--";
    }

    return values[key] ?? 0;
  }

  function getTone(metric) {
    if (metric.key === "captureActive") {
      return captureActive && !moduleErrors.network
        ? "success"
        : "neutral";
    }

    if (metric.key === "activeThreats") {
      return activeThreats > 0 ? "danger" : "success";
    }

    if (metric.key === "openIncidentCount") {
      return openIncidentCount > 0 ? "warning" : "success";
    }

    if (metric.key === "currentRiskScore") {
      if (currentRiskScore == null) return "neutral";
      if (currentRiskScore >= 80) return "danger";
      if (currentRiskScore >= 50) return "warning";
      return "success";
    }

    return metric.tone;
  }

  return (
    <section
      className="sx-soc-metrics"
      aria-label="Security operations metrics"
    >
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const tone = getTone(metric);

        return (
          <motion.article
            key={metric.key}
            className={`sx-soc-metric sx-soc-metric--${tone}`}
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: index * 0.07,
              ease: "easeOut",
            }}
            whileHover={{
              y: -3,
              transition: {
                duration: 0.2,
              },
            }}
          >
            <div className="sx-soc-metric__top">
              <span className="sx-soc-metric__label">
                {metric.label}
              </span>

              <div className="sx-soc-metric__icon">
                <Icon size={18} strokeWidth={1.8} />
              </div>
            </div>

            <div className="sx-soc-metric__value">
              {formatValue(metric.key)}
            </div>

            <div className="sx-soc-metric__bottom">
              <span className="sx-soc-metric__indicator" />

              <span className="sx-soc-metric__description">
                {metric.description}
              </span>
            </div>

            <div className="sx-soc-metric__accent" />
          </motion.article>
        );
      })}
    </section>
  );
}

export default SOCMetrics;
