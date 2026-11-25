import {useCallback, useEffect, useRef, useState} from 'react';
import {
  startHold, stepHold, startSwipe, stepSwipe, startDrag, stepDrag,
  startPour, stepPour, startDial, stepDial, startTrack, stepTrack,
} from './gestures/index.js';

// Binds a pure recognizer to DOM events. SSR-safe: window/document/DOM are touched
// only inside handlers and effects.
//
// `rearm`: recognizers whose `done` is sticky start over after completing, so a
// refused attempt (the model says no) can be retried. `sync`: config the recognizer
// copied into its state at start, refreshed from the latest props before each event.
const RECOGNIZERS = new Map([
  [startHold, {start: startHold, step: stepHold, rearm: false}],
  [startSwipe, {start: startSwipe, step: stepSwipe, rearm: true, sync: (s, c) => ({...s, line: c.line, band: c.band ?? s.band})}],
  [startDrag, {start: startDrag, step: stepDrag, rearm: true, sync: (s, c) => ({...s, zones: c.zones ?? []})}],
  [startPour, {start: startPour, step: stepPour, rearm: true}],
  [startDial, {start: startDial, step: stepDial, rearm: true}],
  [startTrack, {start: startTrack, step: stepTrack, rearm: true, sync: (s, c) => ({...s, cx: c.cx ?? s.cx, cy: c.cy ?? s.cy, value: c.value ?? s.value})}],
]);

// Phases that need a clock: ticks run (via requestAnimationFrame) only while one is active.
const TICKING = new Set(['holding', 'pouring']);

// 'Shift+Tab', 'Shift+ArrowLeft' etc., as the recognizers expect. Printable keys stay as typed.
export function keyName(e) {
  const k = e.key;
  return e.shiftKey && typeof k === 'string' && k.length > 1 && k !== 'Shift' ? `Shift+${k}` : k;
}

// Pointer position in the coordinate space the target's own attributes live in
// (its parent's SVG user space). HTML targets fall back to their bounding rect.
export function toLocal(e) {
  const el = e.currentTarget, parent = el.parentNode;
  const ctm = (parent && typeof parent.getScreenCTM === 'function' ? parent.getScreenCTM() : null)
    ?? (typeof el.getScreenCTM === 'function' ? el.getScreenCTM() : null);
  if (ctm) {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return {x: p.x, y: p.y};
  }
  const r = el.getBoundingClientRect();
  return {x: e.clientX - r.left, y: e.clientY - r.top};
}

const now = () => performance.now();

/**
 * useGesture(start, config, onDone, onChange) → {handlers, state, reset}
 *  - start: a Task 1 start function (startHold, startSwipe, startDrag, startPour,
 *    startDial, startTrack) or a custom {start, step, rearm?, sync?} recognizer.
 *  - onDone(done) is called once per completion.
 *  - onChange(next, prev) is called after every event that changed the state.
 */
export function useGesture(start, config = {}, onDone, onChange) {
  const rec = RECOGNIZERS.get(start) ?? start;
  const [state, setState] = useState(() => rec.start(config));
  const current = useRef(state);
  const latest = useRef({config, onDone, onChange});
  useEffect(() => { latest.current = {config, onDone, onChange}; });

  const dispatch = useCallback(event => {
    const {config: cfg, onDone: done, onChange: change} = latest.current;
    const prev = rec.sync ? rec.sync(current.current, cfg) : current.current;
    const next = rec.step(prev, event);
    if (next === prev) return false;
    const finished = !!next.done && next.done !== prev.done;
    current.current = finished && rec.rearm ? rec.start(cfg) : next;
    setState(current.current);
    change?.(next, prev);
    if (finished) done?.(next.done);
    return true;
  }, [rec]);

  const reset = useCallback(() => {
    current.current = rec.start(latest.current.config);
    setState(current.current);
  }, [rec]);

  const ticking = TICKING.has(state.phase);
  useEffect(() => {
    if (!ticking) return undefined;
    let id = requestAnimationFrame(function loop() {
      dispatch({type: 'tick', t: now()});
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [ticking, dispatch]);

  const pointer = type => e => {
    if (type === 'down') {
      if (e.button > 0) return;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* not capturable (synthetic event) */ }
    }
    const p = type === 'cancel' ? {} : toLocal(e);
    dispatch({type, ...p, t: now()});
  };
  const key = type => e => {
    // Consumed keys (state changed) do not also scroll the page or move focus.
    if (dispatch({type, key: keyName(e), t: now()}) && type === 'key-down') e.preventDefault();
  };

  const handlers = {
    onPointerDown: pointer('down'),
    onPointerMove: pointer('move'),
    onPointerUp: pointer('up'),
    onPointerCancel: pointer('cancel'),
    onKeyDown: key('key-down'),
    onKeyUp: key('key-up'),
    onBlur: () => dispatch({type: 'cancel', t: now()}),
  };
  return {handlers, state, reset};
}
