import { useId, useState } from 'react';
import { PREREQS, HGT_GOALS, newHgt, act, setPrereq, applySelection } from '../hgtLab.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { HoldTarget } from '../hands-on/kit/HoldTarget.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { Assumptions } from '../hands-on/kit/Assumptions.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { hgtIntent } from '../hands-on/intents/hgt.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

// Scene layout in SVG units. The donor slides next to the recipient when the cells touch.
const VIEW_W = 640, VIEW_H = 370, CELL_Y = 56, CELL_W = 220, REC_X = 400, APART_X = 20, TOUCH_X = REC_X - CELL_W - 10;
const PANEL_Y = 200, TRAY_Y = 322;
const TRAY_AT = {conjugative: {x: 170, y: TRAY_Y}, oriT: {x: 330, y: TRAY_Y}};
const PART_NAME = {conjugative: 'Transfer machinery', oriT: 'Origin of transfer (oriT)'};
const inBox = (x0, y0, w, h) => (x, y) => x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;

function CellDrawing({ role, lab }) {
  const donor = role === 'donor', loaded = lab.bact.phase !== 'initial';
  const hasPlasmid = donor || !!lab.bact.recipientPlasmid, plasmidLoaded = donor ? loaded : !!lab.bact.recipientPlasmid;
  return <g role="img" aria-label={`${donor ? 'Donor' : 'Recipient'} cell: chromosome${hasPlasmid ? `, plasmid${plasmidLoaded ? ' carrying Tn5' : ' without Tn5'}` : ', no plasmid'}${donor && !loaded ? ', separate DNA fragment carrying Tn5' : ''}.`}>
    <rect className="hg-wall" x="4" y="4" width="212" height="122" rx="56" />
    <ellipse className="hg-chromosome" cx="78" cy="65" rx="44" ry="30" />
    <text className="hg-tag" x="78" y="69" textAnchor="middle">chromosome</text>
    {hasPlasmid && <g className={`hg-plasmid${!donor ? ' is-new' : ''}`}><circle cx="162" cy="62" r="22" />{plasmidLoaded && <path className="hg-tn" d="M162 40 A22 22 0 0 1 184 62" />}<text className="hg-tag" x="162" y="98" textAnchor="middle">plasmid</text></g>}
    {donor && !loaded && <g className="hg-fragment"><line x1="126" x2="200" y1="112" y2="112" /><line className="hg-tn" x1="148" x2="178" y1="112" y2="112" /><text className="hg-tag" x="163" y="104" textAnchor="middle">fragment</text></g>}
  </g>;
}

