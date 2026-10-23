
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

async function request(endpoint) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Sentinel-X API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// ---------------------------------------------------------
// System
// ---------------------------------------------------------

export function getHealth() {
  return request("/api/v1/health");
}

export function getSystemStatus() {
  return request("/api/v1/system/status");
}

// ---------------------------------------------------------
// Security Events
// ---------------------------------------------------------

export function getSecurityEvents() {
  return request("/api/v1/events");
}

// ---------------------------------------------------------
// Incident Operations
// ---------------------------------------------------------

export function getIncidents() {
  return request("/api/v1/incidents");
}

// ---------------------------------------------------------
// Risk Intelligence
// ---------------------------------------------------------

export function getRiskAssessments() {
  return request("/api/v1/risk");
}

// ---------------------------------------------------------
// Network Monitoring
// ---------------------------------------------------------

export function getNetworkTelemetry() {
  return request("/api/v1/network/telemetry");
}

export function getNetworkStatus() {
  return request("/api/v1/network/status");
}

// ---------------------------------------------------------
// Existing Dashboard Data
// ---------------------------------------------------------

export async function getDashboardData() {
  const [health, system, events] = await Promise.all([
    getHealth(),
    getSystemStatus(),
    getSecurityEvents(),
  ]);

  return {
    health,
    system,
    events,
  };
}
