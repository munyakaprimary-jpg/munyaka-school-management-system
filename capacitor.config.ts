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
    /**
     * Use https:// scheme for the local WebView origin so that:
     *   1. localStorage, IndexedDB, Service Workers, and other secure-context
     *      APIs work as on the web (they require a "secure context");
     *   2. cross-origin requests for local assets (index.html, /assets/*, etc.)
     *      resolve without CORS errors that some plugins trigger under http://;
     *   3. the auth-gate and error-boundary initial paint — which depend on
     *      synchronous storage reads — never race with a scheme-fallback.
     *
     * `cleartext: true` above is what permits the on-device LAN backend
     * (which is plain http://) to still be reached for sync, while the
     * local app shell itself serves from an https:// origin.
     */
    androidScheme: 'https'
  }
};

export default config;