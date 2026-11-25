import {cls} from './cls.js';

const WORDS = {hold: 'Press and hold', swipe: 'Swipe across', drag: 'Drag', track: 'Slide along the ring', tap: 'Tap'};

// Ghost hand demonstrating a gesture (inside an SVG), driven by demoHand():
// show = gesture kind or null, still = reduced motion (static arrow + text).
// Decorative: NextStep carries the instruction for assistive technology.
// labelAt: where the text goes (default: just under `from`).
export function DemoHand({show, still = false, from, to = from, text, labelAt, className}) {
  if (!show || !from) return null;
  const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy);
  const ux = len ? dx / len : 0, uy = len ? dy / len : 0, head = 9, wing = head * 0.6;
  const bx = to.x - ux * head, by = to.y - uy * head;
  return <g className={cls('ho-hand-layer', className)} aria-hidden="true" pointerEvents="none">
    {still && len > 0 && <g className="ho-hand-arrow">
      <line x1={from.x} y1={from.y} x2={bx} y2={by} />
      <polygon points={`${to.x},${to.y} ${bx - uy * wing},${by + ux * wing} ${bx + uy * wing},${by - ux * wing}`} />
    </g>}
    <g transform={`translate(${from.x} ${from.y})`}>
      <g className="ho-hand" data-moving={still ? 'false' : 'true'} style={{'--ho-dx': `${dx}px`, '--ho-dy': `${dy}px`}}>
        <circle className="ho-hand-halo" r="14" />
        <circle className="ho-hand-tip" r="6" />
      </g>
    </g>
    <text className="ho-hand-label" x={labelAt?.x ?? from.x} y={labelAt?.y ?? from.y + 34} textAnchor="middle">{text ?? WORDS[show] ?? show}</text>
  </g>;
}
