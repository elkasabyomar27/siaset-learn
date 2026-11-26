import ConceptDiagram, {CellOwnershipDiagram} from '../../ui/ConceptDiagram.jsx';
import {useState} from 'react';
import {predictionOptions, runInvestigation} from './bacterialExplorerLogic.js';
import {resistanceExample} from './engine/bacterial.js';
import {ChoiceChips} from './hands-on/kit/ChoiceChips.jsx';
import './hands-on/kit/geneticsScenes.css';

function Cells({state}) {
  return <CellOwnershipDiagram state={state}/>;
}

// Context tabs choose the scene, the prediction is a choice of chips, and "Test reasoning" is the
// commitment. What gets recorded as lesson evidence is decided in bacterialExplorerLogic.js.
export default function BacterialExplorer({lesson, inspected = [], onInspect}) {
  const [index, setIndex] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [result, setResult] = useState(null);
  const variant = lesson.variants[index];
  const options = predictionOptions(lesson);
  const test = () => runInvestigation(lesson, index, prediction, {onInspect, setResult});
  return <section className="lesson-section gx-explorer">
    <p className="eyebrow">03 / BACTERIAL DNA AND TRANSFER EXPLORER</p>
    <h2>Inspect the system, then predict</h2>
    <div className="exploration-tabs" role="group" aria-label="Bacterial scientific scenarios">{lesson.variants.map((v, i) => <button type="button" key={v.label} className="outline-button" aria-pressed={i === index} onClick={() => { setIndex(i); setPrediction(''); setResult(null); }}>{v.label}{inspected.includes(i) ? ' ✓' : ''}</button>)}</div>
    <figure className="gx-explorer-scene" aria-label={`Scene: ${variant.label}`}>
      {Number.isInteger(variant.stage) && <Cells state={resistanceExample(Math.max(0, variant.stage - 1)).state}/>}
      <ConceptDiagram title={variant.label} blocks={variant.blocks}/>
    </figure>
    <p><b>Defined context:</b> {variant.explanation}</p>
    <ChoiceChips legend="Predict or classify this scenario" options={options} value={prediction} onChange={o => { setPrediction(o); setResult(null); }} hint={prediction ? undefined : 'Choose a supported interpretation.'} />
    <button type="button" className="primary-button" disabled={!prediction} onClick={test}>Test reasoning</button>
    {result && <><p role="status" className={`feedback ${result.correct ? 'good' : ''}`}>{result.text}</p><p>{result.note}</p>{result.model && <><h3>Calculated cell ownership</h3><Cells state={result.model.state}/><ol>{result.model.events.map((e, i) => <li key={i}>{e.type}: {e.from} → {e.to}; {e.scope}</li>)}</ol><p className="quiet">Chromosomes are retained symbolic identity markers, not simulated whole bacterial genomes. Completed conjugation copies the plasmid into the recipient while retaining the donor copy. Gene acquisition does not establish phenotypic resistance.</p></>}</>}
    <p className="quiet">Correctly classify every context, then answer the applied question and both checks. No clinical outcome or transfer efficiency is predicted.</p>
  </section>;
}
