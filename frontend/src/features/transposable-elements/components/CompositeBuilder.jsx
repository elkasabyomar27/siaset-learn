import { useId, useState } from 'react';
import { MODULES, CARGO, CARGO_GENE, REFERENCE, END_CHOICES, arrangement, matchElement, hintsToward, movingParts, endsUsed, describeDesign } from '../compositeBuilder.js';
import './partsBench.css';

// Layout in SVG units.
const Y = 92, H = 46, HOST = 70, MOD = 160, CARGO_W = 150, GAP = 6, LIFT = -58;
const X = {hostL: 10, left: 10 + HOST + GAP, cargo: 10 + HOST + GAP + MOD + GAP, right: 10 + HOST + GAP + MOD + GAP + CARGO_W + GAP};
X.hostR = X.right + MOD + GAP;
const VIEW_W = X.hostR + HOST + 10, VIEW_H = 190;

function Module({ side, design, used, moving }) {
  const x = X[side], dir = design[side], name = `${design.module}-${side === 'left' ? 'L' : 'R'}`;
  const tip = dir === 1 ? `M${MOD - 34} ${H / 2 - 9} l12 9 l-12 9` : `M34 ${H / 2 - 9} l-12 9 l12 9`;
  return <g className={`cb-module${moving ? ' is-moving' : ''}`} style={{transform: `translate(${x}px, ${Y + (moving ? LIFT : 0)}px)`}}>
    <rect className="cb-module-body" width={MOD} height={H} rx="7" />
    <path className="cb-module-arrow" d={tip} />
    <text x={MOD / 2} y={H / 2 + 5} textAnchor="middle">{name}</text>
    {[0, 1].map(end => <rect key={end} className={`cb-end${used.some(([s, e]) => s === side && e === end) ? ' is-used' : ''}`} x={end ? MOD - 9 : 0} y="0" width="9" height={H} rx="3" />)}
  </g>;
}

