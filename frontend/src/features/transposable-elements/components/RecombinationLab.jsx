import { useId, useState } from 'react';
import { ORIENTATIONS, SUBSTRATES, RECOMB_GOALS, recombine, blockTally } from '../recombinationLab.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { SwipeTarget } from '../hands-on/kit/SwipeTarget.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { Assumptions } from '../hands-on/kit/Assumptions.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { recombinationIntent } from '../hands-on/intents/recombination.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

function Block({ b }) {
  const name = b.replace(/[→←]/g, ''), left = b.startsWith('←'), right = b.endsWith('→');
  const kind = name === 'TE' ? 'te' : name === 'X' ? 'x' : 'host';
  return <span className={`rl-block rl-${kind}`}>{left && <i aria-hidden="true">◀</i>}{name}{right && <i aria-hidden="true">▶</i>}<span className="sr-only">{left ? ' pointing left' : right ? ' pointing right' : ''}</span></span>;
}
function Molecule({ blocks, circular, label }) {
  return <div className={`rl-molecule${circular ? ' is-circle' : ''}`}>
    {label && <span className="rl-label">{label}</span>}
    <div className="rl-track" aria-label={`${label || 'Molecule'}: ${blocks.join(', ')}${circular ? ', circular' : ''}`}>{blocks.map((b, i) => <Block key={i} b={b} />)}</div>
  </div>;
}
const tallyText = t => Object.entries(t).map(([k, v]) => `${k}×${v}`).join(' · ');

// Scene layout in SVG units: five blocks per molecule; sister 2 is shifted by two blocks, so its
// first TE copy sits under sister 1's second copy (the misaligned pairing).
const BW = 78, STEP = 94, X0 = 20, ROW1 = 120, ROW2 = 200, BH = 44, VIEW_W = X0 + 6 * STEP + BW + 20, VIEW_H = 310;
const xOf = i => X0 + i * STEP;
const inBox = (x0, y0, w, h) => (x, y) => x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;
const SUBSTRATE_AT = {intramolecular: {x: 160, y: 36}, 'misaligned-sisters': {x: 440, y: 36}};

function Row({ blocks, y, label, orientation, offsetX = 0, swipe }) {
  const mid = y + BH / 2;
  return <g>
    <text className="gx-small" x={X0 + offsetX} y={y - 14}>{label}</text>
    <line className="gx-dna" x1={X0 + offsetX} x2={xOf(4) + BW + offsetX} y1={mid} y2={mid} />
    {blocks.map((b, i) => {
      const name = b.replace(/[→←]/g, ''), te = name === 'TE', x = xOf(i) + offsetX, dir = b.endsWith('→') ? 1 : b.startsWith('←') ? -1 : 0;
      const piece = <g key={i}>
        <rect className={`gx-piece ${te ? 'gx-piece-element' : name === 'X' ? 'gx-piece-gene' : 'gx-piece-target'}`} x={x} y={y} width={BW} height={BH} rx="7" />
        <text className="gx-text" x={x + BW / 2} y={mid + 5} textAnchor="middle">{name}</text>
        {dir !== 0 && <path className="gx-dna" strokeWidth="3" d={dir === 1 ? `M${x + BW - 26} ${mid - 9} l12 9 l-12 9` : `M${x + 26} ${mid - 9} l-12 9 l12 9`} />}
      </g>;
      return swipe && i === 3 ? <SwipeTarget key={i} className="rl-copy2" label={`Second copy points ${orientation === 'direct' ? 'right, the same way as the first' : 'left, opposite to the first'}. Swipe across it, or press Enter, to turn it round`}
        line={{x1: x, y1: mid, x2: x + BW, y2: mid}} band={swipe.band} onSwipe={swipe.onSwipe}>{piece}</SwipeTarget> : piece;
    })}
  </g>;
}

