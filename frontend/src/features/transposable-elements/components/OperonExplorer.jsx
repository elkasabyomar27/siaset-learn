import { useId, useState } from 'react';
import { SLOTS, TE_PROMOTER, DEFAULT_OPERON, OPERON_GOALS, simulateOperon } from '../operonModel.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { SwipeTarget } from '../hands-on/kit/SwipeTarget.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { Assumptions } from '../hands-on/kit/Assumptions.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { operonIntent } from '../hands-on/intents/operon.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

// SVG layout (x positions).
const P = [20, 90], A = [100, 300], B = [390, 590], DNA_Y = 104, END = 596, VIEW_W = 620, VIEW_H = 240, TRAY_Y = 208;
const TE_X = {promoter: [14, 96], geneA: [160, 242], between: [304, 386]};
const TRAY_AT = {element: {x: 100, y: TRAY_Y}, terminator: {x: 290, y: TRAY_Y}, bPromoter: {x: 480, y: TRAY_Y}};
const STATUS = {
  unchanged: {label: 'Unchanged', icon: '='},
  permitted: {label: 'Transcribed (new source)', icon: '↗'},
  reduced: {label: 'Reduced', icon: '↓'},
  undetermined: {label: 'Undetermined', icon: '?'},
  interrupted: {label: 'Coding interrupted', icon: '✂'},
};
const SLOT_ZONES = {promoter: [0, 124], geneA: [128, 276], between: [280, 424]};
const inBox = (x0, y0, w, h) => (x, y) => x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;
const PROMOTER_TEXT = {none: 'no outward promoter', right: 'an outward promoter pointing right', left: 'an outward promoter pointing left'};

function Transcript({ t, te, row }) {
  const y = DNA_Y - 26 - row * 16;
  const teX = te === null ? null : TE_X[{0: 'promoter', 1: 'geneA', 2: 'between'}[te]];
  let x1, x2;
  if (t.source === 'P') { x1 = P[1] + 4; x2 = t.blocked ? teX[0] - 2 : END; }
  else if (t.source === 'PB') { x1 = B[0] + 2; x2 = END; }
  else if (t.direction === 'right') { x1 = teX[1] + 2; x2 = END; }
  else { x1 = teX[0] - 2; x2 = 8; }
  const right = x2 > x1;
  const tip = right ? `M${x2 - 8} ${y - 5} L${x2} ${y} L${x2 - 8} ${y + 5}` : `M${x2 + 8} ${y - 5} L${x2} ${y} L${x2 + 8} ${y + 5}`;
  return <g className={`op-rna op-rna--${t.source.toLowerCase()}`}>
    <line x1={x1} x2={x2} y1={y} y2={y} />
    {t.blocked ? <path className="op-stop" d={`M${x2} ${y - 8} V${y + 8}`} /> : <path className="op-tip" d={tip} />}
    <text x={right ? x1 + 4 : x1 - 4} y={y - 6} textAnchor={right ? 'start' : 'end'}>{t.source === 'TE' ? 'from element' : t.source === 'PB' ? 'from B’s promoter' : 'from P'}</text>
  </g>;
}

