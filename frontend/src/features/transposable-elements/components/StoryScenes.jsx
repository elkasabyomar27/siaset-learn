// Schematic, hands-on scenes for the story labs. Interactions dispatch story actions; the engine
// (via storyLab.js) decides every molecular outcome. Angles are degrees clockwise from 12 o'clock.

export function polar(cx, cy, r, angle) {
  const a = (angle - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
export function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${((a1 - a0) % 360 + 360) % 360 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}
function angleFromEvent(e, cx, cy) {
  const svg = e.currentTarget.ownerSVGElement, m = svg?.getScreenCTM();
  if (!m) return 0;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return (Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 450) % 360;
}
const press = fn => ({role: 'button', tabIndex: 0, onClick: fn, onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }});

function RingTrack({ cx, cy, r, label, onPick }) {
  return <circle className="sl-ring-track" cx={cx} cy={cy} r={r} role="button" tabIndex={-1} aria-label={label} onClick={e => onPick(angleFromEvent(e, cx, cy))} />;
}

/* ---------------- Tn5: cut and paste ---------------- */
const D_Y = 120, EL = [180, 300], RING5 = [590, 185, 92];

// free: sandbox mode, where ends and scissors stay tappable and the bench explains what is not possible.
export function Tn5Scene({ s, dispatch, free: freeMode = false }) {
  const {stage, bound, cut} = s, free = cut.length === 2, inserted = stage >= 2;
  const tsdBlock = inserted ? s.history.state.molecules.find(m => m.id === 'target')?.blocks.find(b => b.kind === 'tsd') : null;
  // Same mapping as the engine view: boundary / 900 units of the ring.
  const tsdAngle = inserted ? (s.boundary ?? 200) / 900 * 360 : null;
  const end = (side) => {
    const x = side === 'left' ? EL[0] : EL[1], isBound = bound.includes(side), isCut = cut.includes(side);
    const canBind = (freeMode ? !inserted : stage === 0) && !isBound, canCut = freeMode ? !inserted && !isCut : stage === 1 && !isCut && s.answers.tn5 === 0;
    return <g key={side}>
      <rect className={`sl-tir${canBind ? ' is-target' : ''}`} x={side === 'left' ? x : x - 14} y={D_Y - 13} width="14" height="26" rx="3" {...(canBind ? press(() => dispatch({type: 'bind', end: side})) : {})} aria-label={canBind ? `Bind transposase to the ${side} end` : undefined} />
      {isBound && !inserted && <g className="sl-tnp" style={{transform: `translate(${side === 'left' ? x + 7 : x - 7}px, ${D_Y - 30}px)`}}><circle r="13" /><text y="4" textAnchor="middle">T</text></g>}
      {(freeMode ? !inserted : stage === 1) && <g className={`sl-scissors${canCut ? ' is-target' : ''}${isCut ? ' is-done' : ''}`} style={{transform: `translate(${x}px, ${D_Y + 34}px)`}} {...(canCut ? press(() => dispatch({type: 'cut', end: side})) : {})} aria-label={canCut ? `Cut at the ${side} end of Tn5` : undefined}><circle r="15" /><text y="5" textAnchor="middle">✂</text></g>}
    </g>;
  };
  return <svg className="sl-scene" viewBox="0 0 760 340" aria-label={inserted ? 'Tn5 now sits in the target ring between two purple host repeats. The donor is two separate broken pieces.' : free ? 'Tn5 has been cut free and is held by transposase above the broken donor. The target ring is ready.' : 'A linear donor DNA carries the gold Tn5 element between two ends. A circular target has no Tn5.'}>
    <text className="sl-caption" x="40" y="40">DONOR DNA · LINEAR</text>
    <g className="sl-donor-left" style={{transform: `translateX(${free || inserted ? -22 : 0}px)`}}><line className="sl-backbone sl-donor" x1="40" x2={EL[0]} y1={D_Y} y2={D_Y} />{(free || inserted) && <text className="sl-note" x={EL[0] - 6} y={D_Y + 34} textAnchor="end">broken end</text>}</g>
    <g className="sl-donor-right" style={{transform: `translateX(${free || inserted ? 22 : 0}px)`}}><line className="sl-backbone sl-donor" x1={EL[1]} x2="440" y1={D_Y} y2={D_Y} />{(free || inserted) && <text className="sl-note" x={EL[1] + 6} y={D_Y + 34}>broken end</text>}</g>
    {!inserted && <g className="sl-element-group" style={{transform: `translateY(${free ? -48 : 0}px)`}}>
      <rect className="sl-element" x={EL[0]} y={D_Y - 13} width={EL[1] - EL[0]} height="26" rx="4" />
      <text className="sl-element-label" x={(EL[0] + EL[1]) / 2} y={D_Y + 5} textAnchor="middle">Tn5 →</text>
      {bound.length === 2 && !free && <path className="sl-synapsis" d={`M ${EL[0] + 7} ${D_Y - 44} Q ${(EL[0] + EL[1]) / 2} ${D_Y - 80} ${EL[1] - 7} ${D_Y - 44}`} />}
      {end('left')}{end('right')}
    </g>}
    {stage === 0 && <g className="sl-tray">{[0, 1].filter(i => i >= bound.length).map(i => <g key={i} className="sl-tnp is-idle" style={{transform: `translate(${70 + i * 40}px, 290px)`}}><circle r="13" /><text y="4" textAnchor="middle">T</text></g>)}<text className="sl-note" x="40" y="322">transposase</text></g>}
    <text className="sl-caption" x={RING5[0] - 60} y="68">TARGET DNA · CIRCULAR</text>
    <circle className="sl-backbone sl-target" cx={RING5[0]} cy={RING5[1]} r={RING5[2]} fill="none" />
    {stage === 1 && free && <><circle className="sl-ring-glow" cx={RING5[0]} cy={RING5[1]} r={RING5[2]} /><RingTrack cx={RING5[0]} cy={RING5[1]} r={RING5[2]} label="Insert Tn5 at this point on the target ring" onPick={a => dispatch({type: 'insert', angle: a})} /><text className="sl-hint" x={RING5[0]} y={RING5[1] + 5} textAnchor="middle">tap the ring</text></>}
    {inserted && <g className="sl-pop">
      <path className="sl-element-arc" d={arc(...RING5, tsdAngle - 16, tsdAngle + 16)} />
      {[['target-tsd-left', -16], ['target-tsd-right', 16]].map(([id, off]) => { const a = tsdAngle + off, seen = s.inspected.includes(id), can = stage === 3 && !seen;
        return <path key={id} className={`sl-tsd${can ? ' is-target' : ''}${seen ? ' is-done' : ''}`} d={arc(...RING5, off < 0 ? a - 5 : a, off < 0 ? a : a + 5)} {...(can ? press(() => dispatch({type: 'inspect', feature: id})) : {})} aria-label={can ? `Inspect the ${off < 0 ? 'left' : 'right'} purple repeat` : undefined} />; })}
      <text className="sl-note" x={RING5[0]} y={RING5[1] + 4} textAnchor="middle">{tsdBlock ? `${tsdBlock.bp} bp repeats` : ''}</text>
    </g>}
  </svg>;
}

/* ---------------- Tn3: copy, join, separate ---------------- */
const DONOR3 = [220, 180, 82], TARGET3 = [545, 180, 82], CO = [385, 180, 118];
const COPY_SPAN = 34;

export function Tn3Scene({ s, dispatch }) {
  const {stage} = s, docked = stage >= 1, co = stage >= 3 && stage < 5, resolved = stage === 5;
  const shift = docked && !co && !resolved ? -158 : 0;
  const copyArc = (cx, cy, r, centre, id) => {
    const seen = s.inspected.includes(id), can = stage === 3 && !seen;
    return <path key={id} className={`sl-element-arc${can ? ' is-target' : ''}${seen ? ' is-done' : ''}`} d={arc(cx, cy, r, centre - COPY_SPAN / 2, centre + COPY_SPAN / 2)} {...(can ? press(() => dispatch({type: 'inspect', feature: id})) : {})} aria-label={can ? `Inspect Tn3 ${id === 'copy-1' ? 'copy 1' : 'copy 2'}` : undefined} />;
  };
  const res = (cx, cy, r, angle, i) => { const [x, y] = polar(cx, cy, r, angle), can = stage === 4;
    return <g key={i}><circle className={`sl-res${can ? ' is-target' : ''}`} cx={x} cy={y} r="7" {...(can ? press(() => dispatch({type: 'enzyme', available: !s.tnpR})) : {})} aria-label={can ? (s.tnpR ? 'Remove TnpR from res' : 'Dock TnpR on this res site') : undefined} />{stage === 4 && s.tnpR && <g className="sl-tnp sl-tnpr" style={{transform: `translate(${x}px, ${y - 24}px)`}}><circle r="12" /><text y="4" textAnchor="middle">R</text></g>}</g>; };
  return <svg className="sl-scene" viewBox="0 0 760 340" aria-label={resolved ? 'Two separate circles, donor and target, each with one Tn3; they may remain linked.' : co ? 'One large cointegrate circle containing both backbones and two Tn3 copies pointing the same way.' : docked ? 'Donor and target circles touch; Tn3 ends will be joined to the target.' : 'A donor circle carries one Tn3; a separate target circle has none.'}>
    {!co && !resolved && <>
      <text className="sl-caption" x={DONOR3[0] - 50} y="72">DONOR · CIRCULAR</text>
      <circle className="sl-backbone sl-donor" cx={DONOR3[0]} cy={DONOR3[1]} r={DONOR3[2]} fill="none" />
      <path className="sl-element-arc" d={arc(...DONOR3, 70, 120)} />{res(...DONOR3, 95, 'd')}
      <g style={{transform: `translateX(${shift}px)`}} className="sl-slide">
        <text className="sl-caption" x={TARGET3[0] - 50} y="72">TARGET · CIRCULAR</text>
        <circle className="sl-backbone sl-target" cx={TARGET3[0]} cy={TARGET3[1]} r={TARGET3[2]} fill="none" />
        {stage === 0 && <><circle className="sl-ring-glow" cx={TARGET3[0]} cy={TARGET3[1]} r={TARGET3[2]} /><RingTrack cx={TARGET3[0]} cy={TARGET3[1]} r={TARGET3[2]} label="Choose this target site" onPick={a => dispatch({type: 'dock-target', angle: a})} /><text className="sl-hint" x={TARGET3[0]} y={TARGET3[1] + 5} textAnchor="middle">tap the ring</text></>}
      </g>
      {docked && <path className="sl-transfer" d={`M ${polar(...DONOR3, 70)[0]} ${polar(...DONOR3, 70)[1]} Q 330 60 ${TARGET3[0] - 158 + 10} ${TARGET3[1] - TARGET3[2] + 8} M ${polar(...DONOR3, 120)[0]} ${polar(...DONOR3, 120)[1]} Q 330 300 ${TARGET3[0] - 158 + 10} ${TARGET3[1] + TARGET3[2] - 8}`} />}
    </>}
    {co && <g className="sl-pop">
      <text className="sl-caption" x={CO[0] - 70} y="44">COINTEGRATE · ONE CIRCLE</text>
      <path className="sl-backbone sl-donor" d={arc(...CO, 200, 340)} fill="none" />
      <path className="sl-backbone sl-target" d={arc(...CO, 20, 160)} fill="none" />
      {copyArc(...CO, 0, 'copy-1')}{copyArc(...CO, 180, 'copy-2')}
      {res(...CO, 0, 'r1')}{res(...CO, 180, 'r2')}
      {[20, 160].map(a => <path key={a} className="sl-tsd" d={arc(...CO, a === 20 ? 17 : 160, a === 20 ? 22 : 165)} />)}
      <text className="sl-note" x={CO[0]} y={CO[1] - 6} textAnchor="middle">donor backbone (left) + target backbone (right)</text>
      <text className="sl-note" x={CO[0]} y={CO[1] + 14} textAnchor="middle">two Tn3 copies, same direction</text>
    </g>}
    {resolved && <g className="sl-pop">
      <text className="sl-caption" x="200" y="62">DONOR REPLICON</text><text className="sl-caption" x="460" y="62">TARGET REPLICON</text>
      <circle className="sl-backbone sl-donor" cx="290" cy="185" r="88" fill="none" /><path className="sl-element-arc" d={arc(290, 185, 88, 330, 10)} />
      <circle className="sl-backbone sl-target" cx="470" cy="185" r="88" fill="none" /><path className="sl-element-arc" d={arc(470, 185, 88, 350, 30)} />
      <path className="sl-tsd" d={arc(470, 185, 88, 344, 349)} /><path className="sl-tsd" d={arc(470, 185, 88, 31, 36)} />
      <text className="sl-note" x="380" y="318" textAnchor="middle">Circles may remain linked; unlinking is not modelled.</text>
    </g>}
  </svg>;
}
