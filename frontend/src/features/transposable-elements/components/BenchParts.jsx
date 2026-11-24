import { Link } from 'react-router';
import './partsBench.css';
import './benchWorkflow.css';

const ICON = {open: '✓', restricted: '◐', closed: '✕'};
export const optionList = options => Array.isArray(options) ? options : Object.entries(options);

/** "From the last station": what this bench receives. Values are computed by the caller. */
export function SampleHandoff({from, items}) {
  return <aside className="bw-handoff" aria-label="From the last station">
    <p className="eyebrow">FROM THE LAST STATION · <Link to={from.href}>{from.title}</Link></p>
    <dl>{items.map(i => <div key={i.label}><dt>{i.label}</dt><dd>{i.value}</dd></div>)}</dl>
  </aside>;
}

export function Controls({config, settings, onChange}) {
  return <div className="cb-controls">
    {config.controls.map(c => c.type === 'toggle'
      ? <label key={c.key} className="mg-toggle bw-toggle"><input type="checkbox" checked={!!settings[c.key]} onChange={e => onChange({[c.key]: e.target.checked})} /> {c.label}</label>
      : <div key={c.key} className="cb-control" role="group" aria-label={c.label}><span>{c.label}</span><div>{optionList(c.options).map(([value, label]) => <button type="button" key={value} className="outline-button" aria-pressed={String(settings[c.key]) === value} onClick={() => onChange({[c.key]: typeof config.defaults[c.key] === 'number' ? Number(value) : value})}>{label}</button>)}</div></div>)}
  </div>;
}

export function Predict({label, options, value, onChange}) {
  return <label className="bw-predict"><span>{label}</span>
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Choose your prediction</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </label>;
}

export function Gates({gates}) {
  return <ol className="mg-pipeline" aria-label="Requirements in order">
    {gates.map(g => <li key={g.id} className={`mg-gate mg-gate--${g.state}`}>
      <span className="mg-node" aria-hidden="true">{ICON[g.state]}</span>
      <b>{g.label}</b><small className="mg-state">{g.state === 'open' ? 'met' : g.state === 'restricted' ? 'partly met' : 'not met'}</small><p>{g.note}</p>
    </li>)}
  </ol>;
}

/** Stays mounted so screen readers are already watching it when a verdict appears inside. */
export const LiveRegion = ({children}) => <div role="status" aria-live="polite">{children}</div>;

export function Verdict({tone, children}) {
  return <div className={`pb-verdict${tone === 'good' ? ' is-good' : tone === 'bad' ? ' is-bad' : ''}`}>{children}</div>;
}

export const PracticeNote = ({children}) => <p className="quiet">Practice only; it doesn’t change lesson completion.{children ? <> {children}</> : null}</p>;
