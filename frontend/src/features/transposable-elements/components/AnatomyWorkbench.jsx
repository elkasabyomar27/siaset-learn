import { useImperativeHandle, useReducer, useRef, useState } from 'react';
import { cases, fieldsFor, initialPractice, practiceReducer } from '../anatomyPractice.js';
import './anatomyWorkbench.css';

const panels = [['boundaries', 'Boundaries practice'], ['genes', 'Genes practice'], ['junction', 'Insertion junction practice'], ['fresh', 'Fresh reversed example']];
const caption = 'Invented symbolic example of a TIR-bearing element. Not to scale; no nucleotide sequence or reaction mechanism is shown. Motif orientation, coding direction and element reference orientation use different marks.';

export function FeatureGlyph({ block: b }) {
  const leftward = b.mark?.includes('leftward');
  return <svg className={`anatomy-glyph anatomy-glyph--${b.kind}`} viewBox="0 0 120 64" aria-hidden="true" focusable="false">
    <path className="feature-rail" d="M0 28 H120 M0 36 H120" />
    {b.kind === 'host' && <path className="host-ticks" d="M10 24 V40 M30 24 V40 M50 24 V40 M70 24 V40 M90 24 V40 M110 24 V40" />}
    {b.kind === 'repeat' && <><rect className="feature-body" x="32" y="14" width="56" height="36" rx="10" /><path className="feature-mark" d="M43 23 H66 M43 29 H66 M43 35 H66 M70 23 L80 32 L70 41" /></>}
    {b.kind === 'end' && <><path className="feature-body" d="M44 10 H76 V54 H44 Z" /><path className="feature-mark" d={leftward ? 'M69 20 L55 32 L69 44' : 'M51 20 L65 32 L51 44'} /></>}
    {b.kind === 'gene' && <path className={`feature-body gene-${b.role}`} d={leftward ? 'M18 32 L39 12 H102 V52 H39 Z' : 'M18 12 H81 L102 32 L81 52 H18 Z'} />}
    {b.kind === 'gene' && <text x="60" y="37" textAnchor="middle">{b.label}</text>}
  </svg>;
}

export function MapFigure({ c, answers, showBracket, id, result }) {
  const [selected, setSelected] = useState(null);
  const left = c.gaps.findIndex(([gap]) => gap === answers.left);
  const right = c.gaps.findIndex(([gap]) => gap === answers.right);
  const feature = c.blocks.find(b => b.id === selected);
  return <figure className="anatomy-figure">
    <figcaption><strong>Educational draft model — scientific approval pending.</strong><span>Invented example · not to scale · no sequence or reaction shown.</span></figcaption>
    <details className="anatomy-text" id={`${id}-text`}><summary>Read diagram as text — Text equivalent and teaching legend</summary>
      <p>Left-to-right reference order (including when the list stacks vertically):</p>
      <ol>{c.blocks.map((b, i) => <li key={b.id}><strong>{b.id} {b.label}</strong>{b.mark && `; ${b.mark}`}{b.kind === 'end' && '; terminal recognition DNA, not a gene'}{b.kind === 'repeat' && `; host target-derived interval, repeat identity ${c.target}`}{b.role && `; annotation: ${b.role === 'accessory' ? 'accessory function' : 'encodes transposase'}`}{b.kind === 'host' && '; host backbone outside insertion'}{b.kind === 'gene' && result?.valid && result.diagnostics.some(d => d.key === `direction${i - 3}` && !d.ok) && <strong> — Direction cue: read the {c.direction} coding arrowhead separately from function.</strong>}</li>)}</ol>
      <p>Legend: ❯ / ❮ are terminal motif chevrons, inverted symbolic orientations without a claim of perfect sequence complementarity. → / ← on gene bodies describe coding direction, not motion or guaranteed expression. ≡→ is the separate host repeat mark; both outer repeats share identity {c.target} in direct orientation. Equal block sizes show order only.</p>
    </details>
    <div className="anatomy-canvas-heading"><p>Element reference orientation: <strong>{c.direction}</strong></p><span>Map convention, not movement</span></div>
    <p className="anatomy-inspect-prompt">Select or focus a feature to read its details. The full text above contains the same evidence.</p>
    <div className="anatomy-rail" role="group" aria-label="Molecular features in left-to-right reference order">{c.blocks.map((b, i) => <button type="button" key={b.id} aria-pressed={selected === b.id} aria-label={`${b.id} ${b.label}: ${featureDescription(b, c)}${showBracket && left >= 0 && right > left ? i >= left && i < right ? ' Inside your bracket.' : ' Outside your bracket.' : ''}`} onFocus={() => setSelected(b.id)} onClick={() => setSelected(b.id)} className={`anatomy-block anatomy-block--${b.kind} ${showBracket && left >= 0 && right > left && i >= left && i < right ? 'bracketed' : ''}`}>
      <FeatureGlyph block={b} />
      <strong>{b.id} · {b.label}</strong>
      {b.role && <span>{b.role === 'accessory' ? 'Accessory function' : 'Encodes transposase'}</span>}
      {b.kind === 'gene' && result?.valid && result.diagnostics.some(d => d.key === `direction${i - 3}` && !d.ok) && <span className="anatomy-direction-cue">Read the {b.label} coding arrowhead: {c.direction}. This cue concerns direction only.</span>}
      {showBracket && left >= 0 && right > left && <span>{i >= left && i < right ? 'Inside your bracket' : 'Outside your bracket'}</span>}
    </button>)}</div>
    <div className="anatomy-feature-detail" role="status" aria-live="polite" aria-atomic="true">{feature ? <><strong>{feature.id} · {feature.label}</strong><p>{featureDescription(feature, c)}</p></> : <p>Feature details appear here. Use Tab to explore the map, or open the full text above.</p>}</div>
    <p className="anatomy-visual-key">Shape key: ticked rails = host context; rounded ≡→ = host repeat (identity {c.target}); narrow ❯ / ❮ = terminal motif; broad → / ← = gene coding direction. Marks show orientation, not motion. Rails show order, not strand chemistry.</p>
    {showBracket && <p>Your bracket: {answers.left || 'left unset'} to {answers.right || 'right unset'}. Markers are your temporary selection.</p>}

    <details className="anatomy-science"><summary>Scientific details and model limits</summary><p>{caption}</p><p>This generic model is neither a Tn5 sequence map nor a Tn3 structure. Tn5's 19 bp recognition region is not a perfect 19 bp inverted repeat. No promoter, operon, phenotype, donor fate or enzyme activity is established.</p></details>
  </figure>;
}

