const DIRS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };

export function trackStep(value, key, { step = 10, bigStep = 45, min = 0, max = 359, wrap = true } = {}) {
  if (typeof key !== 'string') return value;
  const big = key.startsWith('Shift+'), dir = DIRS[big ? key.slice(6) : key];
  if (!dir) return value;
  const next = value + dir * (big ? bigStep : step);
  if (!wrap) return Math.max(min, Math.min(max, next));
  const span = max - min + 1;
  return min + ((((next - min) % span) + span) % span);
}

// Degrees clockwise from 12 o'clock in screen coordinates (y down), 0..359.
// Same convention as StoryScenes.polar.
export function angleAt(x, y, cx, cy) {
  const deg = Math.atan2(x - cx, cy - y) * 180 / Math.PI;
  return Math.round(((deg % 360) + 360) % 360) % 360;
}

// Ring-track recognizer: pointer down/move previews angleAt, up confirms; arrows
// (Shift for big steps) preview from the current value, Enter confirms, Escape clears.
export const startTrack = ({ cx = 0, cy = 0, value = 0, ...opts } = {}) => ({
  phase: 'idle', cx, cy, value, opts, preview: null, done: null,
});

export function stepTrack(s, e) {
  if (s.done) return s;
  switch (e.type) {
    case 'down':
      return { ...s, phase: 'tracking', preview: angleAt(e.x, e.y, s.cx, s.cy) };
    case 'move':
      return s.phase === 'tracking' ? { ...s, preview: angleAt(e.x, e.y, s.cx, s.cy) } : s;
    case 'up':
      return s.phase === 'tracking' ? { ...s, phase: 'done', done: { value: s.preview, via: 'pointer' } } : s;
    case 'cancel':
      return s.phase === 'tracking' ? { ...s, phase: 'cancelled', preview: null } : s;
    case 'key-down': {
      if (e.key === 'Enter') return { ...s, phase: 'done', done: { value: s.preview ?? s.value, via: 'key' } };
      if (e.key === 'Escape') return s.preview == null ? s : { ...s, phase: 'idle', preview: null };
      if (typeof e.key !== 'string' || !DIRS[e.key.replace(/^Shift\+/, '')]) return s;
      return { ...s, phase: 'previewing', preview: trackStep(s.preview ?? s.value, e.key, s.opts) };
    }
    default:
      return s;
  }
}
