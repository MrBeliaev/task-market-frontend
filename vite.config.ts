import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:3001";
  const wsUrl = backendUrl.replace(/^https?/, (protocol) => (protocol === "https" ? "wss" : "ws"));
  const port = Number(env.VITE_PORT) || 5173;

  const proxy = {
    "/api": {
      target: backendUrl,
      changeOrigin: true,
    },
    "/ws": {
      target: wsUrl,
      ws: true,
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    // `server` backs `vite dev`; `preview` backs `vite preview` (serving the
    // production build locally) — both need the same proxy to reach the backend.
    server: { port, proxy },
    preview: { port, proxy },
  };
});