export function featureDescription(b, c) {
  if (b.kind === 'host') return 'Host backbone outside insertion.';
  if (b.kind === 'repeat') return `Host target-derived interval, repeat identity ${c.target}; ${b.mark}. Both outer repeats share this identity.`;
  if (b.kind === 'end') return `Terminal recognition DNA, not a gene; ${b.mark}.`;
  return `Annotation: ${b.role === 'accessory' ? 'accessory function' : 'encodes transposase'}; ${b.mark}. Coding direction is separate from function.`;
}

function hintsFor(panel, c) {
  const genes = c.blocks.filter(b => b.kind === 'gene');
  const worked = `Use ${c.gapPrefix}2 and ${c.gapPrefix}6: ${c.blocks.slice(2, 6).map(b => b.label).join(', ')} are inside; the host repeats are outside. Both sources are ${c.prePrefix}1; count one complete element. ${genes.map(b => `${b.label}: ${b.role}, ${c.direction}`).join('. ')}. The terminal regions and intervening genes define the element; coding direction is separate from function.`;
  if (panel === 'boundaries') return ['Which labels identify host DNA, and which identify the element?', 'The two q occurrences flank the terminal regions; compare their origins.', 'Use g2 and g6: E-L, T, C and E-R are inside; q-L and q-R are outside.'];
  if (panel === 'genes') return ["Read each gene’s functional annotation.", 'Use the gene arrowhead for coding direction; use the annotation for function.', 'T encodes movement machinery and points rightward. C has an accessory function and also points rightward. Shared direction does not imply shared function or guaranteed expression.'];
  if (panel === 'junction') return ['What was present on the target before the element appeared?', 'Match q identity on each side to the pre-insertion strip; a source may be used twice.', 'Both sources are J1; bracket E-L through E-R once, so the displayed product contains one element.'];
  return ['Read the supplied feature annotations.', 'Keep host-reference direction separate from element orientation.', worked];
}