// The donor is dragged to the recipient, plasmid parts are dropped on the plasmid panel, and
// holding Tn5 or the bridge runs the operation.
function HgtScene({ lab, contact, onGesture, setNote }) {
  const {scale} = useStage();
  const k = 1 / Math.max(scale, 0.05);
  const [over, setOver] = useState(null);
  const {demo, activity, drag} = useDemoHand(contact ? 'hold' : 'drag', contact);
  const donorX = contact ? TOUCH_X : APART_X, loaded = lab.bact.phase !== 'initial';
  const tr = lab.bact.transfer;
  const send = g => { activity(); return onGesture(g); };
  const growth = role => lab.selection?.result[role];
  const mark = g => g === 'grows' ? '✓ grows' : g === 'inhibited' ? '✕ inhibited' : g ? '? undetermined' : '';
  const donorZones = [{id: 'recipient', label: 'the recipient cell', contains: inBox(REC_X - 40, 0, VIEW_W, 260)}, {id: 'apart', label: 'away from the recipient', contains: inBox(0, 0, 300, 260)}];
  const partZones = [{id: 'plasmid', label: 'the plasmid panel', contains: inBox(donorX, PANEL_Y - 6, CELL_W, 70)}, {id: 'tray', label: 'the tray', contains: inBox(0, TRAY_Y - 40, VIEW_W, 80)}];
  const partAt = {conjugative: {x: donorX + 55, y: PANEL_Y + 30}, oriT: {x: donorX + 165, y: PANEL_Y + 30}};
  const bridgeX = (donorX + CELL_W + REC_X) / 2, tn5 = loaded ? {x: donorX + 172, y: CELL_Y + 52} : {x: donorX + 163, y: CELL_Y + 112};
  const handlers = {onCarry: drag, onOver: setOver, onAnnounce: t => t && setNote(`Drop on: ${t}.`)};
  const status = (ok, text) => setNote(`${text}${ok ? '' : ' Nothing changed.'}`);
  return <>
    <text className="gx-small" x={donorX + 4} y={CELL_Y - 8}>DONOR CELL</text>
    <text className="gx-small" x={REC_X + 4} y={CELL_Y - 8}>RECIPIENT CELL {mark(growth('recipient')) && `· ${mark(growth('recipient'))}`}</text>
    {growth('donor') && <text className="gx-small" x={donorX + CELL_W - 4} y={CELL_Y - 8} textAnchor="end">{mark(growth('donor'))}</text>}
    <g className="hg-donor" style={{transform: `translate(${donorX}px, ${CELL_Y}px)`}} data-growth={growth('donor') || undefined}><CellDrawing role="donor" lab={lab} /></g>
    <g style={{transform: `translate(${REC_X}px, ${CELL_Y}px)`}} data-growth={growth('recipient') || undefined}><CellDrawing role="recipient" lab={lab} /></g>

    <line className={`hg-bridge-line${lab.bact.phase === 'transferred' ? ' is-used' : ''}`} x1={donorX + CELL_W} x2={REC_X} y1={CELL_Y + 62} y2={CELL_Y + 62} strokeDasharray={contact ? undefined : '6 6'} />
    <HoldTarget className="hg-bridge" label={`Bridge between the cells${contact ? ' (touching)' : ' (apart)'}. Hold to conjugate: copy the plasmid from donor to recipient`} cx={bridgeX} cy={CELL_Y + 62} hitR={Math.max(30, 22 * k)} ringR={30} expected={contact && loaded && lab.bact.phase !== 'transferred'}
      onHold={() => { activity(); const p = onGesture({kind: 'hold', target: 'bridge'}); if (p) setNote('Conjugating: the plasmid is copied across.'); }}>
      <circle className="gx-piece gx-piece-tir" cx={bridgeX} cy={CELL_Y + 62} r="16" /><text className="gx-small" x={bridgeX} y={CELL_Y + 66} textAnchor="middle">→</text>
    </HoldTarget>
    <HoldTarget className="hg-tn5" label={loaded ? 'Tn5 on the donor plasmid. Hold to transpose again inside the donor' : 'Tn5 on the donor DNA fragment. Hold to transpose it inside the donor, onto the plasmid'} cx={tn5.x} cy={tn5.y} hitR={Math.max(26, 22 * k)} ringR={24} expected={!loaded}
      onHold={() => { activity(); const p = onGesture({kind: 'hold', target: 'tn5'}); if (p) setNote('Transposing inside the donor cell.'); }}>
      <rect className="gx-piece gx-piece-element" x={tn5.x - 22} y={tn5.y - 9} width="44" height="18" rx="6" /><text className="gx-small" x={tn5.x} y={tn5.y + 4} textAnchor="middle" style={{fill: 'var(--color-molecular-text)'}}>Tn5</text>
    </HoldTarget>

    <Draggable className="hg-grip" x={donorX + CELL_W / 2} y={CELL_Y - 34} zones={donorZones} hit={hitBox(130, 30, scale)} expected={!contact}
      label={contact ? 'Donor cell: touching the recipient. Drag it away to break the contact' : 'Donor cell: apart from the recipient. Drag it to the recipient so the cells touch'}
      carriedLabel="Carrying the donor cell. Press Enter to drop it, arrow keys to choose the recipient or away" {...handlers}
      onCancel={() => setNote('The donor cell stayed where it was.')}
      onDrop={({zone}) => { setOver(null); const p = send({kind: 'drop', part: 'donor', target: zone}); if (p) setNote(p.value ? 'The cells are in contact.' : 'The cells are apart.'); }}>
      <rect className="gx-piece" x="-65" y="-14" width="130" height="28" rx="14" /><text className="gx-text" y="5" textAnchor="middle">drag donor ⇄</text>
    </Draggable>

    <rect className="gx-zone" data-over={over === 'plasmid'} x={donorX} y={PANEL_Y - 6} width={CELL_W} height="70" rx="10" />
    <text className="gx-small" x={donorX + 8} y={PANEL_Y - 12}>PLASMID FEATURES: drop parts here</text>
    <rect className="gx-zone" data-over={over === 'tray'} x="6" y={TRAY_Y - 40} width={VIEW_W - 12} height="80" rx="10" />
    <text className="gx-small" x="16" y={TRAY_Y - 46}>TRAY</text>
    {Object.keys(PART_NAME).map(id => <Draggable key={id} className="gx-part" x={(tr[id] ? partAt : TRAY_AT)[id].x} y={(tr[id] ? partAt : TRAY_AT)[id].y} zones={partZones} hit={hitBox(100, 34, scale)}
      label={tr[id] ? `${PART_NAME[id]}: on the plasmid. Drag it back to the tray to remove it` : `${PART_NAME[id]}: in the tray. Drag it onto the plasmid panel`}
      carriedLabel={`Carrying ${PART_NAME[id]}. Press Enter to drop it, arrow keys to choose the plasmid panel or the tray`} {...handlers}
      onCancel={() => setNote('The part is back where it was.')}
      onDrop={({zone}) => { setOver(null); const p = send({kind: 'drop', part: id, target: zone}); if (p) status(true, `${PART_NAME[id]} ${p.value ? 'is on the plasmid' : 'is back in the tray'}.`); }}>
      <rect className={`gx-piece ${tr[id] ? 'gx-piece-tsd' : 'gx-piece-gene'}`} x="-48" y="-16" width="96" height="32" rx="8" /><text className="gx-text" y="5" textAnchor="middle" style={{fontSize: 12}}>{id === 'oriT' ? 'oriT' : 'transfer genes'}</text>
    </Draggable>)}
    <DemoHand show={demo.show} still={demo.still} from={contact ? {x: bridgeX, y: CELL_Y + 62} : {x: donorX + CELL_W / 2, y: CELL_Y - 34}} to={contact ? {x: bridgeX, y: CELL_Y + 62} : {x: REC_X + 60, y: CELL_Y - 34}} text={contact ? 'Press and hold Tn5 or the bridge' : 'Drag the donor to the recipient'} labelAt={{x: 320, y: 280}} />
  </>;
}

