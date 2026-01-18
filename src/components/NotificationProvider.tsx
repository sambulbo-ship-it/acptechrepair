import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useCloudData } from '@/hooks/useCloudData';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { notifyNewEntry, notifyStatusChange, notifyTeamMemberAdded, permission } = useNotifications();
  const { setNotificationCallbacks } = useCloudData();

  useEffect(() => {
    // Only setup callbacks if notifications are enabled
    if (permission === 'granted') {
      setNotificationCallbacks({
        onNewEntry: notifyNewEntry,
        onStatusChange: notifyStatusChange,
        onTeamMemberAdded: notifyTeamMemberAdded,
      });
    } else {
      // Clear callbacks if notifications are not enabled
      setNotificationCallbacks({});
    }
  }, [permission, setNotificationCallbacks, notifyNewEntry, notifyStatusChange, notifyTeamMemberAdded]);

  return <>{children}</>;
};
