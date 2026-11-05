import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from './AuthProvider.jsx';
import { progressRepository } from '../features/transposable-elements/progressRepository.js';
import { createProgressSync } from '../features/transposable-elements/progressSync.js';

export const progressSync = createProgressSync({repository: progressRepository});

/** Starts syncing when a verified user is signed in and stops when they are not. Renders nothing. */
export default function ProgressSync() {
  const {client, user, ready} = useAuth();
  const userId = user && !user.is_anonymous ? user.id : null;
  useEffect(() => {
    if (!ready) return;
    if (client && userId) progressSync.start(client, userId);
    else progressSync.stop();
  }, [client, userId, ready]);
  return null;
}

/** {status: off | syncing | synced | error, lastSynced} for the current browser. */
export function useSyncStatus() {
  return useSyncExternalStore(progressSync.subscribe, progressSync.getSnapshot, progressSync.getSnapshot);
}
