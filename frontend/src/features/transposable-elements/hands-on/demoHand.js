import {DEMO_IDLE_MS} from './gestures/index.js';

// Pure policy for the "ghost hand" that demonstrates a gesture.
// State: {seen:Set<kind>, idleSince, dragging, reducedMotion, kind, show, still}.
export const initialDemo = ({reducedMotion = false} = {}) => ({
  seen: new Set(), idleSince: 0, dragging: false, reducedMotion, kind: null, show: null, still: reducedMotion,
});

const finish = s => ({...s, show: s.dragging ? null : s.show, still: !!s.reducedMotion});

// Show the hand for `kind` for the first time (marks it seen).
const reveal = (s, kind, t) => ({...s, kind, show: kind, idleSince: t ?? s.idleSince, seen: new Set(s.seen).add(kind)});

export function demoHand(state, event) {
  const s = {...initialDemo(), ...state};
  switch (event.type) {
    case 'need': {
      const next = {...s, kind: event.kind};
      if (s.dragging) return finish({...next, show: null});
      if (!s.seen.has(event.kind)) return finish(reveal(next, event.kind, event.t));
      // Seen kind: a step change hides the old demo and restarts the idle clock.
      if (event.kind !== s.kind) return finish({...next, show: null, idleSince: event.t});
      return finish(next);
    }
    case 'activity':
      return finish({...s, idleSince: event.t, show: null});
    case 'drag': {
      if (event.active) return finish({...s, dragging: true, show: null});
      // Drag ended: idle timing restarts from the next timestamped event.
      const ended = {...s, dragging: false, show: null, idleSince: null};
      return finish(ended.kind && !ended.seen.has(ended.kind) ? reveal(ended, ended.kind) : ended);
    }
    case 'tick': {
      if (s.dragging || !s.kind) return finish(s);
      if (s.idleSince == null) return finish({...s, idleSince: event.t});
      if (!s.show && event.t - s.idleSince >= DEMO_IDLE_MS) return finish({...s, show: s.kind});
      return finish(s);
    }
    default:
      return finish(s);
  }
}
