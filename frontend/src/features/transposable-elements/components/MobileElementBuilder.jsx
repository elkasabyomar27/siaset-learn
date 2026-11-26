import { useId, useState } from 'react';
import { IS_PARTS, IS_GOALS, MAX_TRACK, canAdd, endOrientations, evaluateElement } from '../mobileElementBuilder.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { elementBuilderIntent, applyBuilderAction } from '../hands-on/intents/elementBuilder.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

const glyph = (kind, orientation) => kind === 'end' ? (orientation === -1 ? '◀' : '▶') : kind === 'transposase' ? '➜' : kind === 'cargo' ? '✚' : '≡';
const PIECE = {end: 'gx-piece-tir', transposase: 'gx-piece-gene', cargo: 'gx-piece-element', host: 'gx-piece-target'};
const W = 600, H = 300, RAIL = {x: 12, y: 132, w: 576, h: 84}, SLOT_W = 108, TILE_W = 100;
const slotAt = i => ({x: RAIL.x + 8 + SLOT_W / 2 + i * (SLOT_W + 4), y: RAIL.y + RAIL.h / 2});
const binAt = i => ({x: 78 + i * 148, y: 52});
const inRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

// Parts come from a bin onto the DNA track; tiles reorder within the track and are removed by
// dragging them off it. canAdd still gates every add.
function BuilderScene({ track, tested, bounded, onAction, setNote }) {
  const {scale} = useStage();
  const [over, setOver] = useState(null);
  const {demo, activity, drag} = useDemoHand('drag', track.length === 0);
  const orientations = endOrientations(track);
  const lifted = !!tested?.movable;
  const binZones = [{id: 'rail', label: 'the DNA track', contains: (x, y) => inRect(x, y, RAIL)}];
  const tileZones = [
    ...track.map((_, j) => ({id: `slot-${j}`, label: `position ${j + 1}`, contains: (x, y) => Math.abs(x - slotAt(j).x) <= SLOT_W / 2 && y >= RAIL.y && y <= RAIL.y + RAIL.h})),
    {id: 'rail', label: 'the rest of the track (keeps it where it is)', contains: (x, y) => inRect(x, y, RAIL)},
    {id: 'off', label: 'off the track (removes it)', contains: () => true},
  ];
  const send = g => { activity(); const a = elementBuilderIntent(g, track); if (a) onAction(a); return a; };
  const lastX = slotAt(Math.max(track.length - 1, 0)).x;
  return <>
    <text className="gx-small" x="12" y="18">PARTS BIN: drag a part onto the track</text>
    <rect className="gx-zone" data-over={over === 'rail'} x={RAIL.x} y={RAIL.y} width={RAIL.w} height={RAIL.h} rx="12" />
    {Array.from({length: MAX_TRACK}, (_, i) => i >= track.length && <rect key={i} className="gx-zone" x={slotAt(i).x - TILE_W / 2} y={slotAt(i).y - 28} width={TILE_W} height="56" rx="8" />)}
    {track.length === 0 && <text className="gx-small" x={RAIL.x + RAIL.w / 2} y={RAIL.y - 8} textAnchor="middle">Empty. Add a part from the bin.</text>}
    {bounded && <g><path className="gx-dna" strokeWidth="3" d={`M${slotAt(0).x - TILE_W / 2} ${RAIL.y + RAIL.h + 14} v8 H${lastX + TILE_W / 2} v-8`} /><text className="gx-small" x={(slotAt(0).x + lastX) / 2} y={RAIL.y + RAIL.h + 38} textAnchor="middle">element boundaries</text></g>}

    {Object.entries(IS_PARTS).map(([kind, part], i) => <Draggable key={kind} className="gx-bin" x={binAt(i).x} y={binAt(i).y} zones={binZones} expected={track.length === 0 && i === 0} hit={hitBox(136, 52, scale)}
      label={`${part.label}. ${part.hint} Drag it onto the DNA track`} carriedLabel={`Carrying ${part.label}. Press Enter to drop it on the track`}
      onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop on: ${t}.`)} onCancel={() => setNote(`${part.short} is back in the bin.`)}
      onDrop={({zone}) => {
        setOver(null);
        if (send({kind: 'drop', source: 'bin', part: kind, target: zone})) setNote(`${part.short} added.`);
        else setNote(canAdd(track, kind) ? 'Drop it on the track.' : track.length >= MAX_TRACK ? `The track is full (${MAX_TRACK} parts).` : 'There are only two terminal ends.');
      }}>
      <rect className={`gx-piece ${PIECE[kind]}`} x="-68" y="-24" width="136" height="48" rx="10" style={{opacity: canAdd(track, kind) ? 1 : 0.5}} />
      <text className="gx-text" x="-52" y="5">{glyph(kind, 1)}</text><text className="gx-text" x="-30" y="5">{part.label.replace(' (cargo)', '').replace('Resistance gene', 'Cargo gene')}</text>
    </Draggable>)}

    {track.map((kind, i) => <Draggable key={`${i}-${kind}`} className="gx-tile" x={slotAt(i).x} y={slotAt(i).y + (lifted ? -10 : 0)} zones={tileZones} hit={hitBox(TILE_W, 56, scale)}
      label={`Part ${i + 1} of ${track.length}: ${IS_PARTS[kind].label}${kind === 'end' && orientations[i] === -1 ? ', inverted' : ''}. Drag it to another position to reorder, or off the track to remove it`}
      carriedLabel={`Carrying part ${i + 1}, ${IS_PARTS[kind].label}. Press Enter to drop it, arrow keys to choose a position or off the track`}
      onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop at: ${t}.`)} onCancel={() => setNote('The part is back in place.')}
      onDrop={({zone}) => {
        setOver(null);
        const slot = zone.startsWith('slot-') ? Number(zone.slice(5)) : undefined;
        const a = send({kind: 'drop', source: 'tile', index: i, target: zone.startsWith('slot-') ? 'slot' : zone, slot});
        if (a) setNote(a.type === 'remove' ? `${IS_PARTS[kind].short} removed.` : `${IS_PARTS[kind].short} moved to position ${slot + 1}.`);
      }}>
      <rect className={`gx-piece ${PIECE[kind]}`} x={-TILE_W / 2} y="-28" width={TILE_W} height="56" rx="8" />
      <text className="gx-text" y="-4" textAnchor="middle">{glyph(kind, orientations[i])}</text>
      <text className="gx-small" y="16" textAnchor="middle" style={{fill: 'var(--color-molecular-text)'}}>{IS_PARTS[kind].short}{kind === 'end' && orientations[i] === -1 ? ' (inverted)' : ''}</text>
    </Draggable>)}

    {lifted && <text className="gx-small" x={RAIL.x + RAIL.w / 2} y={RAIL.y + RAIL.h + 56} textAnchor="middle">Target DNA: inserted {track.map(k => IS_PARTS[k].short).join(' · ')}</text>}
    <DemoHand show={track.length === 0 ? demo.show : null} still={demo.still} from={binAt(0)} to={slotAt(0)} text="Drag a part onto the track" labelAt={{x: 300, y: 112}} />
  </>;
}

