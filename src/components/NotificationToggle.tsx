import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/contexts/LanguageContext';

export const NotificationToggle = () => {
  const { permission, isSupported, requestPermission } = useNotifications();
  const { t } = useLanguage();

  if (!isSupported) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        className="opacity-50"
        title="Notifications non supportées"
      >
        <BellOff className="h-5 w-5" />
      </Button>
    );
  }

  const handleClick = async () => {
    if (permission === 'default') {
      await requestPermission();
    }
  };

  const getIcon = () => {
    switch (permission) {
      case 'granted':
        return <BellRing className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <BellOff className="h-5 w-5 text-destructive" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (permission) {
      case 'granted':
        return 'Notifications activées';
      case 'denied':
        return 'Notifications refusées';
      default:
        return 'Activer les notifications';
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={permission === 'granted' || permission === 'denied'}
      title={getTitle()}
      aria-label={getTitle()}
    >
      {getIcon()}
    </Button>
  );
};
