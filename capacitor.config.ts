import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ke.sc.munyaka.app',
  appName: 'Munyaka School Portal',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;