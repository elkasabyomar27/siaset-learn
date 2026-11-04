import { useId, useState } from 'react';
import { SLOTS, TE_PROMOTER, DEFAULT_OPERON, OPERON_GOALS, simulateOperon } from '../operonModel.js';
import './partsBench.css';

// SVG layout (x positions).
const P = [20, 90], A = [100, 300], B = [390, 590], DNA_Y = 104, END = 596;
const TE_X = {promoter: [14, 96], geneA: [160, 242], between: [304, 386]};
const STATUS = {
  unchanged: {label: 'Unchanged', icon: '='},
  permitted: {label: 'Transcribed (new source)', icon: '↗'},
  reduced: {label: 'Reduced', icon: '↓'},
  undetermined: {label: 'Undetermined', icon: '?'},
  interrupted: {label: 'Coding interrupted', icon: '✂'},
};

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

export default function OperonExplorer() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [config, setConfig] = useState(DEFAULT_OPERON);
  const [reached, setReached] = useState(() => new Set());
  const result = simulateOperon(config);
  const set = patch => setConfig(prev => {
    const next = {...prev, ...patch};
    const r = simulateOperon(next);
    setReached(seen => { const add = OPERON_GOALS.filter(g => g.done(r) && !seen.has(g.id)); return add.length ? new Set([...seen, ...add.map(g => g.id)]) : seen; });
    return next;
  });
  const teX = result.te === null ? null : TE_X[config.slot];
  const geneClass = g => `op-gene op-gene--${result.genes[g].status}`;

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · INSERT INTO AN OPERON</p>
    <h2 id={`${uid}-title`}>Where it lands decides what changes.</h2>
    <p className="pb-goal">Place an element in this idealised bacterial operon and set what it carries. Watch which transcripts survive and how genes A and B respond.</p>

    <div className="cb-controls">
      <div className="cb-control" role="group" aria-label="Insertion site"><span>Insertion site</span><div>{Object.entries(SLOTS).map(([id, label]) => <button type="button" key={id} className="outline-button" aria-pressed={config.slot === id} onClick={() => set({slot: id})}>{label}</button>)}</div></div>
      <div className="cb-control" role="group" aria-label="Element outward promoter"><span>Element carries</span><div>{Object.entries(TE_PROMOTER).map(([id, label]) => <button type="button" key={id} className="outline-button" aria-pressed={config.tePromoter === id} disabled={config.slot === 'none'} onClick={() => set({tePromoter: id})}>{label}</button>)}</div></div>
      <div className="op-toggles">
        <label><input type="checkbox" checked={config.terminator} disabled={config.slot === 'none'} onChange={e => set({terminator: e.target.checked})} /> Element has a terminator</label>
        <label><input type="checkbox" checked={config.bPromoter} onChange={e => set({bPromoter: e.target.checked})} /> Gene B has its own promoter</label>
        <label><input type="checkbox" checked={config.assumeNoHidden} onChange={e => set({assumeNoHidden: e.target.checked})} /> Assume no other promoters exist</label>
      </div>
    </div>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>IDEALISED E. COLI-LIKE OPERON · LEFT TO RIGHT</span><span>{SLOTS[config.slot]}</span></div>
      <div className="cb-canvas">
        <svg viewBox="0 0 610 150" role="img" aria-label={`Gene A: ${result.genes.A.text} Gene B: ${result.genes.B.text}`}>
          <line className="op-dna" x1="6" x2={END + 6} y1={DNA_Y + 14} y2={DNA_Y + 14} />
          <g className={`op-promoter${result.te === 0 ? ' is-broken' : ''}`}><rect x={P[0]} y={DNA_Y} width={P[1] - P[0]} height="28" rx="5" /><text x={(P[0] + P[1]) / 2} y={DNA_Y + 19} textAnchor="middle">P</text></g>
          <g className={geneClass('A')}><path d={`M${A[0]} ${DNA_Y} H${A[1] - 16} L${A[1]} ${DNA_Y + 14} L${A[1] - 16} ${DNA_Y + 28} H${A[0]} Z`} /><text x={result.te === 1 ? 128 : (A[0] + A[1]) / 2} y={DNA_Y + 19} textAnchor="middle">A</text></g>
          {config.bPromoter && <path className="op-bflag" d={`M${B[0] - 4} ${DNA_Y} V${DNA_Y - 12} H${B[0] + 10}`} />}
          <g className={geneClass('B')}><path d={`M${B[0]} ${DNA_Y} H${B[1] - 16} L${B[1]} ${DNA_Y + 14} L${B[1] - 16} ${DNA_Y + 28} H${B[0]} Z`} /><text x={(B[0] + B[1]) / 2} y={DNA_Y + 19} textAnchor="middle">B</text></g>
          {teX && <g className="op-te" key={config.slot}>
            <rect x={teX[0]} y={DNA_Y - 6} width={teX[1] - teX[0]} height="40" rx="6" />
            <text x={(teX[0] + teX[1]) / 2} y={DNA_Y + 29} textAnchor="middle">TE</text>
            {config.tePromoter !== 'none' && <text className="op-te-mark" x={(teX[0] + teX[1]) / 2} y={DNA_Y + 12} textAnchor="middle">{config.tePromoter === 'right' ? 'P→' : '←P'}</text>}
            {config.terminator && <text className="op-te-mark" x={teX[0] + 9} y={DNA_Y + 12} textAnchor="middle">⊣</text>}
          </g>}
          {result.transcripts.map((t, i) => <Transcript key={`${t.source}-${t.direction}-${config.slot}`} t={t} te={result.te} row={i} />)}
        </svg>
      </div>
      <figcaption className="pb-legend"><span><i className="sw-rna" />Transcript (arrow = direction)</span><span><i className="sw-stop" />Stopped by terminator</span><span><i className="sw-module" />Inserted element</span><span><i className="sw-host" />Gene</span></figcaption>
    </figure>

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
