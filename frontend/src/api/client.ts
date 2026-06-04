import axios from "axios";

const authSessionStorageKey = "class-manager-auth-session";

function apiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (!configuredUrl) return "/api";

  return configuredUrl.replace(/\/$/, "");
}

export const api = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 30_000
});

api.interceptors.request.use((config) => {
  try {
    if (typeof window.localStorage === "undefined") return config;
    const rawSession = window.localStorage.getItem(authSessionStorageKey);
    const accessToken = rawSession ? (JSON.parse(rawSession) as { accessToken?: string }).accessToken : undefined;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch {
    // Requests should still work in local mode if auth storage is unavailable.
  }

  return config;
});

export function calendarUrl(path: string) {
  const base = apiBaseUrl();
  return `${base}${path}`;
}
