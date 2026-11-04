import { useId, useState } from 'react';
import { ANATOMY_CASES, LABELS, checkDissection, insideBracket } from '../anatomyLab.js';
import './partsBench.css';

const SHORT = {host: 'Host', tsd: 'TSD', tir: 'TIR', transposase: 'Transposase', cargo: 'Cargo'};
const arrow = d => d === 1 ? '→' : d === -1 ? '←' : '';
const blank = () => ({left: null, right: null, labels: {}, direction: null, selected: null, result: null});

export default function AnatomyLab() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [caseIndex, setCaseIndex] = useState(0);
  const [work, setWork] = useState(() => ANATOMY_CASES.map(blank));
  const [solved, setSolved] = useState(() => new Set());
  const c = ANATOMY_CASES[caseIndex], w = work[caseIndex];
  const update = patch => setWork(all => all.map((x, i) => i === caseIndex ? {...x, ...patch, result: null} : x));

  function placeGap(g) {
    if (w.left === null) update({left: g});
    else if (w.right === null) update({right: g === w.left ? null : g});
    else update(Math.abs(g - w.left) <= Math.abs(g - w.right) ? {left: g} : {right: g});
  }
  function check() {
    const result = checkDissection(c, w);
    setWork(all => all.map((x, i) => i === caseIndex ? {...x, result} : x));
    if (result.allOk) setSolved(prev => new Set(prev).add(c.id));
  }
  const sel = w.selected !== null ? c.segments[w.selected] : null;

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · DISSECT AN ELEMENT</p>
    <h2 id={`${uid}-title`}>Where does the element start and end, and what is inside?</h2>
    <p className="pb-goal">This DNA has an element inserted in it. (1) Place two markers in the gaps to bracket the element. (2) Tap each segment, read its clue and name it. (3) Say which way the transposase gene reads. Then check.</p>

    <div className="al-cases" role="group" aria-label="Choose an example">{ANATOMY_CASES.map((x, i) => <button type="button" key={x.id} className="outline-button" aria-pressed={i === caseIndex} onClick={() => setCaseIndex(i)}>{solved.has(x.id) ? '✓ ' : ''}{x.name}</button>)}</div>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>CHROMOSOME WITH AN INSERTION · LEFT TO RIGHT</span><span>{w.left !== null && w.right !== null ? 'Bracket placed' : `${(w.left !== null) + (w.right !== null)} / 2 markers`}</span></div>
      <div className="al-strip">
        {c.segments.map((s, i) => <span key={i} className="al-unit">
          <button type="button" className={`al-gap${w.left === i || w.right === i ? ' is-marker' : ''}`} onClick={() => placeGap(i)} aria-label={`${w.left === i || w.right === i ? 'Boundary marker here. ' : ''}Place a boundary before segment ${i + 1}`}><span aria-hidden="true">{w.left === i || w.right === i ? '┃' : ''}</span></button>
          <button type="button" className={`al-seg al-shape-${s.kind === 'transposase' || s.kind === 'cargo' ? 'gene' : s.kind}${w.selected === i ? ' is-selected' : ''}${w.labels[i] ? ` al-named-${w.labels[i]}` : ''}${insideBracket(i, w.left, w.right) ? ' is-inside' : ''}${w.result ? (w.result.labelResults[i] ? ' is-right' : ' is-wrong') : ''}`} onClick={() => setWork(all => all.map((x, k) => k === caseIndex ? {...x, selected: i} : x))} aria-pressed={w.selected === i} aria-label={`Segment ${i + 1}${w.labels[i] ? `, named ${LABELS[w.labels[i]]}` : ', not named yet'}${s.dir ? `, arrow pointing ${s.dir === 1 ? 'right' : 'left'}` : ''}`}>
            <span className="al-seg-arrow" aria-hidden="true">{arrow(s.dir)}</span>
            <span className="al-seg-name">{w.labels[i] ? SHORT[w.labels[i]] : `#${i + 1}`}</span>
            {w.result && <span className="al-seg-mark" aria-hidden="true">{w.result.labelResults[i] ? '✓' : '✗'}</span>}
          </button>
          {i === c.segments.length - 1 && <button type="button" className={`al-gap${w.left === i + 1 || w.right === i + 1 ? ' is-marker' : ''}`} onClick={() => placeGap(i + 1)} aria-label="Place a boundary after the last segment"><span aria-hidden="true">{w.left === i + 1 || w.right === i + 1 ? '┃' : ''}</span></button>}
        </span>)}
      </div>
      <figcaption>Invented example, not to scale; no sequence shown. Arrows show reading direction. Shaded segments are inside your bracket.</figcaption>
    </figure>

    <div className="al-inspector" aria-live="polite">
      {sel ? <><p className="eyebrow">SEGMENT {w.selected + 1} · CLUE</p><p className="al-clue">{sel.clue}</p>
        <div className="al-labels" role="group" aria-label={`Name segment ${w.selected + 1}`}>{Object.entries(LABELS).map(([k, label]) => <button type="button" key={k} className="outline-button" aria-pressed={w.labels[w.selected] === k} onClick={() => update({labels: {...w.labels, [w.selected]: k}})}>{label}</button>)}</div></>
        : <p className="quiet">Tap a segment to read its clue and name it.</p>}
    </div>

    <div className="cb-control al-direction" role="group" aria-label="Transposase reading direction"><span>The transposase gene reads</span><div>{[['right', '→ Rightward'], ['left', '← Leftward']].map(([d, label]) => <button type="button" key={d} className="outline-button" aria-pressed={w.direction === d} onClick={() => update({direction: d})}>{label}</button>)}</div></div>

    <div className="pb-actions"><button type="button" className="primary-button" onClick={check}>Check my dissection →</button><button type="button" className="outline-button" onClick={() => setWork(all => all.map((x, i) => i === caseIndex ? blank() : x))}>Clear</button>
      {w.result?.allOk && caseIndex < ANATOMY_CASES.length - 1 && <button type="button" className="outline-button" onClick={() => setCaseIndex(caseIndex + 1)}>Next element →</button>}</div>

    {w.result && <div className={`pb-verdict ${w.result.allOk ? 'is-good' : 'is-bad'}`} role="status">
      {w.result.allOk ? <><b>✓ Fully dissected.</b> The element runs from one terminal inverted repeat to the other. The matching TSDs sit outside it: they are host DNA copied at insertion, not part of the element.</>
        : <><b>Not yet.</b> <ul className="al-feedback">
          <li>{w.result.boundariesOk ? '✓ Boundaries correct.' : `✗ ${w.result.boundaryHint}`}</li>
          <li>{w.result.labelsOk ? '✓ Every segment named correctly.' : `✗ ${w.result.labelResults.filter(ok => !ok).length} segment(s) need another look (marked ✗). Re-read their clues.`}</li>
          <li>{w.result.directionOk ? '✓ Direction correct.' : '✗ Look at the transposase gene’s arrow.'}</li></ul></>}
    </div>}

    <section className="pb-goals" aria-label="Progress"><p className="eyebrow">ELEMENTS DISSECTED · {solved.size} / {ANATOMY_CASES.length}</p>
      <ul>{ANATOMY_CASES.map(x => <li key={x.id} className={solved.has(x.id) ? 'done' : ''}><span aria-hidden="true">{solved.has(x.id) ? '✓' : '○'}</span>{x.name}{x.id === 'reversed' ? ': genes read leftward' : x.id === 'minimal' ? ': no cargo' : ': with cargo'}</li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Your recorded answers are the required questions below.</p>
  </section>;
}
