import axios from "axios";

// Use relative URL when in dev (goes through Vite proxy to avoid CORS)
// Use full URL in production
const baseURL = import.meta.env.VITE_APP_BASE_URL
  ? import.meta.env.VITE_APP_BASE_URL || "https://api.picominds.com/api"
  : "/api";

const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

type RetryableRequest = {
  _retry?: boolean;
  headers?: Record<string, string>;
};

let isRefreshing = false;
let refreshWaitQueue: Array<(token: string | null) => void> = [];

const flushRefreshQueue = (token: string | null) => {
  refreshWaitQueue.forEach((cb) => cb(token));
  refreshWaitQueue = [];
};

// Add interceptor to include token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    const status = error.response?.status as number | undefined;

    // Try to recover once by refreshing access token.
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(error.config?.url || "").includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      const currentRefreshToken = localStorage.getItem("refreshToken");
      if (!currentRefreshToken) {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshWaitQueue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `Bearer ${token}`,
            };
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken: currentRefreshToken,
        });
        const newAccessToken = refreshResponse.data?.accessToken as
          | string
          | undefined;

        if (!newAccessToken) {
          throw new Error("Missing new access token from refresh endpoint");
        }

        localStorage.setItem("accessToken", newAccessToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        flushRefreshQueue(newAccessToken);
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newAccessToken}`,
        };
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        flushRefreshQueue(null);
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      console.error("Network Error - Backend might be down or unreachable");
      console.error("Attempted URL:", error.config?.url);
      console.error("Base URL:", baseURL);
    }
    // else if (error.response?.status === 401) {
    //   window.location.href = "/auth/login";
    // }
    else if (error.response) {
      // Helpful debugging for 401/403/500
      // thout needing to dig into Network tab.
      console.error("API Error:", {
        method: error.config?.method,
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return Promise.reject(error);
  },
);

export { apiClient };
