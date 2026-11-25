import {startSwipe, SWIPE_BAND} from '../gestures/index.js';
import {useGesture} from '../useGesture.js';
import {cls, MIN_HIT_R} from './cls.js';

// Swipe-across target (inside an SVG). `line` {x1,y1,x2,y2} is the segment to cut
// across; Enter is the keyboard equivalent, so the label names the action.
export function SwipeTarget({label, line, band = SWIPE_BAND, onSwipe, expected = false, className, children}) {
  const {handlers} = useGesture(startSwipe, {line, band}, done => onSwipe?.(done));
  const {x1, y1, x2, y2} = line, len = Math.hypot(x2 - x1, y2 - y1), half = Math.max(MIN_HIT_R, band);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const w = len + 2 * half;
  return <g role="button" tabIndex={0} aria-label={label} className={cls('ho-swipe', expected && 'ho-expected', className)} {...handlers}>
    {children}
    {expected && <line className="ho-swipe-guide" x1={x1} y1={y1} x2={x2} y2={y2} />}
    <rect className="ho-hit" x={-w / 2} y={-half} width={w} height={2 * half} transform={`translate(${mx} ${my}) rotate(${angle})`} />
  </g>;
}
