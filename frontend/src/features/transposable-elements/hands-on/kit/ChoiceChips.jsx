// A question answered by tapping one chip. Chips are real buttons (aria-pressed), so they
// work with mouse, touch and keyboard. options: {value: label}, or an array of values.
export function ChoiceChips({legend, options, value, onChange, disabled = false, className = 'tsd-predict', hint}) {
  const entries = Array.isArray(options) ? options.map(o => [o, o]) : Object.entries(options);
  return <fieldset className={className}>
    <legend>{legend}</legend>
    <div>{entries.map(([k, label]) => <button type="button" key={k} className={`outline-button${value === k ? ' chosen' : ''}`} aria-pressed={value === k} disabled={disabled} onClick={() => onChange(k)}>{label}</button>)}</div>
    {hint && <small>{hint}</small>}
  </fieldset>;
}

// Model assumptions with more than two answers (known / unknown / absent): the same panel as
// <Assumptions>, with a chip row per assumption. items: [{key, label, options, disabled?}].
export function AssumptionChoices({items, values, onChange}) {
  if (!items.length) return null;
  return <div className="ho-assumptions" role="group" aria-label="Assumptions">
    <p className="ho-assume-title">Assumptions</p>
    {items.map(({key, label, options, disabled}) => <ChoiceChips key={key} className="ho-assume-choice" legend={label} options={options} value={values[key]} disabled={disabled} onChange={v => onChange(key, v)} />)}
  </div>;
}
