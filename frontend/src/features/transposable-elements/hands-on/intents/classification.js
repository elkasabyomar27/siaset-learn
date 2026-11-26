// Gesture -> model-input mapping for ClassificationSort: a card dropped on cell `${cls}-${copies}`
// is exactly what the old select-then-click flow passed to checkPlacement(card, cls, copies).
// Wrong drops are accepted too: the model answers them with its hint.
const CELL = /^(I|II)-(increase|same)$/;

export const cellId = (cls, copies) => `${cls}-${copies}`;

export function classificationIntent(g) {
  if (!g || g.kind !== 'drop' || !g.card) return null;
  const m = CELL.exec(g.target ?? '');
  return m ? {card: g.card, cls: m[1], copies: m[2]} : null;
}
