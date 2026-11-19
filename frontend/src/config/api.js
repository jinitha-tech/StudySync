const rawApiUrl = (import.meta.env.VITE_API_URL || "").trim();

// Fall back to live Render backend if unset or if the placeholder is present
const resolvedApiUrl =
  !rawApiUrl || rawApiUrl.includes("your-backend.onrender.com")
    ? (import.meta.env.DEV ? "http://localhost:5050" : "https://studysync-aw5h.onrender.com")
    : rawApiUrl;

export const API_BASE_URL = resolvedApiUrl.replace(/\/+$/, "");

export const AUTH_API_URL = `${API_BASE_URL}/api/auth`;
export const PLANNER_API_URL = `${API_BASE_URL}/api/planner`;
export const NOTIFICATIONS_API_URL = `${API_BASE_URL}/api/notifications`;
export const UPLOADS_API_URL = `${API_BASE_URL}/api/uploads`;

export function getAuthHeaders(token, extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  const authToken = token || localStorage.getItem("studysync_token");
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return headers;
}
