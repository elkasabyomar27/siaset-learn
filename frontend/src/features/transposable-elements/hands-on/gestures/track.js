const DIRS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };

export function trackStep(value, key, { step = 10, bigStep = 45, min = 0, max = 359, wrap = true } = {}) {
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
