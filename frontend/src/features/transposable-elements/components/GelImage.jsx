// Schematic agarose gel: wells at the negative electrode (top), DNA runs toward + (bottom).
// Positions come from benchWorkflow.migrate; a band past the end of the lane has run off.
const TOP = 34, LENGTH = 220, LANE = 64;

const bandText = lane => {
  if (lane.floats) return `${lane.label}: sample floated out of the well`;
  const kept = lane.bands.filter(b => b.pos <= 1), lost = lane.bands.filter(b => b.pos > 1);
  const parts = [kept.length ? kept.map(b => `${b.bp} bp`).join(', ') : 'no bands'];
  if (lost.length) parts.push(`${lost.map(b => `${b.bp} bp`).join(', ')} ran off the gel`);
  return `${lane.label}: ${parts.join('; ')}`;
};

export default function GelImage({lanes, caption}) {
  const width = 40 + lanes.length * LANE;
  const label = `${caption}. Wells at the negative electrode; DNA runs toward the positive electrode. ${lanes.map(bandText).join('. ')}.`;
  return <figure className="gel-figure">
    <svg className="gel-svg" viewBox={`0 0 ${width} ${TOP + LENGTH + 26}`} role="img" aria-label={label}>
      <rect x="0" y="0" width={width} height={TOP + LENGTH + 26} rx="10" fill="var(--scientific-gel)" />
      <text x="10" y={TOP - 4} fontSize="14" fill="var(--scientific-ladder)">−</text>
      <text x="10" y={TOP + LENGTH + 18} fontSize="14" fill="var(--scientific-ladder)">+</text>
      {lanes.map((lane, i) => {
        const x = 30 + i * LANE;
        return <g key={lane.id}>
          <text x={x + LANE / 2 - 4} y="14" fontSize="9" textAnchor="middle" fill="var(--scientific-ladder)">{lane.label}</text>
          <rect x={x + 6} y={TOP - 10} width={LANE - 20} height="7" rx="1.5" fill="none" stroke="var(--scientific-ladder)" />
          {lane.floats && <text x={x + LANE / 2 - 4} y={TOP - 14} fontSize="9" textAnchor="middle" fill="var(--scientific-band)">↑ floated</text>}
          {lane.bands.filter(b => b.pos <= 1).map(b => <rect key={b.bp} className={`gel-band${b.intensity === 'faint' ? ' is-faint' : ''}`} x={x + 6} y={TOP + b.pos * LENGTH} width={LANE - 20} height="4" rx="1.5" fill={lane.id === 'ladder' ? 'var(--scientific-ladder)' : 'var(--scientific-band)'}><title>{b.bp} bp</title></rect>)}
        </g>;
      })}
    </svg>
    <figcaption>{caption} Schematic positions from a log-linear model, not a photograph.</figcaption>
  </figure>;
}
