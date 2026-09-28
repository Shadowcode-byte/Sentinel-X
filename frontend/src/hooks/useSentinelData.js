import { useCallback, useEffect, useState } from "react";
import { getDashboardData } from "../services/sentinelApi";

export function useSentinelData() {
  const [system, setSystem] = useState(null);
  const [events, setEvents] = useState([]);
  const [health, setHealth] = useState(null);

  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getDashboardData();

      setHealth(data.health);
      setSystem(data.system);
      setEvents(data.events);

      setBackendOnline(true);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Sentinel-X telemetry error:", error);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, 5000);

    return () => clearInterval(interval);
  }, [refresh]);

  const highSeverityEvents = events.filter(
    (event) =>
      event.severity === "HIGH" ||
      event.severity === "CRITICAL"
  ).length;

  return {
    system,
    events,
    health,
    loading,
    backendOnline,
    lastUpdated,
    highSeverityEvents,
    refresh,
  };
}