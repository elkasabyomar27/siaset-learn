// Gesture -> model-input mapping for MobileElementBuilder. The outputs are the three edits the old
// buttons made: add(kind) (gated by canAdd), remove(i), and move(i, ±1). A drag within the track is
// a `reorder`, which applies as the same adjacent moves the arrow buttons made.
import { canAdd } from '../../mobileElementBuilder.js';

// track: the current track (array of kinds)
export function elementBuilderIntent(g, track = []) {
  if (!g || g.kind !== 'drop') return null;
  if (g.source === 'bin') return g.target === 'rail' && canAdd(track, g.part) ? {type: 'add', kind: g.part} : null;
  if (g.source !== 'tile' || !Number.isInteger(g.index) || g.index < 0 || g.index >= track.length) return null;
  if (g.target === 'off') return {type: 'remove', index: g.index};
  if (g.target === 'slot' && Number.isInteger(g.slot) && g.slot >= 0 && g.slot < track.length && g.slot !== g.index) return {type: 'reorder', from: g.index, to: g.slot};
  return null;
}

// One adjacent swap: the old ‹ and › buttons.
export function moveOne(track, i, d) {
  const j = i + d;
  if (j < 0 || j >= track.length) return track;
  const next = [...track];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** The new track after an action (a pure function of the old track, like the old functional updates). */
export function applyBuilderAction(track, a) {
  if (!a) return track;
  if (a.type === 'add') return canAdd(track, a.kind) ? [...track, a.kind] : track;
  if (a.type === 'remove') return track.filter((_, n) => n !== a.index);
  if (a.type === 'reorder') {
    let t = track;
    const d = a.to > a.from ? 1 : -1;
    for (let i = a.from; i !== a.to; i += d) t = moveOne(t, i, d);
    return t;
  }
  return track;
}
