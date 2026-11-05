import { Link } from 'react-router';
import FeatureNav from '../features/transposable-elements/FeatureNav.jsx';
import { useProgress } from '../features/transposable-elements/useProgress.js';
import { journeyStops, journeyGroups } from '../features/transposable-elements/journey.js';
import { LearningCompass } from './CurriculumOverview.jsx';
import ContinueLearning from './ContinueLearning.jsx';
import SectionSwitcher from './SectionSwitcher.jsx';

export default function LearningOverview(){
  const {progress,labs}=useProgress();
  const stops=journeyStops(progress,labs,'/'),completed=stops.filter(stop=>stop.completed).length;
  return <main className="laboratory curriculum-overview learning-overview"><FeatureNav/><SectionSwitcher/>
    <header className="curriculum-hero"><div className="curriculum-hero-copy"><p className="eyebrow">THE SIASET FIELD GUIDE / MOLECULAR GENETICS</p><h1>Small elements.<br/><em>Remarkable ideas.</em></h1><p className="curriculum-lede">Explore the science of moving DNA. Start with the foundations, follow a molecule in the lab, and connect what you observe to what you understand.</p><div className="curriculum-hero-actions"><Link className="primary-button" to="/learn/transposable-elements">Explore the curriculum <span aria-hidden="true">↗</span></Link><Link to="/lab/transposable-elements">Enter the guided labs <span aria-hidden="true">→</span></Link></div><div className="course-facts"><span><b>{stops.length}</b> connected topics</span><span><b>{journeyGroups.length}</b> chapters</span><span><b>2</b> guided mechanisms</span><span>Learn at your own pace</span></div></div>
    <aside className="curriculum-progress-card"><LearningCompass stops={stops}/><div className="course-next"><span>YOUR FIELD GUIDE</span><Link to="/learn/transposable-elements"><b>{completed}/{stops.length}</b>Explore your learning path<span aria-hidden="true">→</span></Link></div><p>Your completed topics are based on recorded learning evidence.</p></aside></header>
    <ContinueLearning/>
    <section className="overview-chapters"><header className="overview-section-heading"><div><p className="eyebrow">FIVE CONNECTED CHAPTERS</p><h2>One idea opens the next.</h2></div><Link to="/learn/transposable-elements">View the full curriculum ↗</Link></header><div className="overview-chapter-grid">{journeyGroups.map((group,index)=><Link className={`overview-chapter overview-chapter--${group.id}`} to={`/learn/transposable-elements#journey-${group.id}`} key={group.id}><div className="chapter-card-top"><span>CHAPTER {String(index+1).padStart(2,'0')}</span><b>{group.topics.length} topics</b></div><h3>{group.title}</h3><p>{group.question}</p><span className="chapter-card-link">Explore this chapter <span aria-hidden="true">↗</span></span></Link>)}</div></section>
    <section className="overview-method"><div><p className="eyebrow">A WAY TO LEARN</p><h2>Follow the evidence.</h2><p>Observe a structure, make a prediction, and compare your reasoning with the evidence.</p></div><ol><li><span>01</span><div><b>Observe</b><p>Explore the symbolic molecular models and their annotations.</p></div></li><li><span>02</span><div><b>Predict</b><p>Think through copy number, structure and mechanism.</p></div></li><li><span>03</span><div><b>Understand</b><p>Use feedback to connect a result to the underlying idea.</p></div></li></ol></section>
    <section className="overview-destinations" aria-label="Explore the workspaces"><Link to="/lab/transposable-elements"><span className="eyebrow">EXPERIMENT</span><h3>Get hands-on with DNA.</h3><p>Guided Tn5 and Tn3 workbenches, plus an independent sandbox.</p><b>Open the laboratories ↗</b></Link><Link to="/learn/transposable-elements/assessment"><span className="eyebrow">CHECK & REFLECT</span><h3>Connect what you know.</h3><p>Practice across the curriculum, then revisit your learning evidence.</p><b>Explore assessment & progress ↗</b></Link></section>
    <footer className="learning-overview-footer"><span>SIASET / MOLECULAR GENETICS</span><p>Symbolic educational models · All topics open · Progress saved in this browser and synced when you sign in</p></footer>
  </main>;
}
