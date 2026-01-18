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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  BellRing, 
  Wrench, 
  CheckCircle2, 
  PackageMinus, 
  PackagePlus,
  AlertTriangle,
  UserPlus,
  TestTube,
  Smartphone,
  Info,
  CalendarClock
} from 'lucide-react';
import { toast } from 'sonner';

const notificationTypes = [
  {
    key: 'notify_machine_in_repair' as const,
    label: 'Entrée en réparation',
    description: 'Quand une machine entre en réparation',
    icon: Wrench,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    example: '🛠️ Machine X est entrée en réparation',
  },
  {
    key: 'notify_machine_ready' as const,
    label: 'Machine prête',
    description: 'Quand une réparation est terminée',
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10',
    example: '✅ Machine X est maintenant opérationnelle',
  },
  {
    key: 'notify_stock_out' as const,
    label: 'Sortie de stock',
    description: 'Quand un équipement entre en maintenance',
    icon: PackageMinus,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    example: '📤 Machine X est en maintenance',
  },
  {
    key: 'notify_stock_in' as const,
    label: 'Retour en stock',
    description: 'Quand un équipement redevient opérationnel',
    icon: PackagePlus,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    example: '📥 Machine X est de retour opérationnelle',
  },
  {
    key: 'notify_status_critical' as const,
    label: 'Statut critique',
    description: 'Quand une machine passe hors service',
    icon: AlertTriangle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    example: '🚨 Machine X est maintenant hors service',
  },
  {
    key: 'notify_maintenance_reminder' as const,
    label: 'Rappels maintenance',
    description: 'Rappels de maintenance préventive programmée',
    icon: CalendarClock,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    example: '📅 Maintenance prévue pour Machine X dans 3 jours',
  },
  {
    key: 'notify_new_team_member' as const,
    label: 'Nouveau membre',
    description: "Quand quelqu'un rejoint l'équipe",
    icon: UserPlus,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    example: '👤 Jean Dupont a rejoint l\'équipe',
  },
];

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentWorkspace } = useAuth();
  const { preferences, loading, updatePreference, updateAllPreferences } = useNotificationPreferences();
  const { permission, isSupported, requestPermission, sendNotification } = useNotifications();
  const [updating, setUpdating] = useState<string | null>(null);
  const [testingSent, setTestingSent] = useState(false);

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

  const handleEnableAll = async () => {
    const allEnabled = {
      notify_machine_in_repair: true,
      notify_machine_ready: true,
      notify_stock_out: true,
      notify_stock_in: true,
      notify_status_critical: true,
      notify_new_team_member: true,
      notify_maintenance_reminder: true,
    };
    await updateAllPreferences(allEnabled);
  };

  const handleDisableAll = async () => {
    const allDisabled = {
      notify_machine_in_repair: false,
      notify_machine_ready: false,
      notify_stock_out: false,
      notify_stock_in: false,
      notify_status_critical: false,
      notify_new_team_member: false,
      notify_maintenance_reminder: false,
    };
    await updateAllPreferences(allDisabled);
  };

  const handleTestNotification = () => {
    sendNotification({
      title: '🔔 Test de notification',
      body: 'Les notifications fonctionnent correctement !',
      tag: 'test-notification',
    });
    setTestingSent(true);
    toast.success('Notification de test envoyée !');
    setTimeout(() => setTestingSent(false), 3000);
  };

  const enabledCount = preferences 
    ? Object.entries(preferences)
        .filter(([key]) => key.startsWith('notify_'))
        .filter(([, value]) => value === true)
        .length
    : 0;

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
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/20">
                  <BellRing className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-base">Activer les notifications</CardTitle>
                  <CardDescription>
                    Autorisez les notifications pour recevoir des alertes en temps réel
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleEnableNotifications}
                className="w-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                Autoriser les notifications
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Status Card */}
        {permission === 'granted' && (
          <Card className="border-success/50 bg-success/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Notifications actives</p>
                    <p className="text-xs text-muted-foreground">
                      {enabledCount} type{enabledCount > 1 ? 's' : ''} activé{enabledCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestNotification}
                  disabled={testingSent}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testingSent ? 'Envoyé !' : 'Tester'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        {!loading && preferences && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleEnableAll}
            >
              Tout activer
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleDisableAll}
            >
              Tout désactiver
            </Button>
          </div>
        )}

        {/* Notification preferences */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Types de notifications</CardTitle>
            </div>
            <CardDescription>
              Personnalisez les alertes que vous souhaitez recevoir
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
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
                {notificationTypes.map(({ key, label, description, example, icon: Icon, color, bgColor }) => {
                  const isEnabled = preferences?.[key] ?? true;
                  const isUpdating = updating === key;

                  return (
                    <div
                      key={key}
                      className="px-4 py-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${bgColor}`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={key} 
                              className="text-sm font-medium text-foreground cursor-pointer"
                            >
                              {label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
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
                      {isEnabled && (
                        <div className="ml-12 pl-1">
                          <p className="text-xs text-muted-foreground italic">
                            Exemple: {example}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Les notifications vous alertent en temps réel quand le statut d'une machine change.
                </p>
                <p>
                  <Smartphone className="w-4 h-4 inline mr-1" />
                  Sur mobile, installez l'app pour recevoir les notifications même quand l'application est fermée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationSettings;
