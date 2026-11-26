import { useId, useState } from 'react';
import { ANATOMY_CASES, LABELS, checkDissection, insideBracket } from '../anatomyLab.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { SwipeTarget } from '../hands-on/kit/SwipeTarget.jsx';
import { TapTarget } from '../hands-on/kit/TapTarget.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { anatomyIntent } from '../hands-on/intents/anatomy.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

const SHORT = {host: 'Host', tsd: 'TSD', tir: 'TIR', transposase: 'Transposase', cargo: 'Cargo'};
const PIECE = {tsd: 'gx-piece-tsd', tir: 'gx-piece-tir', transposase: 'gx-piece-gene', cargo: 'gx-piece-element', host: 'gx-piece-target'};
const arrow = d => d === 1 ? '→' : d === -1 ? '←' : '';
const blank = () => ({left: null, right: null, labels: {}, direction: null, selected: null, result: null});

const W = 640, H = 310, X0 = 32, UNIT = 72, SEG_W = 64, SEG_Y = 140, SEG_H = 56, MID = SEG_Y + SEG_H / 2;
const gapX = i => X0 + i * UNIT - 4;
const segX = i => X0 + i * UNIT;
const tagHome = i => ({x: 88 + i * 112, y: 44});
const bracketHome = side => ({x: side === 'left' ? 110 : 210, y: 262});
const ARROW = {x1: 396, y1: 262, x2: 556, y2: 262};

