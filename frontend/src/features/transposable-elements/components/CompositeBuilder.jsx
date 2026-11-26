import { useId, useState } from 'react';
import { MODULES, CARGO, CARGO_GENE, REFERENCE, END_CHOICES, arrangement, matchElement, hintsToward, movingParts, endsUsed, describeDesign } from '../compositeBuilder.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { SwipeTarget } from '../hands-on/kit/SwipeTarget.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { compositeIntent } from '../hands-on/intents/composite.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

// Layout in SVG units.
const Y = 140, H = 46, HOST = 70, MOD = 160, CARGO_W = 150, GAP = 6, LIFT = -58;
const X = {hostL: 10, left: 10 + HOST + GAP, cargo: 10 + HOST + GAP + MOD + GAP, right: 10 + HOST + GAP + MOD + GAP + CARGO_W + GAP};
X.hostR = X.right + MOD + GAP;
const VIEW_W = X.hostR + HOST + 10, VIEW_H = 340;
const ENDS_AT = {left: 150, outer: 330, right: 510}, ENDS_Y = 292;
const isAt = i => ({x: 100 + i * 112, y: 36}), cargoAt = i => ({x: 470 + i * 84, y: 36});
const inBox = (x0, y0, w, h) => (x, y) => x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;

// IS modules and cargo genes are dragged onto the diagram, a swipe across an IS flips it, and the
// transposase token is dropped on the ends it should use.
function CompositeScene({ design, ends, moving, used, onChange, onEnds, setNote }) {
  const {scale} = useStage();
  const k = 1 / Math.max(scale, 0.05);
  const [over, setOver] = useState(null);
  const {demo, activity, drag} = useDemoHand('drag', design.module);
  const lift = part => (moving?.parts.includes(part) ? LIFT : 0);
  const sideZones = ['left', 'right'].map(s => ({id: s, label: `the ${s} IS slot`, contains: inBox(X[s], Y - 10, MOD, H + 20)}));
  const cargoZone = [{id: 'cargo', label: 'the cargo slot', contains: inBox(X.cargo, Y - 10, CARGO_W, H + 20)}];
  const endsZones = Object.keys(END_CHOICES).map(id => ({id: `ends-${id}`, label: END_CHOICES[id], contains: inBox(ENDS_AT[id] - 80, ENDS_Y - 30, 160, 60)}));
  const send = g => { activity(); const p = compositeIntent(g, design); if (p) ('ends' in p ? onEnds(p.ends) : g.kind === 'swipe' ? onChange(d => ({[g.target]: -d[g.target]})) : onChange(p)); return p; };
  const module = (side, x) => {
    const dir = design[side], name = `${design.module}-${side === 'left' ? 'L' : 'R'}`, y = Y + lift(side), dirText = dir === 1 ? 'pointing right' : 'pointing left';
    const tip = dir === 1 ? `M${MOD - 34} ${H / 2 - 9} l12 9 l-12 9` : `M34 ${H / 2 - 9} l-12 9 l12 9`;
    return <SwipeTarget key={side} className={`cb-${side}`} label={`${side === 'left' ? 'Left' : 'Right'} IS module ${name}, ${dirText}. Swipe across it, or press Enter, to flip its direction`}
      line={{x1: x, y1: y + H / 2, x2: x + MOD, y2: y + H / 2}} band={Math.max(34, 22 * k)}
      onSwipe={() => { const p = send({kind: 'swipe', target: side}); if (p) setNote(`${side === 'left' ? 'Left' : 'Right'} IS now points ${p[side] === 1 ? 'right' : 'left'}.`); }}>
      <g style={{transform: `translate(${x}px, ${y}px)`}}>
        <rect className="gx-piece gx-piece-element" width={MOD} height={H} rx="7" />
        <path className="gx-dna" strokeWidth="3" d={tip} />
        <text className="gx-text" x={MOD / 2} y={H / 2 + 5} textAnchor="middle">{name}</text>
        {[0, 1].map(end => <rect key={end} className={used.some(([s, e]) => s === side && e === end) ? 'gx-piece gx-piece-tir' : 'gx-piece'} x={end ? MOD - 9 : 0} y="0" width="9" height={H} rx="3" style={used.some(([s, e]) => s === side && e === end) ? {fill: 'var(--color-brand-highlight)'} : undefined} />)}
      </g>
    </SwipeTarget>;
  };
  return <>
    <text className="gx-small" x="12" y="14">IS MODULES: drop on a side</text>
    <text className="gx-small" x="440" y="14">CARGO GENES: drop on the cargo</text>
    {MODULES.map((m, i) => <Draggable key={m} className="gx-is" x={isAt(i).x} y={isAt(i).y} zones={sideZones} expected={false} hit={hitBox(96, 40, scale)}
      label={`IS module ${m}${design.module === m ? ' (in use)' : ''}. Drag it onto the left or right side`} carriedLabel={`Carrying ${m}. Press Enter to drop it, arrow keys to choose the left or right side`}
      onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop on: ${t}.`)} onCancel={() => setNote(`${m} is back in the tray.`)}
      onDrop={({zone}) => { setOver(null); if (send({kind: 'drop', part: 'module', module: m, target: zone})) setNote(`Both IS modules are now ${m}.`); }}>
      <rect className="gx-piece gx-piece-element" x="-48" y="-20" width="96" height="40" rx="8" style={{strokeWidth: design.module === m ? 4 : 1.5}} /><text className="gx-text" y="5" textAnchor="middle">{m}</text>
    </Draggable>)}
    {Object.entries(CARGO).map(([id, label], i) => <Draggable key={id} className="gx-cargo" x={cargoAt(i).x} y={cargoAt(i).y} zones={cargoZone} hit={hitBox(76, 40, scale)}
      label={`Cargo gene ${label}${design.cargo === id ? ' (in use)' : ''}. Drag it onto the cargo slot`} carriedLabel={`Carrying the ${label} gene. Press Enter to drop it on the cargo slot`}
      onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop on: ${t}.`)} onCancel={() => setNote('The gene is back in the tray.')}
      onDrop={({zone}) => { setOver(null); if (send({kind: 'drop', part: 'cargo', cargo: id, target: zone})) setNote(`Cargo is ${label.toLowerCase()}.`); }}>
      <rect className="gx-piece gx-piece-gene" x="-38" y="-20" width="76" height="40" rx="8" style={{strokeWidth: design.cargo === id ? 4 : 1.5}} /><text className="gx-text" y="5" textAnchor="middle">{CARGO_GENE[id]}</text>
    </Draggable>)}

    <rect className="gx-solid" x={X.hostL} y={Y + 12} width={HOST + GAP} height={H - 24} rx="4" />
    <rect className="gx-solid" x={X.hostR - GAP} y={Y + 12} width={HOST + GAP} height={H - 24} rx="4" />
    {moving && <rect className="gx-zone" x={moving.parts.includes('left') ? X.left : X.right} y={Y} width={moving.parts.length === 3 ? X.right + MOD - X.left : MOD} height={H} rx="7" />}
    {sideZones.map(z => over === z.id && <rect key={z.id} className="gx-zone" data-over="true" x={X[z.id]} y={Y - 10} width={MOD} height={H + 20} rx="10" />)}
    {over === 'cargo' && <rect className="gx-zone" data-over="true" x={X.cargo} y={Y - 10} width={CARGO_W} height={H + 20} rx="10" />}
    {module('left', X.left)}
    <g style={{transform: `translate(${X.cargo}px, ${Y + lift('cargo')}px)`}}>
      <path className="gx-piece gx-piece-gene" d={`M0 6 H${CARGO_W - 24} L${CARGO_W} ${H / 2} L${CARGO_W - 24} ${H - 6} H0 Z`} />
      <text className="gx-text" x={(CARGO_W - 12) / 2} y={H / 2 + 5} textAnchor="middle">{CARGO_GENE[design.cargo]}</text>
    </g>
    {module('right', X.right)}
    {moving && <text className="gx-small" x={moving.parts.length === 3 ? (X.left + X.right + MOD) / 2 : (moving.parts[0] === 'left' ? X.left : X.right) + MOD / 2} y={Y + LIFT - 12} textAnchor="middle">moves</text>}
    <text className="gx-small" x={X.hostL + 4} y={Y + H + 26}>host</text>
    <text className="gx-small" x={X.hostR + HOST - 4} y={Y + H + 26} textAnchor="end">host</text>

    <text className="gx-small" x="12" y={ENDS_Y - 46}>TRANSPOSASE ACTS ON: drag the token onto a slot</text>
    {endsZones.map(z => <g key={z.id}><rect className="gx-zone" data-over={over === z.id} x={ENDS_AT[z.id.slice(5)] - 80} y={ENDS_Y - 30} width="160" height="60" rx="10" />
      <text className="gx-small" x={ENDS_AT[z.id.slice(5)]} y={ENDS_Y + 44} textAnchor="middle">{END_CHOICES[z.id.slice(5)]}</text></g>)}
    <Draggable className="gx-transposase" x={ENDS_AT[ends]} y={ENDS_Y} zones={endsZones} hit={hitBox(120, 40, scale)}
      label={`Transposase: acting on ${END_CHOICES[ends].toLowerCase()}. Drag it to another set of ends`} carriedLabel="Carrying transposase. Press Enter to drop it, arrow keys to choose which ends"
      onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop on: ${t}.`)} onCancel={() => setNote('Transposase is back where it was.')}
      onDrop={({zone}) => { setOver(null); const p = send({kind: 'drop', part: 'transposase', target: zone}); if (p) setNote(`Transposase acts on ${END_CHOICES[p.ends].toLowerCase()}.`); }}>
      <rect className="gx-piece" x="-60" y="-20" width="120" height="40" rx="20" /><text className="gx-text" y="5" textAnchor="middle">transposase</text>
    </Draggable>
    <DemoHand show={demo.show} still={demo.still} from={isAt(1)} to={{x: X.left + MOD / 2, y: Y + H / 2}} text="Drag an IS onto a side" labelAt={{x: 300, y: 100}} />
  </>;
}

export default function CompositeBuilder() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [design, setDesign] = useState({module: 'IS50', left: 1, right: 1, cargo: 'tet'});
  const [ends, setEnds] = useState('outer');
  const [ran, setRan] = useState(false);
  const [target, setTarget] = useState('Tn5');
  const [matched, setMatched] = useState(() => new Set());
  const [note, setNote] = useState('');
  const match = matchElement(design), arr = arrangement(design), used = endsUsed(ends), moving = ran ? movingParts(ends) : null;
  const hints = hintsToward(design, target);

  // Functional updates so quick successive gestures never work from a stale design.
  function change(patch) {
    setRan(false);
    setDesign(prev => {
      const next = {...prev, ...(typeof patch === 'function' ? patch(prev) : patch)};
      const m = matchElement(next);
      if (m) setMatched(seen => seen.has(m) ? seen : new Set(seen).add(m));
      return next;
    });
  }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · ASSEMBLE A COMPOSITE TRANSPOSON</p>
    <h2 id={`${uid}-title`}>Two IS modules, one cargo. What moves?</h2>
    <p className="pb-goal">Drop IS modules on each side, swipe across an IS to flip its direction and drop a cargo gene in to rebuild a classical element. Then drag the transposase onto the ends it uses and run it.</p>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>{arr === 'direct' ? 'DIRECT REPEATS · BOTH MODULES POINT THE SAME WAY' : 'INVERTED REPEATS · MODULES POINT IN OPPOSITE DIRECTIONS'}</span><span className={match ? 'cb-match' : ''}>{match ? `✓ Matches classical ${match}` : 'No classical match yet'}</span></div>
      <div className="gx-scroll" style={{'--gx-min': `${VIEW_W}px`}}>
        <BenchStage variant="molecular" className="gx-stage" width={VIEW_W} height={VIEW_H}
          label={`${describeDesign(design)}${moving ? ` Transposase uses ${END_CHOICES[ends].toLowerCase()}: ${moving.text}` : ''}`}
          after={<NextStep className="gx-note">{note || 'Drop an IS module on a side, or swipe across one to flip it.'}</NextStep>}>
          <CompositeScene design={design} ends={ends} moving={moving} used={used} onChange={change} onEnds={id => { setEnds(id); setRan(false); }} setNote={setNote} />
        </BenchStage>
      </div>
      <figcaption>Arrow in each IS = direction. Highlighted IS ends are the ends the transposase uses. Host DNA is shown at both sides.</figcaption>
    </figure>

    <div className="cb-run">
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
