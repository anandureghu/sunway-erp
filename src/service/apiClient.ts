import axios from "axios";

const baseURL = import.meta.env.VITE_APP_BASE_URL || "http://localhost:8080/api";
console.log("API Base URL:", baseURL);

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

export { apiClient };
