import { useId, useState } from 'react';
import { SITES, PROMOTER_INFO, BACKUP, MEDIUM, DEFAULT_PHENO, PHENO_GOALS, phenotypeChain } from '../phenotypeChain.js';
import './partsBench.css';

// Fixed pseudo-random colony positions so the plate looks natural but stays stable between renders.
const COLONIES = Array.from({length: 26}, (_, i) => {
  const a = i * 2.39996, r = 14 + (i * 37 % 46);
  return [80 + Math.cos(a) * r, 80 + Math.sin(a) * r, 3 + (i * 7 % 4)];
});

function Plate({ outcome }) {
  const shown = outcome === 'likely unchanged' ? COLONIES : outcome === 'likely altered' ? COLONIES.slice(0, 2) : COLONIES.slice(0, 12);
  return <svg className={`ph-plate ph-plate--${outcome.replace(' ', '-')}`} viewBox="0 0 160 160" role="img" aria-label={`Illustrative growth plate: ${outcome}`}>
    <circle cx="80" cy="80" r="74" className="ph-dish" />
    <circle cx="80" cy="80" r="66" className="ph-agar" />
    {shown.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} className="ph-colony" style={{animationDelay: `${i * 30}ms`}} />)}
    {outcome === 'undetermined' && <text x="80" y="96" textAnchor="middle" className="ph-unknown">?</text>}
  </svg>;
}

function Choice({ label, options, value, onChange, disabled }) {
  return <div className="cb-control" role="group" aria-label={label}><span>{label}</span><div>{Object.entries(options).map(([k, text]) => <button type="button" key={k} className="outline-button" aria-pressed={value === k} disabled={disabled} onClick={() => onChange(k)}>{text}</button>)}</div></div>;
}

export default function PhenotypeExplorer() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [input, setInput] = useState(DEFAULT_PHENO);
  const [reached, setReached] = useState(() => new Set());
  const result = phenotypeChain(input);
  const set = patch => setInput(prev => {
    const next = {...prev, ...patch}, r = phenotypeChain(next);
    setReached(seen => { const add = PHENO_GOALS.filter(g => g.done(r) && !seen.has(g.id)); return add.length ? new Set([...seen, ...add.map(g => g.id)]) : seen; });
    return next;
  });
  const steps = [
    {title: 'Molecular change', state: result.molecular.state, text: result.molecular.text},
    {title: 'Pathway function', state: result.pathway.state, text: result.pathway.text},
    {title: 'Phenotype in this assay', state: result.phenotype.outcome.replace(' ', '-'), text: result.phenotype.text, outcome: result.phenotype.outcome},
  ];

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · FROM INSERTION TO PHENOTYPE</p>
    <h2 id={`${uid}-title`}>A broken gene is not yet a changed trait.</h2>
    <p className="pb-goal">A hypothetical haploid bacterium makes a nutrient with one enzyme. Choose where an element lands and what you know, then follow the chain of reasoning to the growth test.</p>

    <div className="cb-controls">
      <Choice label="Insertion site" options={SITES} value={input.site} onChange={v => set({site: v})} />
      {input.site === 'regulatory' && <Choice label="Promoter information" options={PROMOTER_INFO} value={input.promoterInfo} onChange={v => set({promoterInfo: v})} />}
      <Choice label="Backup enzyme" options={BACKUP} value={input.backup} onChange={v => set({backup: v})} disabled={input.site === 'intergenic'} />
      <Choice label="Growth test" options={MEDIUM} value={input.medium} onChange={v => set({medium: v})} />
    </div>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>REASONING CHAIN · EACH STEP NEEDS AN ASSUMPTION</span><span>{result.maskedLoss ? 'Molecular loss hidden in growth' : ''}</span></div>
      <div className="ph-layout">
        <ol className="ph-chain" aria-label="Reasoning chain">{steps.map((st, i) => <li key={st.title} className={`ph-step ph-step--${st.state}`}><span className="ph-num" aria-hidden="true">{i + 1}</span><div><b>{st.title}{st.outcome && `: ${st.outcome}`}</b><p>{st.text}</p></div></li>)}</ol>
        <div className="ph-plate-wrap"><Plate outcome={result.phenotype.outcome} /><small>Illustrative growth plate</small></div>
      </div>
      <figcaption>Hypothetical contexts; no real gene identity or quantitative growth prediction.</figcaption>
    </figure>

    <div className={`pb-verdict ${result.phenotype.outcome === 'likely altered' ? 'is-bad' : result.phenotype.outcome === 'likely unchanged' ? 'is-good' : ''}`} role="status" aria-live="polite"><b>Phenotype: {result.phenotype.outcome}.</b> {result.phenotype.text}{result.maskedLoss && ' The gene is still broken: the plate just cannot show it.'}</div>

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {reached.size} / {PHENO_GOALS.length}</p>
      <ul>{PHENO_GOALS.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion.</p>
  </section>;
}
