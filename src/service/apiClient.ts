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
  (error) => {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      console.error("Network Error - Backend might be down or unreachable");
      console.error("Attempted URL:", error.config?.url);
      console.error("Base URL:", baseURL);
    } else if (error.response?.status === 401) {
      window.location.href = "/login";
    } else if (error.response) {
      // Helpful debugging for 401/403/500 without needing to dig into Network tab.
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
