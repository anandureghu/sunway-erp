import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Default to production API for the smoothest out-of-the-box experience.
  // Override anytime via env:
  // - Windows PowerShell: $env:VITE_PROXY_TARGET="http://localhost:8080"; npm run dev
  // - bash/zsh: VITE_PROXY_TARGET="http://localhost:8080" npm run dev
  const proxyTarget =
    env.VITE_PROXY_TARGET ||
    process.env.VITE_PROXY_TARGET ||
    "https://api.picominds.com";
  const proxyOrigin = new URL(proxyTarget).origin;
  const devPort = Number(env.VITE_PORT || 5173);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "localhost",
      port: devPort,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: proxyTarget.startsWith("https://"),
          rewrite: (path) => path, // Keep the /api prefix in the path
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              // Some backends validate Origin even for proxied requests.
              // Make it match the proxy target origin.
              proxyReq.setHeader("Origin", proxyOrigin);
              // Some backends validate Host as well.
              proxyReq.setHeader("Host", new URL(proxyTarget).host);
              proxyReq.removeHeader("referer");
              proxyReq.removeHeader("Referer");

              // Forward Authorization header if present
              const token = req.headers.authorization;
              if (token) proxyReq.setHeader("Authorization", token);
            });
          },
        },
      },
    },
  };
});
