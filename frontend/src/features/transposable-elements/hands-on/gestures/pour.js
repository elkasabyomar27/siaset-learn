import { isKeyDown } from './events.js';

// Ties go to the lower mark (epsilon guards float noise such as 0.7 - 0.45).
export function nearestMark(value, marks) {
  const sorted = [...marks].sort((a, b) => a - b);
  let best = sorted[0];
  for (const m of sorted) if (Math.abs(m - value) < Math.abs(best - value) - 1e-9) best = m;
  return best;
}

export const startPour = ({ marks, rate }) => ({
  phase: 'idle', marks: [...marks].sort((a, b) => a - b), rate, value: 0, lastT: null, done: null,
});

const finish = s => ({ ...s, phase: 'done', lastT: null, done: { value: s.value, mark: nearestMark(s.value, s.marks) } });

export function stepPour(s, e) {
  if (s.done) return s;
  switch (e.type) {
    case 'down':
      return { ...s, phase: 'pouring', lastT: e.t };
    case 'tick': {
      if (s.phase !== 'pouring') return s;
      const value = Math.min(s.marks[s.marks.length - 1], s.value + s.rate * (e.t - s.lastT) / 1000);
      return { ...s, value, lastT: e.t };
    }
    case 'up':
      return s.phase === 'pouring' ? finish(s) : s;
    case 'cancel':
      return s.phase === 'pouring' ? { ...s, phase: 'cancelled', lastT: null } : s;
    case 'key-down': {
      if (isKeyDown(e, 'ArrowUp')) {
        const next = s.marks.find(m => m > s.value + 1e-9);
        return next === undefined ? s : { ...s, phase: 'stepping', value: next };
      }
      if (isKeyDown(e, 'ArrowDown')) {
        const prev = [...s.marks].reverse().find(m => m < s.value - 1e-9);
        return prev === undefined ? s : { ...s, phase: 'stepping', value: prev };
      }
      return isKeyDown(e, 'Enter') ? finish(s) : s;
    }
    default:
      return s;
  }
}
