import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Check, LogOut, Building2, Shield, Bell, Palette, Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user, currentWorkspace, signOut, isWorkspaceAdmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (err) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t('settings')} />
      
      <div className="p-4 space-y-4">
        {/* Current User & Workspace */}
        <div className="ios-card overflow-hidden">
          <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
            Compte
          </h3>
          
          <div className="px-4 py-4 border-b border-border">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-foreground truncate">{user?.email || '-'}</p>
          </div>
          
          {currentWorkspace && (
            <button
              onClick={() => navigate('/workspaces')}
              className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
            >
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs text-muted-foreground">Espace actuel</p>
                <p className="text-sm font-medium text-foreground truncate">{currentWorkspace.name}</p>
              </div>
              {isWorkspaceAdmin && (
                <Shield className="w-4 h-4 text-primary" />
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Quick settings links */}
        <div className="ios-card overflow-hidden">
          <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
            Paramètres rapides
          </h3>
          
          <button
            onClick={() => navigate('/notification-settings')}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border"
          >
            <Bell className="w-5 h-5 text-primary" />
            <span className="flex-1 text-left text-foreground">Notifications</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {isWorkspaceAdmin && (
            <>
              <button
                onClick={() => navigate('/workspace-branding')}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border"
              >
                <Palette className="w-5 h-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Personnalisation</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <button
                onClick={() => navigate('/workspace-settings')}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
              >
                <SettingsIcon className="w-5 h-5 text-primary" />
                <span className="flex-1 text-left text-foreground">Paramètres espace</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Language */}
        <div className="ios-card overflow-hidden">
          <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
            {t('language')}
          </h3>
          
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              'w-full flex items-center justify-between px-4 py-4 touch-target border-b border-border transition-colors',
              language === 'en' && 'bg-primary/5'
            )}
          >
            <span className="text-foreground">{t('english')}</span>
            {language === 'en' && <Check className="w-5 h-5 text-primary" />}
          </button>
          
          <button
            onClick={() => setLanguage('fr')}
            className={cn(
              'w-full flex items-center justify-between px-4 py-4 touch-target transition-colors',
              language === 'fr' && 'bg-primary/5'
            )}
          >
            <span className="text-foreground">{t('french')}</span>
            {language === 'fr' && <Check className="w-5 h-5 text-primary" />}
          </button>
        </div>

        {/* Sign Out */}
        <Button 
          variant="destructive" 
          className="w-full h-12 gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </Button>

        {/* App Info */}
        <div className="ios-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Tech Repair
          </h3>
          <p className="text-xs text-muted-foreground">
            Version 1.0.0
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
