import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acptechrepair.app',
  appName: 'ACP Tech Repair',
  webDir: 'dist',
  // No server.url = native builds use local dist/ bundle (production-ready)
  // iOS configuration
  ios: {
    scheme: 'ACPTechRepair',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  // Android configuration
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0c0f',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      spinnerColor: '#3b82f6',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0c0f',
    },
  },
};

export default config;
