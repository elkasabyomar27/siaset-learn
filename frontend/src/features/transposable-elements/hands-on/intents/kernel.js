// Gesture -> model-input mapping for KernelGrower. Outputs are the patches the old controls produced:
// {ac: bool}, {timing: 0..1 in steps of 0.05} and {grow: true} (what the "Grow" button did).
export const TIMING_STEP = 0.05;
const DEG_PER_STEP = 360 * TIMING_STEP;

export const timingFromDegrees = deg => Math.min(1, Math.max(0, Math.round(deg / DEG_PER_STEP) * TIMING_STEP));
export const degreesFromTiming = t => t * 360;

// current: {ac, prediction, growing}
export function kernelIntent(g, current = {}) {
  if (!g) return null;
  switch (g.kind) {
    case 'drop': return g.target === 'genome' ? {ac: true} : g.target === 'outside' ? {ac: false} : null;
    // The old range input was disabled without Ac.
    case 'track': return current.ac && Number.isFinite(g.value) ? {timing: Number(timingFromDegrees(g.value).toFixed(2))} : null;
    // The old Grow button was disabled until a prediction was chosen and while a kernel was growing.
    case 'hold': return g.target === 'kernel' && current.prediction && !current.growing ? {grow: true} : null;
    default: return null;
  }
}
