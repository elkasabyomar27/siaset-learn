import {startHold} from '../gestures/index.js';
import {useGesture} from '../useGesture.js';
import {cls, MIN_HIT_R} from './cls.js';

// Press-and-hold target (inside an SVG). Pointer hold or held Enter/Space; the ring
// fills while held and releasing early cancels. Children draw the visible part.
export function HoldTarget({label, cx = 0, cy = 0, hitR = 26, ringR, ms, onHold, expected = false, className, children}) {
  const {handlers, state} = useGesture(startHold, {ms}, done => onHold?.(done));
  const r = Math.max(MIN_HIT_R, hitR), ring = ringR ?? r + 4, holding = state.phase === 'holding';
  return <g role="button" tabIndex={0} aria-label={label} className={cls('ho-hold', expected && 'ho-expected', holding && 'is-holding', className)} {...handlers}>
    {children}
    {expected && <circle className="ho-halo" cx={cx} cy={cy} r={ring} />}
    {holding && <>
      <circle className="ho-hold-ring ho-hold-ring-track" cx={cx} cy={cy} r={ring} />
      <circle className="ho-hold-ring ho-hold-ring-fill" cx={cx} cy={cy} r={ring} pathLength="100"
        transform={`rotate(-90 ${cx} ${cy})`} style={{'--ho-progress': state.progress}} />
    </>}
    <circle className="ho-hit ho-hold-hit" cx={cx} cy={cy} r={r} />
  </g>;
}
