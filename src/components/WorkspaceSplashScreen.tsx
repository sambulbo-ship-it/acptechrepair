import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceBranding } from '@/hooks/useWorkspaceBranding';
import { Loader2 } from 'lucide-react';

interface WorkspaceSplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const WorkspaceSplashScreen = ({ onComplete, duration = 2000 }: WorkspaceSplashScreenProps) => {
  const { currentWorkspace } = useAuth();
  const { branding, loading } = useWorkspaceBranding();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [loading, duration, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: branding.secondary_color }}
    >
      {/* Logo */}
      <div className="mb-8 animate-pulse">
        {branding.logo_url ? (
          <img
            src={branding.logo_url}
            alt={currentWorkspace?.name || 'Logo'}
            className="h-32 w-32 object-contain rounded-2xl"
          />
        ) : (
          <div
            className="h-32 w-32 rounded-2xl flex items-center justify-center text-4xl font-bold text-white"
            style={{ backgroundColor: branding.primary_color }}
          >
            {currentWorkspace?.name?.charAt(0).toUpperCase() || 'R'}
          </div>
        )}
      </div>

      {/* Workspace name */}
      <h1 className="text-2xl font-bold text-white mb-4">
        {currentWorkspace?.name || 'ACP Tech Repair'}
      </h1>

      {/* Loading indicator */}
      <div className="flex items-center gap-2 text-white/70">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: branding.primary_color }} />
        <span className="text-sm">Chargement...</span>
      </div>

      {/* Branding badge */}
      <div className="absolute bottom-8 text-white/50 text-xs">
        Powered by ACP Tech Repair
      </div>
    </div>
  );
};
