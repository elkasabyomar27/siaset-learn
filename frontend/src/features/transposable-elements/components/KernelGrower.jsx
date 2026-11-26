import { useEffect, useId, useRef, useState } from 'react';
import { growKernel, describeKernel, GENERATIONS, SIZE, KERNEL_GOALS } from '../kernelModel.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { HoldTarget } from '../hands-on/kit/HoldTarget.jsx';
import { Track } from '../hands-on/kit/Track.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { kernelIntent, degreesFromTiming } from '../hands-on/intents/kernel.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

const W = 560, H = 270, GENOME = {x: 16, y: 16, w: 190, h: 150}, OUTSIDE = {x: 16, y: 178, w: 190, h: 76}, RING = {cx: 330, cy: 135, r: 70}, KERNEL_AT = {x: 480, y: 135};
const inRect = r => (x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const polar = deg => [RING.cx + RING.r * Math.sin(deg * Math.PI / 180), RING.cy - RING.r * Math.cos(deg * Math.PI / 180)];
const when = t => t < 0.34 ? 'Early' : t > 0.66 ? 'Late' : 'Middle';

// The cell grid spans the kernel outline's bounding box, so no sector needs stretching.
const X0 = 22, Y0 = 18, SX = 156 / SIZE, SY = 208 / SIZE;
const KERNEL = 'M100 18 C150 18 178 62 176 118 C174 176 140 222 100 226 C60 222 26 176 24 118 C22 62 50 18 100 18 Z';
const PREDICTIONS = {colourless: 'Colourless, no spots', large: 'A few large purple sectors', small: 'Many small purple spots'};
const still = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Ac goes into or out of the genome, the timing marker slides round the development clock,
// and holding the kernel grows it.
function KernelScene({ ac, timing, prediction, growing, seed, apply, setNote }) {
  const {scale} = useStage();
  const [over, setOver] = useState(null);
  const {demo, activity, drag} = useDemoHand(ac ? 'hold' : 'drag', ac);
  const k = 1 / Math.max(scale, 0.05);
  const zones = [{id: 'genome', label: 'the genome', contains: inRect(GENOME)}, {id: 'outside', label: 'outside the genome', contains: inRect(OUTSIDE)}];
  const [mx, my] = polar(degreesFromTiming(timing));
  const act = g => { activity(); const patch = kernelIntent(g, {ac, prediction, growing}); if (patch) apply(patch); return patch; };
  return <>
    <rect className="gx-zone" data-over={over === 'genome'} x={GENOME.x} y={GENOME.y} width={GENOME.w} height={GENOME.h} rx="14" />
    <rect className="gx-zone" data-over={over === 'outside'} x={OUTSIDE.x} y={OUTSIDE.y} width={OUTSIDE.w} height={OUTSIDE.h} rx="14" />
    <text className="gx-small" x={GENOME.x + 14} y={GENOME.y + 20}>GENOME</text>
    <text className="gx-small" x={OUTSIDE.x + 14} y={OUTSIDE.y + 20}>OUTSIDE THE GENOME</text>
    <line className="gx-dna" x1="34" x2="188" y1="130" y2="130" />
    <rect className="gx-piece-gene" x="62" y="112" width="100" height="36" rx="6" /><text className="gx-text" x="112" y="135" textAnchor="middle">pigment gene</text>
    <text className="gx-small" x="112" y="160" textAnchor="middle">Ds sits inside</text>
    <Draggable className="gx-ac" x={110} y={ac ? 72 : 218} zones={zones} expected={!ac} hit={hitBox(100, 36, scale)}
      label={ac ? 'Ac element: in the genome. Drag it out of the genome to remove it' : 'Ac element: outside the genome. Drag it into the genome'}
      carriedLabel="Carrying Ac. Press Enter to drop it, arrow keys to choose the genome or outside"
      onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop on: ${t}.`)} onCancel={() => setNote('Ac is back where it was.')}
      onDrop={({zone}) => { setOver(null); if (act({kind: 'drop', target: zone})) setNote(zone === 'genome' ? 'Ac is in the genome: excisions can happen.' : 'Ac is outside the genome: Ds cannot leave.'); }}>
      <rect className="gx-piece gx-piece-element" x="-50" y="-18" width="100" height="36" rx="8" /><text className="gx-text" y="5" textAnchor="middle">Ac</text>
    </Draggable>
    <circle className="gx-solid" cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" style={{opacity: ac ? 1 : 0.4}} />
    <text className="gx-text" x={RING.cx} y={RING.cy - 4} textAnchor="middle">{when(timing)}</text>
    <text className="gx-small" x={RING.cx} y={RING.cy + 14} textAnchor="middle">excisions tend to happen</text>
    <text className="gx-small" x={RING.cx} y={RING.cy - RING.r - 12} textAnchor="middle">start of development</text>
    <circle className="gx-piece gx-piece-target" cx={mx} cy={my} r="10" />
    <Track className="kg-timing" label={ac ? `Excision timing: ${when(timing)}. Slide the marker round the development clock, or use the arrow keys and Enter` : 'Excision timing: needs Ac in the genome first'}
      cx={RING.cx} cy={RING.cy} r={RING.r} value={degreesFromTiming(timing)} step={18} bigStep={54} wrap={false} hitWidth={44 * k}
      onPreview={deg => ac && setNote(`Excisions tend to happen: ${when(deg / 360)}.`)}
      onConfirm={deg => { if (act({kind: 'track', value: deg})) setNote('Timing set. Grow a kernel to see the pattern.'); else setNote('Put Ac in the genome first: without it Ds cannot excise.'); }} />
    <HoldTarget className="kg-kernel" label={seed ? 'Hold to grow another kernel' : 'Hold to grow the kernel'} cx={KERNEL_AT.x} cy={KERNEL_AT.y} hitR={Math.max(40, 22 * k)} ringR={46} expected={!!prediction && !growing && ac}
      onHold={() => { if (act({kind: 'hold', target: 'kernel'})) setNote('Growing: the cells divide.'); else setNote(growing ? 'The kernel is still growing.' : 'Choose a prediction to start growing.'); }}>
      <path d={KERNEL} className="gx-piece" transform={`translate(${KERNEL_AT.x - 50} ${KERNEL_AT.y - 62}) scale(0.5)`} />
    </HoldTarget>
    <text className="gx-small" x={KERNEL_AT.x} y={KERNEL_AT.y + 84} textAnchor="middle">hold to grow</text>
    <DemoHand show={demo.show} still={demo.still} from={ac ? KERNEL_AT : {x: 110, y: 218}} to={ac ? KERNEL_AT : {x: 110, y: 72}} text={ac ? 'Press and hold the kernel' : 'Drag Ac into the genome'} labelAt={ac ? {x: KERNEL_AT.x, y: KERNEL_AT.y + 104} : {x: 110, y: 262}} />
  </>;
}

export default function KernelGrower() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [ac, setAc] = useState(true);
  const [timing, setTiming] = useState(0.8);
  const [seed, setSeed] = useState(0);
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [reached, setReached] = useState(() => new Set());
  const growing = seed > 0 && step < GENERATIONS;
  const kernel = seed ? growKernel({ac, timing, seed}) : null;
  const done = seed > 0 && step >= GENERATIONS;
  const look = done ? describeKernel(kernel, ac) : null;
  const recorded = useRef(0);

  useEffect(() => {
    if (!seed || step >= GENERATIONS) return;
    const t = setTimeout(() => setStep(s => s + 1), still() ? 0 : 420);
    return () => clearTimeout(t);
  }, [seed, step]);
  useEffect(() => {
    if (!done || recorded.current === seed) return;
    recorded.current = seed;
    const pattern = look.pattern;
    if (KERNEL_GOALS.some(g => g.id === pattern) && (pattern !== 'colourless' || !ac)) setReached(prev => prev.has(pattern) ? prev : new Set(prev).add(pattern));
  }, [done, seed, look, ac]);

  const [note, setNote] = useState('');
  function apply(p) {
    if (p.grow) grow();
    else if ('ac' in p) reset(() => setAc(p.ac));
    else if ('timing' in p) reset(() => setTiming(p.timing));
  }
  function grow() { setSeed(Math.floor(Math.random() * 1e9) + 1); setStep(0); }
  function reset(patch) { patch(); setSeed(0); setStep(0); setPrediction(null); }
  const cells = 2 ** Math.min(step, GENERATIONS);

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · GROW A MAIZE KERNEL</p>
    <h2 id={`${uid}-title`}>Why are some kernels spotted?</h2>
    <p className="pb-goal">Ds sits inside a pigment gene, so kernel cells start colourless. If Ds leaves the gene in a cell, pigment can return in that cell and all its descendants. Predict the pattern, then grow a kernel.</p>

    <div className="gx-scroll" style={{'--gx-min': '560px'}}>
      <BenchStage variant="molecular" className="gx-stage" width={W} height={H} label="Kernel lab. Drag Ac into or out of the genome, slide the excision timing round the development clock, and hold the kernel to grow it."
        after={<NextStep className="gx-note">{note || 'Drag Ac, set the timing, choose a prediction, then press and hold the kernel.'}</NextStep>}>
        <KernelScene ac={ac} timing={timing} prediction={prediction} growing={growing} seed={seed} apply={apply} setNote={setNote} />
      </BenchStage>
    </div>

    <fieldset className="tsd-predict"><legend>Predict: what will this kernel look like?</legend>
      <div>{Object.entries(PREDICTIONS).map(([k, label]) => <button type="button" key={k} className={`outline-button${prediction === k ? ' chosen' : ''}`} aria-pressed={prediction === k} disabled={growing} onClick={() => setPrediction(k)}>{label}</button>)}</div>
    </fieldset>

    <figure className="pb-stage kg-stage">
      <div className="pb-stage-head"><span>KERNEL · {step === 0 && !seed ? 'NOT GROWN YET' : `CELL DIVISIONS ${Math.min(step, GENERATIONS)} / ${GENERATIONS}`}</span><span>{done ? `${kernel.stats.spots} sector${kernel.stats.spots === 1 ? '' : 's'} · ${Math.round(kernel.stats.pigmentedFraction * 100)}% pigmented` : ''}</span></div>
      <div className="kg-canvas">
        <svg viewBox="0 0 200 240" role="img" aria-label={look ? look.text : 'A colourless kernel, not grown yet.'}>
          <defs><clipPath id={`${uid}-k`}><path d={KERNEL} /></clipPath></defs>
          <g clipPath={`url(#${uid}-k)`}>
            <rect x="0" y="0" width="200" height="240" className="kg-base" />
            {kernel?.sectors.filter(s => s.gen < step).map((s, i) => <rect key={i} className="kg-sector" x={X0 + s.x * SX} y={Y0 + s.y * SY} width={s.size * SX} height={s.size * SY} style={{opacity: 0.78 + (i % 3) * 0.08}} />)}
            {seed > 0 && step < GENERATIONS && Array.from({length: cells - 1}, (_, i) => <g key={i} className="kg-grid"><line x1={X0 + (i + 1) * 156 / cells} x2={X0 + (i + 1) * 156 / cells} y1="0" y2="240" /><line y1={Y0 + (i + 1) * 208 / cells} y2={Y0 + (i + 1) * 208 / cells} x1="0" x2="200" /></g>)}
          </g>
          <path d={KERNEL} className="kg-outline" />
        </svg>
      </div>
      <figcaption>Schematic sectoring, not a reconstructed experiment. Square sectors are a drawing convention; Ds derivatives differ.</figcaption>
    </figure>

    {look && <div className={`pb-verdict ${prediction === look.pattern ? 'is-good' : 'is-bad'}`} role="status" aria-live="polite"><b>{prediction === look.pattern ? '✓ As you predicted.' : '✗ Not what you predicted.'}</b> {look.text}{ac && ' Excision is a chance event: two kernels under the same conditions differ.'}</div>}

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {reached.size} / {KERNEL_GOALS.length}</p>
      <ul>{KERNEL_GOALS.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. McClintock’s interpretation drew on genetic and cytological observations; this drawing illustrates the idea of Ac-dependent Ds excision, not her data.</p>
  </section>;
}
