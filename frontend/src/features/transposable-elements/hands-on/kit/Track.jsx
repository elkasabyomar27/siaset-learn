import {startTrack} from '../gestures/index.js';
import {useGesture} from '../useGesture.js';
import {cls, MIN_HIT} from './cls.js';

// Degrees clockwise from 12 o'clock (same convention as angleAt).
const polar = (cx, cy, r, deg) => [cx + r * Math.sin(deg * Math.PI / 180), cy - r * Math.cos(deg * Math.PI / 180)];
export const ringArc = (cx, cy, r, from, to) => {
  const [ax, ay] = polar(cx, cy, r, from), [bx, by] = polar(cx, cy, r, to);
  return `M${ax.toFixed(2)} ${ay.toFixed(2)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${bx.toFixed(2)} ${by.toFixed(2)}`;
};

// Position on a ring track (inside an SVG). Pointer: press on the ring and slide,
// release confirms. Keyboard: arrows preview (Shift for big steps) with a ghost arc,
// Enter confirms, Escape clears. onPreview(deg) lets the parent speak the value.
// wrap=false stops the arrow keys at both ends (a timeline, not a clock).
// hitWidth: the touch band across the ring, in viewBox units (>= 44). Scenes drawn small pass
// 44 / scale so the band stays 44 css px.
export function Track({label, cx, cy, r, value = 0, step, bigStep, wrap = true, ghostSpan = 8, hitWidth = MIN_HIT, onPreview, onConfirm, expected = false, className}) {
  const {handlers, state} = useGesture(startTrack, {cx, cy, value, step, bigStep, wrap}, done => onConfirm?.(done.value, done), (next, prev) => {
    if (next.preview != null && next.preview !== prev.preview) onPreview?.(next.preview);
  });
  const p = state.preview, dot = p != null ? polar(cx, cy, r, p) : null, band = Math.max(MIN_HIT, hitWidth);
  return <g role="button" tabIndex={0} aria-label={label} className={cls('ho-track', expected && 'ho-expected', className)} {...handlers}>
    {expected && <circle className="ho-halo" cx={cx} cy={cy} r={r} />}
    {dot && <>
      <path className="ho-ghost" d={ringArc(cx, cy, r, p - ghostSpan, p + ghostSpan)} />
      <circle className="ho-ghost-dot" cx={dot[0]} cy={dot[1]} r="6" />
    </>}
    <circle className="ho-focus-ring" cx={cx} cy={cy} r={r} />
    <circle className="ho-hit ho-track-hit" cx={cx} cy={cy} r={Math.max(r, band / 2)} strokeWidth={band} pointerEvents="stroke" />
  </g>;
}
