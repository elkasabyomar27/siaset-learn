import { isKeyDown } from './events.js';

export const startDrag = ({ zones = [] } = {}) => ({ phase: 'idle', zones, x: null, y: null, over: null, zoneIndex: -1, done: null });

const zoneAt = (zones, x, y) => zones.findIndex(z => z.contains(x, y));
const at = (s, i) => ({ ...s, zoneIndex: i, over: i >= 0 ? s.zones[i].id : null });

export function stepDrag(s, e) {
  if (s.done) return s;
  const n = s.zones.length;
  switch (e.type) {
    case 'down':
      return { ...at(s, zoneAt(s.zones, e.x, e.y)), phase: 'dragging', x: e.x, y: e.y };
    case 'move':
      return s.phase === 'dragging' ? { ...at(s, zoneAt(s.zones, e.x, e.y)), x: e.x, y: e.y } : s;
    case 'up': {
      if (s.phase !== 'dragging') return s;
      const i = zoneAt(s.zones, e.x, e.y);
      return i >= 0
        ? { ...at(s, i), phase: 'dropped', x: e.x, y: e.y, done: { zone: s.zones[i].id } }
        : { ...at(s, -1), phase: 'cancelled', x: e.x, y: e.y };
    }
    case 'cancel':
      return s.phase === 'dragging' ? { ...at(s, -1), phase: 'cancelled' } : s;
    case 'key-down': {
      if (s.phase === 'idle' || s.phase === 'cancelled') {
        return isKeyDown(e, 'Enter') ? { ...at(s, n ? 0 : -1), phase: 'carrying' } : s;
      }
      if (s.phase !== 'carrying') return s;
      if (isKeyDown(e, 'Escape')) return { ...at(s, -1), phase: 'cancelled' };
      if (!n) return s;
      if (isKeyDown(e, 'ArrowRight', 'ArrowDown', 'Tab')) return at(s, (s.zoneIndex + 1) % n);
      if (isKeyDown(e, 'ArrowLeft', 'ArrowUp', 'Shift+Tab')) return at(s, (s.zoneIndex - 1 + n) % n);
      if (isKeyDown(e, 'Enter') && s.zoneIndex >= 0) {
        return { ...s, phase: 'dropped', done: { zone: s.zones[s.zoneIndex].id, via: 'key' } };
      }
      return s;
    }
    default:
      return s;
  }
}
