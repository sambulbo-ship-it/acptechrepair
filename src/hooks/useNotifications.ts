import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Les notifications ne sont pas supportées par ce navigateur');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications activées !');
        return true;
      } else if (result === 'denied') {
        toast.error('Notifications refusées. Vous pouvez les activer dans les paramètres du navigateur.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Erreur lors de la demande de permission');
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((options: NotificationOptions) => {
    if (!isSupported) {
      console.log('Notifications not supported, showing toast instead');
      toast.info(options.title, { description: options.body });
      return null;
    }

    if (permission !== 'granted') {
      console.log('Notification permission not granted, showing toast instead');
      toast.info(options.title, { description: options.body });
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      });

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      // Auto-close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      // Fallback to toast
      toast.info(options.title, { description: options.body });
      return null;
    }
  }, [isSupported, permission]);

  const notifyNewEntry = useCallback((machineName: string, entryType: string, priority: string) => {
    const priorityLabels: Record<string, string> = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      critical: 'Critique'
    };

    const typeLabels: Record<string, string> = {
      repair: 'Réparation',
      maintenance: 'Maintenance',
      inspection: 'Inspection',
      upgrade: 'Amélioration',
      other: 'Autre'
    };

    const isCritical = priority === 'high' || priority === 'critical';
    
    sendNotification({
      title: isCritical ? '🚨 Nouvelle entrée critique' : '📋 Nouvelle entrée',
      body: `${typeLabels[entryType] || entryType} pour ${machineName} - Priorité: ${priorityLabels[priority] || priority}`,
      tag: 'new-entry',
      requireInteraction: isCritical,
    });
  }, [sendNotification]);

  const notifyStatusChange = useCallback((machineName: string, oldStatus: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      operational: 'Opérationnel',
      maintenance: 'En maintenance',
      repair: 'En réparation',
      'out-of-service': 'Hors service'
    };

    const isCritical = newStatus === 'out-of-service' || newStatus === 'repair';
    
    sendNotification({
      title: isCritical ? '⚠️ Changement de statut critique' : '🔄 Changement de statut',
      body: `${machineName}: ${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}`,
      tag: 'status-change',
      requireInteraction: isCritical,
    });
  }, [sendNotification]);

  const notifyTeamMemberAdded = useCallback((memberName: string) => {
    sendNotification({
      title: '👤 Nouveau membre',
      body: `${memberName} a rejoint l'équipe`,
      tag: 'team-member',
    });
  }, [sendNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    notifyNewEntry,
    notifyStatusChange,
    notifyTeamMemberAdded,
  };
};
