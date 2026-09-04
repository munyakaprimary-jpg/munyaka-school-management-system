import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ke.sc.munyaka.app',
  appName: 'Munyaka School Portal',
  webDir: 'dist',
  server: {
    /**
     * Allow unencrypted http:// traffic to LAN servers (e.g. http://10.0.2.2:5000
     * for the emulator and http://192.168.x.x:5000 for devices on the same
     * network). Required because the on-device LAN backend only serves HTTP.
     */
    cleartext: true,
    /** Use http:// scheme so http://localhost and http://10.0.2.2 resolve
     * without TLS — pairs with cleartext: true. */
    androidScheme: 'http'
  }
};

export default config;