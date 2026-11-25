import { useSyncExternalStore } from 'react';
import { progressRepository } from './progressRepository.js';

export function useProgress() {
  return useSyncExternalStore(progressRepository.subscribe, progressRepository.getSnapshot, progressRepository.getSnapshot);
}
