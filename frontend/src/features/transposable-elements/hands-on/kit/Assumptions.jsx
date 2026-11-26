import {useId} from 'react';

// Model assumptions are not lab actions: a small labelled panel of switches beside the scene.
// items: [{key, label}], values: {key: bool}, onChange(key, value).
export function Assumptions({items, values, onChange}) {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  if (!items.length) return null;
  return <fieldset className="ho-assumptions">
    <legend>Assumptions</legend>
    {items.map(({key, label}) => <label key={key} className="ho-assume-row" htmlFor={`${uid}-${key}`}>
      <input id={`${uid}-${key}`} type="checkbox" role="switch" checked={!!values[key]} onChange={e => onChange(key, e.target.checked)} />
      <span>{label}</span>
    </label>)}
  </fieldset>;
}
