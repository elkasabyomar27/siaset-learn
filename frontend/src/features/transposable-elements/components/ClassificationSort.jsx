import { useId, useState } from 'react';
import { CLASS_CARDS, CLASS_LABEL, COPY_LABEL, checkPlacement, sortComplete } from '../classificationSort.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { classificationIntent, cellId } from '../hands-on/intents/classification.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

const ROWS = ['increase', 'same'], COLS = ['I', 'II'];
const W = 600, H = 524, CARD_W = 284, CARD_H = 70;
const cardAt = i => ({x: 8 + CARD_W / 2 + (i % 2) * 300, y: 26 + CARD_H / 2 + Math.floor(i / 2) * 78});
const CELL = (c, r) => ({x: 146 + COLS.indexOf(c) * 230, y: 332 + ROWS.indexOf(r) * 100, w: 220, h: 92});
const inCell = (c, r) => (x, y) => { const b = CELL(c, r); return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; };
const halves = steps => { const n = Math.ceil(steps.length / 2); return [steps.slice(0, n), steps.slice(n)].filter(h => h.length).map(h => h.join(' → ')); };

// Cards are dragged into grid cells. Every drop reaches checkPlacement, right or wrong.
function SortScene({ placed, onDrop, setNote }) {
  const {scale} = useStage();
  const [over, setOver] = useState(null);
  const {demo, activity, drag} = useDemoHand('drag', Object.keys(placed).length);
  const zones = COLS.flatMap(c => ROWS.map(r => ({id: cellId(c, r), label: `${CLASS_LABEL[c]}, ${COPY_LABEL[r]}`, contains: inCell(c, r)})));
  const first = CLASS_CARDS.findIndex(c => !placed[c.id]);
  return <>
    <text className="gx-small" x="8" y="16">ELEMENTS TO SORT: drag a card into the grid</text>
    {CLASS_CARDS.map((card, i) => placed[card.id] ? null : <Draggable key={card.id} className="gx-card" x={cardAt(i).x} y={cardAt(i).y} zones={zones} expected={i === first && !Object.keys(placed).length}
      hit={hitBox(CARD_W, CARD_H, scale)}
      label={`${card.name}${card.hypothetical ? ', hypothetical' : ''}: ${card.steps.join(', then ')}. Drag it into a grid cell`}
      carriedLabel={`Carrying ${card.name}. Press Enter to place it, arrow keys to choose the cell`}
      onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop in: ${t}.`)} onCancel={() => setNote(`${card.name} is back in the tray.`)}
      onDrop={({zone}) => { setOver(null); activity(); onDrop(card.id, zone); }}>
      <rect className="gx-piece" x={-CARD_W / 2} y={-CARD_H / 2} width={CARD_W} height={CARD_H} rx="10" />
      <text className="gx-text" x={-CARD_W / 2 + 12} y={-CARD_H / 2 + 20} fontWeight="700">{card.name}{card.hypothetical ? ' · hypothetical' : ''}</text>
      {halves(card.steps).map((line, k) => <text key={k} className="gx-small" x={-CARD_W / 2 + 12} y={-CARD_H / 2 + 38 + k * 16}>{line}</text>)}
    </Draggable>)}
    {CLASS_CARDS.every(c => placed[c.id]) && <text className="gx-text" x="300" y="140" textAnchor="middle">All elements sorted.</text>}

    <g>
      {COLS.map(c => <text key={c} className="gx-text" x={CELL(c, 'increase').x + 110} y="318" textAnchor="middle" fontWeight="700">{CLASS_LABEL[c]}</text>)}
      {ROWS.map(r => <text key={r} className="gx-text" x="8" y={CELL('I', r).y + 50}>{COPY_LABEL[r].replace('Copy number ', 'Copies ')}</text>)}
      {COLS.flatMap(c => ROWS.map(r => {
        const b = CELL(c, r), here = CLASS_CARDS.filter(card => placed[card.id] === cellId(c, r));
        return <g key={cellId(c, r)}>
          <rect className="gx-zone" data-over={over === cellId(c, r)} x={b.x} y={b.y} width={b.w} height={b.h} rx="12" />
          {here.map((card, k) => <text key={card.id} className="gx-text" x={b.x + 14} y={b.y + 30 + k * 22}>✓ {card.name}</text>)}
        </g>;
      }))}
    </g>
    <DemoHand show={demo.show} still={demo.still} from={cardAt(Math.max(first, 0))} to={{x: CELL('I', 'increase').x + 110, y: CELL('I', 'increase').y + 46}} text="Drag a card into a cell" labelAt={{x: 300, y: 300}} />
  </>;
}

export default function ClassificationSort() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [placed, setPlaced] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [note, setNote] = useState('');
  const done = sortComplete(placed);

  function drop(cardId, zone) {
    const place = classificationIntent({kind: 'drop', card: cardId, target: zone});
    if (!place) return;
    const card = CLASS_CARDS.find(c => c.id === cardId), result = checkPlacement(place.card, place.cls, place.copies);
    setFeedback({...result, name: card.name});
    setNote(result.correct ? `${card.name} placed.` : `Not that cell for ${card.name}. Read the hint and try again.`);
    if (result.correct) setPlaced(p => ({...p, [cardId]: `${place.cls}-${place.copies}`}));
  }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · SORT BY INTERMEDIATE</p>
    <h2 id={`${uid}-title`}>Follow the intermediate, then count the copies.</h2>
    <p className="pb-goal">Pick up an element, read its pathway, and drop it in the grid. Class depends on the intermediate; copy number is a separate question.</p>

    <div className="gx-scroll" style={{'--gx-min': '600px'}}>
      <BenchStage variant="molecular" className="gx-stage" width={W} height={H} label="Classification grid. Drag each element card into the cell for its class and copy outcome."
        after={<NextStep className="gx-note">{note || 'Drag an element card into a cell of the grid.'}</NextStep>}>
        <SortScene placed={placed} onDrop={drop} setNote={setNote} />
      </BenchStage>
    </div>

    {feedback && <div className={`pb-verdict${feedback.correct ? ' is-good' : ' is-bad'}`} role="status" aria-live="polite"><b>{feedback.correct ? `✓ ${feedback.name} placed.` : feedback.name ? `✗ Not that box for ${feedback.name}.` : ''}</b> {feedback.text}</div>}
    {done && <div className="pb-verdict is-good" role="status"><b>All sorted.</b> Class II appears in both rows: Tn5 keeps one copy while Tn3 makes two. Knowing the class alone does not tell you the copy outcome.</div>}
    <div className="pb-actions"><button type="button" className="outline-button" disabled={!Object.keys(placed).length} onClick={() => { setPlaced({}); setFeedback(null); setNote(''); }}>Start over</button></div>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Hypothetical elements are teaching examples, not named biological elements.</p>
  </section>;
}
