import { WifiOff, Loader2, CloudOff, Check } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingCount, syncPendingChanges } = useOfflineSync();

  // If online with no pending changes, don't show anything
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <button
      onClick={isOnline && pendingCount > 0 ? syncPendingChanges : undefined}
      disabled={!isOnline || pendingCount === 0 || isSyncing}
      className={cn(
        "fixed top-16 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg transition-all",
        !isOnline && "bg-destructive text-destructive-foreground",
        isOnline && isSyncing && "bg-primary text-primary-foreground",
        isOnline && pendingCount > 0 && !isSyncing && "bg-warning text-warning-foreground cursor-pointer hover:opacity-90"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Hors-ligne</span>
          {pendingCount > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
              {pendingCount}
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Synchronisation...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <CloudOff className="w-4 h-4" />
          <span>{pendingCount} en attente</span>
        </>
      ) : null}
    </button>
  );
};