// The substrate cards are dropped on the stage, a swipe turns the second copy round, and the
// first copy is dragged onto the second to pair them.
function RecombScene({ orientation, substrate, homology, before, onGesture, setNote }) {
  const {scale} = useStage();
  const k = 1 / Math.max(scale, 0.05);
  const [over, setOver] = useState(null);
  const sisters = substrate === 'misaligned-sisters';
  const {demo, activity, drag} = useDemoHand('drag', `${orientation}-${substrate}`);
  const stageH = sisters ? 190 : 110;
  const stageZone = [{id: 'stage', label: 'the chromosome stage', contains: inBox(0, ROW1 - 40, VIEW_W, stageH)}];
  const pairZone = [{id: 'copy2', label: 'the second copy', contains: inBox(xOf(3) - 20, ROW1 - 20, BW + 40, sisters ? ROW2 - ROW1 + BH + 40 : BH + 40)}];
  const send = g => { activity(); return onGesture(g); };
  return <>
    <text className="gx-small" x="12" y="14">SUBSTRATE: drop a card on the stage</text>
    {Object.keys(SUBSTRATES).map(id => <Draggable key={id} className="gx-card" x={SUBSTRATE_AT[id].x} y={SUBSTRATE_AT[id].y} zones={stageZone} hit={hitBox(240, 40, scale)}
      label={`Substrate card: ${SUBSTRATES[id]}${substrate === id ? ' (in use)' : ''}. Drag it onto the stage`} carriedLabel={`Carrying the card ${SUBSTRATES[id]}. Press Enter to drop it on the stage`}
      onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop on: ${t}.`)} onCancel={() => setNote('The card is back in the tray.')}
      onDrop={({zone}) => { setOver(null); if (send({kind: 'drop', part: 'substrate', substrate: id, target: zone})) setNote(`Pairing: ${SUBSTRATES[id].toLowerCase()}.`); }}>
      <rect className="gx-piece" x="-120" y="-20" width="240" height="40" rx="8" style={{strokeWidth: substrate === id ? 4 : 1.5}} />
      <text className="gx-text" y="5" textAnchor="middle">{id === 'intramolecular' ? 'Within one chromosome' : 'Between misaligned sisters'}</text>
    </Draggable>)}
    <rect className="gx-zone" data-over={over === 'stage'} x="6" y={ROW1 - 40} width={VIEW_W - 12} height={stageH} rx="12" />
    <Row blocks={before} y={ROW1} label={sisters ? 'SISTER 1' : 'CHROMOSOME'} orientation={orientation}
      swipe={{band: Math.max(34, 22 * k), onSwipe: () => { const p = send({kind: 'swipe', target: 'copy2'}); if (p) setNote(`The second copy now points ${p.orientation === 'direct' ? 'the same way as the first' : 'the opposite way'}.`); }}} />
    {sisters && <Row blocks={before} y={ROW2} label="SISTER 2 (MISALIGNED BY TWO BLOCKS)" orientation={orientation} offsetX={2 * STEP} />}
    {homology && <rect className="gx-zone" data-over="true" x={xOf(3) - 6} y={ROW1 - 6} width={BW + 12} height={(sisters ? ROW2 - ROW1 : 0) + BH + 12} rx="9" />}
    <Draggable className="gx-copy1" x={xOf(1) + BW / 2} y={ROW1 + BH + 24} zones={pairZone} hit={hitBox(120, 40, scale)} onOver={setOver}
      label="First TE copy. Drag it onto the second copy to pair the two copies and recombine" carriedLabel="Carrying the first copy. Press Enter to pair it with the second copy"
      onCarry={drag} onAnnounce={t => t && setNote(`Pair with: ${t}.`)} onCancel={() => setNote('The copies stayed apart.')}
      onDrop={({zone}) => { setOver(null); send({kind: 'drop', part: 'copy', target: zone}); }}>
      <rect className="gx-piece gx-piece-element" x="-56" y="-18" width="112" height="36" rx="18" /><text className="gx-text" y="5" textAnchor="middle">pull together</text>
    </Draggable>
    <DemoHand show={demo.show} still={demo.still} from={{x: xOf(1) + BW / 2, y: ROW1 + BH + 24}} to={{x: xOf(3) + BW / 2, y: ROW1 + BH / 2}} text="Drag the copies together" labelAt={{x: 360, y: 290}} />
  </>;
}

export default function RecombinationLab() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [orientation, setOrientation] = useState('direct');
  const [substrate, setSubstrate] = useState('intramolecular');
  const [homology, setHomology] = useState(true);
  const [result, setResult] = useState(null);
  const [reached, setReached] = useState(() => new Set());
  const [note, setNote] = useState('');
  const before = orientation === 'direct' ? ['L', 'TE→', 'X→', 'TE→', 'R'] : ['L', 'TE→', 'X→', '←TE', 'R'];
  const sisters = substrate === 'misaligned-sisters';

  function run() {
    const r = recombine({orientation, substrate, homology});
    setResult(r);
    const id = r.ok ? r.event : 'no-pairing';
    setReached(prev => prev.has(id) ? prev : new Set(prev).add(id));
    setNote(r.ok ? `Recombined: ${r.event}.` : 'No recombination: the copies could not pair.');
  }
  // Every setting change clears the old result, exactly as the old buttons did.
  function apply(patch) {
    if (patch.run) return run();
    if ('orientation' in patch) setOrientation(patch.orientation);
    if ('substrate' in patch) setSubstrate(patch.substrate);
    if ('homology' in patch) setHomology(patch.homology);
    setResult(null);
  }
  const onGesture = g => { const p = recombinationIntent(g, {orientation}); if (p) apply(p); return p; };

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · RECOMBINE TWO COPIES</p>
    <h2 id={`${uid}-title`}>Two copies of the same element. What happens if they pair?</h2>
    <p className="pb-goal">This is recombination between copies that are already in the genome, not a new insertion. Swipe across the second copy to turn it round, drop a substrate card on the stage, then drag the copies together and trace every product.</p>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>BEFORE · {ORIENTATIONS[orientation].toUpperCase()}</span><span>{homology ? 'Paired copies are outlined' : 'No pairing possible'}</span></div>
      <div className="gx-scroll" style={{'--gx-min': `${VIEW_W}px`}}>
        <BenchStage variant="molecular" className="gx-stage" width={VIEW_W} height={VIEW_H}
          label={`Recombination bench. ${sisters ? 'Two misaligned sister chromatids' : 'One chromosome'}: ${before.join(', ')}. The second copy points ${orientation === 'direct' ? 'the same way as the first' : 'the opposite way'}.`}
          after={<NextStep className="gx-note">{note || 'Swipe across the second copy, drop a substrate card, then drag the copies together.'}</NextStep>}>
          <RecombScene orientation={orientation} substrate={substrate} homology={homology} before={before} onGesture={onGesture} setNote={setNote} />
        </BenchStage>
      </div>
      {result?.ok && <><div className="pb-stage-head rl-after-head"><span>AFTER · {result.event.toUpperCase()}</span><span>Material: {tallyText(blockTally(result.products.map(p => p.blocks)))}</span></div>
        <div className="rl-stage rl-products">{result.products.map((p, i) => <Molecule key={i} blocks={p.blocks} circular={p.topology === 'circular'} label={result.event === 'duplication' ? (i === 0 ? 'Sister 1: duplication' : 'Sister 2: deletion') : p.topology === 'circular' ? 'Excised circle' : 'Chromosome'} />)}</div></>}
      <figcaption>Symbolic blocks (L, R host · TE element copy · X segment between copies), not sequence or scale.</figcaption>
    </figure>

    <Assumptions items={[{key: 'homology', label: 'Copies are similar enough to pair (homologous)'}]} values={{homology}} onChange={(key, value) => onGesture({kind: 'assume', control: key, value})} />

    {result && <div className={`pb-verdict ${result.ok ? 'is-good' : 'is-bad'}`} role="status" aria-live="polite"><b>{result.ok ? `${result.event[0].toUpperCase()}${result.event.slice(1)}.` : 'No recombination.'}</b> {result.text}{result.ok && <><br /><small>Before: {tallyText(blockTally(sisters ? [before, before] : [before]))} → after: {tallyText(blockTally(result.products.map(p => p.blocks)))}. Every block is accounted for.</small></>}</div>}

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {reached.size} / {RECOMB_GOALS.length}</p>
      <ul>{RECOMB_GOALS.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Products come from the lesson’s rearrangement model. These are selected outcomes, not inevitable consequences of having two copies.</p>
  </section>;
}
