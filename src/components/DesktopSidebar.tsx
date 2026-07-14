import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Wrench, PlusCircle, Settings, Package, ShoppingCart,
  BarChart3, Globe, LogOut, Building2, Cpu, Layers, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationToggle } from './NotificationToggle';
import { toast } from 'sonner';

/**
 * Persistent desktop sidebar (lg+). Full navigation, workspace context,
 * user identity and quick actions — replaces Header + BottomNav on desktop.
 */
export const DesktopSidebar = () => {
  const { t, language, setLanguage } = useLanguage();
  const { currentWorkspace, user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Wrench, label: t('equipment') },
    { path: '/rental-sale', icon: ShoppingCart, label: t('rentalSale') },
    { path: '/add', icon: PlusCircle, label: t('addMachine'), badge: '+' },
    { path: '/bulk-add', icon: Layers, label: t('bulkAdd') },
    { path: '/repair-resources', icon: Package, label: t('resources') },
    { path: '/analytics', icon: BarChart3, label: t('analytics') },
    { path: '/ai-assistant', icon: Cpu, label: t('aiAssistant') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch {
      toast.error(t('signOutError'));
    }
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 h-screen"
      aria-label="Navigation principale"
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">ACP Tech</p>
            <p className="text-xs text-muted-foreground truncate">{currentWorkspace?.name || 'Repair'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive && 'stroke-[2.5]')} />
              {item.label}
              {'badge' in item && item.badge && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-3 pb-4 pt-2 border-t border-border/50 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2">
          <NotificationToggle />
          <span className="text-xs text-muted-foreground">{t('notifications')}</span>
        </div>

        <button
          onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
        >
          <Globe className="w-5 h-5 shrink-0" />
          <span>{language === 'fr' ? 'English' : 'Français'}</span>
          <span className="ml-auto text-xs uppercase bg-secondary px-1.5 py-0.5 rounded font-mono">{language}</span>
        </button>

        <button
          onClick={() => navigate('/privacy')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
        >
          <Shield className="w-5 h-5 shrink-0" />
          <span>{t('privacy')}</span>
        </button>

        {user && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
                <button
                  onClick={() => navigate('/workspaces')}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Building2 className="w-3 h-3" />
                  {t('switchWorkspace')}
                </button>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {t('signOut')}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
