import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.techrepair',
  appName: 'Tech Repair',
  webDir: 'dist',
  server: {
    url: 'https://8369cce7-c2e9-4f93-bf6e-e4f5dd0e8aff.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  // iOS configuration
  ios: {
    scheme: 'TechRepair',
    contentInset: 'automatic',
  },
  // Android configuration
  android: {
    allowMixedContent: true,
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f1419',
      showSpinner: false,
    },
  },
};

export default config;
