import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    proxy: {
      "/api": {
        target: "https://api.picominds.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path, // Keep the /api prefix in the path
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Forward Authorization header if present
            const token = req.headers.authorization;
            if (token) {
              proxyReq.setHeader("Authorization", token);
            }
            // Log the proxied request for debugging
            console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
          proxy.on("error", (err) => {
            console.error("[Proxy Error]", err);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              `[Proxy Response] ${req.url} -> ${proxyRes.statusCode}`
            );
          });
        },
      },
    },
  },
});
