import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  // Build timestamp injected into the bundle so admins can verify which Vercel
  // deployment they are running (surfaced in the app footer).
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registration is handled in src/registerServiceWorker.ts so update
      // detection + forced reload live in one place.
      injectRegister: false,
      workbox: { maximumFileSizeToCacheInBytes: 8000000 },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
