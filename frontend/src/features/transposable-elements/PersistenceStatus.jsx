import { useProgress } from './useProgress.js';
import { progressRepository } from './progressRepository.js';

export default function PersistenceStatus() {
  const { status, damaged } = useProgress();
  return <div><p role="status">{status === 'saved'
    ? 'Progress is saved locally in this browser.'
    : `${status === 'read-failed' ? 'Browser storage could not be read.' : 'Browser storage could not save all changes.'} Temporary progress stays available while this page remains loaded, including navigation within SIASET. Reloading or closing the page can lose temporary changes.`}
    {damaged && ' Some stored data is damaged or incompatible. It has been left untouched; valid records remain available.'}</p>
    {status !== 'saved' && <button className="outline-button" onClick={() => progressRepository.retry()}>Retry saving progress</button>}</div>;
}
