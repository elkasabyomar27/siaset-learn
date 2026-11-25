// Event vocabulary shared by every recognizer. Recognizers are pure reducers:
// no React, no DOM, no timers. Time comes only from event.t (milliseconds).
//   {type:'down'|'move'|'up'|'cancel', x, y, t}
//   {type:'key-down'|'key-up', key, t}      (Shift+Tab etc. arrive as 'Shift+Tab')
//   {type:'tick', t}
export const isPointer = e => e.type === 'down' || e.type === 'move' || e.type === 'up' || e.type === 'cancel';
export const isKeyDown = (e, ...keys) => e.type === 'key-down' && keys.includes(e.key);
