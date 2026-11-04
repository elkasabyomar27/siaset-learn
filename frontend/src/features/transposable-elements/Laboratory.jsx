import LabEvidence from './components/LabEvidence.jsx';
import topics from './curriculum/topics.json' with { type: 'json' };
import { progressRepository } from './progressRepository.js';
import PersistenceStatus from './PersistenceStatus.jsx';
import { experimentFromParams, selectExperiment } from './experimentRouting.js';
import FeatureNav from './FeatureNav.jsx';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Curriculum from './Curriculum.jsx';
import references from './profiles/references.json';
import profiles from './profiles/mechanisms.json';
import { newHistory, execute, seek, reset, replay } from './engine/index.js';
import { copies } from './engine/model.js';
import LabInspector from './components/LabInspector.jsx';
import { guidedStages, stageForCursor, canAdvance, actionForStep } from './learning.js';
import MoleculeView from './components/MoleculeView.jsx';
import Checkpoint from './components/Checkpoint.jsx';
export default function Laboratory() {
  const [params, setParams] = useSearchParams();
  const scenario = experimentFromParams(params);
  function changeScenario(value) {
    if (value !== scenario) setParams(current => selectExperiment(current, value));
  }
  return <LaboratorySession key={scenario} scenario={scenario} changeScenario={changeScenario} />;
}
function LaboratorySession({
  scenario,
  changeScenario
}) {
  const [history, setHistory] = useState(() => newHistory(scenario));
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selection, setSelection] = useState(null);
  const [compare, setCompare] = useState(false);
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [targetBoundary, setTargetBoundary] = useState(200);
  const [resolvase, setResolvase] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const steps = guidedStages[scenario];
  const step = steps[stage];
  const state = history.state;
  const selectedMolecule = state.molecules.find(m => m.id === selection?.moleculeId);
  const selectedFeature = selectedMolecule?.features.find(f => f.id === selection?.featureId);
  const activeProfile = profiles.find(p => p.id === scenario);
  const referenceIds = scenario === 'tn3' ? [...activeProfile.references, ...profiles.find(p => p.id === 'tn3-resolution').references] : activeProfile.references;
  const activeRefs = references.filter(r => referenceIds.includes(r.id));
  function advance() {
    try {
      if (!canAdvance(scenario, stage, answers)) return;
      let action = actionForStep(scenario, stage, targetBoundary);
      if (action?.type === 'tn3.resolve') action = {
        ...action,
        resolvaseAvailable: resolvase
      };
      if (action) setHistory(execute(history, action));
      setStage(stage + 1);
      setError('');
      setSelection(null);
      setNotice('');
    } catch (e) {
      setError(`${e.code}: ${e.message}`);
    }
  }
  function moveHistory(delta) {
    try {
      const h = seek(history, history.cursor + delta);
      setHistory(h);
      setStage(stageForCursor(scenario, h.cursor));
      setSelection(null);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  function startOver() {
    setHistory(reset(history));
    setStage(0);
    setAnswers({});
    setSelection(null);
    setResolvase(true);
    setError('');
    setNotice('Experiment reset to its initial molecular state.');
  }
  function verifyReplay() {
    try {
      const result = replay(history.initial, history.events.slice(0, history.cursor));
      setHistory({
        ...history,
        state: result
      });
      setNotice(`Replayed ${history.cursor} molecular event(s). State reconstruction matches the recorded result.`);
    } catch (e) {
      setError(e.message);
    }
  }
  const currentNote = step.note;
  const checkpointId = step.checkpoint;
  return <main className="laboratory"><FeatureNav /><div className="lab-heading"><div><p className="eyebrow">EXPERIMENT SERIES 01 <span>/</span> TRANSPOSABLE ELEMENTS</p><h1>DNA in motion<span>.</span></h1><p className="intro">Trace the molecule. Predict the outcome. Test your reasoning.</p></div><button className="outline-button" onClick={() => setShowCurriculum(!showCurriculum)} aria-expanded={showCurriculum}>☷ Curriculum <span>{topics.length} topics</span></button></div>
    <PersistenceStatus />
    <div className="experiment-tabs" role="group" aria-label="Choose experiment"><button aria-pressed={scenario === 'tn5'} className={scenario === 'tn5' ? 'active' : ''} onClick={() => changeScenario('tn5')}><span>01</span>Tn5 <small>Conservative</small></button><button aria-pressed={scenario === 'tn3'} className={scenario === 'tn3' ? 'active' : ''} onClick={() => changeScenario('tn3')}><span>02</span>Tn3 <small>Replicative</small></button></div>
    <section className="metrics" aria-label="Molecular state summary"><div><span>ELEMENT COPIES</span><strong>{copies(state).length.toString().padStart(2, '0')}<small> {scenario === 'tn5' ? 'conserved overall' : state.phase === 'initial' ? 'initial donor copy' : 'replication product'}</small></strong></div><div><span>MOLECULAR STATE</span><strong className="state-name">{state.phase === 'initial' ? 'Separate DNA' : state.phase === 'cointegrate' ? 'Cointegrate' : state.phase === 'resolved' ? 'Resolved products' : 'Target insertion'}</strong></div><div><span>TARGET-SITE DUPLICATION</span><strong>{scenario === 'tn5' ? '9' : '5'} <small>bp · host-derived{state.phase === 'initial' ? ' · expected' : ''}</small></strong></div></section>
    <Link className="outline-button curriculum-link" to="/learn/transposable-elements">Study the foundational lessons</Link>
    {showCurriculum && <Curriculum collapsible={false} />}
    <div className="lab-grid"><section className="workspace panel"><div className="panel-heading"><h2><span className="status-dot" /> Molecular workspace</h2><span>ENGINE STATE · REV {state.revision}</span></div><nav className="stage-strip" aria-label="Guided experiment steps">{steps.map(({
            id,
            title: name
          }, i) => <div key={id} className={i === stage ? 'current' : i < stage ? 'done' : ''} aria-current={i === stage ? 'step' : undefined}><span>{i < stage ? '✓' : i + 1}</span><b>{name}</b></div>)}</nav>
    <div className="workspace-toolbar"><span className="state-badge">{step.explanatory ? 'EXPLANATORY STAGE · STATE UNCHANGED' : step.badge || 'CALCULATED MOLECULAR STATE'}</span><label className="compare-toggle"><input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} /> Compare initial state</label></div>
    <div className="legend"><span><i className="donor" />Donor backbone</span><span><i className="target" />Target backbone</span><span><i className="element" />Element →</span><span><i className="tsd" />TSD</span><span><i className="res" />res</span></div>
    {compare && <div className="comparison"><p className="eyebrow">INITIAL STATE</p><div className="molecule-grid">{history.initial.molecules.map(m => <MoleculeView key={m.id} molecule={m} compact onSelect={() => setNotice('Initial-state reference. Use the current-state diagram below for feature inspection.')} />)}</div><p className="eyebrow">CURRENT STATE</p></div>}
    <div className={`molecule-grid ${state.phase === 'cointegrate' ? 'cointegrate-grid' : ''}`}>{state.molecules.map(m => <MoleculeView key={m.id} molecule={m} onSelect={setSelection} selected={selection?.moleculeId === m.id ? selection.featureId : null} />)}</div>
    <div className="model-note"><span>ⓘ</span><p>Symbolic structural model. Diagrams and coordinates are schematic, with no asserted nucleotide sequence. TSD lengths are literature-derived; small features are visually enlarged.</p></div>
    <section className="stage-explanation"><div className="eyebrow">{checkpointId === scenario ? 'EXPLANATORY CHECKPOINT' : 'OBSERVATION & REASONING'}</div><h3>{step.title}</h3><p>{currentNote}</p></section>
    {checkpointId && <Checkpoint id={checkpointId} answer={answers[checkpointId]} onAnswer={value => setAnswers({
          ...answers,
          [checkpointId]: value
        })} />}
    {step.enzymeGate && <label className="enzyme-gate"><input type="checkbox" checked={resolvase} onChange={e => setResolvase(e.target.checked)} /> TnpR resolvase available <small>Switch off to test the resolution gate.</small></label>}
    {state.phase === 'resolved' && <p className="topology-warning">{state.topologyNote}</p>}
    {step.boundaryControl && <label className="boundary-control">Target boundary <input type="number" min="0" max="900" step="1" value={targetBoundary} onChange={e => setTargetBoundary(e.target.value === '' ? '' : Number(e.target.value))} /><span>Teaching placement, 0–900; 900 ≡ 0. No insertion preference predicted.</span></label>}
    {error && <p role="alert" className="error">{error}</p>}{notice && <p role="status" className="notice">{notice}</p>}
    {step.final && <button className="outline-button" onClick={() => setNotice(progressRepository.recordLab(history, stage, answers) ? 'Guided review saved in this browser.' : 'Review not saved to browser storage. Valid evidence remains temporary while the page is loaded; reloading or closing can lose it.')}>Record completed guided review</button>}<div className="workspace-actions"><div className="history-controls"><button className="icon-button" disabled={history.cursor === 0} onClick={() => moveHistory(-1)} title="Undo molecular event" aria-label="Undo molecular event">↶</button><button className="icon-button" disabled={history.cursor === history.events.length} onClick={() => moveHistory(1)} title="Redo molecular event" aria-label="Redo molecular event">↷</button><button className="text-button" onClick={startOver}>Reset</button><button className="text-button" onClick={verifyReplay}>Replay</button></div><button className="primary-button" disabled={!canAdvance(scenario, stage, answers)} onClick={advance}>{step.final ? 'Experiment reviewed' : step.actionLabel || 'Continue'} <span>→</span></button></div></section>
    <LabInspector selectedFeature={selectedFeature} selectedMolecule={selectedMolecule} history={history} scenario={scenario} /></div>
    {step.final && <section className="panel lesson-section learning-transitions" aria-label="Continue learning"><h2>Continue your learning pathway</h2><p>Use “Record completed guided review” above to record this review before moving on. Following a link does not record completion.</p><div className="feature-actions"><Link className="outline-button" to={scenario === 'tn5' ? '/lab/transposable-elements?experiment=tn3' : '/learn/transposable-elements/insertion-sequences'}>{scenario === 'tn5' ? 'Next: Tn3 replicative laboratory' : 'Next: Insertion Sequences'}</Link><Link className="outline-button" to="/learn/transposable-elements/progress">Review your progress</Link></div></section>}
    <LabEvidence scenario={scenario} activeProfile={activeProfile} activeRefs={activeRefs} /><footer className="lab-footer"><span>SIASET LEARN / TRANSPOSABLE ELEMENTS</span><span>SCIENTIFIC MODEL v1 · PHASES 1–3</span></footer>
  </main>;
}
