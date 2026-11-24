import { useId, useReducer } from 'react';
import { SAMPLE, PCR, PCR_OUTCOMES, runPcr, pcrTable, idealCopies, templateCopies, quantify, migrate } from '../benchWorkflow.js';
import { benchStep, initialStep } from '../benchStep.js';
import { SampleHandoff, Controls, Predict, Gates, Verdict, PracticeNote } from './BenchParts.jsx';
import GelImage from './GelImage.jsx';

const OUTCOME_OPTIONS = Object.entries(PCR_OUTCOMES).map(([k, v]) => [k, v.label]);
const fmt = n => n.toLocaleString('en-US');
const startCopies = Math.round(templateCopies() / 100) * 100;
const CYCLE10 = [['11k', 'About 11,000'], ['1.1m', 'About 1.1 million'], ['110k', 'About 110,000']];

// Ideal doubling against a schematic plateau (log scale). The plateau is illustrative only.
function CopyChart() {
  const W = 320, H = 170, N = 35, maxLog = 13, cap = 1e11;
  const x = n => 30 + n / N * (W - 40), y = v => H - 20 - Math.log10(Math.max(v, 1)) / maxLog * (H - 30);
  const ideal = Array.from({length: N + 1}, (_, n) => idealCopies(startCopies, n));
  const line = vals => vals.map((v, n) => `${n ? 'L' : 'M'}${x(n).toFixed(1)},${y(Math.min(v, 10 ** maxLog)).toFixed(1)}`).join(' ');
  return <svg className="bw-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Copies against cycle number on a log scale. Ideal doubling from about ${fmt(startCopies)} copies reaches about ${fmt(idealCopies(startCopies, 10))} at cycle 10. A schematic plateau curve levels off in late cycles; it is illustrative, not calculated.`}>
    <line x1="30" y1={H - 20} x2={W - 10} y2={H - 20} stroke="currentColor" />
    <line x1="30" y1="10" x2="30" y2={H - 20} stroke="currentColor" />
    <path d={line(ideal)} fill="none" stroke="var(--scientific-band)" strokeWidth="2" />
    <path d={line(ideal.map(v => cap * v / (cap + v)))} fill="none" stroke="var(--scientific-ladder)" strokeWidth="2" strokeDasharray="5 4" />
    <circle cx={x(10)} cy={y(ideal[10])} r="4" fill="var(--scientific-band)" />
    <text x={W - 10} y={H - 6} fontSize="9" textAnchor="end" fill="currentColor">cycle →</text>
    <text x="34" y="18" fontSize="9" fill="currentColor">copies (log)</text>
  </svg>;
}

export default function Thermocycler() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [step, dispatch] = useReducer(benchStep, PCR.defaults, initialStep);
  const [curve, curveDispatch] = useReducer(benchStep, {}, initialStep);
  const r = step.result;
  const conc = quantify({...SAMPLE.readings, volumeUl: SAMPLE.volumeUl}).concentration;
  const ladder = SAMPLE.ladder.map(bp => ({bp, pos: migrate(bp, '1', 'right')}));
  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · THERMOCYCLER</p>
    <h2 id={`${uid}-title`}>Copy one target from your genomic DNA.</h2>
    <SampleHandoff from={{title: 'DNA Quantification', href: '/learn/bench-workflow/dna-quantification'}} items={[
      {label: 'Your DNA', value: `${conc} ng/µL, A260/A280 1.83`},
      {label: 'Template', value: `1 µL of a 1:${SAMPLE.dilution} dilution = ${conc / SAMPLE.dilution} ng, about ${fmt(startCopies)} haploid genome copies`},
    ]} />
    <p className="pb-goal">Set up the reaction. Predict what comes out, then run the cycler. The primers are designed to bracket an {SAMPLE.ampliconBp} bp target.</p>
    <Controls config={PCR} settings={step.settings} onChange={patch => dispatch({type: 'set', patch})} />
    <Predict label="Predict the product" options={OUTCOME_OPTIONS} value={step.prediction} onChange={value => dispatch({type: 'predict', value})} />
    <div className="pb-actions"><button type="button" className="primary-button" disabled={!step.prediction} onClick={() => dispatch({type: 'reveal', evaluate: runPcr})}>Run the cycler</button></div>
    {r && <>
      <Verdict tone={PCR_OUTCOMES[r.outcome].tone}><b>{r.correct ? '✓ Your prediction holds: ' : '✗ Not quite: '}{PCR_OUTCOMES[r.outcome].label}.</b> {PCR_OUTCOMES[r.outcome].text}</Verdict>
      <figure className="pb-stage"><div className="pb-stage-head"><span>REQUIREMENTS</span><span>{r.gates.filter(g => g.state === 'open').length} / {r.gates.length} met</span></div><Gates gates={r.gates} /></figure>
      <GelImage caption="Quick check of the reaction on a 1% gel." lanes={[{id: 'ladder', label: 'Ladder', bands: ladder}, {id: 'product', label: 'PCR', bands: r.bands.map(b => ({...b, pos: migrate(b.bp, '1', 'right')}))}]} />
      {r.bands.some(b => b.schematic) && <p className="quiet">The extra bands are placed schematically; their sizes are not predicted.</p>}
    </>}

    <section className="bw-step" aria-labelledby={`${uid}-table`}>
      <h3 id={`${uid}-table`}>Why the target doubles</h3>
      <p>After each denaturation both strands are templates, and each new strand carries the other primer’s site. Counting double-stranded copies from one template molecule in ideal cycles:</p>
      <table className="bw-table"><thead><tr><th scope="col">Cycle</th><th scope="col">Target-containing duplexes</th><th scope="col">Exact-length ({SAMPLE.ampliconBp} bp) duplexes</th></tr></thead>
        <tbody>{pcrTable(5).map(row => <tr key={row.cycle}><th scope="row">{row.cycle}</th><td>{row.total}</td><td>{row.exact}</td></tr>)}</tbody></table>
      <p className="quiet">Exact-length duplexes first appear in cycle 3: 2ⁿ − 2n of the 2ⁿ.</p>
      <Predict label={`Starting from about ${fmt(startCopies)} copies, how many after 10 ideal cycles?`} options={CYCLE10} value={curve.prediction} onChange={value => curveDispatch({type: 'predict', value})} />
      <div className="pb-actions"><button type="button" className="primary-button" disabled={!curve.prediction} onClick={() => curveDispatch({type: 'reveal', evaluate: () => ({outcome: '1.1m'})})}>Reveal the curve</button></div>
      {curve.result && <><Verdict tone={curve.result.correct ? 'good' : 'bad'}><b>{curve.result.correct ? '✓ Right.' : '✗ Not quite.'}</b> 2¹⁰ = 1,024, so {fmt(startCopies)} × 1,024 ≈ {fmt(idealCopies(startCopies, 10))}, about 1.1 million.</Verdict><CopyChart /></>}
      <p className="quiet">Solid line: ideal doubling. Dashed line: a schematic plateau. Real reactions level off in late cycles; where that happens varies, and this curve is not calculated.</p>
    </section>
    <div className="pb-actions"><button type="button" className="outline-button" onClick={() => dispatch({type: 'reset', settings: PCR.defaults})}>Reset the cycler</button></div>
    <PracticeNote />
  </section>;
}
