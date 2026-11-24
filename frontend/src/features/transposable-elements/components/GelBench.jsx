import { useId, useReducer, useState } from 'react';
import { SAMPLE, GEL, GEL_OUTCOMES, runGel, bracket } from '../benchWorkflow.js';
import { benchStep, initialStep } from '../benchStep.js';
import { SampleHandoff, Controls, Predict, Verdict, PracticeNote } from './BenchParts.jsx';
import GelImage from './GelImage.jsx';

const CONFIG = {...GEL, defaults: {...GEL.defaults, ethanol: false}, controls: [...GEL.controls, {key: 'ethanol', label: 'Load a sample that still has ethanol in it', type: 'toggle'}]};
const BRACKETS = [['700-800', '700–800 bp'], ['800-900', '800–900 bp'], ['900-1000', '900–1,000 bp']];
const LABELS = {ladder: '100 bp ladder', product: 'PCR', ntc: 'No template', ethanol: 'With ethanol'};
const [LOW, HIGH] = bracket(SAMPLE.ampliconBp);
const midpoint = Math.round(Math.sqrt(LOW * HIGH));

export function evaluateGel(settings) {
  const gel = runGel(settings, {ethanolLane: settings.ethanol});
  const sized = gel.outcome === 'resolved';
  return {...gel, gelOutcome: gel.outcome, outcome: sized ? `${LOW}-${HIGH}` : 'none'};
}

export default function GelBench() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [step, dispatch] = useReducer(benchStep, CONFIG.defaults, initialStep);
  const [estimate, setEstimate] = useState('');
  const [checked, setChecked] = useState(null);
  const r = step.result, outcome = r && GEL_OUTCOMES[r.gelOutcome];
  const act = action => { dispatch(action); setChecked(null); };
  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · GEL RIG</p>
    <h2 id={`${uid}-title`}>Run your PCR product beside a ladder.</h2>
    <SampleHandoff from={{title: 'PCR Amplification', href: '/learn/bench-workflow/pcr-amplification'}} items={[
      {label: 'PCR product', value: `Expected ${SAMPLE.ampliconBp} bp, set by where the primers bind`},
      {label: 'Ladder', value: `${SAMPLE.ladder[1] - SAMPLE.ladder[0]} bp steps, ${SAMPLE.ladder[0]}–${SAMPLE.ladder.at(-1).toLocaleString('en-US')} bp`},
    ]} />
    <p className="pb-goal">Pour the gel, set up the electrodes and choose how long to run. Predict where the product will sit against the ladder, then run it.</p>
    <Controls config={CONFIG} settings={step.settings} onChange={patch => act({type: 'set', patch})} />
    <Predict label="The product will sit between the ladder bands at" options={BRACKETS} value={step.prediction} onChange={value => act({type: 'predict', value})} />
    <div className="pb-actions"><button type="button" className="primary-button" disabled={!step.prediction} onClick={() => act({type: 'reveal', evaluate: evaluateGel})}>Run the gel</button></div>
    {r && <>
      <Verdict tone={outcome.tone}><b>{outcome.label[0].toUpperCase() + outcome.label.slice(1)}.</b> {outcome.text} {r.outcome === 'none' ? 'There is no band to size.' : r.correct ? '✓ Your bracket was right.' : `✗ The band sits between ${LOW} and ${HIGH} bp.`}</Verdict>
      <GelImage caption={`${step.settings.agarose}% agarose gel.`} polarity={step.settings.polarity} lanes={r.lanes.map(l => ({...l, label: LABELS[l.id]}))} />
    </>}
    {r?.gelOutcome === 'resolved' && <section className="bw-step" aria-labelledby={`${uid}-est`}>
      <h3 id={`${uid}-est`}>Estimate the size</h3>
      <p>The band sits between the {LOW} and {HIGH} bp ladder bands, about halfway between them on the gel. Distance falls with log(size), so halfway on the gel is halfway on a log scale.</p>
      <label className="bw-predict"><span>Your estimate (bp)</span><input type="number" inputMode="numeric" min="100" max="1000" value={estimate} onChange={e => { setEstimate(e.target.value); setChecked(null); }} /></label>
      <div className="pb-actions"><button type="button" className="primary-button" disabled={!estimate} onClick={() => setChecked(Number(estimate))}>Check my estimate</button></div>
      {checked !== null && <Verdict tone={Math.abs(checked - SAMPLE.ampliconBp) <= 25 ? 'good' : 'bad'}>
        <b>{Math.abs(checked - SAMPLE.ampliconBp) <= 25 ? '✓ Good estimate.' : '✗ Try again.'}</b> Halfway on a log scale between {LOW} and {HIGH} is √({LOW} × {HIGH}) ≈ {midpoint} bp, so the product is about {SAMPLE.ampliconBp} bp, as the primers predict.
      </Verdict>}
    </section>}
    <div className="pb-actions"><button type="button" className="outline-button" onClick={() => act({type: 'reset', settings: CONFIG.defaults})}>Reset the rig</button></div>
    <PracticeNote>Band positions are schematic; real resolution depends on the agarose, buffer and voltage.</PracticeNote>
  </section>;
}
