import { isKeyDown } from './events.js';

const ang = (x, y, c) => Math.atan2(y - c.y, x - c.x);
const wrapPi = d => Math.atan2(Math.sin(d), Math.cos(d));

// Two modes. {center, threshold}: done once net angular travel (radians) reaches
// threshold. {center, detents:[...]}: arrows move one detent, Enter commits.
export const startDial = ({ center = { x: 0, y: 0 }, threshold, detents } = {}) => ({
  phase: 'idle', center, threshold, detents, detent: 0, value: detents ? detents[0] : null, last: null, travel: 0, done: null,
});

export function stepDial(s, e) {
  if (s.done) return s;
  switch (e.type) {
    case 'down':
      return s.detents ? s : { ...s, phase: 'turning', last: ang(e.x, e.y, s.center), travel: 0 };
    case 'move': {
      if (s.detents || s.phase !== 'turning') return s;
      const a = ang(e.x, e.y, s.center), travel = s.travel + wrapPi(a - s.last);
      return Math.abs(travel) >= s.threshold - 1e-9
        ? { ...s, phase: 'done', last: a, travel, done: { travel: Math.abs(travel) } }
        : { ...s, last: a, travel };
    }
    case 'up':
    case 'cancel':
      return s.phase === 'turning' && !s.detents ? { ...s, phase: 'cancelled', last: null } : s;
    case 'key-down': {
      if (!s.detents) return s;
      const last = s.detents.length - 1, move = i => ({ ...s, phase: 'turning', detent: i, value: s.detents[i] });
      if (isKeyDown(e, 'ArrowRight', 'ArrowUp')) return move(Math.min(last, s.detent + 1));
      if (isKeyDown(e, 'ArrowLeft', 'ArrowDown')) return move(Math.max(0, s.detent - 1));
      return isKeyDown(e, 'Enter') ? { ...s, phase: 'done', done: { value: s.value } } : s;
    }
    default:
      return s;
  }
}
