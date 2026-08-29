import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rkh8888.app',
  appName: 'RKH 8888',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#FBF9F5',
      overlaysWebView: false
    }
  }
};

export default config;