function Scene({ c, w, onPatch, setNote, showResult }) {
  const {scale} = useStage();
  const [over, setOver] = useState(null);
  const {demo, activity, drag} = useDemoHand('drag', c.id);
  const k = 1 / Math.max(scale, 0.05);
  const n = c.segments.length;
  const gapZones = Array.from({length: n + 1}, (_, i) => ({id: i, label: i === n ? 'the gap after the last segment' : `the gap before segment ${i + 1}`, contains: (x, y) => Math.abs(x - gapX(i)) <= 18 && y >= 100 && y <= 232}));
  const segZones = c.segments.map((_, i) => ({id: i, label: `segment ${i + 1}`, contains: (x, y) => x >= segX(i) - 4 && x <= segX(i) + SEG_W + 4 && y >= SEG_Y - 10 && y <= SEG_Y + SEG_H + 10}));
  const patch = g => { activity(); const p = anatomyIntent(g, w); if (p) onPatch(p); return p; };
  const dirText = w.direction === 'right' ? 'rightward' : w.direction === 'left' ? 'leftward' : 'not chosen yet';
  return <>
    <text className="gx-small" x="32" y="16">NAME TAGS: drag one onto a segment</text>
    {Object.entries(LABELS).map(([kind, full], i) => <Draggable key={kind} className="gx-tag" x={tagHome(i).x} y={tagHome(i).y} zones={segZones} expected={false} hit={hitBox(104, 40, scale)}
      label={`Name tag: ${full}. Drag it onto a segment`} carriedLabel={`Carrying the ${full} tag. Press Enter to put it on a segment, arrow keys to choose the segment`}
      onCarry={drag} onOver={id => setOver(id === null ? null : `seg${id}`)} onAnnounce={t => t && setNote(`Drop on: ${t}.`)} onCancel={() => setNote('The tag is back in the tray.')}
      onDrop={({zone}) => { setOver(null); if (patch({kind: 'drop', target: 'segment', index: zone, tag: kind})) setNote(`Segment ${zone + 1} named ${SHORT[kind]}.`); }}>
      <rect className={`gx-piece ${PIECE[kind]}`} x="-52" y="-20" width="104" height="40" rx="8" /><text className="gx-text" y="5" textAnchor="middle">{SHORT[kind]}</text>
    </Draggable>)}

    {c.segments.map((s, i) => {
      const named = w.labels[i], res = showResult ? w.result.labelResults[i] : null;
      const label = `Segment ${i + 1}${named ? `, named ${LABELS[named]}` : ', not named yet'}${s.dir ? `, arrow pointing ${s.dir === 1 ? 'right' : 'left'}` : ''}. Activate to read its clue`;
      return <TapTarget key={i} label={label} hit={{d: `M${segX(i)} ${SEG_Y} h${SEG_W} v${SEG_H} h${-SEG_W} Z`}} onTap={() => { patch({kind: 'tap', target: 'segment', index: i}); setNote(`Segment ${i + 1}: read the clue, then drop a name tag on it.`); }}>
        <rect className={`gx-piece ${named ? PIECE[named] : ''}`} data-over={over === `seg${i}`} x={segX(i)} y={SEG_Y} width={SEG_W} height={SEG_H} rx="8"
          style={{strokeWidth: insideBracket(i, w.left, w.right) || w.selected === i ? 3.5 : 1.5, strokeDasharray: w.selected === i ? '6 3' : undefined}} />
        <text className="gx-small" x={segX(i) + SEG_W / 2} y={SEG_Y + 16} textAnchor="middle">{arrow(s.dir)}</text>
        <text className="gx-text" x={segX(i) + SEG_W / 2} y={SEG_Y + 36} textAnchor="middle">{named ? SHORT[named] : `#${i + 1}`}</text>
        {res !== null && <text className={res ? 'gx-mark-good' : 'gx-mark-bad'} x={segX(i) + SEG_W - 12} y={SEG_Y + 14} textAnchor="middle" fontSize="13">{res ? '✓' : '✗'}</text>}
      </TapTarget>;
    })}

    {['left', 'right'].map(side => {
      const g = w[side], placed = g !== null, pos = placed ? {x: gapX(g), y: MID} : bracketHome(side);
      return <Draggable key={side} className="gx-bracket" x={pos.x} y={pos.y} zones={gapZones} expected={!placed && w.left === null && w.right === null && side === 'left'}
        hit={placed ? {x: -Math.max(15, 22 * k), y: -80, width: Math.max(30, 44 * k), height: 134} : hitBox(80, 40, scale)}
        label={placed ? `${side === 'left' ? 'Left' : 'Right'} bracket, before segment ${g + 1}. Drag it to another gap` : `${side === 'left' ? 'Left' : 'Right'} bracket, not placed. Drag it into a gap`}
        carriedLabel={`Carrying the ${side} bracket. Press Enter to place it, arrow keys to choose the gap`}
        onCarry={drag} onOver={id => setOver(id === null ? null : `gap${id}`)} onAnnounce={t => t && setNote(`Drop in: ${t}.`)} onCancel={() => setNote('The bracket is back where it was.')}
        onDrop={({zone}) => { setOver(null); if (patch({kind: 'drop', target: 'gap', index: zone, bracket: side})) setNote(`${side === 'left' ? 'Left' : 'Right'} bracket placed before segment ${zone + 1}.`); }}>
        {placed && <rect className="gx-piece gx-piece-target" x="-3" y="-50" width="6" height="100" rx="3" />}
        <rect className="gx-piece gx-piece-target" x={placed ? -26 : -40} y={placed ? -78 : -18} width={placed ? 52 : 80} height="32" rx="8" />
        <text className="gx-text" x="0" y={placed ? -57 : 3} textAnchor="middle">{side === 'left' ? '[ left' : 'right ]'}</text>
      </Draggable>;
    })}

    <text className="gx-small" x={ARROW.x1} y="232">The transposase gene reads {dirText}</text>
    <SwipeTarget className="gx-dir" label={`Transposase reading direction: ${dirText}. Swipe across the arrow, or press Enter, to flip it`} line={ARROW} band={Math.max(34, 22 * k)}
      onSwipe={() => { const p = patch({kind: 'swipe', target: 'arrow'}); if (p) setNote(`Transposase gene reads ${p.direction === 'right' ? 'rightward' : 'leftward'}.`); }}>
      <line className="gx-dna" x1={ARROW.x1} y1={ARROW.y1} x2={ARROW.x2} y2={ARROW.y2} strokeDasharray={w.direction ? undefined : '8 8'} />
      <text className="gx-text" x={(ARROW.x1 + ARROW.x2) / 2} y={ARROW.y1 + 5} textAnchor="middle" fontSize="22">{w.direction === 'right' ? '→' : w.direction === 'left' ? '←' : '?'}</text>
    </SwipeTarget>
    <DemoHand show={demo.show} still={demo.still} from={bracketHome('left')} to={{x: gapX(1), y: MID}} text="Drag a bracket into a gap" labelAt={{x: 160, y: 296}} />
  </>;
}

