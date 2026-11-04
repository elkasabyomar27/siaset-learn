import { useEffect, useId, useRef, useState } from 'react';
import { growKernel, describeKernel, GENERATIONS, SIZE, KERNEL_GOALS } from '../kernelModel.js';
import './partsBench.css';

// The cell grid spans the kernel outline's bounding box, so no sector needs stretching.
const X0 = 22, Y0 = 18, SX = 156 / SIZE, SY = 208 / SIZE;
const KERNEL = 'M100 18 C150 18 178 62 176 118 C174 176 140 222 100 226 C60 222 26 176 24 118 C22 62 50 18 100 18 Z';
const PREDICTIONS = {colourless: 'Colourless, no spots', large: 'A few large purple sectors', small: 'Many small purple spots'};
const still = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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

  function grow() { setSeed(Math.floor(Math.random() * 1e9) + 1); setStep(0); }
  function reset(patch) { patch(); setSeed(0); setStep(0); setPrediction(null); }
  const cells = 2 ** Math.min(step, GENERATIONS);

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · GROW A MAIZE KERNEL</p>
    <h2 id={`${uid}-title`}>Why are some kernels spotted?</h2>
    <p className="pb-goal">Ds sits inside a pigment gene, so kernel cells start colourless. If Ds leaves the gene in a cell, pigment can return in that cell and all its descendants. Predict the pattern, then grow a kernel.</p>

    <div className="cb-controls">
      <label className="mg-toggle"><input type="checkbox" checked={ac} onChange={e => reset(() => setAc(e.target.checked))} /> Ac present elsewhere in the genome</label>
      <label className="tsd-slider">When excisions tend to happen <b>{timing < 0.34 ? 'Early' : timing > 0.66 ? 'Late' : 'Middle'}</b>
        <input type="range" min="0" max="1" step="0.05" value={timing} disabled={!ac} onChange={e => reset(() => setTiming(Number(e.target.value)))} />
        <small className="kg-scale"><span>early in development</span><span>late</span></small>
      </label>
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

    <div className="pb-actions"><button type="button" className="primary-button" disabled={!prediction || growing} onClick={grow}>{seed ? 'Grow another kernel' : 'Grow the kernel'} →</button></div>
    {!prediction && <p className="advance-hint kg-hint">Choose a prediction to start growing.</p>}
    {look && <div className={`pb-verdict ${prediction === look.pattern ? 'is-good' : 'is-bad'}`} role="status" aria-live="polite"><b>{prediction === look.pattern ? '✓ As you predicted.' : '✗ Not what you predicted.'}</b> {look.text}{ac && ' Excision is a chance event: two kernels under the same conditions differ.'}</div>}

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {reached.size} / {KERNEL_GOALS.length}</p>
      <ul>{KERNEL_GOALS.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. McClintock’s interpretation drew on genetic and cytological observations; this drawing illustrates the idea of Ac-dependent Ds excision, not her data.</p>
  </section>;
}
