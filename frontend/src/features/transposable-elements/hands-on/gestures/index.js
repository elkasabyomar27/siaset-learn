export const HOLD_MS = 700;
export const TAP_SLOP = 10;
export const TAP_MS = 350;
export const SWIPE_BAND = 34;
export const DEMO_IDLE_MS = 8000;

export { isPointer, isKeyDown } from './events.js';
export { startHold, stepHold } from './hold.js';
export { startSwipe, stepSwipe } from './swipe.js';
export { startDrag, stepDrag } from './drag.js';
export { trackStep, angleAt } from './track.js';
export { startPour, stepPour, nearestMark } from './pour.js';
export { startDial, stepDial } from './dial.js';
