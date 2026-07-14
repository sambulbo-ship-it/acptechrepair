import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Check, LogOut, Building2, Shield, Bell, Palette,
  Settings as SettingsIcon, ChevronRight, FileText, Wrench, BarChart3, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const APP_VERSION = '1.0.0';

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user, currentWorkspace, signOut, isWorkspaceAdmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch {
      toast.error(t('signOutError'));
    }
  };

  const SettingsRow = ({
    icon: Icon,
    label,
    onClick,
    iconClass = 'text-primary',
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    iconClass?: string;
  }) => (
    <button
      onClick={onClick}
      className="w-full glass-list-item px-4 py-4 flex items-center gap-3 transition-colors text-left"
    >
      <Icon className={cn('w-5 h-5 shrink-0', iconClass)} aria-hidden="true" />
      <span className="flex-1 text-foreground">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
    </button>
  );

  return (
    <AppLayout>
      <div className="min-h-screen lg:min-h-0 bg-background pb-24 lg:pb-0">
        <Header title={t('settings')} />

        {/* Desktop page header */}
        <div className="hidden lg:block px-8 pt-8 pb-2">
          <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
        </div>

        <div className="p-4 lg:px-8 lg:py-6 space-y-4 max-w-2xl">
          {/* Account */}
          <div className="glass-section overflow-hidden">
            <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
              {t('account')}
            </h3>

            <div className="glass-list-item px-4 py-4">
              <p className="text-xs text-muted-foreground">{t('email')}</p>
              <p className="text-sm font-medium text-foreground truncate">{user?.email || '—'}</p>
            </div>

            {currentWorkspace && (
              <button
                onClick={() => navigate('/workspaces')}
                className="w-full glass-list-item px-4 py-4 flex items-center gap-3 transition-colors text-left"
              >
                <Building2 className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t('currentWorkspace')}</p>
                  <p className="text-sm font-medium text-foreground truncate">{currentWorkspace.name}</p>
                </div>
                {isWorkspaceAdmin && <Shield className="w-4 h-4 text-primary shrink-0" aria-label="Admin" />}
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Quick settings */}
          <div className="glass-section overflow-hidden">
            <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
              {t('quickSettings')}
            </h3>

            <SettingsRow icon={BarChart3} label={t('analytics')} onClick={() => navigate('/analytics')} />
            <SettingsRow icon={Bell} label={t('notifications')} onClick={() => navigate('/notification-settings')} />

            {isWorkspaceAdmin && (
              <>
                <SettingsRow icon={Palette} label={t('customization')} onClick={() => navigate('/workspace-branding')} />
                <SettingsRow icon={SettingsIcon} label={t('workspaceSettings')} onClick={() => navigate('/workspace-settings')} />
              </>
            )}
          </div>

          {/* Business management */}
          <div className="glass-section overflow-hidden">
            <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
              {t('businessManagement')}
            </h3>

            <SettingsRow icon={FileText} label={t('quoteRequests')} onClick={() => navigate('/quote-requests-received')} />
            <SettingsRow icon={Wrench} label={t('repairRequests')} onClick={() => navigate('/repair-requests-received')} />
          </div>

          {/* Language */}
          <div className="glass-section overflow-hidden">
            <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
              {t('language')}
            </h3>

            {(['en', 'fr'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'w-full glass-list-item flex items-center justify-between px-4 py-4 touch-target transition-colors',
                  language === lang && 'bg-primary/10'
                )}
              >
                <span className="text-foreground">{lang === 'en' ? t('english') : t('french')}</span>
                {language === lang && <Check className="w-5 h-5 text-primary" aria-hidden="true" />}
              </button>
            ))}
          </div>

          {/* Legal */}
          <div className="glass-section overflow-hidden">
            <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
              {t('legal')}
            </h3>
            <SettingsRow icon={Lock} label={t('privacyPolicy')} onClick={() => navigate('/privacy')} />
          </div>

          {/* Sign out */}
          <Button
            variant="destructive"
            className="w-full h-12 gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            {t('signOut')}
          </Button>

          {/* App info */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">ACP Tech Repair</h3>
            <p className="text-xs text-muted-foreground">
              {t('version')} {APP_VERSION} · © {new Date().getFullYear()} Animal Coat Production
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
