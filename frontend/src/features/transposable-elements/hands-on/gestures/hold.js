import { isKeyDown } from './events.js';

export const HOLD_MS = 700;

export const startHold = ({ ms = HOLD_MS } = {}) => ({ phase: 'idle', progress: 0, ms, startT: null, via: null, locked: false, done: null });

const begin = (s, t, via) => ({ ...s, phase: 'holding', progress: 0, startT: t, via, locked: false, done: null });
const abort = s => ({ ...s, phase: 'cancelled', progress: 0, startT: null, via: null });
const isHoldKey = k => k === 'Enter' || k === ' ';

export function stepHold(s, e) {
  switch (e.type) {
    case 'down':
      return s.phase === 'holding' ? s : begin(s, e.t, 'pointer');
    case 'key-down':
      // Key auto-repeat must not re-arm a finished hold: `locked` holds until key-up or cancel.
      return isKeyDown(e, 'Enter', ' ') && s.phase !== 'holding' && !s.locked ? begin(s, e.t, 'key') : s;
    case 'tick': {
      if (s.phase !== 'holding') return s;
      const progress = Math.min(1, (e.t - s.startT) / s.ms);
      if (progress < 1) return { ...s, progress };
      return { ...s, phase: 'done', progress: 1, locked: s.via === 'key', done: { via: s.via } };
    }
    case 'up':
      return s.phase === 'holding' && s.via === 'pointer' ? abort(s) : s;
    case 'cancel':
      return s.phase === 'holding' ? abort(s) : { ...s, locked: false };
    case 'key-up':
      if (!isHoldKey(e.key)) return s;
      if (s.phase === 'holding' && s.via === 'key') return abort(s);
      return s.locked ? { ...s, locked: false } : s;
    default:
      return s;
  }
}
