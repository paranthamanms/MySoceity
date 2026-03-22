import type { CapacitorConfig } from '@capacitor/cli';

// Set CAPACITOR_LIVE_RELOAD=1 in env to enable live-reload mode.
// The emulator uses 10.0.2.2 to reach the host machine localhost.
const isLiveReload = process.env['CAPACITOR_LIVE_RELOAD'] === '1';

const config: CapacitorConfig = {
  appId: 'com.nammasociety.app',
  appName: 'NammaSociety',
  webDir: 'www',
  server: isLiveReload
    ? { url: 'http://10.0.2.2:4200', cleartext: true }
    : { androidScheme: 'http' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a237e',
      androidSplashResourceName: 'splash',
      showSpinner: false
    }
  }
};

export default config;
