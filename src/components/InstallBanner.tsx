import { useState, useEffect, forwardRef } from 'react';
import { X, Download, Smartphone, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const BANNER_DISMISSED_KEY = 'pwa_banner_dismissed';
const BANNER_DISMISSED_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const InstallBanner = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if banner was dismissed recently
    const dismissedData = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedData) {
      const { timestamp } = JSON.parse(dismissedData);
      if (Date.now() - timestamp < BANNER_DISMISSED_EXPIRY) {
        return;
      }
    }

    // Detect iOS
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Show banner after a short delay for iOS
    if (isIOSDevice) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setIsVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      navigate('/install');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(
      BANNER_DISMISSED_KEY,
      JSON.stringify({ timestamp: Date.now() })
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            {isIOS ? (
              <Apple className="w-5 h-5 text-primary" />
            ) : (
              <Smartphone className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm">
              Installer ACP Tech Repair
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS 
                ? "Ajoutez l'app à votre écran d'accueil"
                : "Accédez rapidement depuis votre écran d'accueil"
              }
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall} className="h-8 text-xs">
                <Download className="w-3 h-3 mr-1" />
                {isIOS ? "Comment faire ?" : "Installer"}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="h-8 text-xs text-muted-foreground"
              >
                Plus tard
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

InstallBanner.displayName = 'InstallBanner';
