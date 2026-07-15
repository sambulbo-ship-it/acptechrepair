import { WifiOff, Loader2, CloudOff } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * Floating connectivity pill. Shows offline state, pending change count,
 * and sync progress; tap to force a sync when back online.
 */
export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingCount, syncPendingChanges } = useOfflineSync();
  const { t } = useLanguage();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <button
      onClick={isOnline && pendingCount > 0 ? syncPendingChanges : undefined}
      disabled={!isOnline || pendingCount === 0 || isSyncing}
      aria-live="polite"
      className={cn(
        'fixed top-16 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg transition-all fade-in',
        !isOnline && 'bg-destructive text-destructive-foreground',
        isOnline && isSyncing && 'bg-primary text-primary-foreground',
        isOnline && pendingCount > 0 && !isSyncing && 'bg-warning text-warning-foreground cursor-pointer hover:opacity-90'
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" aria-hidden="true" />
          <span>{t('offlineShort')}</span>
          {pendingCount > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
              {pendingCount}
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>{t('syncing')}</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <CloudOff className="w-4 h-4" aria-hidden="true" />
          <span>{pendingCount} {t('pendingShort')}</span>
        </>
      ) : null}
    </button>
  );
};