export default function MobileElementBuilder() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [track, setTrack] = useState([]);
  const [tested, setTested] = useState(null);
  const [reached, setReached] = useState(() => new Set());
  const [note, setNote] = useState('');
  const verdict = evaluateElement(track);
  const bounded = ['simple-is', 'with-cargo', 'no-transposase', 'with-host'].includes(verdict.id);

  // Functional updates so rapid gestures never build from a stale track.
  function update(fn) { setTrack(fn); setTested(null); }
  const act = action => update(t => applyBuilderAction(t, action));
  function test() {
    setTested(verdict);
    if (verdict.id !== 'empty') setReached(prev => new Set(prev).add(verdict.id));
  }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · BUILD A MOBILE ELEMENT</p>
    <h2 id={`${uid}-title`}>What does DNA need to move itself?</h2>
    <p className="pb-goal">Drag parts onto the track, drag them to rearrange or off the track to remove them, then test whether your element can move. Try to reach every goal below.</p>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>YOUR DNA</span><span>{track.length} / {MAX_TRACK} parts</span></div>
      <div className="gx-scroll" style={{'--gx-min': '600px'}}>
        <BenchStage variant="molecular" className="gx-stage" width={W} height={H} label={`DNA track with ${track.length} of ${MAX_TRACK} parts, left to right. Drag parts from the bin onto it.`}
          after={<NextStep className="gx-note">{note || 'Drag a part from the bin onto the track.'}</NextStep>}>
          <BuilderScene track={track} tested={tested} bounded={bounded} onAction={act} setNote={setNote} />
        </BenchStage>
      </div>
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
