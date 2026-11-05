import AnatomyLab from './components/AnatomyLab.jsx';
import TsdBuilder from './components/TsdBuilder.jsx';
import MobileElementBuilder from './components/MobileElementBuilder.jsx';
import CompositeBuilder from './components/CompositeBuilder.jsx';
import OperonExplorer from './components/OperonExplorer.jsx';
import ClassificationSort from './components/ClassificationSort.jsx';
import MobilityGates from './components/MobilityGates.jsx';
import PhenotypeExplorer from './components/PhenotypeExplorer.jsx';
import KernelGrower from './components/KernelGrower.jsx';
import CopyLedger from './components/CopyLedger.jsx';
import RecombinationLab from './components/RecombinationLab.jsx';
import HgtLab from './components/HgtLab.jsx';
import { adjacentTopics } from './curriculum/navigation.js';
import { Question, Exploration } from './components/LessonActivities.jsx';
import BacterialExplorer from './BacterialExplorer.jsx';
import LessonReset from './components/LessonReset.jsx';
import ConsequenceExplorer from './ConsequenceExplorer.jsx';
import { Link, useParams } from 'react-router';
import topics from './curriculum/topics.json' with { type: 'json' };
import references from './profiles/references.json';
import { lessonById, topicHref } from './curriculum/lessons.js';
import { isComplete } from './lessonProgress.js';
import { useProgress } from './useProgress.js';
import { progressRepository } from './progressRepository.js';
import PersistenceStatus from './PersistenceStatus.jsx';
import Curriculum from './Curriculum.jsx';
export default function Lessons() {
  const {
    topicId
  } = useParams();
  const {
    progress
  } = useProgress();
  const lesson = lessonById(topicId);
  function record(kind, value) {
    progressRepository.recordLesson(topicId, kind, value);
  }
  const topic = topics.find(t => t.id === topicId);
  const current = progress[topicId] || {};
  const complete = isComplete(topicId, current);
  const {
    next: nextTopic,
    previous: previousTopic
  } = adjacentTopics(topicId);
  return <main className="laboratory lessons"><div className="lab-heading"><div><h1>{lesson ? topic.title : 'Understand mobile DNA'}<span>.</span></h1><p className="intro">Observe the structure. Reason from evidence. Check your understanding.</p></div></div>{topicId && !lesson ? <><Curriculum /><section className="panel lesson-section"><h2>Lesson unavailable</h2><p>This topic is planned or belongs to a guided laboratory. Choose an available topic above.</p></section></> : lesson && <article className="panel lesson-body"><section className="lesson-section"><p className="eyebrow">01 / OBJECTIVES</p><h2>What you will be able to explain</h2><ul>{lesson.objectives.map(o => <li key={o}>{o}</li>)}</ul><p className="eyebrow">02 / CORE CONCEPT</p><p>{lesson.concept}</p><div className="tags">{lesson.terms.map(term => <span key={term}>{term}</span>)}</div></section>{lesson.id === 'tsd' && <TsdBuilder />}{lesson.id === 'insertion-sequences' && <MobileElementBuilder />}{lesson.id === 'composite' && <CompositeBuilder />}{lesson.id === 'expression' && <OperonExplorer />}{lesson.id === 'classification' && <ClassificationSort />}{lesson.id === 'introduction' && <MobilityGates mode="intro" />}{lesson.id === 'regulation' && <MobilityGates />}{lesson.id === 'phenotypes' && <PhenotypeExplorer />}{lesson.id === 'discovery' && <KernelGrower />}{lesson.id === 'dna-diversity' && <CopyLedger />}{lesson.id === 'genomic-consequences' && <RecombinationLab />}{lesson.id === 'bacterial-hgt' && <HgtLab />}{lesson.id === 'bacterial-hgt' ? <BacterialExplorer key={lesson.id} lesson={lesson} inspected={current.inspected} onInspect={i => record('inspect', i)} /> : lesson.check2 ? <ConsequenceExplorer key={lesson.id} lesson={lesson} inspected={current.inspected} onInspect={i => record('inspect', i)} /> : <Exploration key={lesson.id} lesson={lesson} inspected={current.inspected} onInspect={i => record('inspect', i)} />}{lesson.id === 'anatomy' && <><section className="lesson-section" aria-label="Recorded anatomy evidence"><h2>Recorded lesson evidence</h2><ul>{lesson.variants.map((variant, i) => <li key={variant.label}>{variant.label}: {current.inspected?.includes(i) ? 'inspected' : 'still to inspect using the original view button'}</li>)}<li>Applied reasoning: {current.exercise === undefined ? 'unanswered' : current.exercise === lesson.exercise.correct ? 'correct' : 'review required'}</li><li>Knowledge check: {current.check === undefined ? 'unanswered' : current.check === lesson.check.correct ? 'correct' : 'review required'}</li></ul><p>Recorded lesson evidence may change in another tab; practice answers are separate.</p><a className="outline-button" href="#anatomy-required">Jump to required questions</a></section><AnatomyLab key={lesson.id} /><div id="anatomy-required" tabIndex={-1}><h2>Original required questions</h2></div></>}<Question title="04 / APPLIED REASONING" name={`${lesson.id}-exercise`} question={lesson.exercise} answer={current.exercise} onAnswer={i => record('exercise', i)} /><Question title="05 / KNOWLEDGE CHECK" name={`${lesson.id}-check`} question={lesson.check} answer={current.check} onAnswer={i => record('check', i)} />{lesson.check2 && <Question title="05 / KNOWLEDGE CHECK 2" name={`${lesson.id}-check2`} question={lesson.check2} answer={current.check2} onAnswer={i => record('check2', i)} />}<section className="lesson-section"><p className="eyebrow">06 / COMPLETION SUMMARY</p><h2 role="status">{complete ? 'Lesson completed' : 'Evidence still to review'}</h2><p>{complete ? 'You inspected every view and correctly answered all required reasoning questions.' : `Inspect all ${lesson.variants.length} views and answer all required questions correctly. Opening the page does not complete it.`}</p>{complete && <p>{lesson.objectives.join(' ')}</p>}<PersistenceStatus />{previousTopic && <Link className="outline-button" to={topicHref(previousTopic)}>Previous: {previousTopic.title}</Link>}{nextTopic && topicHref(nextTopic) && <Link className="outline-button" to={topicHref(nextTopic)}>Next: {nextTopic.title}</Link>}<div className="learning-transitions"><p>Continue at your own pace. Moving to another topic does not complete this lesson.</p><Link className="outline-button" to="/learn/transposable-elements/progress">Review your progress</Link>{!nextTopic && <Link className="outline-button" to="/learn/transposable-elements/assessment">Practice with the cumulative assessment</Link>}</div>{lesson.id === 'dna-diversity' && <div className="tags"><Link className="outline-button" to="/lab/transposable-elements?experiment=tn5">Launch Tn5</Link><Link className="outline-button" to="/lab/transposable-elements?experiment=tn3">Launch Tn3</Link></div>}<LessonReset key={lesson.id} title={topic.title} onReset={() => progressRepository.resetLesson(lesson.id)} /></section><details className="lesson-section model-notes"><summary><h2>Model notes and sources</h2></summary><p>{lesson.limitations}</p><ul className="model-notes-list"><li>Diagrams are ordered teaching annotations: layout and spacing are schematic, not sequence, scale or molecular motion.</li><li>Concept views are explanatory symbolic models. Qualitative contexts do not predict experimental measurements; only structures explicitly labelled as calculated use a molecular engine.</li><li>Progress records your current answers. It is not an instructor-certified assessment.</li></ul><div className="reference-list">{lesson.references.map(id => {
            const reference = references.find(r => r.id === id);
            return <a key={id} href={reference.url} target="_blank" rel="noreferrer">{reference.citation}<small>{reference.verification}</small></a>;
          })}</div></details></article>}</main>;
}
