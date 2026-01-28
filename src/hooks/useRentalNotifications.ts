import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { differenceInDays, parseISO, isAfter, isBefore, addDays } from 'date-fns';

interface RentalTransaction {
  id: string;
  machine_id: string;
  transaction_type: string;
  expected_end_date: string | null;
  warranty_end_date: string | null;
  status: string;
  client_name: string | null;
}

interface Machine {
  id: string;
  name: string;
}

export const useRentalNotifications = () => {
  const { currentWorkspace, user } = useAuth();
  const { sendNotification, permission } = useNotifications();
  const lastCheckRef = useRef<Date | null>(null);
  const notifiedRentalsRef = useRef<Set<string>>(new Set());
  const notifiedWarrantiesRef = useRef<Set<string>>(new Set());

  const checkExpiringRentals = useCallback(async () => {
    if (!currentWorkspace || !user || permission !== 'granted') return;

    // Only check once per hour
    const now = new Date();
    if (lastCheckRef.current && differenceInDays(now, lastCheckRef.current) < 0.04) {
      return;
    }
    lastCheckRef.current = now;

    try {
      // Fetch active rentals with expected end dates
      const { data: rentals, error: rentalsError } = await supabase
        .from('rental_transactions')
        .select('id, machine_id, transaction_type, expected_end_date, warranty_end_date, status, client_name')
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'active');

      if (rentalsError) {
        console.error('Error fetching rentals for notifications:', rentalsError);
        return;
      }

      // Fetch machines for names
      const machineIds = [...new Set((rentals || []).map(r => r.machine_id))];
      if (machineIds.length === 0) return;

      const { data: machines } = await supabase
        .from('machines')
        .select('id, name')
        .in('id', machineIds);

      const machineMap = new Map((machines || []).map((m: Machine) => [m.id, m.name]));

      const today = new Date();
      const warningDays = 3; // Notify 3 days before expiration

      (rentals || []).forEach((rental: RentalTransaction) => {
        const machineName = machineMap.get(rental.machine_id) || 'Machine';

        // Check rental expiration
        if (rental.transaction_type === 'rental' && rental.expected_end_date) {
          const endDate = parseISO(rental.expected_end_date);
          const daysUntilEnd = differenceInDays(endDate, today);

          // Notify if expiring within warning period and not already notified
          if (daysUntilEnd >= 0 && daysUntilEnd <= warningDays) {
            const notificationKey = `rental-${rental.id}-${rental.expected_end_date}`;
            if (!notifiedRentalsRef.current.has(notificationKey)) {
              notifiedRentalsRef.current.add(notificationKey);

              if (daysUntilEnd === 0) {
                sendNotification({
                  title: '⏰ Location expire aujourd\'hui',
                  body: `La location de ${machineName}${rental.client_name ? ` (${rental.client_name})` : ''} expire aujourd'hui`,
                  tag: `rental-expiry-${rental.id}`,
                  requireInteraction: true,
                });
              } else {
                sendNotification({
                  title: '📅 Location bientôt terminée',
                  body: `La location de ${machineName}${rental.client_name ? ` (${rental.client_name})` : ''} expire dans ${daysUntilEnd} jour${daysUntilEnd > 1 ? 's' : ''}`,
                  tag: `rental-expiry-${rental.id}`,
                  requireInteraction: false,
                });
              }
            }
          }
        }

        // Check warranty expiration for sales
        if (rental.transaction_type === 'sale' && rental.warranty_end_date) {
          const warrantyEnd = parseISO(rental.warranty_end_date);
          const daysUntilWarrantyEnd = differenceInDays(warrantyEnd, today);

          // Notify 30 days and 7 days before warranty expires
          if ((daysUntilWarrantyEnd === 30 || daysUntilWarrantyEnd === 7 || daysUntilWarrantyEnd === 1)) {
            const notificationKey = `warranty-${rental.id}-${daysUntilWarrantyEnd}`;
            if (!notifiedWarrantiesRef.current.has(notificationKey)) {
              notifiedWarrantiesRef.current.add(notificationKey);

              sendNotification({
                title: '🛡️ Garantie bientôt expirée',
                body: `La garantie de ${machineName}${rental.client_name ? ` vendu à ${rental.client_name}` : ''} expire dans ${daysUntilWarrantyEnd} jour${daysUntilWarrantyEnd > 1 ? 's' : ''}`,
                tag: `warranty-expiry-${rental.id}`,
                requireInteraction: daysUntilWarrantyEnd <= 7,
              });
            }
          }
        }
      });
    } catch (error) {
      console.error('Error checking rental notifications:', error);
    }
  }, [currentWorkspace, user, permission, sendNotification]);

  // Check on mount and periodically
  useEffect(() => {
    if (!currentWorkspace || !user) return;

    // Initial check after a delay to let the app load
    const initialTimeout = setTimeout(() => {
      checkExpiringRentals();
    }, 5000);

    // Check every hour
    const interval = setInterval(() => {
      checkExpiringRentals();
    }, 60 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [currentWorkspace, user, checkExpiringRentals]);

  return {
    checkExpiringRentals,
  };
};
