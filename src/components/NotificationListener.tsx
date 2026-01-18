import { useMachineStatusNotifications } from '@/hooks/useMachineStatusNotifications';

/**
 * Component that initializes and manages real-time notifications
 * for machine status changes. Should be placed inside AuthProvider.
 */
export const NotificationListener = () => {
  // Initialize the machine status notifications hook
  useMachineStatusNotifications();
  
  return null;
};
