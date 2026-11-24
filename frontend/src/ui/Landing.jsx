import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import Brand from '../Brand.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { profileDetails } from '../auth/profile.js';
import { useProgress } from '../features/transposable-elements/useProgress.js';
import { journeyStops } from '../features/transposable-elements/journey.js';
import { modules, fields, allChapters, fieldById } from '../features/transposable-elements/curriculum/modules.js';
import { activityFor } from '../features/transposable-elements/curriculum/stations.js';

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

function useCountUp(targets) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (reducedMotion()) { setK(1); return undefined; }
    let raf, start;
    const tick = now => { start ??= now; const t = Math.min(1, (now - start) / 1400); setK(1 - (1 - t) ** 3); if (t < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return targets.map(value => Math.round(value * k));
}

const RUNGS = Array.from({ length: 22 }, (_, i) => ({ i, element: i >= 9 && i <= 13 }));

function Helix() {
  return <figure className="landing-helix" role="img" aria-label="A three-dimensional DNA double helix slowly rotating, with a highlighted transposable element segment in the middle">
    <div className="landing-orbit landing-orbit--outer" aria-hidden="true"/>
    <div className="landing-orbit landing-orbit--inner" aria-hidden="true"/>
    <div className="helix-stage" aria-hidden="true">
      <div className="helix">
        {RUNGS.map(({ i, element }) => <div key={i} className={`helix-rung${element ? ' is-element' : ''}`} style={{ top: `${i * 19}px`, transform: `rotateY(${i * 22}deg)` }}><i/><b/><b/></div>)}
      </div>
    </div>
    <figcaption className="helix-legend"><span><i className="host"/>Host DNA</span><span><i className="element"/>Transposable element</span><span>Hover to pause</span></figcaption>
  </figure>;
}

const GUESSES = ['One, it moves', 'Two, it copies itself', 'Zero, it is used up'];

// A simplified animation teaser. It does not use or replace the lab engine; the real station does.
function LiveDemo() {
  const [guess, setGuess] = useState(null), [phase, setPhase] = useState('idle');
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    if (guess === null || phase !== 'idle') return;
    setPhase('lift');
    timer.current = setTimeout(() => setPhase('inserted'), reducedMotion() ? 0 : 750);
  };
  const placed = phase === 'inserted', right = guess === 0;
  const message = !placed ? (guess === null ? 'Pick a prediction to unlock the run.' : 'Prediction locked in. Run it and see.')
    : right ? 'You called it: one copy. Tn5 left the donor, and two short repeats appeared at the joins.'
      : 'Not quite: there is still one copy. In cut-and-paste the element leaves the donor instead of copying.';
  return <section className="landing-live" aria-labelledby="live-h">
    <div className="landing-live-copy">
      <p className="lab-eyebrow"><span className="live-dot" aria-hidden="true"/>TRY IT LIVE · A STATION FROM GENETICS</p>
      <h2 id="live-h">After Tn5 hops, how many copies are left?</h2>
      <div role="radiogroup" aria-label="Your prediction" className="landing-guesses">
        {GUESSES.map((label, i) => <button key={label} type="button" role="radio" aria-checked={guess === i} disabled={phase !== 'idle'} onClick={() => setGuess(i)}>{label}</button>)}
      </div>
      <div className="landing-live-actions">
        <button type="button" className="lab-button" disabled={guess === null || phase !== 'idle'} onClick={run}>Run transposition →</button>
        <button type="button" className="lab-text-button" onClick={() => { clearTimeout(timer.current); setGuess(null); setPhase('idle'); }}>↺ Reset</button>
      </div>
      <p role="status" className={`lab-callout${placed ? (right ? ' is-good' : ' is-warn') : ''}`}>{message}</p>
    </div>
    <div className="landing-live-stage">
      <div className="landing-vitals">
        <span>ELEMENT COPIES <b>1</b></span><span>DNA MOLECULES <b>{placed ? 3 : 2}</b></span><span>STATE <b className="accent">{placed ? 'Inserted' : phase === 'lift' ? 'Moving' : 'Separate DNA'}</b></span>
      </div>
      <div className="landing-stage-scroll">
        <div className={`landing-stage is-${phase}`} role="img" aria-label={placed ? 'Tn5 inserted at the top of the target ring with a short repeat on each side; the donor is left in two pieces' : 'Tn5 inside the straight donor DNA, next to an empty target ring'}>
          <span className="stage-label stage-label--donor">DONOR</span>
          <div className="stage-donor a"/><div className="stage-donor b"/>
          <span className="stage-label stage-label--target">TARGET RING</span>
          <div className="stage-ring"/>
          <div className="stage-chip">Tn5</div>
          <div className="stage-repeat left"/><div className="stage-repeat right"/>
        </div>
      </div>
      <p className="landing-stage-note">Simplified preview. The full station uses the real lab engine, step by step.</p>
    </div>
  </section>;
}

