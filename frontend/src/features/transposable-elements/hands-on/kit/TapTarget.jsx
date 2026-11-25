import {cls, MIN_HIT_R} from './cls.js';

// Tap target (inside an SVG): click, touch, or Enter / Space. `hit` is either a circle
// {cx, cy, r} (r is raised to the 44 px minimum) or a closed path {d} whose filled area
// is the touch area (the caller makes it at least 44 units across). Children draw the
// visible part; focus and the expected halo are drawn on the hit shape.
export function TapTarget({label, hit, onTap, expected = false, className, children}) {
  const onKeyDown = e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (!e.repeat) onTap?.({via: 'key'});
  };
  const shape = hit.d != null
    ? kind => <path className={kind} d={hit.d} />
    : kind => <circle className={kind} cx={hit.cx} cy={hit.cy} r={Math.max(MIN_HIT_R, hit.r ?? MIN_HIT_R) + (kind === 'ho-halo' ? 4 : 0)} />;
  return <g role="button" tabIndex={0} aria-label={label} className={cls('ho-tap', expected && 'ho-expected', className)}
    onClick={() => onTap?.({via: 'pointer'})} onKeyDown={onKeyDown}>
    {children}
    {expected && shape('ho-halo')}
    {shape('ho-hit')}
  </g>;
}
