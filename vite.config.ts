import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

export default defineConfig(() => ({
  // Force relative base path at the root of the config so all bundled
  // assets work from any sub-path or local file URL (critical for
  // Capacitor / Android WebView file:// access).
  base: "./",
  server: {
    host: "::",
    port: 8080,
  },
  // @vitejs/plugin-react must be first so its Babel transform runs before
  // any other plugin sees the JSX (required for automatic JSX runtime).
  plugins: [react(), dyadComponentTagger()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Set target to es2015 for Android WebView compatibility
    target: 'es2015',
    // Disable module preloading to prevent cross-origin script loading blocks
    // in native local file:// contexts (Capacitor / Android WebView).
    modulePreload: false,
    // Raise the warning threshold to accommodate the heavy vendor stack used
    // for local / Capacitor builds (recharts, pdfjs, sql.js, lucide).
    chunkSizeWarningLimit: 6000,
    // No custom manualChunks — let Rollup bundle react / react-dom / react-router
    // synchronously into the main chunk so they load without async script tags
    // that break older Android WebViews.
    rollupOptions: {},
  },
}));
