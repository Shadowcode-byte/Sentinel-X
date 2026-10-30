import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDashboardData,
  getIncidents,
  getRiskAssessments,
  getNetworkTelemetry,
  getNetworkStatus,
} from "../services/sentinelApi";


// ---------------------------------------------------------
// Sentinel-X Live SOC Configuration
// ---------------------------------------------------------

const POLL_INTERVAL_MS = 1000;


// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function normalizeSeverity(value) {
  return String(
    value || "INFO"
  ).toUpperCase();
}


function sortNewestFirst(items) {
  return [...items].sort(
    (a, b) => {
      const dateA =
        Date.parse(
          a?.created_at || ""
        ) || 0;

      const dateB =
        Date.parse(
          b?.created_at || ""
        ) || 0;

      return (
        dateB - dateA ||
        Number(b?.id || 0) -
          Number(a?.id || 0)
      );
    }
  );
}


function getLatestRiskAssessment(
  assessments
) {
  if (
    !Array.isArray(assessments) ||
    assessments.length === 0
  ) {
    return null;
  }

  return (
    sortNewestFirst(
      assessments
    )[0] || null
  );
}


// ---------------------------------------------------------
// Main Hook
// ---------------------------------------------------------

export function useSentinelData() {
  // Existing dashboard state
  const [system, setSystem] =
    useState(null);

  const [events, setEvents] =
    useState([]);

  const [health, setHealth] =
    useState(null);


  const [
    backendOnline,
    setBackendOnline,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);


  // SOC intelligence state
  const [
    incidents,
    setIncidents,
  ] = useState([]);

  const [
    riskAssessments,
    setRiskAssessments,
  ] = useState([]);

  const [
    networkTelemetry,
    setNetworkTelemetry,
  ] = useState(null);

  const [
    networkStatus,
    setNetworkStatus,
  ] = useState(null);


  const [
    moduleErrors,
    setModuleErrors,
  ] = useState({});


  // -------------------------------------------------------
  // Refresh
  // -------------------------------------------------------

  const refresh = useCallback(
    async () => {
      /*
       * Fetch modules independently so one failing API does
       * not prevent the rest of the SOC dashboard from
       * updating.
       */

      const results =
        await Promise.allSettled([
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


      // ---------------------------------------------------
      // Dashboard
      // ---------------------------------------------------

      if (
        dashboardResult.status ===
        "fulfilled"
      ) {
        const data =
          dashboardResult.value;

        setHealth(
          data.health
        );

        setSystem(
          data.system
        );

        setEvents(
          Array.isArray(
            data.events
          )
            ? data.events
            : []
        );

        setBackendOnline(
          true
        );

        setLastUpdated(
          new Date()
        );
      } else {
        console.error(
          "Sentinel-X dashboard error:",
          dashboardResult.reason
        );

        setBackendOnline(
          false
        );

        errors.dashboard =
          "Dashboard data unavailable";
      }


      // ---------------------------------------------------
      // Incidents
      // ---------------------------------------------------

      if (
        incidentsResult.status ===
        "fulfilled"
      ) {
        setIncidents(
          Array.isArray(
            incidentsResult.value
          )
            ? incidentsResult.value
            : []
        );
      } else {
        errors.incidents =
          "Incident data unavailable";

        setIncidents([]);
      }


      // ---------------------------------------------------
      // Risk intelligence
      // ---------------------------------------------------

      if (
        riskResult.status ===
        "fulfilled"
      ) {
        setRiskAssessments(
          Array.isArray(
            riskResult.value
          )
            ? riskResult.value
            : []
        );
      } else {
        errors.risk =
          "Risk data unavailable";

        setRiskAssessments([]);
      }


      // ---------------------------------------------------
      // Network telemetry
      // ---------------------------------------------------

      if (
        telemetryResult.status ===
        "fulfilled"
      ) {
        setNetworkTelemetry(
          telemetryResult.value
        );
      } else {
        errors.telemetry =
          "Network telemetry unavailable";

        setNetworkTelemetry(
          null
        );
      }


      // ---------------------------------------------------
      // Capture status
      // ---------------------------------------------------

      if (
        networkResult.status ===
        "fulfilled"
      ) {
        setNetworkStatus(
          networkResult.value
        );
      } else {
        errors.network =
          "Capture status unavailable";

        setNetworkStatus(
          null
        );
      }


      setModuleErrors(
        errors
      );

      setLoading(
        false
      );
    },
    []
  );


  // -------------------------------------------------------
  // Live polling
  //
  // Dynamic Risk v2 can change several times during one
  // scan burst. Poll every second so the Command Center can
  // visibly react while controlled Kali traffic is running.
  // -------------------------------------------------------

  useEffect(() => {
    let active = true;
    let timerId = null;


    async function poll() {
      await refresh();


      if (active) {
        timerId = setTimeout(
          poll,
          POLL_INTERVAL_MS
        );
      }
    }


    poll();


    return () => {
      active = false;

      if (timerId !== null) {
        clearTimeout(
          timerId
        );
      }
    };
  }, [refresh]);


  // -------------------------------------------------------
  // Derived SOC metrics
  // -------------------------------------------------------

  const highSeverityEvents =
    events.filter(
      (event) =>
        [
          "HIGH",
          "CRITICAL",
        ].includes(
          normalizeSeverity(
            event.severity
          )
        )
    ).length;


  const openIncidents =
    incidents.filter(
      (incident) =>
        String(
          incident.status || ""
        ).toUpperCase() !==
        "RESOLVED"
    );


  const activeThreats =
    openIncidents.filter(
      (incident) =>
        [
          "HIGH",
          "CRITICAL",
        ].includes(
          normalizeSeverity(
            incident.severity
          )
        )
    ).length;


  // -------------------------------------------------------
  // Current live risk
  //
  // Use the newest risk assessment rather than the maximum
  // historical/current score across multiple incidents.
  //
  // This allows the Command Center to follow Dynamic Risk
  // v2 updates as new traffic evidence arrives.
  // -------------------------------------------------------

  const latestRiskAssessment =
    getLatestRiskAssessment(
      riskAssessments
    );


  const currentRiskScore =
    latestRiskAssessment
      ? Number(
          latestRiskAssessment
            .risk_score
        )
      : null;


  const currentRiskLevel =
    latestRiskAssessment
      ? normalizeSeverity(
          latestRiskAssessment
            .risk_level
        )
      : null;


  const captureActive =
    networkStatus
      ?.capture_active === true;


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

    // Raw SOC data
    incidents,
    riskAssessments,
    networkTelemetry,
    networkStatus,
    moduleErrors,

    // Derived metrics
    openIncidentCount:
      openIncidents.length,

    activeThreats,

    currentRiskScore,

    currentRiskLevel,

    latestRiskAssessment,

    captureActive,
  };
}