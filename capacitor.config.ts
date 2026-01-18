import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8369cce7c2e94f93bf6ee4f5dd0e8aff',
  appName: 'Tech Repair',
  webDir: 'dist',
  server: {
    url: 'https://8369cce7-c2e9-4f93-bf6e-e4f5dd0e8aff.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  // iOS configuration
  ios: {
    scheme: 'Tech Repair',
  },
  // Electron (macOS) configuration  
  plugins: {
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