// The element is dragged into a slot, a swipe turns its promoter, and the terminator and
// B-promoter pieces are dropped on the DNA (or back in the tray).
function OperonScene({ config, result, onGesture, setNote }) {
  const {scale} = useStage();
  const k = 1 / Math.max(scale, 0.05);
  const [over, setOver] = useState(null);
  const placed = config.slot !== 'none', teX = placed ? TE_X[config.slot] : null, teMid = teX ? (teX[0] + teX[1]) / 2 : 0;
  const {demo, activity, drag} = useDemoHand('drag', config.slot);
  const geneClass = g => `op-gene op-gene--${result.genes[g].status}`;
  const trayZone = {id: 'tray', label: 'the tray', contains: inBox(0, TRAY_Y - 34, VIEW_W, 70)};
  const slotZones = Object.entries(SLOT_ZONES).map(([id, [x0, x1]]) => ({id, label: SLOTS[id].toLowerCase(), contains: inBox(x0, DNA_Y - 50, x1 - x0, 110)}));
  const teZone = {id: 'te', label: 'the inserted element', contains: inBox(teX ? teX[0] - 20 : 0, DNA_Y - 20, teX ? teX[1] - teX[0] + 40 : 0, 70)};
  const bZone = {id: 'geneB', label: 'gene B', contains: inBox(B[0] - 10, DNA_Y - 50, B[1] - B[0] + 20, 110)};
  const send = g => { activity(); return onGesture(g); };
  const pieceHandlers = {onCarry: drag, onOver: setOver, onAnnounce: t => t && setNote(`Drop on: ${t}.`)};
  const termAt = placed && config.terminator ? {x: teMid, y: DNA_Y + 64} : TRAY_AT.terminator;
  const bAt = config.bPromoter ? {x: (B[0] + B[1]) / 2, y: DNA_Y + 64} : TRAY_AT.bPromoter;
  const elAt = placed ? {x: teMid, y: DNA_Y + 14} : TRAY_AT.element;
  return <>
    <rect className="gx-zone" data-over={over === 'tray'} x="6" y={TRAY_Y - 34} width={VIEW_W - 12} height="70" rx="12" />
    <text className="gx-small" x="16" y={TRAY_Y - 40}>TRAY: pieces to drag onto the DNA</text>
    <line className="op-dna" x1="6" x2={END + 6} y1={DNA_Y + 14} y2={DNA_Y + 14} />
    <g className={`op-promoter${result.te === 0 ? ' is-broken' : ''}`}><rect x={P[0]} y={DNA_Y} width={P[1] - P[0]} height="28" rx="5" /><text x={(P[0] + P[1]) / 2} y={DNA_Y + 19} textAnchor="middle">P</text></g>
    <g className={geneClass('A')}><path d={`M${A[0]} ${DNA_Y} H${A[1] - 16} L${A[1]} ${DNA_Y + 14} L${A[1] - 16} ${DNA_Y + 28} H${A[0]} Z`} /><text x={result.te === 1 ? 128 : (A[0] + A[1]) / 2} y={DNA_Y + 19} textAnchor="middle">A</text></g>
    <g className={geneClass('B')}><path d={`M${B[0]} ${DNA_Y} H${B[1] - 16} L${B[1]} ${DNA_Y + 14} L${B[1] - 16} ${DNA_Y + 28} H${B[0]} Z`} /><text x={(B[0] + B[1]) / 2} y={DNA_Y + 19} textAnchor="middle">B</text></g>
    {over && SLOT_ZONES[over] && <rect className="gx-zone" data-over="true" x={SLOT_ZONES[over][0]} y={DNA_Y - 50} width={SLOT_ZONES[over][1] - SLOT_ZONES[over][0]} height="110" rx="10" />}
    {over === 'geneB' && <rect className="gx-zone" data-over="true" x={B[0] - 10} y={DNA_Y - 50} width={B[1] - B[0] + 20} height="110" rx="10" />}
    {over === 'te' && teX && <rect className="gx-zone" data-over="true" x={teX[0] - 20} y={DNA_Y - 20} width={teX[1] - teX[0] + 40} height="70" rx="10" />}
    {result.transcripts.map((t, i) => <Transcript key={`${t.source}-${t.direction}-${config.slot}`} t={t} te={result.te} row={i} />)}

    <Draggable className="gx-element" x={elAt.x} y={elAt.y} zones={[...slotZones, trayZone]} hit={hitBox(placed ? teX[1] - teX[0] : 90, 40, scale)} expected={false}
      label={placed ? `Element: inserted ${SLOTS[config.slot].toLowerCase()}. Drag it to another slot, or back to the tray` : 'Element: in the tray. Drag it onto the promoter, gene A or the gap between A and B'}
      carriedLabel="Carrying the element. Press Enter to drop it, arrow keys to choose a slot or the tray" {...pieceHandlers}
      onCancel={() => setNote('The element is back where it was.')}
      onDrop={({zone}) => { setOver(null); const p = send({kind: 'drop', part: 'element', target: zone}); if (p) setNote(p.slot === 'none' ? 'The element is back in the tray: no insertion.' : `The element is ${SLOTS[p.slot].toLowerCase()}.`); }}>
      <rect className="gx-piece gx-piece-element" x={placed ? -(teX[1] - teX[0]) / 2 : -45} y={placed ? -20 : -20} width={placed ? teX[1] - teX[0] : 90} height="40" rx="7" />
      <text className="gx-text" y={placed ? 5 : 5} textAnchor="middle">TE</text>
    </Draggable>
    {placed && <SwipeTarget className="op-swipe" label={`Element carries ${PROMOTER_TEXT[config.tePromoter]}. Swipe across the promoter arrow, or press Enter, to change it`}
      line={{x1: teX[0], y1: DNA_Y - 34, x2: teX[1], y2: DNA_Y - 34}} band={Math.max(22, 14 * k)}
      onSwipe={() => { const p = send({kind: 'swipe', target: 'promoter'}, config); if (p) setNote(`Element now carries ${PROMOTER_TEXT[p.tePromoter]}.`); }}>
      <path className="gx-dna" strokeWidth="3" d={`M${teMid} ${DNA_Y - 6} V${DNA_Y - 34} ${config.tePromoter === 'left' ? `h-26 m10 -8 l-10 8 l10 8` : config.tePromoter === 'right' ? `h26 m-10 -8 l10 8 l-10 8` : 'h0'}`} style={{opacity: config.tePromoter === 'none' ? 0.35 : 1}} />
      <text className="gx-small" x={teMid} y={DNA_Y - 42} textAnchor="middle">{config.tePromoter === 'none' ? 'swipe: promoter?' : 'promoter'}</text>
    </SwipeTarget>}

    <Draggable className="gx-terminator" x={termAt.x} y={termAt.y} zones={placed ? [teZone, trayZone] : [trayZone]} hit={hitBox(60, 40, scale)}
      label={placed ? (config.terminator ? 'Terminator piece: on the element. Drag it back to the tray to remove it' : 'Terminator piece: in the tray. Drag it onto the element') : 'Terminator piece: in the tray. Place the element first'}
      carriedLabel="Carrying the terminator. Press Enter to drop it, arrow keys to choose the element or the tray" {...pieceHandlers}
      onCancel={() => setNote('The terminator is back where it was.')}
      onDrop={({zone}) => { setOver(null); const p = send({kind: 'drop', part: 'terminator', target: zone}, config); setNote(p ? (p.terminator ? 'The element now has a terminator.' : 'The terminator is back in the tray.') : 'Place the element in a slot first: a terminator needs an element.'); }}>
      <rect className="gx-piece gx-piece-tir" x="-30" y="-18" width="60" height="36" rx="7" /><text className="gx-text" y="5" textAnchor="middle">⊣ stop</text>
    </Draggable>
    <Draggable className="gx-bpromoter" x={bAt.x} y={bAt.y} zones={[bZone, trayZone]} hit={hitBox(90, 40, scale)}
      label={config.bPromoter ? 'B promoter piece: on gene B. Drag it back to the tray to remove it' : 'B promoter piece: in the tray. Drag it onto gene B'}
      carriedLabel="Carrying the B promoter. Press Enter to drop it, arrow keys to choose gene B or the tray" {...pieceHandlers}
      onCancel={() => setNote('The promoter is back where it was.')}
      onDrop={({zone}) => { setOver(null); const p = send({kind: 'drop', part: 'bPromoter', target: zone}, config); if (p) setNote(p.bPromoter ? 'Gene B now has its own promoter.' : 'Gene B’s promoter is back in the tray.'); }}>
      <rect className="gx-piece gx-piece-gene" x="-45" y="-18" width="90" height="36" rx="7" /><text className="gx-text" y="5" textAnchor="middle">B promoter</text>
    </Draggable>
    <DemoHand show={demo.show} still={demo.still} from={TRAY_AT.element} to={{x: (TE_X.between[0] + TE_X.between[1]) / 2, y: DNA_Y + 14}} text="Drag the element into a slot" labelAt={{x: 310, y: 172}} />
  </>;
}

