import { useProgress } from './useProgress.js';
import { progressRepository } from './progressRepository.js';
import { progressSync, useSyncStatus } from '../../auth/ProgressSync.jsx';

const SYNC = {
  off: 'Progress is saved in this browser. Sign in to sync it across your devices.',
  syncing: 'Progress is saved in this browser and syncing to your account…',
  synced: 'Progress is saved and synced to your account across your devices.',
  error: 'Progress is saved in this browser, but your account could not be reached. Syncing will retry automatically.',
};

export default function PersistenceStatus() {
  const { status, damaged } = useProgress();
  const { status: sync } = useSyncStatus();
  return <div><p role="status">{status === 'saved'
    ? SYNC[sync]
    : `${status === 'read-failed' ? 'Browser storage could not be read.' : 'Browser storage could not save all changes.'} Temporary progress stays available while this page remains loaded, including navigation within SIASET. Reloading or closing the page can lose temporary changes.`}
    {damaged && ' Some stored data is damaged or incompatible. It has been left untouched; valid records remain available.'}</p>
    {status !== 'saved' && <button className="outline-button" onClick={() => progressRepository.retry()}>Retry saving progress</button>}
    {status === 'saved' && sync === 'error' && <button className="outline-button" onClick={() => progressSync.syncNow()}>Sync now</button>}</div>;
}
