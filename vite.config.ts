import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

export default defineConfig(() => ({
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
    rollupOptions: {
      output: {
        manualChunks: {
          // React core packages
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Lucide icons library
          "vendor-icons": ["lucide-react"],
          // PDF parsing and processing libraries
          "vendor-pdf": ["pdfjs-dist"],
        },
      },
    },
  },
}));