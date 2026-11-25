export const TAP_SLOP = 10;
export const TAP_MS = 350;
export const DEMO_IDLE_MS = 8000;

export { isPointer, isKeyDown } from './events.js';
export { HOLD_MS, startHold, stepHold } from './hold.js';
export { SWIPE_BAND, startSwipe, stepSwipe } from './swipe.js';
export { startDrag, stepDrag } from './drag.js';
export { trackStep, angleAt, startTrack, stepTrack } from './track.js';
export { startPour, stepPour, nearestMark } from './pour.js';
export { startDial, stepDial } from './dial.js';
