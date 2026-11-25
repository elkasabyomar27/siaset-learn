export const cls = (...names) => names.filter(Boolean).join(' ');

// Smallest hit radius / side that meets the 44 px touch-target rule.
export const MIN_HIT_R = 22;
export const MIN_HIT = 2 * MIN_HIT_R;
