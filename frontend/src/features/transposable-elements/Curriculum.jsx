import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useProgress } from './useProgress.js';
import { focusJourneyTarget, curriculumModules, journeyStops } from './journey.js';
import { allTopics } from './curriculum/modules.js';
import './journey.css';

export function JourneyMap({ progress, labs, pathname, search = '', initialView = 'journey' }) {
  const [view, setView] = useState(initialView);
  const [previews, setPreviews] = useState(false);
  const stops = journeyStops(progress, labs, pathname, search);
  const current = stops.find(stop => stop.current);
  return <section className={`dna-journey dna-journey--${view}`} aria-labelledby="journey-title">
    <div className="journey-heading"><div><p className="eyebrow">EXPLORE / CONNECT / REVISIT</p><h2 id="journey-title">DNA Journey</h2></div><p>{stops.filter(stop => stop.completed).length} / {stops.length} officially completed</p></div>
    <p>Explore freely: every topic is open. Browsing does not record learning evidence.</p>
    <p className="journey-draft">Visual teaching draft · scientific approval pending.</p>
    <details className="journey-model-note"><summary>About this pathway</summary><p className="journey-note">A DNA helix is a navigation metaphor. Positions, spacing and bends do not represent biological positions, sequence or scale, prerequisites, or proficiency.</p><p>Concept previews use existing lesson objectives; the connecting pathway is navigation, not a reaction mechanism. Official completion reflects the existing lesson requirements or an explicitly recorded guided review; it is not scientific certification.</p></details>
    <p className="journey-location">Current location: <strong>{current ? `${String(current.order).padStart(2, '0')} · ${current.title}` : 'Curriculum overview'}</strong>. Completion is shown separately at each stop.</p>
    <div className="journey-tools"><a href="#journey-all" onClick={focusJourneyTarget}>Browse all {stops.length} topics</a><fieldset><legend>Navigation view</legend><label><input type="radio" name="journey-view" value="journey" checked={view === 'journey'} onChange={() => setView('journey')} />Journey map</label><label><input type="radio" name="journey-view" value="list" checked={view === 'list'} onChange={() => setView('list')} />Flat list</label></fieldset></div>
    <label className="journey-preview-toggle"><input type="checkbox" checked={previews} onChange={event => setPreviews(event.target.checked)} />Show concept previews</label>
    <nav className="journey-jumps" aria-label="Jump to a module or conceptual group">{curriculumModules.map((module, m) => <span className="journey-jump-module" key={module.id}><a href={`#module-${module.id}`} onClick={focusJourneyTarget}><b>Module {m + 1} · {module.title}</b></a>{module.chapters.map((group, i) => <a key={group.id} href={`#journey-${group.id}`} onClick={focusJourneyTarget}><span aria-hidden="true">0{i + 1} · </span>{group.title}</a>)}</span>)}</nav>
    <h3 id="journey-all" tabIndex={-1}>All topics · in order</h3>
    {curriculumModules.map((module, m) => <section className="journey-module" key={module.id} aria-labelledby={`module-${module.id}`}>
      <header className="journey-module-header"><p className="eyebrow">MODULE {String(m + 1).padStart(2, '0')} · {module.topics.length} TOPICS</p><h3 id={`module-${module.id}`} tabIndex={-1}>{module.title}</h3><p>{module.summary}</p></header>
    {module.chapters.map((group, i) => <section className={`journey-group journey-region-${group.id}`} key={group.id} aria-labelledby={`journey-${group.id}`}>
      <header><p className="eyebrow">MODULE {m + 1} · GROUP 0{i + 1}</p><h3 id={`journey-${group.id}`} tabIndex={-1}>{group.title}</h3><p>{group.question}</p></header>
      <div className="journey-track">
        <svg className="journey-ribbons" viewBox="0 0 64 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M16 0 C64 25 0 25 48 50 S0 75 16 100" /><path d="M48 0 C0 25 64 25 16 50 S64 75 48 100" /></svg>
        <ol role="list" start={stops.find(stop => group.topics.includes(stop.id)).order}>{stops.filter(stop => group.topics.includes(stop.id)).map(stop => <li key={stop.id}>
          <Link className={`journey-stop${stop.completed ? ' is-complete' : ''}`} to={stop.href} aria-current={stop.current ? 'page' : undefined}>
            <span className="journey-number">{String(stop.order).padStart(2, '0')}</span><span className="journey-label"><strong>{stop.title}</strong><span className="journey-kind">{stop.learning.kind === 'laboratory' ? `Guided laboratory · ${stop.learning.experiment === 'tn3' ? 'Tn3' : 'Tn5'}` : 'Interactive lesson'}</span><span className="journey-preview" hidden={!previews}><span>Concept preview</span>{stop.learningObjectives[0]}</span><span className="journey-status">Official completion: {stop.completed ? 'Completed' : 'Incomplete'}{stop.learning.kind === 'laboratory' && !stop.completed ? ' · guided review not recorded' : ''}</span>{stop.current && <span className="journey-current">Current location</span>}</span><span className="journey-open" aria-hidden="true">↗</span>
          </Link>
        </li>)}</ol>
      </div>
    </section>)}
    </section>)}
  </section>;
}

export default function Curriculum({ collapsible = true }) {
  const { progress, labs } = useProgress();
  const { pathname, search } = useLocation();
  const map = <JourneyMap progress={progress} labs={labs} pathname={pathname} search={search} />;
  return !collapsible || pathname.replace(/\/+$/, '') === '/learn/transposable-elements' ? <div className="curriculum panel">{map}</div> : <details className="curriculum panel journey-disclosure"><summary>DNA Journey · browse all {allTopics.length} topics in {curriculumModules.length} modules</summary>{map}</details>;
}
