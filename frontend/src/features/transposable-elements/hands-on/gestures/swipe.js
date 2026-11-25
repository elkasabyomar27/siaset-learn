import { isKeyDown } from './events.js';

export const SWIPE_BAND = 34;

export const startSwipe = ({ line, band = SWIPE_BAND }) => ({ phase: 'idle', line, band, last: null, travel: 0, done: null });

const ptSeg = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  const u = len2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
  return Math.hypot(px - (x1 + u * dx), py - (y1 + u * dy));
};
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const intersects = (a, b, c, d) => cross(c, d, a) * cross(c, d, b) <= 0 && cross(a, b, c) * cross(a, b, d) <= 0;

// Distance between the path step p->q and the target segment (0 when they intersect).
function stepDistance(p, q, { x1, y1, x2, y2 }) {
  if (intersects(p, q, { x: x1, y: y1 }, { x: x2, y: y2 })) return 0;
  return Math.min(ptSeg(p.x, p.y, x1, y1, x2, y2), ptSeg(q.x, q.y, x1, y1, x2, y2),
    ptSeg(x1, y1, p.x, p.y, q.x, q.y), ptSeg(x2, y2, p.x, p.y, q.x, q.y));
}

// Simplest rule that satisfies the brief: the swipe is done when some step of
// the pointer path passes within `band` of the target segment (crossing it
// counts as distance 0), once the pointer has travelled MIN_TRAVEL units so a
// bare tap beside the line does not count. Strokes across or along the
// segment both qualify; a stroke farther than `band` away never does.
const MIN_TRAVEL = 10;

export function stepSwipe(s, e) {
  if (s.done) return s;
  switch (e.type) {
    case 'down':
      return { ...s, phase: 'swiping', last: { x: e.x, y: e.y }, travel: 0 };
    case 'move': {
      if (s.phase !== 'swiping') return s;
      const q = { x: e.x, y: e.y }, travel = s.travel + Math.hypot(q.x - s.last.x, q.y - s.last.y);
      const hit = travel >= MIN_TRAVEL && stepDistance(s.last, q, s.line) <= s.band;
      return hit ? { ...s, phase: 'done', last: q, travel, done: { via: 'pointer' } } : { ...s, last: q, travel };
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
