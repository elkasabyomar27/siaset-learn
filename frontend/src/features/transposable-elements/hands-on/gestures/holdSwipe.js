import { HOLD_MS } from './hold.js';
import { SWIPE_BAND, cuts, sideOf } from './swipe.js';
import { TAP_MS } from './index.js'; // read at call time only, so the import cycle is safe

// One target, two gestures (the sandbox's unbound DNA end: bind it, or try to cut it).
//  - Pointer: hold still ~HOLD_MS -> {kind:'hold'}; a stroke across `line` -> {kind:'swipe'}.
//  - Keyboard: hold Enter/Space for HOLD_MS -> hold; a quick press (released within TAP_MS)
//    -> swipe. A release between the two cancels. After a key hold completes, the key stays
//    locked until it is released, so auto-repeat never starts a second gesture.
// Not re-armed by useGesture: each completion gets a fresh `done` object, and the state
// accepts the next gesture itself.
export const startHoldSwipe = ({ line, band = SWIPE_BAND, ms = HOLD_MS } = {}) => ({
  phase: 'idle', line, band, ms, via: null, startT: null, progress: 0, last: null, done: null,
});

const idle = s => ({ ...s, phase: 'idle', via: null, startT: null, progress: 0, last: null });
const isKey = k => k === 'Enter' || k === ' ';

export function stepHoldSwipe(s, e) {
  switch (e.type) {
    case 'down':
      return s.phase === 'holding' ? s : { ...idle(s), phase: 'holding', via: 'pointer', startT: e.t, last: { x: e.x, y: e.y } };
    case 'move': {
      if (s.phase !== 'holding' || s.via !== 'pointer') return s;
      const q = { x: e.x, y: e.y };
      if (cuts(s.last, q, s.line, s.band)) return { ...idle(s), done: { kind: 'swipe', via: 'pointer' } };
      return sideOf(s.line, q) === 0 ? s : { ...s, last: q };
    }
    case 'tick': {
      if (s.phase !== 'holding') return s;
      const progress = Math.min(1, (e.t - s.startT) / s.ms);
      if (progress < 1) return { ...s, progress };
      const done = { kind: 'hold', via: s.via };
      return s.via === 'key' ? { ...idle(s), phase: 'locked', done } : { ...idle(s), done };
    }
    case 'up':
      return s.phase === 'holding' && s.via === 'pointer' ? idle(s) : s;
    case 'cancel':
      return s.phase === 'holding' || s.phase === 'locked' ? idle(s) : s;
    case 'key-down':
      return isKey(e.key) && s.phase === 'idle' ? { ...idle(s), phase: 'holding', via: 'key', startT: e.t } : s;
    case 'key-up': {
      if (!isKey(e.key)) return s;
      if (s.phase === 'locked') return idle(s);
      if (s.phase !== 'holding' || s.via !== 'key') return s;
      return e.t - s.startT <= TAP_MS ? { ...idle(s), done: { kind: 'swipe', via: 'key' } } : idle(s);
    }
    default:
      return s;
  }
}
