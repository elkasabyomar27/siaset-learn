import ConceptDiagram from '../../ui/ConceptDiagram.jsx';
import {useState} from 'react';
import {predictionOptions, runReveal} from './consequenceExplorerLogic.js';
import MoleculeView from './components/MoleculeView.jsx';
import {ChoiceChips} from './hands-on/kit/ChoiceChips.jsx';
import './hands-on/kit/geneticsScenes.css';

// Context tabs choose the scene, the prediction is a choice of chips, and the reveal button is the
// commitment. What gets recorded as lesson evidence is decided in consequenceExplorerLogic.js.
export default function ConsequenceExplorer({lesson, inspected = [], onInspect}) {
  const [index, setIndex] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [result, setResult] = useState(null);
  const variant = lesson.variants[index];
  const options = predictionOptions(lesson);
  const reveal = () => runReveal(lesson, index, prediction, {onInspect, setResult});
  return <section className="lesson-section gx-explorer">
    <p className="eyebrow">03 / SCIENTIFIC EXPLORER</p>
    <h2>Select a context and predict</h2>
    <div className="exploration-tabs" role="group" aria-label="Scientific contexts">{lesson.variants.map((v, i) => <button type="button" className="outline-button" key={v.label} aria-pressed={index === i} onClick={() => { setIndex(i); setPrediction(''); setResult(null); }}>{v.label}{inspected.includes(i) ? ' ✓' : ''}</button>)}</div>
    <figure className="gx-explorer-scene" aria-label={`Scene: ${variant.label}`}>
      <ConceptDiagram title={variant.label} blocks={variant.blocks}/>
    </figure>
    <p><b>Defined context:</b> {variant.explanation}</p>
    <ChoiceChips legend="Predict the qualitative outcome" options={options} value={prediction} onChange={o => { setPrediction(o); setResult(null); }} hint={prediction ? undefined : 'Choose an outcome.'} />
    <button type="button" className="primary-button" disabled={!prediction} onClick={reveal}>{lesson.id === 'genomic-consequences' ? 'Calculate selected event' : 'Investigate prediction'}</button>
    {result && <><p role="status" className={`feedback ${result.correct ? 'good' : ''}`}>{result.correct ? 'Supported by this context. ' : 'Reconsider this context. '}Expected: {variant.outcome}. {variant.explanation}</p>{result.calculated?.products && <><p>{result.calculated.mechanism}</p><p>Before: {result.calculated.before.join(' | ')}</p>{result.calculated.products.map((product, i) => <figure key={i}><figcaption>Product {i + 1} ({result.calculated.topology[i]})</figcaption><ConceptDiagram title={`Product ${i + 1} (${result.calculated.topology[i]})`} blocks={product} calculated/></figure>)}<p className="quiet">Calculated symbolic block arrangement. No nucleotide breakpoints or product survival are inferred.</p></>}{(result.calculated?.result || result.calculated?.state) && <><p>Calculated by the existing {lesson.id === 'tsd' && index === 1 ? 'Tn3' : 'Tn5'} engine.</p>{result.calculated.initial && <details><summary>Compare original molecules</summary><div className="molecule-grid">{result.calculated.initial.molecules.map(m => <MoleculeView key={m.id} molecule={m}/>)}</div></details>}<div className="molecule-grid">{(result.calculated.result || result.calculated.state).molecules.map(m => <MoleculeView key={m.id} molecule={m}/>)}</div>{result.calculated.pairs && <div>{result.calculated.pairs.map(pair => <p key={pair.id}>{pair.side} TSD: {pair.bp} bp, host-derived from target interval {pair.sourceSegments.map(([a, b]) => `${a + 1}–${b}`).join(', ')} (one-based inclusive, symbolic positions). Both repeats trace the same host interval.</p>)}</div>}</>}</>}
    <p className="quiet">Solve every context to complete exploration.</p>
  </section>;
}
