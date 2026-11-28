import { useId, useState } from 'react';
import { F_STEPS, ZOOM_NOTES, CELL_TYPES, fStatus, pickDonor, mixedCulture, integrateF, newProgress, record, matingUnlocked, HFR_GENES, HFR_STOPS, HFR_MAX_MIN, transferredGenes, transferredFraction, COMPARE, CJ_QUIZ, CJ_GOALS } from '../conjugationLab.js';
import './partsBench.css';

function FStage({ step }) {
  const s = F_STEPS[step], st = fStatus(step);
  const rec = s.recipient;
  return <svg className="hg-cj-svg" viewBox="0 0 520 190" role="img" aria-label={`Donor ${st.donor} cell on the left, recipient ${st.recipient} cell on the right. ${s.label}`}>
    <rect className="hg-wall" x="6" y="20" width="190" height="150" rx="64" />
    <rect className="hg-wall" x="324" y="20" width="190" height="150" rx="64" />
    <text className="hg-tag" x="101" y="14" textAnchor="middle">Donor {st.donor}{' (tet-R)'}</text>
    <text className="hg-tag" x="419" y="14" textAnchor="middle">Recipient {st.recipient}{st.recipient === 'F+' ? ' (tet-R)' : ' (tet-S)'}</text>
    <ellipse className="hg-chromosome" cx="75" cy="95" rx="40" ry="28" />
    <ellipse className="hg-chromosome" cx="458" cy="95" rx="38" ry="28" />
    <g className="hg-plasmid"><circle cx="150" cy="95" r="22" /><path className="hg-tn" d="M150 73 A22 22 0 0 1 172 95" /><circle className="hg-orit" cx="128" cy="95" r="4" /><text className="hg-tag" x="150" y="136" textAnchor="middle">F plasmid</text>{s.nick && <text className="hg-tag hg-nick" x="128" y="62" textAnchor="middle">nick at oriT</text>}</g>
    {step === 0 && <g><line className="hg-pilus" x1="196" x2="262" y1="95" y2="95" /><text className="hg-tag" x="230" y="82" textAnchor="middle">F pilus reaches out</text></g>}
    {s.contact && <g className="hg-bridge-line"><line x1="196" x2="324" y1="95" y2="95" /><text className="hg-tag" x="260" y="82" textAnchor="middle">mating pair</text></g>}
    {step === 2 && <g><line className="hg-strand" x1="196" x2="300" y1="102" y2="102" /><text className="hg-tag" x="260" y="124" textAnchor="middle">ssDNA + helicase</text></g>}
    {rec !== 'none' && <g className="hg-plasmid is-new"><circle className={`hg-strand-ring${rec === 'single' ? ' is-partial' : ''}`} cx="370" cy="95" r="22" />{rec === 'double' && <circle className="hg-strand-new" cx="370" cy="95" r="16" />}{rec === 'circular' && <path className="hg-tn" d="M370 73 A22 22 0 0 1 392 95" />}<text className="hg-tag" x="370" y="136" textAnchor="middle">{rec === 'single' ? 'single strand' : rec === 'double' ? 'making complement' : 'F plasmid'}</text></g>}
  </svg>;
}

function Dots({ fPlus, total }) {
  return <div className="hg-dots" role="img" aria-label={`${fPlus} of ${total} cells are F+`}>{Array.from({length: total}, (_, i) => <i key={i} className={i < fPlus ? 'is-f' : ''} />)}</div>;
}

function Quiz({ item, answers, setAnswers }) {
  const a = answers[item.id], name = useId();
  return <fieldset className="hg-quiz"><legend>{item.q}</legend>
    {item.options.map((o, i) => <label key={o} className="mg-toggle"><input type="radio" name={name} checked={a === i} onChange={() => setAnswers({...answers, [item.id]: i})} /> {o}</label>)}
    <p role="status" className={a === undefined ? '' : a === item.correct ? 'hg-ok' : 'hg-no'}>{a !== undefined && <>{a === item.correct ? 'Correct. ' : 'Not quite. '}{item.why}</>}</p>
  </fieldset>;
}

