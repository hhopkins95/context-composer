import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({}), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    port: process.env.FRONTEND_PORT || 9001,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.BACKEND_PORT || 9000}`,
        changeOrigin: true,
      },
    },
  },
});