export default function AnatomyWorkbench({ ref }) {
  const [state, dispatch] = useReducer(practiceReducer, undefined, initialPractice);
  const heading = useRef(null);
  useImperativeHandle(ref, () => ({ clear: () => dispatch({ type: 'clear' }) }), []);
  const fresh = state.panel === 'fresh';
  const c = cases[fresh ? state.fresh : 'B'];
  const draft = state.drafts[fresh ? state.fresh : state.panel];
  const id = `anatomy-${state.panel}-${c.id}`;
  const hints = hintsFor(state.panel, c);
  const result = draft.result;
  const title = panels.find(([key]) => key === state.panel)[1];
  const verdict = !result ? '' : !result.valid ? 'Choose the missing answers before checking.' : result.correct ? fresh ? result.independent ? 'Solved this fresh example without hints' : 'Reviewed with support' : `${title} correct.` : 'Review the indicated criteria and try again.';
  return <section className="lesson-section anatomy-workbench" aria-labelledby="anatomy-workbench-title">
    <h2 id="anatomy-workbench-title">Optional anatomy workbench</h2>
    <p>Practice reading an element map. Practice and hints do not change lesson completion. Draft practice is kept only while this lesson stays open. Your recorded lesson evidence is shown separately.</p>
    <a className="outline-button" href="#anatomy-required">Skip to required questions</a>
    <nav className="anatomy-nav" aria-label="Optional practice sections">{panels.map(([panel, label]) => <button type="button" className="outline-button" key={panel} aria-pressed={state.panel === panel} onClick={() => { dispatch({ type: 'panel', panel }); heading.current?.focus(); }}>{label}</button>)}</nav>
    <h3 ref={heading} tabIndex={-1}>{title}{fresh && ` · Case ${c.id}`}</h3>
    <p className="anatomy-task">{state.panel === 'boundaries' ? 'Place boundaries around both terminal regions and internal genes; leave host DNA outside.' : state.panel === 'genes' ? 'Identify each gene’s supplied function and coding direction.' : state.panel === 'junction' ? 'Match the outer repeats to their source and count the complete elements.' : 'Use the supplied evidence to interpret this reversed element.'}</p>
    {fresh && <p>Use the supplied annotations for this reversed element. “Without hints” describes only this local case attempt, not validated mastery or proof that you have never seen this diagram. {result?.independent ? 'This first complete submission used no hints.' : state.supported[c.id] ? 'This case is now supported review.' : 'First complete submission is eligible for the local without-hints label.'} Both cases have similar structure, so success shows limited transfer.</p>}
    {(fresh || state.panel === 'junction') && <section className="anatomy-before" aria-label="Before insertion"><h4>Before insertion — same stipulated host locus</h4><p>{c.prePrefix}0: {c.hosts[0]} → {c.prePrefix}1: target interval {c.target}, one occurrence, rightward reference mark → {c.prePrefix}2: {c.hosts[1]}.</p><p>No element is present on this target. After insertion the two outer occurrences share the target identity {c.target}. Donor DNA is not shown. Matching means source-interval identity, not the same physical atoms occupying both copies.</p></section>}
    <MapFigure key={id} c={c} answers={draft.answers} showBracket={fresh || state.panel === 'boundaries'} id={id} result={result} />
    <form className="anatomy-answer-panel" onSubmit={event => { event.preventDefault(); dispatch({ type: 'check' }); }}>
      <fieldset><legend>Your practice answers</legend>
        <div className="anatomy-fields">{fieldsFor(state.panel, c).map(field => <label key={field.key} htmlFor={`${id}-${field.key}`}>{field.label}
          <select id={`${id}-${field.key}`} value={draft.answers[field.key] || ''} aria-invalid={result?.diagnostics.some(d => d.key === field.key && !d.ok) || undefined} onChange={event => dispatch({ type: 'edit', key: field.key, value: event.target.value })}>
            <option value="">Choose {field.key === 'left' || field.key === 'right' ? 'a gap' : 'an answer'}</option>{field.options.map(([value, label]) => <option value={value} key={value}>{value.match(/^[guvJUV]\d$/) ? `${value}: ` : ''}{label}</option>)}
          </select>
        </label>)}</div>
      </fieldset>
      <button className="outline-button" type="submit">{state.panel === 'boundaries' ? 'Check bracket' : 'Check practice answers'}</button>
    </form>
    <p role="status" aria-live="polite" aria-atomic="true">{verdict}</p>
    {result && <ul className="anatomy-results">{result.diagnostics.map((d, i) => <li key={`${d.key}-${i}`}><strong>{!result.valid ? 'Missing' : d.ok ? 'Correct' : 'Review'}: </strong>{d.text} {!d.ok && <a href={`#${id}-${d.key}`}>Go to {fieldsFor(state.panel, c).find(f => f.key === d.key)?.label}</a>}</li>)}</ul>}
    <div className="anatomy-hints"><p>{draft.hints || (!fresh && state.supported[state.panel]) ? 'Supported practice — hints or a previous submission were used.' : 'Hints are optional. They do not change recorded lesson evidence.'}</p>
      {draft.hints > 0 && <ol>{hints.slice(0, draft.hints).map((hint, i) => <li key={hint}><strong>{i === 2 ? 'Worked answer' : `Hint ${i + 1}`}:</strong> {hint}</li>)}</ol>}
      <button className="outline-button" type="button" disabled={draft.hints >= 3} onClick={() => dispatch({ type: 'hint' })}>Show next hint ({draft.hints}/3)</button>
    </div>
    {fresh && <button className="outline-button" type="button" onClick={() => { dispatch({ type: 'next' }); heading.current?.focus(); }}>{state.seen.length < 2 ? 'Try parallel Case U2' : 'Review other case (both cases seen)'}</button>}
    <button className="outline-button" type="button" onClick={() => dispatch({ type: 'clear' })}>Clear practice answers</button>
    <p>Clearing answers keeps this session’s hint and submission history. It does not reset recorded lesson evidence.</p>
  </section>;
}