export default function AnatomyLab() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [caseIndex, setCaseIndex] = useState(0);
  const [work, setWork] = useState(() => ANATOMY_CASES.map(blank));
  const [solved, setSolved] = useState(() => new Set());
  const [note, setNote] = useState('');
  const c = ANATOMY_CASES[caseIndex], w = work[caseIndex];
  const update = patch => setWork(all => all.map((x, i) => i === caseIndex ? {...x, ...patch, result: null} : x));
  // Dropping a tag also opens that segment's clue; tapping a segment only selects it (the old behaviour).
  const apply = patch => 'selected' in patch ? setWork(all => all.map((x, k) => k === caseIndex ? {...x, selected: patch.selected} : x))
    : update('labels' in patch ? {...patch, selected: Number(Object.keys(patch.labels).find(i => patch.labels[i] !== w.labels[i]) ?? w.selected)} : patch);

  function check() {
    const result = checkDissection(c, w);
    setWork(all => all.map((x, i) => i === caseIndex ? {...x, result} : x));
    if (result.allOk) setSolved(prev => new Set(prev).add(c.id));
  }
  const sel = w.selected !== null ? c.segments[w.selected] : null;

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · DISSECT AN ELEMENT</p>
    <h2 id={`${uid}-title`}>Where does the element start and end, and what is inside?</h2>
    <p className="pb-goal">This DNA has an element inserted in it. (1) Drag the two brackets into the gaps to bracket the element. (2) Tap each segment, read its clue and drop the right name tag on it. (3) Swipe across the arrow to say which way the transposase gene reads. Then check.</p>

    <div className="al-cases" role="group" aria-label="Choose an example">{ANATOMY_CASES.map((x, i) => <button type="button" key={x.id} className="outline-button" aria-pressed={i === caseIndex} onClick={() => setCaseIndex(i)}>{solved.has(x.id) ? '✓ ' : ''}{x.name}</button>)}</div>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>CHROMOSOME WITH AN INSERTION · LEFT TO RIGHT</span><span>{w.left !== null && w.right !== null ? 'Bracket placed' : `${(w.left !== null) + (w.right !== null)} / 2 markers`}</span></div>
      <div className="gx-scroll" style={{'--gx-min': '640px'}}>
        <BenchStage variant="molecular" className="gx-stage" width={W} height={H} label={`${c.name}: a chromosome with an insertion, ${c.segments.length} segments left to right. Drag brackets into gaps, drop name tags on segments, swipe the arrow.`}
          after={<NextStep className="gx-note">{note || 'Drag a bracket into a gap to start.'}</NextStep>}>
          <Scene key={c.id} c={c} w={w} onPatch={apply} setNote={setNote} showResult={!!w.result} />
        </BenchStage>
      </div>
      <figcaption>Invented example, not to scale; no sequence shown. Arrows show reading direction. Heavier outlines are inside your bracket.</figcaption>
    </figure>

    <div className="al-inspector" aria-live="polite">
      {sel ? <><p className="eyebrow">SEGMENT {w.selected + 1} · CLUE</p><p className="al-clue">{sel.clue}</p>
        <p className="quiet">{w.labels[w.selected] ? `Named: ${LABELS[w.labels[w.selected]]}.` : 'Not named yet. Drag a name tag onto it.'}</p></>
        : <p className="quiet">Tap a segment to read its clue, then drag a name tag onto it.</p>}
    </div>

    <div className="pb-actions"><button type="button" className="primary-button" onClick={check}>Check my dissection →</button><button type="button" className="outline-button" onClick={() => setWork(all => all.map((x, i) => i === caseIndex ? blank() : x))}>Clear</button>
      {w.result?.allOk && caseIndex < ANATOMY_CASES.length - 1 && <button type="button" className="outline-button" onClick={() => setCaseIndex(caseIndex + 1)}>Next element →</button>}</div>

    {w.result && <div className={`pb-verdict ${w.result.allOk ? 'is-good' : 'is-bad'}`} role="status">
      {w.result.allOk ? <><b>✓ Fully dissected.</b> The element runs from one terminal inverted repeat to the other. The matching TSDs sit outside it: they are host DNA copied at insertion, not part of the element.</>
        : <><b>Not yet.</b> <ul className="al-feedback">
          <li>{w.result.boundariesOk ? '✓ Boundaries correct.' : `✗ ${w.result.boundaryHint}`}</li>
          <li>{w.result.labelsOk ? '✓ Every segment named correctly.' : `✗ ${w.result.labelResults.filter(ok => !ok).length} segment(s) need another look (marked ✗). Re-read their clues.`}</li>
          <li>{w.result.directionOk ? '✓ Direction correct.' : '✗ Look at the transposase gene’s arrow.'}</li></ul></>}
    </div>}

    <section className="pb-goals" aria-label="Progress"><p className="eyebrow">ELEMENTS DISSECTED · {solved.size} / {ANATOMY_CASES.length}</p>
      <ul>{ANATOMY_CASES.map(x => <li key={x.id} className={solved.has(x.id) ? 'done' : ''}><span aria-hidden="true">{solved.has(x.id) ? '✓' : '○'}</span>{x.name}{x.id === 'reversed' ? ': genes read leftward' : x.id === 'minimal' ? ': no cargo' : ': with cargo'}</li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Your recorded answers are the required questions below.</p>
  </section>;
}
