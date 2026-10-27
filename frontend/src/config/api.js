const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5050"
).replace(/\/+$/, "");

export const PLANNER_API_URL = `${API_BASE_URL}/api/planner`;