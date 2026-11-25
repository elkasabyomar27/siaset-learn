import {startHoldSwipe, SWIPE_BAND} from '../gestures/index.js';
import {useGesture} from '../useGesture.js';
import {cls, MIN_HIT_R} from './cls.js';

// One target with two gestures (inside an SVG): press and hold to `onHold`, or swipe
// across `line` to `onSwipe`. Keyboard: hold Enter/Space for the hold, a quick press for
// the swipe, so the label must name both. The hit area is the swipe band around `line`
// (at least 44 units each way); the hold ring is drawn at (cx, cy).
export function HoldSwipeTarget({label, cx, cy, ringR = 24, ms, line, band = SWIPE_BAND, onHold, onSwipe, expected = false, className, children}) {
  const {handlers, state} = useGesture(startHoldSwipe, {line, band, ms}, done => (done.kind === 'hold' ? onHold : onSwipe)?.(done));
  const {x1, y1, x2, y2} = line, len = Math.hypot(x2 - x1, y2 - y1), half = Math.max(MIN_HIT_R, band);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, w = len + 2 * half;
  const holding = state.phase === 'holding';
  return <g role="button" tabIndex={0} aria-label={label} className={cls('ho-hold', 'ho-holdswipe', expected && 'ho-expected', holding && 'is-holding', className)} {...handlers}>
    {children}
    {expected && <circle className="ho-halo" cx={cx} cy={cy} r={ringR} />}
    {holding && <>
      <circle className="ho-hold-ring ho-hold-ring-track" cx={cx} cy={cy} r={ringR} />
      <circle className="ho-hold-ring ho-hold-ring-fill" cx={cx} cy={cy} r={ringR} pathLength="100"
        transform={`rotate(-90 ${cx} ${cy})`} style={{'--ho-progress': state.progress}} />
    </>}
    <rect className="ho-hit" x={-w / 2} y={-half} width={w} height={2 * half} transform={`translate(${mx} ${my}) rotate(${angle})`} />
  </g>;
}