export default function HgtLab() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [lab, setLab] = useState(newHgt);
  const [assume, setAssume] = useState(true);
  const [message, setMessage] = useState(null);
  const [note, setNote] = useState('');
  const done = new Set(HGT_GOALS.filter(g => g.done(lab.log)).map(g => g.id));
  function run(action) { const r = act(lab, action); setLab(r.lab); setMessage({ok: r.ok, text: r.text}); setNote(r.ok ? 'Done.' : 'Nothing changed: see the message below.'); }
  function select() { const r = applySelection(lab, assume); setLab(r.lab); setMessage({ok: true, text: r.text}); setNote('Selection applied: it only reports growth, no DNA moved.'); }
  // Gestures reach the same model calls as the old checkboxes and buttons.
  function onGesture(g) {
    const p = hgtIntent(g);
    if (!p) return null;
    if ('prereq' in p) setLab(setPrereq(lab, p.prereq, p.value));
    else if ('act' in p) run(p.act);
    else if ('assume' in p) setAssume(p.assume);
    return p;
  }
  const contact = !!lab.bact.transfer.contact;

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · SPREAD A RESISTANCE GENE</p>
    <h2 id={`${uid}-title`}>Moving inside a cell, moving between cells, and selection are different things.</h2>
    <p className="pb-goal">Tn5 carries a resistance gene on a DNA fragment in the donor cell. Press and hold Tn5 to transpose it inside the donor, or the bridge to conjugate. Drag the donor to the recipient and the plasmid parts into place to meet the requirements.</p>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>TWO BACTERIAL CELLS</span><span>{lab.bact.phase === 'initial' ? 'Tn5 on donor fragment' : lab.bact.phase === 'loaded' ? 'Tn5 on donor plasmid' : 'Plasmid copy in recipient'}</span></div>
      <div className="gx-scroll" style={{'--gx-min': `${VIEW_W}px`}}>
        <BenchStage variant="molecular" className="gx-stage" width={VIEW_W} height={VIEW_H}
          label={`Two bacterial cells, ${contact ? 'touching' : 'apart'}. Plasmid ${lab.bact.transfer.conjugative ? 'has' : 'lacks'} transfer machinery and ${lab.bact.transfer.oriT ? 'has' : 'lacks'} an origin of transfer. ${lab.bact.phase === 'initial' ? 'Tn5 is on a donor DNA fragment.' : lab.bact.phase === 'loaded' ? 'Tn5 is on the donor plasmid.' : 'The recipient holds a plasmid copy.'}`}
          after={<NextStep className="gx-note">{note || 'Drag the donor to the recipient, then press and hold Tn5 or the bridge.'}</NextStep>}>
          <HgtScene lab={lab} contact={contact} onGesture={onGesture} setNote={setNote} />
        </BenchStage>
      </div>
      <figcaption className="pb-legend"><span><i className="sw-module" />Tn5 with resistance cargo</span><span><i className="sw-host" />Chromosome</span><span><i className="sw-cargo" />Plasmid</span></figcaption>
    </figure>

    <div className="hg-actions">
      <button type="button" className="outline-button" onClick={select}>Add antibiotic <small>selection</small></button>
      <button type="button" className="outline-button" onClick={() => { setLab(newHgt()); setMessage(null); setNote('The cells are reset.'); }}>Reset cells</button>
    </div>

    <Assumptions items={[
      {key: 'compatibleRecipient', label: PREREQS.compatibleRecipient},
      {key: 'selection', label: 'Assume the resistance gene is expressed and sufficient'},
    ]} values={{compatibleRecipient: !!lab.bact.transfer.compatibleRecipient, selection: assume}} onChange={(key, value) => onGesture({kind: 'assume', control: key, value})} />

    {message && <div className={`pb-verdict ${message.ok ? 'is-good' : 'is-bad'}`} role="status" aria-live="polite">{message.text}</div>}
    {lab.log.length > 0 && <ol className="hg-log" aria-label="What happened">{lab.log.map((e, i) => <li key={i} className={e.ok ? '' : 'is-failed'}><b>{e.action === 'select' ? 'Selection' : e.action === 'transpose' ? 'Transposition' : 'Conjugation'}</b>{e.scope && <span className="hg-scope">{e.scope}</span>}{!e.ok && <span className="hg-scope is-failed">no change</span>}</li>)}</ol>}

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {done.size} / {HGT_GOALS.length}</p>
      <ul>{HGT_GOALS.map(g => <li key={g.id} className={done.has(g.id) ? 'done' : ''}><span aria-hidden="true">{done.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{done.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Transposition and conjugation use the lesson’s bacterial model. Growth outcomes are qualitative and depend on the stated assumption.</p>
  </section>;
}
