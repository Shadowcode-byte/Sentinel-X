
import { useCallback, useEffect, useState } from "react";

import {
  getDashboardData,
  getIncidents,
  getRiskAssessments,
  getNetworkTelemetry,
  getNetworkStatus,
} from "../services/sentinelApi";

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function normalizeSeverity(value) {
  return String(value || "INFO").toUpperCase();
}

function getLatestRiskByIncident(assessments) {
  const latest = new Map();

  const sorted = [...assessments].sort((a, b) => {
    const dateA = Date.parse(a.created_at || "") || 0;
    const dateB = Date.parse(b.created_at || "") || 0;

    return dateB - dateA || (b.id || 0) - (a.id || 0);
  });

  for (const risk of sorted) {
    if (
      risk.incident_id != null &&
      !latest.has(risk.incident_id)
    ) {
      latest.set(risk.incident_id, risk);
    }
  }

  return [...latest.values()];
}

// ---------------------------------------------------------
// Main Hook
// ---------------------------------------------------------

export function useSentinelData() {
  // Existing dashboard state
  const [system, setSystem] = useState(null);
  const [events, setEvents] = useState([]);
  const [health, setHealth] = useState(null);

  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // New SOC intelligence state
  const [incidents, setIncidents] = useState([]);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [networkTelemetry, setNetworkTelemetry] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(null);

  const [moduleErrors, setModuleErrors] = useState({});

  // -------------------------------------------------------
  // Refresh
  // -------------------------------------------------------

  const refresh = useCallback(async () => {
    // Fetch each module independently.
    const results = await Promise.allSettled([
      getDashboardData(),
      getIncidents(),
      getRiskAssessments(),
      getNetworkTelemetry(),
      getNetworkStatus(),
    ]);

    const [
      dashboardResult,
      incidentsResult,
      riskResult,
      telemetryResult,
      networkResult,
    ] = results;

    const errors = {};

    // Existing dashboard
    if (dashboardResult.status === "fulfilled") {
      const data = dashboardResult.value;

      setHealth(data.health);
      setSystem(data.system);
      setEvents(
        Array.isArray(data.events) ? data.events : []
      );

      setBackendOnline(true);
      setLastUpdated(new Date());
    } else {
      console.error(
        "Sentinel-X dashboard error:",
        dashboardResult.reason
      );

      setBackendOnline(false);
      errors.dashboard = "Dashboard data unavailable";
    }

    // Incidents
    if (incidentsResult.status === "fulfilled") {
      setIncidents(
        Array.isArray(incidentsResult.value)
          ? incidentsResult.value
          : []
      );
    } else {
      errors.incidents = "Incident data unavailable";
      setIncidents([]);
    }

    // Risk intelligence
    if (riskResult.status === "fulfilled") {
      setRiskAssessments(
        Array.isArray(riskResult.value)
          ? riskResult.value
          : []
      );
    } else {
      errors.risk = "Risk data unavailable";
      setRiskAssessments([]);
    }

    // Network telemetry
    if (telemetryResult.status === "fulfilled") {
      setNetworkTelemetry(telemetryResult.value);
    } else {
      errors.telemetry = "Network telemetry unavailable";
      setNetworkTelemetry(null);
    }

    // Actual capture status
    if (networkResult.status === "fulfilled") {
      setNetworkStatus(networkResult.value);
    } else {
      errors.network = "Capture status unavailable";
      setNetworkStatus(null);
    }

    setModuleErrors(errors);
    setLoading(false);
  }, []);

  // -------------------------------------------------------
  // Poll every five seconds
  // -------------------------------------------------------

  useEffect(() => {
    let active = true;
    let timerId;

    async function poll() {
      await refresh();

      if (active) {
        timerId = setTimeout(poll, 5000);
      }
    }

    poll();

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [refresh]);

  // -------------------------------------------------------
  // Derived SOC metrics
  // -------------------------------------------------------

  const highSeverityEvents = events.filter(
    (event) =>
      ["HIGH", "CRITICAL"].includes(
        normalizeSeverity(event.severity)
      )
  ).length;

  const openIncidents = incidents.filter(
    (incident) =>
      String(incident.status || "").toUpperCase() !==
      "RESOLVED"
  );

  const activeThreats = openIncidents.filter(
    (incident) =>
      ["HIGH", "CRITICAL"].includes(
        normalizeSeverity(incident.severity)
      )
  ).length;

  const latestRisks = getLatestRiskByIncident(
    riskAssessments
  );

  const currentRiskScore =
    latestRisks.length > 0
      ? Math.max(
          ...latestRisks.map(
            (risk) => Number(risk.risk_score) || 0
          )
        )
      : null;

  const captureActive =
    networkStatus?.capture_active === true;

  return {
    // Original fields
    system,
    events,
    health,
    loading,
    backendOnline,
    lastUpdated,
    highSeverityEvents,
    refresh,

    // New raw data
    incidents,
    riskAssessments,
    networkTelemetry,
    networkStatus,
    moduleErrors,

    // New derived metrics
    openIncidentCount: openIncidents.length,
    activeThreats,
    currentRiskScore,
    captureActive,
  };
}
