import { useState } from 'react';
import { modules, fieldById } from '../features/transposable-elements/curriculum/modules.js';

const num = topic => String(topic.order).padStart(2, '0');

/** Choose stations for an assignment: grouped by field and module, kept in the order picked. */
export default function StationPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLocaleLowerCase();
  const byId = new Map(modules.flatMap(m => m.topics.map(t => [t.id, t])));
  const toggle = id => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  return <div className="station-picker">
    <label className="station-picker-search"><span>Stations (optional)</span>
      <input type="search" aria-label="Search stations" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title"/></label>
    {value.length > 0 && <ul className="station-chips" aria-label="Selected stations">
      {value.filter(id => byId.has(id)).map(id => { const t = byId.get(id); return <li key={id}>
        <span>{num(t)} · {t.title}</span>
        <button type="button" className="class-link" aria-label={`Remove ${num(t)} ${t.title}`} onClick={() => toggle(id)}>×</button></li>; })}
    </ul>}
    {modules.map(module => {
      const shown = module.topics.filter(t => !term || t.title.toLocaleLowerCase().includes(term));
      return <fieldset key={module.id} className="station-group" hidden={!shown.length}>
        <legend>{fieldById(module.field)?.title} · {module.title}</legend>
        {module.topics.map(t => <label key={t.id} className="station-option" hidden={!shown.includes(t)}>
          <input type="checkbox" checked={value.includes(t.id)} onChange={() => toggle(t.id)}/>
          <span>{num(t)} · {t.title}</span></label>)}
      </fieldset>;
    })}
  </div>;
}
