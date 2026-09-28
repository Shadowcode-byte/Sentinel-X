const API_BASE_URL = "http://127.0.0.1:8000";

async function request(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `Sentinel-X API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export function getHealth() {
  return request("/api/v1/health");
}

export function getSystemStatus() {
  return request("/api/v1/system/status");
}

export function getSecurityEvents() {
  return request("/api/v1/events");
}

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