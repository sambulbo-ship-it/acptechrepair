import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  BellRing, 
  Wrench, 
  CheckCircle2, 
  PackageMinus, 
  PackagePlus,
  AlertTriangle,
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const notificationTypes = [
  {
    key: 'notify_machine_in_repair' as const,
    label: 'Entrée en réparation',
    description: 'Quand une machine entre en réparation',
    icon: Wrench,
    color: 'text-warning',
  },
  {
    key: 'notify_machine_ready' as const,
    label: 'Machine prête',
    description: 'Quand une réparation est terminée',
    icon: CheckCircle2,
    color: 'text-success',
  },
  {
    key: 'notify_stock_out' as const,
    label: 'Sortie de stock',
    description: 'Quand un équipement sort du stock',
    icon: PackageMinus,
    color: 'text-destructive',
  },
  {
    key: 'notify_stock_in' as const,
    label: 'Entrée en stock',
    description: 'Quand un équipement entre en stock',
    icon: PackagePlus,
    color: 'text-primary',
  },
  {
    key: 'notify_status_critical' as const,
    label: 'Statut critique',
    description: 'Quand une machine passe en état critique',
    icon: AlertTriangle,
    color: 'text-destructive',
  },
  {
    key: 'notify_new_team_member' as const,
    label: 'Nouveau membre',
    description: "Quand quelqu'un rejoint l'équipe",
    icon: UserPlus,
    color: 'text-primary',
  },
];

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentWorkspace } = useAuth();
  const { preferences, loading, updatePreference } = useNotificationPreferences();
  const { permission, isSupported, requestPermission } = useNotifications();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (key: keyof typeof preferences & string, currentValue: boolean) => {
    if (!preferences) return;
    
    setUpdating(key);
    const success = await updatePreference(key as any, !currentValue);
    setUpdating(null);
    
    if (success) {
      toast.success(!currentValue ? 'Notification activée' : 'Notification désactivée');
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notifications activées !');
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header title="Notifications" showBack />
        <div className="p-4 text-center text-muted-foreground">
          Sélectionnez un espace de travail
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Notifications" showBack />

      <div className="p-4 space-y-4">
        {/* Permission status */}
        {isSupported && permission !== 'granted' && (
          <div className="ios-card p-4 border-warning/50 bg-warning/10">
            <div className="flex items-center gap-3 mb-3">
              <BellRing className="w-6 h-6 text-warning" />
              <div>
                <h3 className="font-medium text-foreground">Activer les notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Autorisez les notifications pour recevoir des alertes
                </p>
              </div>
            </div>
            <Button 
              onClick={handleEnableNotifications}
              className="w-full"
              variant="outline"
            >
              <Bell className="w-4 h-4 mr-2" />
              Autoriser les notifications
            </Button>
          </div>
        )}

        {/* Notification preferences */}
        <div className="ios-card overflow-hidden">
          <h3 className="px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide border-b border-border flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Types de notifications
          </h3>

          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notificationTypes.map(({ key, label, description, icon: Icon, color }) => {
                const isEnabled = preferences?.[key] ?? true;
                const isUpdating = updating === key;

                return (
                  <div
                    key={key}
                    className="px-4 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg bg-muted ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={key} 
                          className="text-sm font-medium text-foreground cursor-pointer"
                        >
                          {label}
                        </Label>
                        <p className="text-xs text-muted-foreground truncate">
                          {description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={key}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(key, isEnabled)}
                      disabled={isUpdating}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="ios-card p-4">
          <p className="text-sm text-muted-foreground">
            Les notifications vous permettent de rester informé des activités importantes 
            de votre espace de travail. Vous pouvez personnaliser chaque type selon vos besoins.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationSettings;
