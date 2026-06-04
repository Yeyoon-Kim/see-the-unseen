import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const devApiTarget = process.env.VITE_DEV_API_TARGET?.trim() || "http://127.0.0.1:4000";

export default defineConfig({
  plugins: [react],
  server: {
    port: 5173,
    proxy: { "/api": devApiTarget }
  }
});
