import { isKeyDown } from './events.js';

export const HOLD_MS = 700;

export const startHold = ({ ms = HOLD_MS } = {}) => ({ phase: 'idle', progress: 0, ms, startT: null, via: null, done: null });

const begin = (s, t, via) => ({ ...s, phase: 'holding', progress: 0, startT: t, via, done: null });
const abort = s => ({ ...s, phase: 'cancelled', progress: 0, startT: null, via: null });

export function stepHold(s, e) {
  switch (e.type) {
    case 'down':
      return s.phase === 'holding' ? s : begin(s, e.t, 'pointer');
    case 'key-down':
      return isKeyDown(e, 'Enter', ' ') && s.phase !== 'holding' ? begin(s, e.t, 'key') : s;
    case 'tick': {
      if (s.phase !== 'holding') return s;
      const progress = Math.min(1, (e.t - s.startT) / s.ms);
      if (progress < 1) return { ...s, progress };
      return { ...s, phase: 'done', progress: 1, done: { via: s.via } };
    }
    case 'up':
    case 'cancel':
      return s.phase === 'holding' ? abort(s) : s;
    case 'key-up':
      return s.phase === 'holding' && s.via === 'key' && (e.key === 'Enter' || e.key === ' ') ? abort(s) : s;
    default:
      return s;
  }
}
