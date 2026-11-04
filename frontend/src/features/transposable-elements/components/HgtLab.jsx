import { useId, useState } from 'react';
import { PREREQS, HGT_GOALS, newHgt, act, setPrereq, applySelection } from '../hgtLab.js';
import './partsBench.css';

function Cell({ role, lab }) {
  const donor = role === 'donor', loaded = lab.bact.phase !== 'initial';
  const hasPlasmid = donor || !!lab.bact.recipientPlasmid, plasmidLoaded = donor ? loaded : !!lab.bact.recipientPlasmid;
  const growth = lab.selection?.result[role];
  return <figure className={`hg-cell${growth ? ` is-${growth}` : ''}`}>
    <figcaption><b>{donor ? 'Donor cell' : 'Recipient cell'}</b>{growth && <span className="hg-growth">{growth === 'grows' ? '✓ grows' : growth === 'inhibited' ? '✕ inhibited' : '? undetermined'}</span>}</figcaption>
    <svg viewBox="0 0 220 130" role="img" aria-label={`${donor ? 'Donor' : 'Recipient'} cell: chromosome${hasPlasmid ? `, plasmid${plasmidLoaded ? ' carrying Tn5' : ' without Tn5'}` : ', no plasmid'}${donor && !loaded ? ', separate DNA fragment carrying Tn5' : ''}.`}>
      <rect className="hg-wall" x="4" y="4" width="212" height="122" rx="56" />
      <ellipse className="hg-chromosome" cx="78" cy="65" rx="44" ry="30" />
      <text className="hg-tag" x="78" y="69" textAnchor="middle">chromosome</text>
      {hasPlasmid && <g className={`hg-plasmid${!donor ? ' is-new' : ''}`}><circle cx="162" cy="62" r="22" />{plasmidLoaded && <path className="hg-tn" d="M162 40 A22 22 0 0 1 184 62" />}<text className="hg-tag" x="162" y="98" textAnchor="middle">plasmid</text></g>}
      {donor && !loaded && <g className="hg-fragment"><line x1="126" x2="200" y1="112" y2="112" /><line className="hg-tn" x1="148" x2="178" y1="112" y2="112" /><text className="hg-tag" x="163" y="104" textAnchor="middle">fragment</text></g>}
    </svg>
  </figure>;
}

export default function HgtLab() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [lab, setLab] = useState(newHgt);
  const [assume, setAssume] = useState(true);
  const [message, setMessage] = useState(null);
  const done = new Set(HGT_GOALS.filter(g => g.done(lab.log)).map(g => g.id));
  function run(action) { const r = act(lab, action); setLab(r.lab); setMessage({ok: r.ok, text: r.text}); }
  function select() { const r = applySelection(lab, assume); setLab(r.lab); setMessage({ok: true, text: r.text}); }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · SPREAD A RESISTANCE GENE</p>
    <h2 id={`${uid}-title`}>Moving inside a cell, moving between cells, and selection are different things.</h2>
    <p className="pb-goal">Tn5 carries a resistance gene on a DNA fragment in the donor cell. Try the three operations in any order and watch what each one changes.</p>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>TWO BACTERIAL CELLS</span><span>{lab.bact.phase === 'initial' ? 'Tn5 on donor fragment' : lab.bact.phase === 'loaded' ? 'Tn5 on donor plasmid' : 'Plasmid copy in recipient'}</span></div>
      <div className="hg-cells"><Cell role="donor" lab={lab} /><span className={`hg-bridge${lab.bact.phase === 'transferred' ? ' is-used' : ''}`} aria-hidden="true">→</span><Cell role="recipient" lab={lab} /></div>
      <figcaption className="pb-legend"><span><i className="sw-module" />Tn5 with resistance cargo</span><span><i className="sw-host" />Chromosome</span><span><i className="sw-cargo" />Plasmid</span></figcaption>
    </figure>

    <div className="hg-actions">
      <button type="button" className="primary-button" onClick={() => run('transpose')}>Transpose <small>inside the donor</small></button>
      <button type="button" className="primary-button" onClick={() => run('conjugate')}>Conjugate <small>donor → recipient</small></button>
      <button type="button" className="outline-button" onClick={select}>Add antibiotic <small>selection</small></button>
      <button type="button" className="outline-button" onClick={() => { setLab(newHgt()); setMessage(null); }}>Reset cells</button>
    </div>

    <div className="cb-controls hg-prereqs">
      <div className="cb-control"><span>Conjugation requirements</span>{Object.entries(PREREQS).map(([k, label]) => <label key={k} className="mg-toggle"><input type="checkbox" checked={lab.bact.transfer[k]} onChange={e => setLab(setPrereq(lab, k, e.target.checked))} /> {label}</label>)}</div>
      <div className="cb-control"><span>Selection assumption</span><label className="mg-toggle"><input type="checkbox" checked={assume} onChange={e => setAssume(e.target.checked)} /> Assume the resistance gene is expressed and sufficient</label></div>
    </div>

    {message && <div className={`pb-verdict ${message.ok ? 'is-good' : 'is-bad'}`} role="status" aria-live="polite">{message.text}</div>}
    {lab.log.length > 0 && <ol className="hg-log" aria-label="What happened">{lab.log.map((e, i) => <li key={i} className={e.ok ? '' : 'is-failed'}><b>{e.action === 'select' ? 'Selection' : e.action === 'transpose' ? 'Transposition' : 'Conjugation'}</b>{e.scope && <span className="hg-scope">{e.scope}</span>}{!e.ok && <span className="hg-scope is-failed">no change</span>}</li>)}</ol>}

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {done.size} / {HGT_GOALS.length}</p>
      <ul>{HGT_GOALS.map(g => <li key={g.id} className={done.has(g.id) ? 'done' : ''}><span aria-hidden="true">{done.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{done.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Transposition and conjugation use the lesson’s bacterial model. Growth outcomes are qualitative and depend on the stated assumption.</p>
  </section>;
}