export default function OperonExplorer() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [config, setConfig] = useState(DEFAULT_OPERON);
  const [reached, setReached] = useState(() => new Set());
  const [note, setNote] = useState('');
  const result = simulateOperon(config);
  const set = patch => setConfig(prev => {
    const next = {...prev, ...patch};
    const r = simulateOperon(next);
    setReached(seen => { const add = OPERON_GOALS.filter(g => g.done(r) && !seen.has(g.id)); return add.length ? new Set([...seen, ...add.map(g => g.id)]) : seen; });
    return next;
  });
  const onGesture = g => { const p = operonIntent(g, config); if (p) set(p); return p; };

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · INSERT INTO AN OPERON</p>
    <h2 id={`${uid}-title`}>Where it lands decides what changes.</h2>
    <p className="pb-goal">Drag an element into this idealised bacterial operon, swipe its promoter arrow, and add a terminator or a promoter for B. Watch which transcripts survive and how genes A and B respond.</p>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>IDEALISED E. COLI-LIKE OPERON · LEFT TO RIGHT</span><span>{SLOTS[config.slot]}</span></div>
      <div className="gx-scroll" style={{'--gx-min': `${VIEW_W}px`}}>
        <BenchStage variant="molecular" className="gx-stage" width={VIEW_W} height={VIEW_H}
          label={`Operon bench. Gene A: ${result.genes.A.text} Gene B: ${result.genes.B.text}`}
          after={<NextStep className="gx-note">{note || 'Drag the element into a slot on the DNA.'}</NextStep>}>
          <OperonScene config={config} result={result} onGesture={onGesture} setNote={setNote} />
        </BenchStage>
      </div>
      <figcaption className="pb-legend"><span><i className="sw-rna" />Transcript (arrow = direction)</span><span><i className="sw-stop" />Stopped by terminator</span><span><i className="sw-module" />Inserted element</span><span><i className="sw-host" />Gene</span></figcaption>
    </figure>

    <Assumptions items={[{key: 'assumeNoHidden', label: 'Assume no other promoters exist'}]} values={config} onChange={(key, value) => onGesture({kind: 'assume', control: key, value})} />

    <div className="op-results" role="status" aria-live="polite">
      {['A', 'B'].map(g => <div key={g} className={`op-result op-result--${result.genes[g].status}`}><b><span aria-hidden="true">{STATUS[result.genes[g].status].icon}</span> Gene {g}: {STATUS[result.genes[g].status].label}</b><p>{result.genes[g].text}</p></div>)}
    </div>
    {result.notes.length > 0 && <ul className="op-notes">{result.notes.map(n => <li key={n}>{n}</li>)}</ul>}

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {reached.size} / {OPERON_GOALS.length}</p>
      <ul>{OPERON_GOALS.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Idealised transcription under the stated assumptions, not universal TE rules. Transcription is not protein abundance.</p>
  </section>;
}
