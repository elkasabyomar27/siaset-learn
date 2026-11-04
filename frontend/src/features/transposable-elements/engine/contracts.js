export const SCHEMA_VERSION = 1;
export class ScientificError extends Error {
  constructor(code, message) { super(message); this.name = 'ScientificError'; this.code = code; }
}
export function requireCondition(ok, code, message) {
  if (!ok) throw new ScientificError(code, message);
}
export const clone = value => structuredClone(value);
export function boundary(value, length, topology) {
  requireCondition(Number.isInteger(length) && length > 0, 'LENGTH', 'Length must be a positive integer.');
  requireCondition(Number.isInteger(value) && value >= 0 && value <= length, 'BOUNDARY', 'Boundary is outside the molecule.');
  return topology === 'circular' && value === length ? 0 : value;
}
export function intervalSegments(start, size, length, topology) {
  start = boundary(start, length, topology);
  requireCondition(Number.isInteger(size) && size > 0 && size <= length, 'INTERVAL', 'Feature size must be positive and no longer than the molecule.');
  requireCondition(topology === 'circular' || start + size <= length, 'INTERVAL', 'Linear features cannot cross an end.');
  return start + size <= length ? [[start, start + size]] : [[start, length], [0, start + size - length]];
}
export function studentLabels(segments) { return segments.map(([start, end]) => `${start + 1}–${end}`).join(', '); }
export function validateFeature(feature, length) {
  requireCondition(typeof feature.id === 'string' && feature.id.length > 0, 'FEATURE_ID', 'Features need stable IDs.');
  requireCondition([1, -1].includes(feature.orientation), 'ORIENTATION', 'Orientation must be +1 or −1.');
  requireCondition(Array.isArray(feature.segments) && feature.segments.length > 0, 'SEGMENTS', 'Feature segments are required.');
  const intervals = feature.segments;
  for (const [start, end] of intervals) requireCondition(Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start && end <= length, 'SEGMENTS', 'Invalid half-open interval.');
  for (let i = 0; i < intervals.length; i++) for (let j = i + 1; j < intervals.length; j++) requireCondition(Math.max(intervals[i][0], intervals[j][0]) >= Math.min(intervals[i][1], intervals[j][1]), 'SEGMENTS', 'Segments of one feature may not overlap.');
}
export function validateEvent(event) {
  requireCondition(event?.schemaVersion === SCHEMA_VERSION && Number.isInteger(event.fromRevision) && event.toRevision === event.fromRevision + 1, 'EVENT_VERSION', 'Invalid event version.');
  requireCondition(typeof event.id === 'string' && typeof event.type === 'string' && typeof event.action?.type === 'string' && typeof event.before === 'string' && typeof event.after === 'string' && Array.isArray(event.references) && event.references.length > 0, 'EVENT_SCHEMA', 'Incomplete scientific event.');
  return true;
}
