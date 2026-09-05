import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

export default defineConfig(() => ({
  // Use relative base path so all bundled assets work from any sub-path or
  // local file URL (critical for Capacitor / Android WebView file:// access).
  base: "./",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Raise the warning threshold to accommodate the heavy vendor stack used
    // for local / Capacitor builds (recharts, pdfjs, sql.js, lucide).
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Charting libs (recharts + d3 ecosystem)
            if (
              id.includes("recharts") ||
              id.includes("d3-") ||
              id.includes("/d3/")
            ) {
              return "vendor-charts";
            }
            // Icon set
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // React core
            if (
              id.includes("react-router") ||
              id.includes("react-dom") ||
              id.includes("/react/")
            ) {
              return "vendor-core";
            }
            // PDF parsing/processing
            if (id.includes("pdfjs-dist")) {
              return "vendor-pdf";
            }
            // Capacitor (mobile bridge)
            if (id.includes("@capacitor")) {
              return "vendor-capacitor";
            }
            // SQL.js (offline DB)
            if (id.includes("sql.js") || id.includes("sqljs")) {
              return "vendor-sql";
            }
            // Everything else from node_modules
            return "vendor-libs";
          }
        },
      },
    },
  },
}));