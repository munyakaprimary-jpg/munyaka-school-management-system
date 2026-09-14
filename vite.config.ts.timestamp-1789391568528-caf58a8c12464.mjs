// vite.config.ts
import { defineConfig } from "file:///C:/Users/munya/dyad-apps/munyaka-school-management-system/node_modules/.pnpm/vite@4.5.5_@types+node@20.10.0_lightningcss@1.32.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/munya/dyad-apps/munyaka-school-management-system/node_modules/.pnpm/@vitejs+plugin-react@4.2.1__e0e9ae27f0e7d3f7ca1adfa0ec50a01f/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import dyadComponentTagger from "file:///C:/Users/munya/dyad-apps/munyaka-school-management-system/node_modules/.pnpm/@dyad-sh+react-vite-compone_4ba8c1756cca0ca3c5e2739bec5fc029/node_modules/@dyad-sh/react-vite-component-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\munya\\dyad-apps\\munyaka-school-management-system";
var vite_config_default = defineConfig(() => ({
  // Force relative base path at the root of the config so all bundled
  // assets work from any sub-path or local file URL (critical for
  // Capacitor / Android WebView file:// access).
  base: "./",
  server: {
    host: "::",
    port: 8080
  },
  // @vitejs/plugin-react must be first so its Babel transform runs before
  // any other plugin sees the JSX (required for automatic JSX runtime).
  plugins: [react(), dyadComponentTagger()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Set target to es2015 for Android WebView compatibility
    target: "es2015",
    // Disable module preloading to prevent cross-origin script loading blocks
    // in native local file:// contexts (Capacitor / Android WebView).
    modulePreload: false,
    // Raise the warning threshold to accommodate the heavy vendor stack used
    // for local / Capacitor builds (recharts, pdfjs, sql.js, lucide).
    chunkSizeWarningLimit: 6e3,
    // No custom manualChunks — let Rollup bundle react / react-dom / react-router
    // synchronously into the main chunk so they load without async script tags
    // that break older Android WebViews.
    rollupOptions: {}
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtdW55YVxcXFxkeWFkLWFwcHNcXFxcbXVueWFrYS1zY2hvb2wtbWFuYWdlbWVudC1zeXN0ZW1cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXG11bnlhXFxcXGR5YWQtYXBwc1xcXFxtdW55YWthLXNjaG9vbC1tYW5hZ2VtZW50LXN5c3RlbVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvbXVueWEvZHlhZC1hcHBzL211bnlha2Etc2Nob29sLW1hbmFnZW1lbnQtc3lzdGVtL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZHlhZENvbXBvbmVudFRhZ2dlciBmcm9tICdAZHlhZC1zaC9yZWFjdC12aXRlLWNvbXBvbmVudC10YWdnZXInO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKCkgPT4gKHtcbiAgLy8gRm9yY2UgcmVsYXRpdmUgYmFzZSBwYXRoIGF0IHRoZSByb290IG9mIHRoZSBjb25maWcgc28gYWxsIGJ1bmRsZWRcbiAgLy8gYXNzZXRzIHdvcmsgZnJvbSBhbnkgc3ViLXBhdGggb3IgbG9jYWwgZmlsZSBVUkwgKGNyaXRpY2FsIGZvclxuICAvLyBDYXBhY2l0b3IgLyBBbmRyb2lkIFdlYlZpZXcgZmlsZTovLyBhY2Nlc3MpLlxuICBiYXNlOiBcIi4vXCIsXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICB9LFxuICAvLyBAdml0ZWpzL3BsdWdpbi1yZWFjdCBtdXN0IGJlIGZpcnN0IHNvIGl0cyBCYWJlbCB0cmFuc2Zvcm0gcnVucyBiZWZvcmVcbiAgLy8gYW55IG90aGVyIHBsdWdpbiBzZWVzIHRoZSBKU1ggKHJlcXVpcmVkIGZvciBhdXRvbWF0aWMgSlNYIHJ1bnRpbWUpLlxuICBwbHVnaW5zOiBbcmVhY3QoKSwgZHlhZENvbXBvbmVudFRhZ2dlcigpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIC8vIFNldCB0YXJnZXQgdG8gZXMyMDE1IGZvciBBbmRyb2lkIFdlYlZpZXcgY29tcGF0aWJpbGl0eVxuICAgIHRhcmdldDogJ2VzMjAxNScsXG4gICAgLy8gRGlzYWJsZSBtb2R1bGUgcHJlbG9hZGluZyB0byBwcmV2ZW50IGNyb3NzLW9yaWdpbiBzY3JpcHQgbG9hZGluZyBibG9ja3NcbiAgICAvLyBpbiBuYXRpdmUgbG9jYWwgZmlsZTovLyBjb250ZXh0cyAoQ2FwYWNpdG9yIC8gQW5kcm9pZCBXZWJWaWV3KS5cbiAgICBtb2R1bGVQcmVsb2FkOiBmYWxzZSxcbiAgICAvLyBSYWlzZSB0aGUgd2FybmluZyB0aHJlc2hvbGQgdG8gYWNjb21tb2RhdGUgdGhlIGhlYXZ5IHZlbmRvciBzdGFjayB1c2VkXG4gICAgLy8gZm9yIGxvY2FsIC8gQ2FwYWNpdG9yIGJ1aWxkcyAocmVjaGFydHMsIHBkZmpzLCBzcWwuanMsIGx1Y2lkZSkuXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA2MDAwLFxuICAgIC8vIE5vIGN1c3RvbSBtYW51YWxDaHVua3MgXHUyMDE0IGxldCBSb2xsdXAgYnVuZGxlIHJlYWN0IC8gcmVhY3QtZG9tIC8gcmVhY3Qtcm91dGVyXG4gICAgLy8gc3luY2hyb25vdXNseSBpbnRvIHRoZSBtYWluIGNodW5rIHNvIHRoZXkgbG9hZCB3aXRob3V0IGFzeW5jIHNjcmlwdCB0YWdzXG4gICAgLy8gdGhhdCBicmVhayBvbGRlciBBbmRyb2lkIFdlYlZpZXdzLlxuICAgIHJvbGx1cE9wdGlvbnM6IHt9LFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1VyxTQUFTLG9CQUFvQjtBQUNwWSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8seUJBQXlCO0FBSGhDLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxPQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJakMsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQTtBQUFBO0FBQUEsRUFHQSxTQUFTLENBQUMsTUFBTSxHQUFHLG9CQUFvQixDQUFDO0FBQUEsRUFDeEMsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFTCxRQUFRO0FBQUE7QUFBQTtBQUFBLElBR1IsZUFBZTtBQUFBO0FBQUE7QUFBQSxJQUdmLHVCQUF1QjtBQUFBO0FBQUE7QUFBQTtBQUFBLElBSXZCLGVBQWUsQ0FBQztBQUFBLEVBQ2xCO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
