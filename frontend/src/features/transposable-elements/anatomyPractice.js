// Local teaching cases and transient practice only. No learner repository dependency.
function model(id, prefix, gapPrefix, prePrefix, target, hosts, ends, genes, reversed) {
  const direction = reversed ? 'leftward' : 'rightward';
  const blocks = [
    { label: `host context ${hosts[0]}`, kind: 'host' },
    { label: `${target}-${id === 'B' ? 'L' : 'a'}`, kind: 'repeat', mark: 'rightward repeat mark' },
    { label: `terminal ${ends[0]}`, kind: 'end', mark: 'rightward motif mark' },
    { label: genes[0], kind: 'gene', role: reversed ? 'accessory' : 'transposase', mark: `${direction} coding arrow` },
    { label: genes[1], kind: 'gene', role: reversed ? 'transposase' : 'accessory', mark: `${direction} coding arrow` },
    { label: `terminal ${ends[1]}`, kind: 'end', mark: 'leftward motif mark' },
    { label: `${target}-${id === 'B' ? 'R' : 'b'}`, kind: 'repeat', mark: 'rightward repeat mark' },
    { label: `host context ${hosts[1]}`, kind: 'host' },
  ].map((b, i) => ({ ...b, id: `${prefix}${i}` }));
  return { id, blocks, gapPrefix, prePrefix, target, hosts, direction,
    gaps: Array.from({ length: 9 }, (_, i) => [`${gapPrefix}${i}`, i === 0 ? `Before ${blocks[0].id} ${blocks[0].label}` : i === 8 ? `After ${blocks[7].id} ${blocks[7].label}` : `Between ${blocks[i - 1].id} ${blocks[i - 1].label} and ${blocks[i].id} ${blocks[i].label}`]),
    sources: [[`${prePrefix}0`, `${hosts[0]} — neighboring host context`], [`${prePrefix}1`, `${target} — target interval`], [`${prePrefix}2`, `${hosts[1]} — neighboring host context`], ['terminal', 'Element terminal region'], ['unknown', 'No source can be identified from the stated example']],
  };
}
export const cases = {
  B: model('B', 'B', 'g', 'J', 'q', ['H-L', 'H-R'], ['E-L', 'E-R'], ['T', 'C'], false),
  U: model('U', 'X', 'u', 'U', 'r', ['M', 'N'], ['K', 'L'], ['V', 'W'], true),
  U2: model('U2', 'Y', 'v', 'V', 's', ['P', 'Q'], ['D', 'E'], ['A', 'Z'], true),
};
export const functions = [['transposase', 'Encodes transposase / movement machinery'], ['accessory', 'Accessory function'], ['terminal', 'Terminal recognition DNA'], ['host', 'Host target repeat']];
export const directions = [['rightward', 'Rightward'], ['leftward', 'Leftward']];
export const counts = [['0', '0'], ['1', '1'], ['2', '2'], ['unknown', 'Cannot determine']];
export const reasons = [
  ['origin', 'The terminal regions and intervening genes define one element; both outer intervals trace to the single pre-insertion host interval. Coding arrows indicate direction separately from function.'],
  ['two', 'The two outer intervals are two elements, because each repeat is a complete transposon.'],
  ['reverse', 'The leftward coding arrows mean the host repeats must be inverted and the genes exchange functions.'],
  ['pathway', 'The pre/post drawing proves that this element used conservative excision and that its donor was repaired.'],
];
export function fieldsFor(section, c) {
  const boundaries = [{ key: 'left', label: 'Left boundary', options: c.gaps }, { key: 'right', label: 'Right boundary', options: c.gaps }];
  const genes = c.blocks.filter(b => b.kind === 'gene').flatMap((b, i) => [
    { key: `role${i}`, label: `${b.label} function`, options: functions },
    { key: `direction${i}`, label: `${b.label} coding direction`, options: directions },
  ]);
  const junction = [1, 6].map((i, n) => ({ key: `source${n}`, label: `${c.blocks[i].label} pre-insertion source`, options: c.sources }));
  junction.push({ key: 'count', label: 'Complete elements in the displayed post-insertion host molecule', options: counts });
  return section === 'boundaries' ? boundaries : section === 'genes' ? genes : section === 'junction' ? junction : [...boundaries, ...junction, ...genes, { key: 'reason', label: 'Reasoning statement', options: reasons }];
}
export function grade(section, a, c) {
  const fields = fieldsFor(section, c);
  const missing = fields.filter(f => !f.options.some(([value]) => value === a[f.key]));
  if (missing.length) return { valid: false, correct: false, diagnostics: missing.map(f => ({ key: f.key, ok: false, text: `Choose ${f.label.toLowerCase()} before checking.` })) };
  const diagnostics = [];
  const add = (key, ok, text) => diagnostics.push({ key, ok, text });
  if (section === 'boundaries' || section === 'fresh') {
    const left = c.gaps.findIndex(([id]) => id === a.left), right = c.gaps.findIndex(([id]) => id === a.right);
    add('left', left === 2, left >= right ? 'Order the boundary markers before interpreting the selected features.' : left === 2 ? 'Left boundary includes the first terminal region and excludes the host repeat.' : `Left boundary should be ${c.gapPrefix}2, before ${c.blocks[2].label}.`);
    add('right', right === 6, left >= right ? 'Order the boundary markers before interpreting the selected features.' : right === 6 ? 'Right boundary includes the last terminal region and excludes the host repeat.' : `Right boundary should be ${c.gapPrefix}6, after ${c.blocks[5].label}.`);
    if (left >= right) diagnostics.push({ key: 'left', ok: false, detail: true, text: left === right ? 'These markers enclose no blocks. Choose two different gaps around the element.' : 'The left marker is to the right of the right marker. Order the two markers in the host reference frame.' });
    else c.blocks.forEach((b, i) => {
      const included = i >= left && i < right, internal = i >= 2 && i <= 5;
      if (included && !internal) diagnostics.push({ key: i < 2 ? 'left' : 'right', ok: false, detail: true, text: `Your bracket includes ${b.id} ${b.label}, ${b.kind === 'host' ? 'host backbone' : 'a host-derived target repeat'} outside this element.` });
      if (!included && internal) diagnostics.push({ key: i < left ? 'left' : 'right', ok: false, detail: true, text: `Your bracket leaves out ${b.id} ${b.label}, ${b.kind === 'end' ? 'a terminal recognition region. Both ends belong inside this element.' : b.role === 'accessory' ? 'cargo. Cargo has a different function, but still belongs inside this element.' : 'the internal transposase coding region.'}` });
    });
  }
  if (section === 'genes' || section === 'fresh') c.blocks.filter(b => b.kind === 'gene').forEach((b, i) => {
    const role = a[`role${i}`];
    add(`role${i}`, role === b.role, role === b.role ? `${b.label}: ${b.role === 'accessory' ? 'accessory function' : 'encodes transposase / movement machinery'}.` : role === 'terminal' ? `${b.label} is a coding region here; ${c.blocks[2].label} and ${c.blocks[5].label} are terminal recognition DNA.` : role === 'host' ? `${b.label} lies inside the element; the outer repeats are host target DNA.` : `${b.label} is annotated as ${b.role === 'accessory' ? 'accessory cargo; its arrow does not make it transposase' : 'encoding transposase, the movement protein in this example'}.`);
    add(`direction${i}`, a[`direction${i}`] === c.direction, `${b.label} coding arrowhead points ${c.direction}. Read direction separately from function; direction does not guarantee expression.`);
  });
  if (section === 'junction' || section === 'fresh') {
    [1, 6].forEach((i, n) => {
      const source = a[`source${n}`];
      add(`source${n}`, source === `${c.prePrefix}1`, source === 'terminal' ? `The target before insertion contains ${c.target} but no element. ${c.blocks[i].label} has host-target origin.` : source === 'unknown' ? `This example explicitly pairs the same host locus and matching ${c.target} identities; both occurrences trace to ${c.prePrefix}1.` : `${c.blocks[i].label} traces to ${c.prePrefix}1 ${c.target}, one original host target interval. Neighboring host contexts are different intervals.`);
    });
    if (a.source0 !== a.source1) diagnostics.push({ key: 'source0', ok: false, detail: true, text: `Both repeat occurrences match the same pre-insertion interval, ${c.prePrefix}1. Two occurrences need not have different sources.` });
    add('count', a.count === '1', a.count === '0' ? 'The post-insertion map contains one pair of terminal regions with its internal genes.' : a.count === 'unknown' ? 'The displayed product has one fully annotated element. Other unshown molecules are outside this count.' : `Two host repeats flank one complete element, ${c.blocks[2].label} through ${c.blocks[5].label}. Count complete elements rather than repeat occurrences.`);
  }
  if (section === 'fresh') add('reason', a.reason === 'origin', a.reason === 'two' ? 'Repeat occurrences are not complete elements.' : a.reason === 'reverse' ? 'Distinguish the fixed host frame, motif orientation, gene function and coding direction; the host repeats remain direct.' : a.reason === 'pathway' ? 'These panels show anatomy and stated source relationships; they do not establish an excision pathway or donor repair.' : 'Terminal regions and intervening genes define one element; outer repeats share host origin. Function and coding direction are separate claims.');
  return { valid: true, correct: diagnostics.every(d => d.ok), diagnostics };
}
const draft = () => ({ answers: {}, hints: 0, result: null });
export const initialPractice = () => ({ panel: 'boundaries', fresh: 'U', seen: ['U'], supported: {}, drafts: { boundaries: draft(), genes: draft(), junction: draft(), U: draft(), U2: draft() } });
export function practiceReducer(state, action) {
  const key = state.panel === 'fresh' ? state.fresh : state.panel;
  const current = state.drafts[key];
  const update = value => ({ ...state, drafts: { ...state.drafts, [key]: value } });
  if (action.type === 'panel') return { ...state, panel: action.panel };
  if (action.type === 'edit') return update({ ...current, answers: { ...current.answers, [action.key]: action.value }, result: null });
  if (action.type === 'hint') return { ...update({ ...current, hints: Math.min(3, current.hints + 1), result: null }), supported: { ...state.supported, [key]: true } };
  if (action.type === 'check') {
    const result = grade(state.panel, current.answers, cases[state.panel === 'fresh' ? state.fresh : 'B']);
    const independent = state.panel === 'fresh' && result.valid && result.correct && !state.supported[key];
    return { ...update({ ...current, result: { ...result, independent } }), supported: { ...state.supported, [key]: state.supported[key] || result.valid } };
  }
  if (action.type === 'clear') return { ...state, drafts: Object.fromEntries(Object.keys(state.drafts).map(k => [k, draft()])) };
  if (action.type === 'next') {
    const next = state.fresh === 'U' ? 'U2' : 'U';
    return { ...state, fresh: next, seen: [...new Set([...state.seen, next])], supported: { ...state.supported, [next]: state.supported[next] || state.seen.includes(next) }, drafts: { ...state.drafts, [next]: draft() } };
  }
  return state;
}
