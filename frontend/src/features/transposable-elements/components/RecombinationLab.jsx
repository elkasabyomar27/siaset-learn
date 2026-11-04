import { useId, useState } from 'react';
import { ORIENTATIONS, SUBSTRATES, RECOMB_GOALS, recombine, blockTally } from '../recombinationLab.js';
import './partsBench.css';

function Block({ b }) {
  const name = b.replace(/[→←]/g, ''), left = b.startsWith('←'), right = b.endsWith('→');
  const kind = name === 'TE' ? 'te' : name === 'X' ? 'x' : 'host';
  return <span className={`rl-block rl-${kind}`}>{left && <i aria-hidden="true">◀</i>}{name}{right && <i aria-hidden="true">▶</i>}<span className="sr-only">{left ? ' pointing left' : right ? ' pointing right' : ''}</span></span>;
}
// Each block is 4.6em wide plus a 0.8em linker, so 10.8em shifts sister 2 by two blocks:
// its first TE copy sits under sister 1's second copy, the misaligned pairing.
function Molecule({ blocks, circular, label, offset = 0 }) {
  return <div className={`rl-molecule${circular ? ' is-circle' : ''}`} style={offset ? {marginLeft: `${offset}em`} : undefined}>
    {label && <span className="rl-label">{label}</span>}
    <div className="rl-track" aria-label={`${label || 'Molecule'}: ${blocks.join(', ')}${circular ? ', circular' : ''}`}>{blocks.map((b, i) => <Block key={i} b={b} />)}</div>
  </div>;
}
const tallyText = t => Object.entries(t).map(([k, v]) => `${k}×${v}`).join(' · ');

export default function RecombinationLab() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [orientation, setOrientation] = useState('direct');
  const [substrate, setSubstrate] = useState('intramolecular');
  const [homology, setHomology] = useState(true);
  const [result, setResult] = useState(null);
  const [reached, setReached] = useState(() => new Set());
  const before = orientation === 'direct' ? ['L', 'TE→', 'X→', 'TE→', 'R'] : ['L', 'TE→', 'X→', '←TE', 'R'];
  const sisters = substrate === 'misaligned-sisters';

  function change(fn) { fn(); setResult(null); }
  function run() {
    const r = recombine({orientation, substrate, homology});
    setResult(r);
    const id = r.ok ? r.event : 'no-pairing';
    setReached(prev => prev.has(id) ? prev : new Set(prev).add(id));
  }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · RECOMBINE TWO COPIES</p>
    <h2 id={`${uid}-title`}>Two copies of the same element. What happens if they pair?</h2>
    <p className="pb-goal">This is recombination between copies that are already in the genome, not a new insertion. Set the copies’ directions and where they pair, predict, then recombine and trace every product.</p>

    <div className="cb-controls">
      <div className="cb-control" role="group" aria-label="Second copy direction"><span>Second copy points</span><div>{Object.entries(ORIENTATIONS).map(([k, label]) => <button type="button" key={k} className="outline-button" aria-pressed={orientation === k} onClick={() => change(() => setOrientation(k))}>{label}</button>)}</div></div>
      <div className="cb-control" role="group" aria-label="Where the copies pair"><span>Pairing</span><div>{Object.entries(SUBSTRATES).map(([k, label]) => <button type="button" key={k} className="outline-button" aria-pressed={substrate === k} onClick={() => change(() => setSubstrate(k))}>{label}</button>)}</div></div>
      <label className="mg-toggle"><input type="checkbox" checked={homology} onChange={e => change(() => setHomology(e.target.checked))} /> Copies are similar enough to pair (homologous)</label>
    </div>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>BEFORE</span><span>{homology ? 'Paired copies are outlined' : 'No pairing possible'}</span></div>
      <div className={`rl-stage${homology ? ' is-paired' : ''}`}>
        <Molecule blocks={before} label={sisters ? 'Sister 1' : 'Chromosome'} />
        {sisters && <Molecule blocks={before} label="Sister 2 (misaligned)" offset={10.8} />}
      </div>
      {result?.ok && <><div className="pb-stage-head rl-after-head"><span>AFTER · {result.event.toUpperCase()}</span><span>Material: {tallyText(blockTally(result.products.map(p => p.blocks)))}</span></div>
        <div className="rl-stage rl-products">{result.products.map((p, i) => <Molecule key={i} blocks={p.blocks} circular={p.topology === 'circular'} label={result.event === 'duplication' ? (i === 0 ? 'Sister 1: duplication' : 'Sister 2: deletion') : p.topology === 'circular' ? 'Excised circle' : 'Chromosome'} />)}</div></>}
      <figcaption>Symbolic blocks (L, R host · TE element copy · X segment between copies), not sequence or scale.</figcaption>
    </figure>

    <div className="pb-actions"><button type="button" className="primary-button" onClick={run}>Recombine →</button></div>
    {result && <div className={`pb-verdict ${result.ok ? 'is-good' : 'is-bad'}`} role="status" aria-live="polite"><b>{result.ok ? `${result.event[0].toUpperCase()}${result.event.slice(1)}.` : 'No recombination.'}</b> {result.text}{result.ok && <><br /><small>Before: {tallyText(blockTally(sisters ? [before, before] : [before]))} → after: {tallyText(blockTally(result.products.map(p => p.blocks)))}. Every block is accounted for.</small></>}</div>}

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {reached.size} / {RECOMB_GOALS.length}</p>
      <ul>{RECOMB_GOALS.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Products come from the lesson’s rearrangement model. These are selected outcomes, not inevitable consequences of having two copies.</p>
  </section>;
}
