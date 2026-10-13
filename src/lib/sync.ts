import { useEffect, useCallback, useState } from 'react';

const SYNC_EVENT = 'app:data-sync';

export function triggerSync() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function useSyncTrigger(onSync: () => void) {
  useEffect(() => {
    const handler = () => onSync();
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, [onSync]);
}

export function useSyncState() {
  const [syncing, setSyncing] = useState(false);
  const doSync = useCallback(() => {
    setSyncing(true);
    triggerSync();
    setTimeout(() => setSyncing(false), 1500);
  }, []);
  return { syncing, doSync };
}
