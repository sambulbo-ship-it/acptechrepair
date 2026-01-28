import { useMachineStatusNotifications } from '@/hooks/useMachineStatusNotifications';
import { useRentalNotifications } from '@/hooks/useRentalNotifications';

/**
 * Component that initializes and manages real-time notifications
 * for machine status changes and rental expirations.
 */
export const NotificationListener = () => {
  // Initialize the machine status notifications hook
  useMachineStatusNotifications();
  
  // Initialize rental expiration notifications
  useRentalNotifications();
  
  return null;
};
