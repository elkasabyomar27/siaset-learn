import { useId, useState } from 'react';
import { IS_PARTS, IS_GOALS, MAX_TRACK, canAdd, endOrientations, evaluateElement } from '../mobileElementBuilder.js';
import './partsBench.css';

const glyph = (kind, orientation) => kind === 'end' ? (orientation === -1 ? '◀' : '▶') : kind === 'transposase' ? '➜' : kind === 'cargo' ? '✚' : '≡';

export default function MobileElementBuilder() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [track, setTrack] = useState([]);
  const [tested, setTested] = useState(null);
  const [reached, setReached] = useState(() => new Set());
  const verdict = evaluateElement(track);
  const orientations = endOrientations(track);
  const bounded = ['simple-is', 'with-cargo', 'no-transposase', 'with-host'].includes(verdict.id);

  // Functional updates so rapid taps never build from a stale track.
  function update(fn) { setTrack(fn); setTested(null); }
  const add = kind => update(t => canAdd(t, kind) ? [...t, kind] : t);
  const remove = i => update(t => t.filter((_, n) => n !== i));
  const move = (i, d) => update(t => { const j = i + d; if (j < 0 || j >= t.length) return t; const next = [...t]; [next[i], next[j]] = [next[j], next[i]]; return next; });
  function test() {
    setTested(verdict);
    if (verdict.id !== 'empty') setReached(prev => new Set(prev).add(verdict.id));
  }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · BUILD A MOBILE ELEMENT</p>
    <h2 id={`${uid}-title`}>What does DNA need to move itself?</h2>
    <p className="pb-goal">Add parts to the track, arrange them, then test whether your element can move. Try to reach every goal below.</p>

    <div className="pb-palette" role="group" aria-label="Add a part">
      {Object.entries(IS_PARTS).map(([kind, part]) => <button type="button" key={kind} className={`pb-part-button pb-kind-${kind}`} disabled={!canAdd(track, kind)} onClick={() => add(kind)} title={part.hint}>
        <span className="pb-swatch" aria-hidden="true">{glyph(kind, 1)}</span><span><b>{part.label}</b><small>{part.hint}</small></span>
      </button>)}
    </div>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>YOUR DNA</span><span>{track.length} / {MAX_TRACK} parts</span></div>
      <div className={`pb-rail${bounded ? ' is-bounded' : ''}${tested?.movable ? ' is-lifted' : ''}${tested && !tested.movable && tested.id !== 'empty' ? ' is-stuck' : ''}`}>
        <span className="pb-host-cap" aria-hidden="true" />
        {track.length === 0 && <p className="pb-empty">Empty. Add a part above.</p>}
        <ol aria-label="Parts in order, left to right">
          {track.map((kind, i) => <li key={`${i}-${kind}`} className={`pb-tile pb-kind-${kind}`}>
            <span className="pb-tile-glyph" aria-hidden="true">{glyph(kind, orientations[i])}</span>
            <span className="pb-tile-label">{IS_PARTS[kind].short}{kind === 'end' && <small>{orientations[i] === -1 ? ' (inverted)' : ''}</small>}</span>
            <span className="pb-tile-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${IS_PARTS[kind].label} left`}>‹</button>
              <button type="button" onClick={() => remove(i)} aria-label={`Remove ${IS_PARTS[kind].label}`}>×</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === track.length - 1} aria-label={`Move ${IS_PARTS[kind].label} right`}>›</button>
            </span>
          </li>)}
        </ol>
        <span className="pb-host-cap" aria-hidden="true" />
        {bounded && <span className="pb-bracket" aria-hidden="true">element boundaries</span>}
      </div>
      {tested && tested.movable && <div className="pb-target" aria-hidden="true"><span>TARGET DNA</span><div className="pb-target-rail"><i /><i /><b className="pb-landed">{track.map(k => IS_PARTS[k].short).join(' · ')}</b><i /><i /></div></div>}
      <figcaption>Schematic parts, not to scale. Terminal ends are inverted relative to each other.</figcaption>
    </figure>

    <div className="pb-actions">
      <button type="button" className="primary-button" disabled={!track.length} onClick={test}>Test: can it move? →</button>
      <button type="button" className="outline-button" disabled={!track.length} onClick={() => update(() => [])}>Clear track</button>
    </div>

    <div className={`pb-verdict${tested ? (tested.movable ? ' is-good' : ' is-bad') : ''}`} role="status" aria-live="polite">
      <b>{tested ? `${tested.movable ? '✓ It moves.' : tested.id === 'empty' ? '' : '✗ It can’t move on its own.'} ${tested.title}.` : `${verdict.title}.`}</b> {tested ? tested.text : 'Press “Test” when you are ready.'}
    </div>

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {[...reached].filter(id => IS_GOALS.some(g => g.id === id)).length} / {IS_GOALS.length}</p>
      <ul>{IS_GOALS.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Real IS families differ in organisation and mechanism; this shows the shared core idea.</p>
  </section>;
}
