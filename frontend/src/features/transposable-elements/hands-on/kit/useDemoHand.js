import {useCallback, useEffect, useReducer} from 'react';
import {demoHand, initialDemo} from '../demoHand.js';

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// The ghost hand for one scene: `kind` is the gesture the current step needs, `key` changes
// when the step changes. Returns the state for <DemoHand>, plus `activity` and `drag(active)`.
export function useDemoHand(kind, key) {
  const [demo, send] = useReducer(demoHand, undefined, () => initialDemo({reducedMotion: reduced()}));
  useEffect(() => { send({type: 'need', kind, t: performance.now()}); }, [kind, key]);
  useEffect(() => {
    const id = setInterval(() => send({type: 'tick', t: performance.now()}), 1000);
    return () => clearInterval(id);
  }, []);
  const activity = useCallback(() => send({type: 'activity', t: performance.now()}), []);
  const drag = useCallback(active => send({type: 'drag', active}), []);
  return {demo, activity, drag};
}

// Hit box of w x h css-comfortable size around the local origin, never below 44 px on screen.
export const hitBox = (w, h, scale) => {
  const W = Math.max(w, 44 / Math.max(scale, 0.05)), H = Math.max(h, 44 / Math.max(scale, 0.05));
  return {x: -W / 2, y: -H / 2, width: W, height: H};
};