export default function CompositeBuilder() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [design, setDesign] = useState({module: 'IS50', left: 1, right: 1, cargo: 'tet'});
  const [ends, setEnds] = useState('outer');
  const [ran, setRan] = useState(false);
  const [target, setTarget] = useState('Tn5');
  const [matched, setMatched] = useState(() => new Set());
  const match = matchElement(design), arr = arrangement(design), used = endsUsed(ends), moving = ran ? movingParts(ends) : null;
  const hints = hintsToward(design, target);

  // Functional updates so quick successive clicks never work from a stale design.
  function change(patch) {
    setRan(false);
    setDesign(prev => {
      const next = {...prev, ...(typeof patch === 'function' ? patch(prev) : patch)};
      const m = matchElement(next);
      if (m) setMatched(seen => seen.has(m) ? seen : new Set(seen).add(m));
      return next;
    });
  }
  const isMoving = part => !!moving?.parts.includes(part);

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · ASSEMBLE A COMPOSITE TRANSPOSON</p>
    <h2 id={`${uid}-title`}>Two IS modules, one cargo. What moves?</h2>
    <p className="pb-goal">Pick the IS modules, flip their direction and choose the cargo to rebuild a classical element. Then choose which ends transposase uses and watch what moves.</p>

    <div className="cb-controls">
      <div className="cb-control" role="group" aria-label="IS module type"><span>IS modules</span><div>{MODULES.map(m => <button type="button" key={m} className="outline-button" aria-pressed={design.module === m} onClick={() => change({module: m})}>{m}</button>)}</div></div>
      <div className="cb-control" role="group" aria-label="Module directions"><span>Directions</span><div>
        <button type="button" className="outline-button" onClick={() => change(d => ({left: -d.left}))}>Flip left {design.left === 1 ? '→' : '←'}</button>
        <button type="button" className="outline-button" onClick={() => change(d => ({right: -d.right}))}>Flip right {design.right === 1 ? '→' : '←'}</button>
      </div></div>
      <div className="cb-control" role="group" aria-label="Cargo"><span>Cargo</span><div>{Object.entries(CARGO).map(([id, label]) => <button type="button" key={id} className="outline-button" aria-pressed={design.cargo === id} onClick={() => change({cargo: id})}>{label.replace(' resistance', '')}<small> resistance</small></button>)}</div></div>
    </div>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>{arr === 'direct' ? 'DIRECT REPEATS · BOTH MODULES POINT THE SAME WAY' : 'INVERTED REPEATS · MODULES POINT IN OPPOSITE DIRECTIONS'}</span><span className={match ? 'cb-match' : ''}>{match ? `✓ Matches classical ${match}` : 'No classical match yet'}</span></div>
      <div className="cb-canvas">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={`${describeDesign(design)}${moving ? ` Transposase uses ${END_CHOICES[ends].toLowerCase()}: ${moving.text}` : ''}`}>
          <rect className="cb-host" x={X.hostL} y={Y + 12} width={HOST + GAP} height={H - 24} rx="4" />
          <rect className="cb-host" x={X.hostR - GAP} y={Y + 12} width={HOST + GAP} height={H - 24} rx="4" />
          {moving && <rect className="cb-gap" x={moving.parts.includes('left') ? X.left : X.right} y={Y} width={moving.parts.length === 3 ? X.right + MOD - X.left : MOD} height={H} rx="7" />}
          <Module side="left" design={design} used={used} moving={isMoving('left')} />
          <g className={`cb-cargo${isMoving('cargo') ? ' is-moving' : ''}`} style={{transform: `translate(${X.cargo}px, ${Y + (isMoving('cargo') ? LIFT : 0)}px)`}}>
            <path className="cb-cargo-body" d={`M0 6 H${CARGO_W - 24} L${CARGO_W} ${H / 2} L${CARGO_W - 24} ${H - 6} H0 Z`} />
            <text x={(CARGO_W - 12) / 2} y={H / 2 + 5} textAnchor="middle">{CARGO_GENE[design.cargo]}</text>
          </g>
          <Module side="right" design={design} used={used} moving={isMoving('right')} />
          {moving && <text className="cb-moving-label" x={moving.parts.length === 3 ? (X.left + X.right + MOD) / 2 : (moving.parts[0] === 'left' ? X.left : X.right) + MOD / 2} y={Y + LIFT - 12} textAnchor="middle">moves</text>}
          <text className="cb-axis" x={X.hostL + 4} y={Y + H + 26}>host</text>
          <text className="cb-axis" x={X.hostR + HOST - 4} y={Y + H + 26} textAnchor="end">host</text>
        </svg>
      </div>
      <figcaption className="pb-legend"><span><i className="sw-module" />IS module (arrow = direction)</span><span><i className="sw-end" />Terminal end</span><span><i className="sw-used" />Ends used by transposase</span><span><i className="sw-cargo" />Cargo gene</span><span><i className="sw-host" />Host DNA</span></figcaption>
    </figure>

    <div className="cb-run">
      <div className="cb-control" role="group" aria-label="Ends used by transposase"><span>Transposase acts on</span><div>{Object.entries(END_CHOICES).map(([id, label]) => <button type="button" key={id} className="outline-button" aria-pressed={ends === id} onClick={() => { setEnds(id); setRan(false); }}>{label}</button>)}</div></div>
      <div className="pb-actions"><button type="button" className="primary-button" onClick={() => setRan(true)} disabled={ran}>Run transposase →</button>{ran && <button type="button" className="outline-button" onClick={() => setRan(false)}>Put it back</button>}</div>
    </div>
    <div className={`pb-verdict${moving ? ' is-good' : ''}`} role="status" aria-live="polite">{moving ? <><b>{moving.parts.length === 3 ? 'The whole composite moves.' : 'Only one IS moves.'}</b> {moving.text}</> : <><b>{END_CHOICES[ends]}.</b> Press “Run transposase” to see which DNA moves.</>}</div>

    <section className="pb-goals" aria-label="Rebuild challenge">
      <div className="cb-challenge-head"><p className="eyebrow">REBUILD CHALLENGE · {matched.size} / 3</p><div role="group" aria-label="Choose an element to rebuild">{Object.keys(REFERENCE).map(name => <button type="button" key={name} className="outline-button" aria-pressed={target === name} onClick={() => setTarget(name)}>{matched.has(name) ? '✓ ' : ''}{name}</button>)}</div></div>
      {hints.length === 0 ? <p className="cb-hint is-done">✓ This is {target}. {REFERENCE[target].note}</p> : <ul>{hints.map(h => <li key={h}><span aria-hidden="true">○</span>{h}</li>)}</ul>}
    </section>
    <details className="tsd-text"><summary>Read this diagram as text</summary><p>{describeDesign(design)} {match ? `This matches classical ${match}.` : ''}</p></details>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Module orientation is architecture; it does not by itself establish a transposition pathway. Direct IS repeats are not host-derived TSDs.</p>
  </section>;
}
