import {useId} from 'react';

export const DNA_KINDS = ['donor', 'target', 'element', 'tsd'];

// React ids contain characters (":", "«") that break url(#…) references.
export const safeId = raw => `ho${String(raw).replace(/[^A-Za-z0-9_-]/g, '')}`;

// Ids of every definition for a given prefix; use with url(id) as fill/stroke/filter.
export const defIds = prefix => ({
  tube: Object.fromEntries(DNA_KINDS.map(k => [k, `${prefix}-tube-${k}`])),
  sphere: Object.fromEntries(DNA_KINDS.map(k => [k, `${prefix}-sphere-${k}`])),
  enzyme: `${prefix}-enzyme`,
  shade: `${prefix}-tube-shade`,
  contact: `${prefix}-contact`,
  lift: `${prefix}-lift`,
});
export const url = id => `url(#${id})`;

const tone = (kind, other, pct) => `color-mix(in srgb, var(--scientific-${kind}) ${pct}%, var(${other}))`;
const stop = (offset, color, opacity) => <stop offset={offset} style={{stopColor: color, ...(opacity != null && {stopOpacity: opacity})}} />;

function Sphere({id, kind}) {
  // Spheres are only used on circles (non-zero bounding box), so objectBoundingBox is safe here.
  return <radialGradient id={id} cx="0.36" cy="0.32" r="0.75" fx="0.3" fy="0.26">
    {stop('0', tone(kind, '--color-molecular-text', 45))}
    {stop('0.45', `var(--scientific-${kind})`)}
    {stop('1', tone(kind, '--color-molecular-background', 45))}
  </radialGradient>;
}

/**
 * Shared SVG <defs> for a scene: shaded DNA tubes, glossy enzyme spheres, and
 * contact/lift shadows. Everything used on lines or flat shapes is userSpaceOnUse:
 * objectBoundingBox gradients and filters vanish on zero-height lines.
 *  - tube.<kind>: linear gradient across a horizontal tube of thickness `tube`
 *    centred on y = 0 (draw the tube in a translated/rotated local frame).
 *  - shade: lighting filter that shades any stroke as a tube, whatever its path.
 *  - sphere.<kind> / enzyme: glossy sphere fills for circles.
 *  - contact / lift: resting and carried drop shadows.
 * `width`/`height` bound the filter region (the stage's viewBox).
 */
export function HandsOnDefs({idPrefix, width = 1000, height = 1000, tube = 14}) {
  const auto = safeId(useId());
  const ids = defIds(idPrefix ?? auto), pad = 120;
  const region = {filterUnits: 'userSpaceOnUse', x: -pad, y: -pad, width: width + 2 * pad, height: height + 2 * pad};
  const shadow = 'color-mix(in srgb, var(--color-molecular-background) 85%, var(--color-brand-primary))';
  return <defs>
    {DNA_KINDS.map(kind => <linearGradient key={kind} id={ids.tube[kind]} gradientUnits="userSpaceOnUse" x1="0" y1={-tube / 2} x2="0" y2={tube / 2}>
      {stop('0', tone(kind, '--color-molecular-text', 55))}
      {stop('0.3', `var(--scientific-${kind})`)}
      {stop('0.75', `var(--scientific-${kind})`)}
      {stop('1', tone(kind, '--color-molecular-background', 50))}
    </linearGradient>)}
    {DNA_KINDS.map(kind => <Sphere key={kind} id={ids.sphere[kind]} kind={kind} />)}
    <Sphere id={ids.enzyme} kind="tsd" />
    <filter id={ids.shade} {...region} colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
      <feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.8" specularExponent="18" result="spec" style={{lightingColor: 'var(--color-molecular-text)'}}>
        <feDistantLight azimuth="235" elevation="48" />
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="gloss" />
      <feComposite in="SourceGraphic" in2="gloss" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" />
    </filter>
    <filter id={ids.contact} {...region}>
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" style={{floodColor: shadow, floodOpacity: 0.7}} />
    </filter>
    <filter id={ids.lift} {...region}>
      <feDropShadow dx="0" dy="10" stdDeviation="6" style={{floodColor: shadow, floodOpacity: 0.5}} />
    </filter>
  </defs>;
}