export default function Landing() {
  const { user } = useAuth();
  const { progress, labs } = useProgress();
  const stops = journeyStops(progress, labs, '/');
  const done = stops.filter(stop => stop.completed).length;
  const next = stops.find(stop => !stop.completed);
  const [nStations, nFields, nModules] = useCountUp([stops.length, fields.length, modules.length]);
  const name = user ? profileDetails(user).name : '';
  const labCount = stops.filter(stop => stop.learning.kind === 'laboratory').length;

  return <main className="landing">
    <div className="landing-hero-band">
      <section className="landing-hero" aria-labelledby="hero">
        <div className="landing-hero-copy">
          <div className="landing-hero-logo"><Brand tone="dark"/></div>
          <p className="lab-eyebrow on-dark">THE SIASET VIRTUAL LAB · ONE LAB, MANY FIELDS</p>
          <h1 id="hero">Do real science<br/><span>with your own hands.</span></h1>
          <p className="landing-lede">A virtual lab where every idea becomes a station you can try, predict and test. Pick a field, open a module, and step up to the bench. Genetics and molecular biology are open today, and new fields plug into the same lab.</p>
          {user
            ? <div className="landing-resume">
                <div>
                  <p className="lab-eyebrow on-dark">WELCOME BACK{name ? `, ${name.toUpperCase()}` : ''}</p>
                  <p className="landing-resume-title">{next ? `Station ${String(next.order).padStart(2, '0')} · ${next.title}` : 'Every station completed'}</p>
                  <div className="lab-progress on-dark" role="progressbar" aria-label="Stations completed" aria-valuemin={0} aria-valuemax={stops.length} aria-valuenow={done}><i style={{ width: `${Math.round(done / stops.length * 100)}%` }}/></div>
                  <p className="landing-resume-meta">{done} of {stops.length} stations completed</p>
                </div>
                <div className="landing-resume-actions">
                  <Link className="lab-button lab-button--amber" to={next ? next.href : '/lab'}>{next ? 'Resume station →' : 'Revisit the lab →'}</Link>
                  <Link className="lab-link on-dark" to="/lab">Open the lab room</Link>
                </div>
              </div>
            : <div className="landing-guest">
                <div className="landing-guest-actions">
                  <Link className="lab-button lab-button--amber lab-button--lg" to="/lab">Enter the lab, no account needed <span aria-hidden="true">→</span></Link>
                  <Link className="lab-button lab-button--ghost lab-button--lg" to="/account">Create a free account</Link>
                </div>
                <p className="landing-guest-note">Without an account, your progress stays in this browser. Sign in to sync it across devices and join a class.</p>
              </div>}
        </div>
        <Helix/>
      </section>
    </div>

    <section className="landing-facts" aria-label="At a glance">
      <p><b>{nStations}</b>stations to try</p>
      <p><b>{nFields}</b>fields open, more on the way</p>
      <p><b>{nModules}</b>modules · {allChapters.length} chapters</p>
      <p><b>{labCount} + 1</b>hands-on labs plus a free sandbox</p>
      <p><b>Free</b>every station open</p>
    </section>

    <div className="landing-body">
      <LiveDemo/>

      <section id="how" className="landing-section" aria-labelledby="how-h" tabIndex={-1}>
        <div className="landing-section-head"><p className="lab-eyebrow">HOW A STATION WORKS</p><h2 id="how-h">Guess first. Then let the bench tell you.</h2></div>
        <ol className="landing-steps">
          <li><span className="step-1">1</span><b>Read the challenge</b><p>Each station opens with one question, not a wall of text.</p></li>
          <li><span className="step-2">2</span><b>Predict</b><p>Commit to a guess before the bench runs. It unlocks the next step.</p></li>
          <li><span className="step-3">3</span><b>Test on the bench</b><p>Bind, cut, insert, wash. The lab engine calculates what really happens.</p></li>
          <li><span className="step-4">4</span><b>Explain and track</b><p>Compare your guess with the result, then see it in your notebook.</p></li>
        </ol>
      </section>

      <section id="fields" className="landing-section" aria-labelledby="fields-h" tabIndex={-1}>
        <div className="landing-section-head row">
          <div><p className="lab-eyebrow">FIELDS → MODULES → STATIONS</p><h2 id="fields-h">Pick a field. Open a module. Step up to the bench.</h2><p>Every field works the same way, so what you learn about the lab carries over when new fields arrive.</p></div>
          <Link className="lab-link" to="/stations">Browse all stations →</Link>
        </div>
        <div className="landing-field-grid">
          {modules.map(module => <Link key={module.id} className="landing-field-card tilt" to={`/lab#module-${module.id}`}>
            <span className="lab-field-chip">FIELD · {fieldById(module.field)?.title.toUpperCase()}</span>
            <span className="lab-eyebrow">MODULE · {module.topics.length} STATIONS · {module.chapters.length} {module.chapters.length === 1 ? 'CHAPTER' : 'CHAPTERS'}</span>
            <span className="landing-field-title depth">{module.title}</span>
            <span className="landing-field-summary">{module.summary}</span>
            <span className="landing-field-tags">{[...new Set(module.topics.map(topic => activityFor(topic.id)).filter(Boolean))].slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</span>
            <span className="landing-field-open">Open this module →</span>
          </Link>)}
          <div className="landing-field-card is-placeholder">
            <span className="lab-field-chip muted">NEXT FIELD</span>
            <span className="landing-field-title">More fields join the lab</span>
            <span className="landing-field-summary">New fields bring their own modules and stations, and reuse the same bench layout, notebook, practice and classroom tools.</span>
          </div>
        </div>
      </section>

      <section className="landing-peek" aria-labelledby="peek-h">
        <div>
          <p className="lab-eyebrow">INSIDE A STATION</p>
          <h2 id="peek-h">Same layout every time, so the science gets your attention.</h2>
          <p>The challenge is on top, the steps on the left, the bench in the middle and your tools on the right. On a phone, the tools sit right under the bench.</p>
          <Link className="lab-link" to="/lab/transposable-elements?experiment=tn5">Try station 06 now →</Link>
        </div>
        <div className="landing-device" aria-hidden="true">
          <div className="device-banner">Move Tn5 into the target, and find out what it leaves behind.</div>
          <div className="device-body">
            <div className="device-col"><i/><i className="on"/><i/><i/></div>
            <div className="device-canvas"><svg width="140" height="120" viewBox="0 0 140 120"><circle cx="70" cy="60" r="44" fill="none" stroke="#176D80" strokeWidth="8"/><path d="M70 16 A44 44 0 0 1 108 38" fill="none" stroke="#F5B75E" strokeWidth="10"/></svg></div>
            <div className="device-col"><i className="predict"/><i/><i className="go"/></div>
          </div>
        </div>
      </section>

      <section id="teachers" className="landing-teachers" aria-labelledby="teach-h" tabIndex={-1}>
        <div>
          <p className="lab-eyebrow on-dark">FOR TEACHERS</p>
          <h2 id="teach-h">Bring the bench to your class.</h2>
          <p>Once your teacher access is approved, you can create classes, assign stations from any field and run live quizzes that learners join with a code.</p>
          <div className="landing-teachers-actions">
            <Link className="lab-button lab-button--aqua" to={user ? '/teach' : '/account'}>{user ? 'Request teacher access' : 'Sign in to request teacher access'}</Link>
            <Link className="lab-link on-dark" to="/classes">Joining a class? Enter your code →</Link>
          </div>
        </div>
        <ul>
          <li><b>Classes and codes</b><span>Learners join in seconds, with no setup on your side.</span></li>
          <li><b>Assignments</b><span>Pick stations and see who has completed them.</span></li>
          <li><b>Live quizzes</b><span>Host a session and watch answers come in.</span></li>
        </ul>
      </section>

      <section className="landing-honest" aria-labelledby="honest-h">
        <h2 id="honest-h">Honest by design</h2>
        <div><b>Clear models</b><p>Diagrams are symbolic teaching models with stated limits and linked sources. Calculated structures come from a tested engine.</p></div>
        <div><b>Progress you earned</b><p>A station counts as done only when you have done the work and answered its checks. Opening a page never counts.</p></div>
        <div><b>Your data, your choice</b><p>Without an account, progress stays in your browser. Sign in only if you want sync or classes.</p></div>
      </section>

      <section className="landing-final" aria-labelledby="cta-h">
        <h2 id="cta-h">{user ? 'Your bench is waiting where you left it.' : 'The bench is set. Start with station 01, no account needed.'}</h2>
        <Link className="lab-button lab-button--navy lab-button--lg" to={user && next ? next.href : '/lab'}>{user && next ? 'Resume your station' : 'Enter the lab'} <span aria-hidden="true">→</span></Link>
      </section>
    </div>

    <footer className="lab-footer-bar"><Brand tone="light"/><p>SIASET Learn · A virtual laboratory across scientific fields · Symbolic educational models</p></footer>
  </main>;
}
