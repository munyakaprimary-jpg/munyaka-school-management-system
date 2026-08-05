import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ke.sc.munyaka.app',
  appName: 'Munyaka School Portal',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Http: {
      enabled: true
    },
    Network: {
      enabled: true
    },
    SQLite: {
      enabled: true
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
      androidDatabaseLocation: 'default'
    }
  }
};

export default config;