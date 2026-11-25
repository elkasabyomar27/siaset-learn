import { isKeyDown } from './events.js';

export const SWIPE_BAND = 34;

export const startSwipe = ({ line, band = SWIPE_BAND }) => ({ phase: 'idle', line, band, last: null, done: null });

// `line` is the segment being cut across. Done when two consecutive path points
// lie strictly on opposite sides of the segment's line AND the point where that
// step crosses the line falls on the segment extended by `band` at each end.
// Strokes along the segment or that never cross it do not count.
export const sideOf = ({ x1, y1, x2, y2 }, pt) => (x2 - x1) * (pt.y - y1) - (y2 - y1) * (pt.x - x1);

export function cuts(p, q, { x1, y1, x2, y2 }, band) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (!len) return false;
  const side = pt => sideOf({ x1, y1, x2, y2 }, pt);
  const sp = side(p), sq = side(q);
  if (sp * sq >= 0) return false;
  const k = sp / (sp - sq), cx = p.x + k * (q.x - p.x), cy = p.y + k * (q.y - p.y);
  const along = ((cx - x1) * dx + (cy - y1) * dy) / len;
  return along >= -band && along <= len + band;
}

export function stepSwipe(s, e) {
  if (s.done) return s;
  switch (e.type) {
    case 'down':
      return { ...s, phase: 'swiping', last: { x: e.x, y: e.y } };
    case 'move': {
      if (s.phase !== 'swiping') return s;
      const q = { x: e.x, y: e.y };
      if (cuts(s.last, q, s.line, s.band)) return { ...s, phase: 'done', last: q, done: { via: 'pointer' } };
      // A point exactly on the line has no side: keep the last sided point, so the
      // next step is still measured from the side the stroke came from.
      return sideOf(s.line, q) === 0 ? s : { ...s, last: q };
    }
    case 'up':
    case 'cancel':
      return s.phase === 'swiping' ? { ...s, phase: 'cancelled', last: null } : s;
    case 'key-down':
      return isKeyDown(e, 'Enter') ? { ...s, phase: 'done', done: { via: 'key' } } : s;
    default:
      return s;
  }
}
