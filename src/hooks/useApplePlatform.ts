import { useState, useEffect } from 'react';

interface ApplePlatformInfo {
  isAppleDevice: boolean;
  isIOS: boolean;
  isIPadOS: boolean;
  isMacOS: boolean;
  osVersion: number | null;
  supportsLiquidGlass: boolean;
  isDesktop: boolean;
  isMobile: boolean;
}

const LIQUID_GLASS_MIN_VERSION = 26;

export function useApplePlatform(): ApplePlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<ApplePlatformInfo>({
    isAppleDevice: false,
    isIOS: false,
    isIPadOS: false,
    isMacOS: false,
    osVersion: null,
    supportsLiquidGlass: false,
    isDesktop: false,
    isMobile: false,
  });

  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform || '';
      
      // Detect iOS (iPhone)
      const isIPhone = /iPhone/.test(userAgent);
      
      // Detect iPadOS - iPads with iOS 13+ report as Mac in userAgent
      // We need to check for touch support + Mac platform
      const isIPad = /iPad/.test(userAgent) || 
        (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Detect macOS (not iPad masquerading as Mac)
      const isMac = /Mac/.test(platform) && !isIPad;
      
      // Detect if it's a true desktop vs mobile
      const isMobileDevice = isIPhone || isIPad || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isDesktopDevice = !isMobileDevice;
      
      // Extract OS version
      let osVersion: number | null = null;
      
      if (isIPhone || isIPad) {
        // iOS/iPadOS version: "CPU iPhone OS 17_0" or "CPU OS 17_0"
        const iosMatch = userAgent.match(/OS (\d+)[_\.](\d+)/);
        if (iosMatch) {
          osVersion = parseInt(iosMatch[1], 10);
        }
      } else if (isMac) {
        // macOS version: "Mac OS X 14_0" or "Mac OS X 10_15_7"
        const macMatch = userAgent.match(/Mac OS X (\d+)[_\.](\d+)/);
        if (macMatch) {
          const majorVersion = parseInt(macMatch[1], 10);
          // macOS 10.x uses minor version, macOS 11+ uses major version
          osVersion = majorVersion === 10 ? parseInt(macMatch[2], 10) + 10 : majorVersion;
        }
      }
      
      const isApple = isIPhone || isIPad || isMac;
      
      // Liquid Glass is available on iOS 26, iPadOS 26, macOS 26+
      const supportsLiquidGlass = isApple && osVersion !== null && osVersion >= LIQUID_GLASS_MIN_VERSION;
      
      setPlatformInfo({
        isAppleDevice: isApple,
        isIOS: isIPhone,
        isIPadOS: isIPad,
        isMacOS: isMac,
        osVersion,
        supportsLiquidGlass,
        isDesktop: isDesktopDevice,
        isMobile: isMobileDevice,
      });
    };

    detectPlatform();
    
    // Re-detect on orientation change (might affect iPad detection)
    window.addEventListener('orientationchange', detectPlatform);
    return () => window.removeEventListener('orientationchange', detectPlatform);
  }, []);

  return platformInfo;
}

// CSS class helper for conditional Liquid Glass styling
export function getLiquidGlassClass(supportsLiquidGlass: boolean, baseClass: string): string {
  return supportsLiquidGlass ? `${baseClass} liquid-glass` : baseClass;
}
