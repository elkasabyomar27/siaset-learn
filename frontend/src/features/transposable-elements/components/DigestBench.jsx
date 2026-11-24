import { useId, useReducer } from 'react';
import { SAMPLE, ENZYMES, SIZE_CHOICES, digest, cutsFor, fragmentsMatch, migrate } from '../benchWorkflow.js';
import { benchStep, initialStep } from '../benchStep.js';
import { SampleHandoff, Predict, Verdict, LiveRegion, PracticeNote } from './BenchParts.jsx';
import GelImage from './GelImage.jsx';

const DEFAULTS = {enzymes: ['EcoRI'], partial: false};
const L = SAMPLE.ampliconBp;
const place = sizes => sizes.map(bp => ({bp, pos: migrate(bp, '1', 'right')}));

function evaluate(settings) {
  const full = digest(L, cutsFor(settings.enzymes));
  const fragments = digest(L, cutsFor(settings.enzymes), {partial: settings.partial});
  return {fragments, full, outcome: fragments.join('+')};
}
const judge = (predicted, result) => fragmentsMatch(predicted, result.full);
const CIRCLE = [['one', 'One piece, 3,000 bp, now linear'], ['two', 'Two pieces'], ['none', 'No change at all']];

export default function DigestBench() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [step, dispatch] = useReducer(benchStep, DEFAULTS, initialStep);
  const [circle, circleDispatch] = useReducer(benchStep, {}, initialStep);
  const {settings, prediction, result: r} = step;
  const picked = Array.isArray(prediction) ? prediction : [];
  const toggleEnzyme = name => dispatch({type: 'set', patch: {enzymes: settings.enzymes.includes(name) ? settings.enzymes.filter(e => e !== name) : [...settings.enzymes, name]}});
  const toggleSize = bp => dispatch({type: 'predict', value: picked.includes(bp) ? picked.filter(s => s !== bp) : [...picked, bp]});
  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · DIGEST AND CHECK</p>
    <h2 id={`${uid}-title`}>Predict where the enzymes cut, then check on the gel.</h2>
    <SampleHandoff from={{title: 'Gel Electrophoresis', href: '/learn/bench-workflow/gel-electrophoresis'}} items={[
      {label: 'PCR product', value: `One clean band, about ${L} bp`},
      {label: 'Site map', value: `EcoRI at ${ENZYMES.EcoRI.at[0]} bp · HindIII at ${ENZYMES.HindIII.at[0]} bp · no BamHI site`},
    ]} />
    <p className="pb-goal">Choose one or more enzymes. Pick every fragment size you expect from a complete digest, then digest and run it beside the uncut product.</p>
    <fieldset className="bw-fieldset"><legend>Enzymes</legend>
      {Object.entries(ENZYMES).map(([name, e]) => <label key={name} className="mg-toggle bw-toggle"><input type="checkbox" checked={settings.enzymes.includes(name)} onChange={() => toggleEnzyme(name)} /> {name} <small>({e.cut})</small></label>)}
      <label className="mg-toggle bw-toggle"><input type="checkbox" checked={settings.partial} onChange={e => dispatch({type: 'set', patch: {partial: e.target.checked}})} /> Short incubation (not every molecule gets cut)</label>
    </fieldset>
    <div className="bw-choices" role="group" aria-label="Fragment sizes you expect from a complete digest">
      {SIZE_CHOICES.map(bp => <button type="button" key={bp} className="outline-button" aria-pressed={picked.includes(bp)} onClick={() => toggleSize(bp)}>{bp} bp</button>)}
    </div>
    <div className="pb-actions"><button type="button" className="primary-button" disabled={!picked.length} onClick={() => dispatch({type: 'reveal', evaluate, judge})}>Digest and run</button></div>
    <LiveRegion>{r && <Verdict tone={r.correct ? 'good' : 'bad'}>
        <b>{r.correct ? '✓ Your prediction holds.' : '✗ Not quite.'}</b> A complete digest with {settings.enzymes.length ? settings.enzymes.join(' + ') : 'no enzyme'} gives {r.full.join(' + ')} bp.
        {settings.partial && r.fragments.length > r.full.length && <> With a short incubation some molecules are uncut or cut once, so you also see {r.fragments.filter(f => !r.full.includes(f)).join(', ')} bp.</>}
      </Verdict>}</LiveRegion>
      {r && <>
      <GelImage caption="1% agarose gel." lanes={[{id: 'ladder', label: 'Ladder', bands: place(SAMPLE.ladder)}, {id: 'uncut', label: 'Uncut', bands: place([L])}, {id: 'digest', label: 'Digest', bands: place(r.fragments).map(b => ({...b, intensity: r.full.includes(b.bp) ? 'strong' : 'faint'}))}]} />
    </>}
    <section className="bw-step" aria-labelledby={`${uid}-rule`}>
      <h3 id={`${uid}-rule`}>Counting pieces</h3>
      <p>Cutting a <b>linear</b> molecule at n sites gives n + 1 pieces. Cutting a <b>circle</b> at n sites gives n pieces.</p>
      <Predict label="A 3,000 bp circular plasmid has one EcoRI site. What does a complete EcoRI digest give?" options={CIRCLE} value={circle.prediction} onChange={value => circleDispatch({type: 'predict', value})} />
      <div className="pb-actions"><button type="button" className="primary-button" disabled={!circle.prediction} onClick={() => circleDispatch({type: 'reveal', evaluate: () => ({outcome: 'one'})})}>Reveal</button></div>
      <LiveRegion>{circle.result && <Verdict tone={circle.result.correct ? 'good' : 'bad'}><b>{circle.result.correct ? '✓ Right.' : '✗ Not quite.'}</b> One cut opens the circle into a single linear {digest(3000, [100], {topology: 'circular'})[0].toLocaleString('en-US')} bp piece.</Verdict>}</LiveRegion>
    </section>
    <div className="pb-actions"><button type="button" className="outline-button" onClick={() => dispatch({type: 'reset', settings: DEFAULTS})}>Reset the digest</button></div>
    <PracticeNote>The amplicon and its sites are a schematic teaching example.</PracticeNote>
  </section>;
}
