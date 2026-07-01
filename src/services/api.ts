// services/api.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import logger from "@/utils/logger";

// ==================== CONFIGURACIÓN BASE ====================

const BASE_URL = import.meta.env.VITE_API_URL;
if (!BASE_URL) {
  throw new Error(
    "[Rentus] VITE_API_URL is not defined. Check your .env file."
  );
}

const api = axios.create({
  baseURL: BASE_URL,
  // withCredentials is OFF — JWT lives in localStorage/sessionStorage and is
  // attached via the request interceptor's Authorization header.
  // Enabling it causes HTTP 431 when cookies grow too large.
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000, // 10 seconds default (use custom config for uploads)
});

// ==================== HELPERS ====================

/**
 * Retrieve token from storage (localStorage or sessionStorage).
 */
export const getToken = (): string | null =>
  localStorage.getItem("auth_token") ||
  sessionStorage.getItem("auth_token");

/**
 * Persist token according to the "remember me" preference.
 */
export const saveToken = (token: string, remember = false): void => {
  if (remember) {
    localStorage.setItem("auth_token", token);
    sessionStorage.removeItem("auth_token");
  } else {
    sessionStorage.setItem("auth_token", token);
    localStorage.removeItem("auth_token");
  }
};

/**
 * Remove all auth-related items from both storages.
 */
export const clearStorage = (): void => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  localStorage.removeItem("redirectAfterLogin");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("user");
};

// ==================== REQUEST INTERCEPTOR ====================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    logger.error("Request error:", error.message);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) return Promise.reject(error);

    // ── 401 Token Expired ──────────────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop on the refresh itself
      if (originalRequest.url?.includes("/auth/refresh")) {
        clearStorage();
        logger.warn("Refresh token expired — session cleared.");
        return Promise.reject(error);
      }

      // No token at all → public route, just reject
      if (!getToken()) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        logger.log("Attempting token refresh...");
        const response = await api.post("/auth/refresh");

        if (response.data.success && response.data.token) {
          const newToken: string = response.data.token;
          const isRemembered = !!localStorage.getItem("auth_token");
          saveToken(newToken, isRemembered);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          processQueue(null, newToken);
          logger.log("Token refreshed successfully.");
          return api(originalRequest);
        }

        throw new Error("Token refresh failed — no token in response.");
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearStorage();
        logger.warn("Session cleared after failed token refresh.");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Other HTTP Errors (log in DEV only, no sensitive data) ────────────
    if (error.response?.status === 403) {
      logger.warn("403 Forbidden");
    } else if (error.response?.status === 422) {
      logger.warn("422 Validation Error");
    } else if (error.response?.status === 429) {
      logger.warn("429 Too Many Requests");
    } else if (error.response?.status === 500) {
      logger.error("500 Internal Server Error");
    } else if (error.code === "ECONNABORTED") {
      logger.error("Request timeout");
    } else if (!error.response) {
      logger.error("Network error — server unreachable");
    }

    return Promise.reject(error);
  }
);

// ── Google Maps client (no auth header needed) ────────────────────────────
const googleApi = axios.create({
  baseURL: "https://maps.googleapis.com/maps/api",
  timeout: 10000,
});

export { api, googleApi };
export default api;