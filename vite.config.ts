import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 0,
    hmr: { overlay: false },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) return "vendor-react";
            if (id.includes("@tanstack")) return "vendor-query";
            if (id.includes("@radix-ui")) return "vendor-ui";
            if (id.includes("recharts")) return "vendor-charts";
            if (id.includes("date-fns") || id.includes("clsx") || id.includes("tailwind") || id.includes("lucide")) return "vendor-utils";
          }
        },
      },
    },
  },
}));
