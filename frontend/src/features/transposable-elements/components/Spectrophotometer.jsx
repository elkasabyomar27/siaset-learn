import { useId, useReducer, useState } from 'react';
import { SAMPLE, QUANT_SAMPLES, VERDICTS, quantify, verdictFor, DS_DNA_NG_PER_UL_PER_A260 } from '../benchWorkflow.js';
import { benchStep, initialStep } from '../benchStep.js';
import { SampleHandoff, Predict, Verdict, LiveRegion, PracticeNote } from './BenchParts.jsx';

const VERDICT_OPTIONS = Object.entries(VERDICTS).map(([k, v]) => [k, v.label]);
const evaluateCard = card => () => { const r = quantify({...card, volumeUl: SAMPLE.volumeUl}); return {...r, outcome: verdictFor(r)}; };

function SampleCard({card}) {
  const [step, dispatch] = useReducer(benchStep, {}, initialStep);
  const r = step.result;
  return <li className="bw-card">
    <b>{card.label}</b>
    <p className="bw-readings">A260 {card.a260.toFixed(2)} · A280 {card.a280.toFixed(2)} · A230 {card.a230.toFixed(2)}</p>
    <Predict label="What does this sample show?" options={VERDICT_OPTIONS} value={step.prediction} onChange={value => dispatch({type: 'predict', value})} />
    <button type="button" className="primary-button" disabled={!step.prediction} onClick={() => dispatch({type: 'reveal', evaluate: evaluateCard(card)})}>Reveal the ratios</button>
    <LiveRegion>{r && <Verdict tone={r.correct ? 'good' : 'bad'}>
      <b>{r.correct ? '✓ Your prediction holds.' : `✗ Not quite: this is ${VERDICTS[r.outcome].label}.`}</b> A260/A280 = {r.r280.toFixed(2)} · A260/A230 = {r.r230.toFixed(2)} · {r.concentration} ng/µL. {VERDICTS[r.outcome].text}
    </Verdict>}</LiveRegion>
  </li>;
}

const CONC_OPTIONS = [37.5, 15, 75];

export default function Spectrophotometer() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [answer, setAnswer] = useState(null);
  const ours = quantify({...SAMPLE.readings, volumeUl: SAMPLE.volumeUl});
  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · SPECTROPHOTOMETER</p>
    <h2 id={`${uid}-title`}>How much DNA did you get, and how clean is it?</h2>
    <SampleHandoff from={{title: 'Ethanol Washing', href: '/learn/dna-extraction/ethanol-wash'}} items={[
      {label: 'Sample', value: 'Clean genomic DNA from the 70% ethanol wash'},
      {label: 'Volume', value: `${SAMPLE.volumeUl} µL in TE buffer`},
    ]} />
    <p className="pb-goal">Read each sample card. Predict what it shows before you reveal its ratios. Pure DNA reads about 1.8 for A260/A280 and about 1.8–2.2 for A260/A230.</p>
    <ol className="bw-cards" aria-label="Samples to read">{QUANT_SAMPLES.map(card => <SampleCard key={card.id} card={card} />)}</ol>

    <section className="bw-step" aria-labelledby={`${uid}-conc`}>
      <h3 id={`${uid}-conc`}>Your DNA reads A260 = {SAMPLE.readings.a260}. What is its concentration?</h3>
      <div className="bw-choices" role="group" aria-label="Concentration">
        {CONC_OPTIONS.map(c => <button type="button" key={c} className="outline-button" aria-pressed={answer === c} onClick={() => setAnswer(c)}>{c} ng/µL</button>)}
      </div>
      <LiveRegion>{answer !== null && <Verdict tone={answer === ours.concentration ? 'good' : 'bad'}>
        <b>{answer === ours.concentration ? '✓ Right.' : '✗ Not quite.'}</b> {SAMPLE.readings.a260} × {DS_DNA_NG_PER_UL_PER_A260} ng/µL = {ours.concentration} ng/µL; × {SAMPLE.volumeUl} µL = {ours.yieldNg.toLocaleString('en-US')} ng, about {(ours.yieldNg / 1000).toFixed(1)} µg. This DNA goes on to the PCR station.
      </Verdict>}</LiveRegion>
    </section>
    <PracticeNote>Flag cut-offs are teaching values, not instrument specifications.</PracticeNote>
  </section>;
}
