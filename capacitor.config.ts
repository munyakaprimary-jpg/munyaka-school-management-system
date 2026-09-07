import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ke.sc.munyaka.app',
  appName: 'Munyaka School Portal',
  webDir: 'dist',
  // Intentionally NO `server` property. Capacitor will serve the bundled
  // webDir directly from the device, with no local dev-server URL, no
  // `cleartext` override, and no `androidScheme` override.
};

export default config;
