import {useState} from 'react';
import {startDrag} from '../gestures/index.js';
import {useGesture} from '../useGesture.js';
import {cls, MIN_HIT, MIN_HIT_R} from './cls.js';

const DEFAULT_HIT = {x: -MIN_HIT_R, y: -MIN_HIT_R, width: MIN_HIT, height: MIN_HIT};
const isActive = s => s.phase === 'dragging' || s.phase === 'carrying';

// Draggable item (inside an SVG), drawn by `children` around its local origin and
// placed at (x, y). zones: [{id, label, contains(x, y), x?, y?}] in the parent's
// coordinates; a zone with x/y is a magnet: the item snaps there while over it.
// Pointer: drag and release over a zone. Keyboard: Enter picks up, arrows/Tab move
// through zones (each zone's label goes to onAnnounce, for NextStep), Enter drops,
// Escape cancels. Drops outside every zone spring back and call onCancel.
export function Draggable({
  label, carriedLabel, zones = [], x = 0, y = 0, hit = DEFAULT_HIT, expected = false,
  onDrop, onCancel, onAnnounce, onOver, onCarry, className, children,
}) {
  const [grab, setGrab] = useState(null);
  const {handlers, state} = useGesture(startDrag, {zones}, done => onDrop?.(done), (next, prev) => {
    if (next.phase === 'dragging' && prev.phase !== 'dragging') setGrab({x: next.x, y: next.y});
    const active = isActive(next), was = isActive(prev);
    if (active !== was) onCarry?.(active);
    const over = active ? next.over : null, wasOver = was ? prev.over : null;
    if (over !== wasOver) onOver?.(over);
    if (next.phase === 'carrying' && (prev.phase !== 'carrying' || next.zoneIndex !== prev.zoneIndex)) {
      onAnnounce?.(next.zoneIndex >= 0 ? next.zones[next.zoneIndex].label : '');
    }
    if (next.phase === 'cancelled' && prev.phase !== 'cancelled') onCancel?.();
  });

  const active = isActive(state), dragging = state.phase === 'dragging';
  const zone = active && state.zoneIndex >= 0 ? state.zones[state.zoneIndex] : null;
  let px = x, py = y;
  if (zone && zone.x != null && zone.y != null) { px = zone.x; py = zone.y; }
  else if (dragging) { const g = grab ?? state; px = x + state.x - g.x; py = y + state.y - g.y; }

  return <g role="button" tabIndex={0} aria-label={active ? (carriedLabel ?? label) : label}
    className={cls('ho-drag', expected && 'ho-expected', className)} data-dragging={dragging ? 'true' : 'false'}
    style={{transform: `translate(${px}px, ${py}px)`}} {...handlers}>
    <g className={cls('ho-lift', active && 'ho-carried')}>{children}</g>
    <rect className="ho-hit" x={hit.x} y={hit.y} width={Math.max(MIN_HIT, hit.width)} height={Math.max(MIN_HIT, hit.height)} />
  </g>;
}
