import { useLayoutEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useProgress } from '../features/transposable-elements/useProgress.js';
import { journeyStops } from '../features/transposable-elements/journey.js';
import { modules, fields, fieldById } from '../features/transposable-elements/curriculum/modules.js';
import { challengeFor, activityFor } from '../features/transposable-elements/curriculum/stations.js';
import PersistenceStatus from '../features/transposable-elements/PersistenceStatus.jsx';
import { stationStatus, STATUS_LABEL, chapterBadges } from './labData.js';

const TOUR_KEY = 'siaset-lab-tour-v1';
const tourSeen = () => { try { return localStorage.getItem(TOUR_KEY) === 'done'; } catch { return true; } };
const markTour = () => { try { localStorage.setItem(TOUR_KEY, 'done'); } catch { /* per-viewer convenience only */ } };

const TOUR = [
  ['Welcome to your lab room.', 'Every station is a small experiment. Read the challenge, make a prediction, then test it on the bench.'],
  ['Fields, modules, stations.', 'Pick a field above the benches, open a module, and choose any station. Every station is open, in any order.'],
  ['Your notebook fills itself.', 'Finish a station and it lands in your notebook with its evidence. Opening a page alone never counts.'],
];

export default function LabRoom() {
  const { progress, labs } = useProgress();
  const { hash } = useLocation();
  const [field, setField] = useState('all');
  const [tour, setTour] = useState(() => (tourSeen() ? -1 : 0));
  const stops = journeyStops(progress, labs, '/lab');
  const done = stops.filter(stop => stop.completed).length;
  const next = stops.find(stop => !stop.completed);
  const badges = chapterBadges(stops);
  const earned = badges.filter(badge => badge.earned).length;
  const shown = modules.filter(module => field === 'all' || module.field === field);

  useLayoutEffect(() => {
    const id = hash.slice(1);
    if (!id.startsWith('module-')) return;
    const module = modules.find(m => `module-${m.id}` === id);
    if (module) setField('all');
    const target = document.getElementById(id);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'start' });
  }, [hash]);

  const closeTour = () => { markTour(); setTour(-1); };
  const count = id => stops.filter(stop => id === 'all' || fieldById(modules.find(m => m.id === stop.module)?.field)?.id === id).length;

  return <main className="lab-room">
    {tour >= 0 && <section className="lab-tour" aria-labelledby="tour-h" aria-live="polite">
      <p className="lab-eyebrow on-dark">FIRST VISIT · {tour + 1} OF {TOUR.length}</p>
      <h2 id="tour-h">{TOUR[tour][0]}</h2>
      <p>{TOUR[tour][1]}</p>
      <ol className="lab-tour-dots" aria-hidden="true">{TOUR.map((_, i) => <li key={i} className={i <= tour ? 'on' : ''}/>)}</ol>
      <div className="lab-tour-actions">
        {tour < TOUR.length - 1 ? <button type="button" className="lab-button lab-button--amber" onClick={() => setTour(tour + 1)}>Next</button> : <button type="button" className="lab-button lab-button--amber" onClick={closeTour}>Start exploring</button>}
        <button type="button" className="lab-text-button on-dark" onClick={closeTour}>Skip the tour</button>
      </div>
    </section>}

    <section className="lab-room-hero" aria-labelledby="lab-h">
      <div className="lab-room-welcome">
        <p className="lab-eyebrow on-dark">{done ? 'YOUR BENCH IS READY' : 'WELCOME TO THE LAB'}</p>
        <h1 id="lab-h">{done ? 'Pick up where you left the pipette.' : 'Choose a station and get your hands dirty.'}</h1>
        {next ? <div className="lab-next">
          <div className="lab-next-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M10 3v7L4 19q-1 2 2 2h12q3 0 2-2l-6-9V3M7 15h10"/></svg></div>
          <div className="lab-next-copy">
            <p>{fieldById(modules.find(m => m.id === next.module)?.field)?.title} · {modules.find(m => m.id === next.module)?.title} · Station {String(next.order).padStart(2, '0')}</p>
            <b>{next.title}</b>
            <span>Challenge: {challengeFor(next.id)}</span>
          </div>
          <Link className="lab-button lab-button--amber" to={next.href}>{stationStatus(next, progress) === 'progress' ? 'Resume station' : 'Start station'} <span aria-hidden="true">→</span></Link>
        </div> : <p className="lab-next-done">Every station is complete. Revisit any of them below, or test yourself in Practice.</p>}
      </div>
      <aside className="lab-room-progress" aria-label="Your progress">
        <div className="lab-room-progress-head"><b>Lab progress · all fields</b><span><strong>{done}</strong> / {stops.length}</span></div>
        <div className="lab-progress" role="progressbar" aria-label="Stations completed" aria-valuemin={0} aria-valuemax={stops.length} aria-valuenow={done}><i style={{ width: `${Math.round(done / stops.length * 100)}%` }}/></div>
        <p className="lab-quiet">Completion comes from learning evidence, not page visits.</p>
        <div className="lab-room-tiles">
          <div className="tile-teal"><span>CHAPTER BADGES</span><b>{earned} of {badges.length}</b></div>
          <div className="tile-amber"><span>HANDS-ON LABS</span><b>{['tn5', 'tn3'].filter(id => labs?.[id]).length} of 2</b></div>
        </div>
        <Link className="lab-link" to="/notebook">Open your notebook →</Link>
      </aside>
    </section>

    <PersistenceStatus/>

    <section className="lab-fields" aria-labelledby="fields-h">
      <div><p className="lab-eyebrow">THE LAB</p><h2 id="fields-h">Choose a field</h2></div>
      <div role="group" aria-label="Field" className="lab-pills">
        {[{ id: 'all', title: 'All fields' }, ...fields].map(f => <button key={f.id} type="button" aria-pressed={field === f.id} onClick={() => setField(f.id)}>{f.title}<span>{count(f.id)}</span></button>)}
      </div>
    </section>

    {shown.map(module => {
      const own = stops.filter(stop => stop.module === module.id);
      return <section key={module.id} id={`module-${module.id}`} tabIndex={-1} className="lab-module" aria-labelledby={`module-h-${module.id}`}>
        <header className="lab-module-head">
          <div>
            <p className="lab-eyebrow"><span className="lab-field-chip">{fieldById(module.field)?.title.toUpperCase()}</span>MODULE · {module.topics.length} STATIONS</p>
            <h2 id={`module-h-${module.id}`}>{module.title}</h2>
            <p>{module.summary}</p>
          </div>
          <p className="lab-module-count"><b>{own.filter(stop => stop.completed).length}</b> of {own.length} stations done</p>
        </header>
        {module.chapters.map(chapter => <div key={chapter.id} className="lab-shelf" id={`journey-${chapter.id}`}>
          <p className="lab-shelf-title"><b>{chapter.title}</b> · {chapter.question}</p>
          <ul className="lab-station-grid">
            {own.filter(stop => chapter.topics.includes(stop.id)).map(stop => {
              const status = stationStatus(stop, progress);
              return <li key={stop.id}><Link className={`lab-station is-${status}`} to={stop.href}>
                <span className="lab-station-top"><span className="lab-station-num">{String(stop.order).padStart(2, '0')}</span><span className={`lab-status is-${status}`}>{STATUS_LABEL[status]}{status === 'done' ? ' ✓' : ''}</span></span>
                <b>{stop.title}</b>
                <span className="lab-station-kind">{stop.learning.kind === 'laboratory' ? 'Hands-on lab' : activityFor(stop.id) || 'Interactive lesson'}</span>
              </Link></li>;
            })}
          </ul>
        </div>)}
      </section>;
    })}

    <section className="lab-more" aria-label="More of the lab">
      <Link className="lab-more-card is-dark" to="/lab/transposable-elements/sandbox"><span className="lab-eyebrow on-dark">FREE BENCH</span><b>Sandbox: no script, any order</b><span>Try Tn5 or Tn3 freely. Session only, never records progress.</span></Link>
      <Link className="lab-more-card" to="/practice"><span className="lab-eyebrow">PRACTICE</span><b>Module assessments</b><span>Each module has its own assessment. Check what you know, then review your evidence.</span></Link>
      <div className="lab-more-card is-placeholder"><span className="lab-eyebrow">NEXT FIELD</span><b>More fields are joining the lab</b><span>New modules from other fields appear here with the same stations, notebook and practice.</span></div>
    </section>
  </main>;
}