export default function ConjugationLab() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [tab, setTab] = useState('A');
  const [step, setStep] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pick, setPick] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [sharedIS, setSharedIS] = useState(true);
  const [integ, setInteg] = useState(null);
  const [minutes, setMinutes] = useState(0);
  const [prog, setProg] = useState(newProgress);
  const [answers, setAnswers] = useState({});
  const culture = mixedCulture();
  const done = new Set(CJ_GOALS.filter(g => g.done(prog)).map(g => g.id));
  const hfr = matingUnlocked(integ);

  const go = n => { const s = Math.max(0, Math.min(F_STEPS.length - 1, n)); setStep(s); setProg(p => record(p, {type: 'step', step: s})); };
  const choose = c => { const r = pickDonor(c); setPick({c, ...r}); if (!r.ok) setProg(p => record(p, {type: 'triedF'})); };
  const cross = () => { const r = integrateF(sharedIS); setInteg(r); if (r.hfr) setProg(p => record(p, {type: 'hfr'})); else setMinutes(0); };
  const setMin = m => { setMinutes(m); setProg(p => record(p, {type: 'stop', minutes: m})); };
  const got = transferredGenes(minutes), frac = transferredFraction(minutes);
  const R = 62, C = 2 * Math.PI * R;

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · CONJUGATION IN DETAIL</p>
    <h2 id={`${uid}-title`}>How a plasmid, and sometimes a chromosome, crosses from one cell to another.</h2>
    <p className="pb-goal">Two practice experiments from the Microbial Genetics conjugation notes. Step through the transfer, then see how F joins the chromosome and what interrupted mating shows.</p>

    <div className="hg-actions" role="group" aria-label="Experiment">
      <button type="button" className={tab === 'A' ? 'primary-button' : 'outline-button'} aria-pressed={tab === 'A'} onClick={() => setTab('A')}>A · F+ × F- conjugation</button>
      <button type="button" className={tab === 'B' ? 'primary-button' : 'outline-button'} aria-pressed={tab === 'B'} onClick={() => setTab('B')}>B · Hfr and interrupted mating</button>
    </div>

    {tab === 'A' && <>
      <figure className="pb-stage">
        <div className="pb-stage-head"><span>F+ × F- · STEP {step} OF {F_STEPS.length - 1}</span><span>{CELL_TYPES['F+'].pilus ? 'one-way transfer' : ''}</span></div>
        <FStage step={step} />
        <figcaption className="hg-step-label" role="status" aria-live="polite">{F_STEPS[step].label}</figcaption>
        <p className="quiet hg-note">The tet-R gene on F is a teaching marker from the lecture figure. It is not a normal feature of F.</p>
      </figure>
      <div className="hg-actions">
        <button type="button" className="outline-button" disabled={step === 0} onClick={() => go(step - 1)}>Back</button>
        <button type="button" className="primary-button" disabled={step === F_STEPS.length - 1} onClick={() => go(step + 1)}>Next step</button>
        <button type="button" className="outline-button" onClick={() => setStep(0)}>Restart</button>
        <label className="mg-toggle"><input type="checkbox" checked={zoom} onChange={e => setZoom(e.target.checked)} /> Zoom in on the molecules</label>
      </div>
      {zoom && <ul className="hg-zoom">{ZOOM_NOTES.map(n => <li key={n}>{n}</li>)}</ul>}

      <div className="cb-controls hg-prereqs">
        <div className="cb-control"><span>Which cell is the donor?</span>
          <div className="hg-actions"><button type="button" className="outline-button" aria-pressed={pick?.c === 'F+'} onClick={() => choose('F+')}>The F+ cell</button><button type="button" className="outline-button" aria-pressed={pick?.c === 'F-'} onClick={() => choose('F-')}>The F- cell</button></div>
          <p role="status" className={!pick ? '' : pick.ok ? 'hg-ok' : 'hg-no'}>{pick?.text}</p>
          <p className="quiet">{CELL_TYPES['F-'].text}</p>
        </div>
        <div className="cb-control"><span>Mixed culture: a few F+ among many F-</span>
          <label className="hg-range">Contact rounds: {rounds}<input type="range" min="0" max={culture.length - 1} value={rounds} onChange={e => setRounds(+e.target.value)} aria-valuetext={`${rounds} rounds, ${culture[rounds]} of 48 cells F+`} /></label>
          <Dots fPlus={culture[rounds]} total={48} />
          <p className="quiet">{culture[rounds]} of 48 cells are F+. F+ cells are usually blocked from mating with other F+ cells, so only F- cells change. Example numbers, not data.</p>
        </div>
      </div>
      <Quiz item={CJ_QUIZ[0]} answers={answers} setAnswers={setAnswers} />
    </>}

    {tab === 'B' && <>
      <figure className="pb-stage">
        <div className="pb-stage-head"><span>B1 · F JOINS THE CHROMOSOME</span><span>{hfr ? 'Hfr cell' : 'F+ cell'}</span></div>
        <svg className="hg-cj-svg" viewBox="0 0 520 190" role="img" aria-label={hfr ? 'F plasmid integrated into the chromosome, flanked by IS on both sides.' : `Separate chromosome and F plasmid${sharedIS ? ', each carrying an IS element' : '; only F carries an IS element'}.`}>
          <circle className="hg-chromosome" cx="170" cy="95" r="70" fill="none" />
          {hfr ? <path className="hg-tn" d="M170 25 A70 70 0 0 1 227 55" fill="none" /> : <g className="hg-plasmid"><circle cx="400" cy="95" r="30" /><text className="hg-tag" x="400" y="146" textAnchor="middle">F plasmid</text></g>}
          {hfr ? <g><circle className="hg-is" cx="170" cy="25" r="6" /><circle className="hg-is" cx="227" cy="55" r="6" /><text className="hg-tag" x="170" y="14" textAnchor="middle">IS</text><text className="hg-tag" x="244" y="58">IS</text><text className="hg-tag" x="205" y="20" textAnchor="middle">F</text></g>
            : <g><circle className="hg-is" cx="170" cy="25" r={sharedIS ? 6 : 0} /><circle className="hg-is" cx="400" cy="65" r="6" /><text className="hg-tag" x="170" y="14" textAnchor="middle">{sharedIS ? 'IS' : ''}</text><text className="hg-tag" x="418" y="62">IS</text></g>}
          <text className="hg-tag" x="170" y="176" textAnchor="middle">chromosome</text>
        </svg>
        <figcaption className="hg-step-label" role="status" aria-live="polite">{integ ? integ.text : 'Some F plasmids carry an IS element that is also on the chromosome. Matching IS copies give a place for an occasional crossover.'}</figcaption>
      </figure>
      <div className="hg-actions">
        <label className="mg-toggle"><input type="checkbox" checked={sharedIS} disabled={hfr} onChange={e => { setSharedIS(e.target.checked); setInteg(null); }} /> The same IS element is on the chromosome</label>
        <button type="button" className="primary-button" disabled={hfr} onClick={cross}>Crossover between IS copies</button>
        <button type="button" className="outline-button" onClick={() => { setInteg(null); setMinutes(0); }}>Reset</button>
      </div>

      <figure className="pb-stage">
        <div className="pb-stage-head"><span>B2 · INTERRUPTED MATING</span><span>{hfr ? `stopped at ${minutes} min` : 'needs an Hfr cell'}</span></div>
        <svg className="hg-cj-svg" viewBox="0 0 520 190" role="img" aria-label={`Hfr chromosome with transfer arrow from the origin covering ${Math.round(frac * 100)} percent of the example scale. Genes entered: ${got.length ? got.join(', ') : 'none'}.`}>
          <g transform="translate(130 95) rotate(-90)">
            <circle className="hg-chromosome" r={R} fill="none" />
            <circle className="hg-arrow" r={R} fill="none" strokeDasharray={`${C * frac} ${C}`} />
            {HFR_GENES.map(g => { const a = 2 * Math.PI * (g.entry / 100); return <circle key={g.id} className={`hg-gene${got.includes(g.id) ? ' is-in' : ''}`} cx={R * Math.cos(a)} cy={R * Math.sin(a)} r="7" />; })}
          </g>
          <circle className="hg-origin" cx="130" cy="33" r="5" />
          <text className="hg-tag" x="142" y="28">Origin</text>
          <text className="hg-tag" x="130" y="182" textAnchor="middle">Hfr donor</text>
          <rect className="hg-wall" x="300" y="30" width="200" height="130" rx="58" />
          <text className="hg-tag" x="400" y="22" textAnchor="middle">F- recipient</text>
          <text className="hg-tag" x="400" y="98" textAnchor="middle">{got.length ? `genes in: ${got.join(', ')}` : 'no donor genes yet'}</text>
          {got.length > 0 && <line className="hg-bridge-line" x1="196" x2="300" y1="95" y2="95" />}
        </svg>
        <figcaption className="hg-step-label">{hfr ? (got.length ? `By ${minutes} min the recipient has received genes ${got.join(', ')}. The bridge usually breaks before the whole chromosome enters, so the recipient gets only part.` : 'Move the slider to stop the mating at a chosen time.') : 'Make an Hfr cell in B1 first: only an integrated F drags the chromosome along.'}</figcaption>
        <p className="quiet hg-note">Gene names, entry times and the chromosome scale are examples. The lecture notes give none.</p>
      </figure>
      <div className="cb-controls hg-prereqs"><div className="cb-control"><span>Stop the mating</span>
        <div className="hg-actions">{HFR_STOPS.map(m => <button key={m} type="button" className="outline-button" disabled={!hfr} aria-pressed={minutes === m} onClick={() => setMin(m)}>{m} min</button>)}</div>
        <label className="hg-range">Minutes: {minutes}<input type="range" min="0" max={HFR_MAX_MIN} value={minutes} disabled={!hfr} onChange={e => setMin(+e.target.value)} /></label>
      </div></div>

      <table className="hg-compare"><caption>F+ and Hfr compared</caption><thead><tr><th scope="col" /><th scope="col">F+</th><th scope="col">Hfr</th></tr></thead>
        <tbody>{COMPARE.map(([k, a, b]) => <tr key={k}><th scope="row">{k}</th><td>{a}</td><td>{b}</td></tr>)}</tbody></table>
      {CJ_QUIZ.slice(1).map(q => <Quiz key={q.id} item={q} answers={answers} setAnswers={setAnswers} />)}
    </>}

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {done.size} / {CJ_GOALS.length}</p>
      <ul>{CJ_GOALS.map(g => <li key={g.id} className={done.has(g.id) ? 'done' : ''}><span aria-hidden="true">{done.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{done.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Based on the Microbial Genetics conjugation notes. Timings, positions and counts are schematic.</p>
  </section>;
}
