import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { cases, fieldsFor, grade, initialPractice, practiceReducer as reduce } from '../anatomyPractice.js';
import { createProgressRepository, OP_PREFIX } from '../progressRepository.js';
import { STORAGE_KEY, isComplete } from '../lessonProgress.js';

const answer = c => ({ left: `${c.gapPrefix}2`, right: `${c.gapPrefix}6`, role0: c.id === 'B' ? 'transposase' : 'accessory', role1: c.id === 'B' ? 'accessory' : 'transposase', direction0: c.direction, direction1: c.direction, source0: `${c.prePrefix}1`, source1: `${c.prePrefix}1`, count: '1', reason: 'origin' });
function fill(state, values) {
  for (const [key, value] of Object.entries(values)) state = reduce(state, { type: 'edit', key, value });
  return state;
}

test('all 81 brackets use semantic endpoints, with exhaustive inclusion/exclusion diagnostics', () => {
  for (let left = 0; left <= 8; left++) for (let right = 0; right <= 8; right++) {
    const result = grade('boundaries', { left: `g${left}`, right: `g${right}` }, cases.B);
    assert.equal(result.valid, true);
    assert.equal(result.correct, left === 2 && right === 6, `${left}/${right}`);
    const text = result.diagnostics.map(d => d.text).join(' ');
    if (left === right) assert.match(text, /enclose no blocks/);
    else if (left > right) assert.match(text, /left marker is to the right/);
    else for (let i = 0; i < 8; i++) {
      const selected = i >= left && i < right, internal = i >= 2 && i <= 5;
      if (selected !== internal) assert.ok(result.diagnostics.some(d => d.detail && d.text.includes(`B${i}`)), `${left}/${right}: B${i}`);
    }
  }
  assert.equal(grade('boundaries', {}, cases.B).valid, false);
  assert.equal(grade('boundaries', { left: 'g99', right: 'g6' }, cases.B).valid, false);
});

test('gene function and direction grade separately, and source mapping permits a shared source', () => {
  const a = answer(cases.B);
  assert.equal(grade('genes', a, cases.B).correct, true);
  const wrongDirection = grade('genes', { ...a, direction0: 'leftward' }, cases.B);
  assert.equal(wrongDirection.diagnostics.find(d => d.key === 'role0').ok, true);
  assert.equal(wrongDirection.diagnostics.find(d => d.key === 'direction0').ok, false);
  for (const role of ['accessory', 'terminal', 'host']) assert.equal(grade('genes', { ...a, role0: role }, cases.B).correct, false);
  assert.equal(grade('junction', a, cases.B).correct, true);
  for (const source of ['J0', 'J2', 'terminal', 'unknown']) assert.equal(grade('junction', { ...a, source0: source }, cases.B).correct, false);
  for (const count of ['0', '2', 'unknown']) assert.equal(grade('junction', { ...a, count }, cases.B).correct, false);
});

test('both reversed cases require all ten criteria and retain direct host marks', () => {
  for (const c of [cases.U, cases.U2]) {
    const a = answer(c), result = grade('fresh', a, c);
    assert.equal(result.correct, true);
    assert.equal(result.diagnostics.filter(d => !d.detail).length, 10);
    assert.equal(c.blocks[1].mark, 'rightward repeat mark');
    assert.equal(c.blocks[6].mark, 'rightward repeat mark');
    assert.equal(c.blocks[3].role, 'accessory');
    assert.equal(c.blocks[4].role, 'transposase');
    for (const field of fieldsFor('fresh', c)) {
      const other = field.options.find(([value]) => value !== a[field.key])[0];
      assert.equal(grade('fresh', { ...a, [field.key]: other }, c).correct, false, field.key);
      assert.equal(grade('fresh', { ...a, [field.key]: '' }, c).valid, false, field.key);
    }
  }
});

test('missing fields consume no attempt; edits clear verdict; hints, graded retries and clears retain support history', () => {
  let s = reduce(initialPractice(), { type: 'panel', panel: 'fresh' });
  s = reduce(s, { type: 'check' });
  assert.equal(s.supported.U, false);
  s = fill(s, answer(cases.U));
  s = reduce(s, { type: 'check' });
  assert.equal(s.drafts.U.result.independent, true);
  s = reduce(s, { type: 'edit', key: 'count', value: '2' });
  assert.equal(s.drafts.U.result, null);
  s = reduce(s, { type: 'clear' });
  s = reduce(fill(s, answer(cases.U)), { type: 'check' });
  assert.equal(s.drafts.U.result.independent, false);
  s = reduce(s, { type: 'next' });
  assert.deepEqual(s.drafts.U2.answers, {});
  s = reduce(s, { type: 'hint' });
  s = reduce(s, { type: 'clear' });
  s = reduce(fill(s, answer(cases.U2)), { type: 'check' });
  assert.equal(s.drafts.U2.result.independent, false);
  s = reduce(s, { type: 'next' });
  assert.equal(s.supported.U, true);
  assert.deepEqual(s.drafts.U.answers, {});
  s = reduce(s, { type: 'next' });
  assert.equal(s.supported.U2, true);
});

test('panel changes retain drafts; complete wrong submission makes a corrected case supported', () => {
  let s = fill(initialPractice(), { left: 'g1' });
  s = reduce(s, { type: 'hint' });
  s = reduce(s, { type: 'panel', panel: 'fresh' });
  s = reduce(fill(s, { ...answer(cases.U), count: '2' }), { type: 'check' });
  assert.equal(s.drafts.U.result.correct, false);
  s = reduce(fill(s, { count: '1' }), { type: 'check' });
  assert.equal(s.drafts.U.result.independent, false);
  s = reduce(s, { type: 'panel', panel: 'boundaries' });
  assert.equal(s.drafts.boundaries.answers.left, 'g1');
  assert.equal(s.drafts.boundaries.hints, 1);
});

test('returning legacy evidence, all practice actions, reset and remote updates keep separate state and storage contracts', () => {
  const legacy = JSON.stringify({ version: 1, records: { anatomy: { inspected: [0, 2], exercise: 1 } } });
  const data = new Map([[STORAGE_KEY, legacy]]), handlers = new Map();
  let writes = 0, id = 0;
  const storage = { get length() { return data.size; }, key: i => [...data.keys()][i], getItem: k => data.get(k) ?? null, setItem(k, v) { writes++; data.set(k, v); } };
  const repo = createProgressRepository({ storage: () => storage, events: { addEventListener: (k, f) => handlers.set(k, f), removeEventListener: k => handlers.delete(k) }, makeId: () => `local-${++id}` });
  const unsub = repo.subscribe(() => {});
  const snapshot = repo.getSnapshot();
  let s = initialPractice();
  for (const panel of ['boundaries', 'genes', 'junction', 'fresh']) {
    s = reduce(s, { type: 'panel', panel });
    s = reduce(fill(s, answer(cases[panel === 'fresh' ? 'U' : 'B'])), { type: 'check' });
    s = reduce(s, { type: 'hint' });
  }
  assert.equal(writes, 0);
  assert.strictEqual(repo.getSnapshot(), snapshot);
  assert.equal(isComplete('anatomy', snapshot.progress.anatomy), false);
  const draftBefore = structuredClone(s);
  const remote = { version: 1, id: 'remote', clock: 1, type: 'resetLesson', lessonId: 'anatomy' };
  data.set(OP_PREFIX + remote.id, JSON.stringify(remote));
  handlers.get('storage')({ key: OP_PREFIX + remote.id });
  assert.equal(repo.getSnapshot().progress.anatomy, undefined);
  assert.deepEqual(s, draftBefore);
  repo.recordLesson('anatomy', 'check', 1);
  assert.equal(repo.getSnapshot().progress.anatomy.check, 1);
  repo.resetLesson('anatomy');
  s = reduce(s, { type: 'clear' });
  assert.deepEqual(s.drafts.U.answers, {});
  assert.equal(s.supported.U, true);
  assert.equal(repo.getSnapshot().progress.anatomy, undefined);
  assert.equal(data.get(STORAGE_KEY), legacy);
  assert.deepEqual(initialPractice().drafts.boundaries.answers, {}); // remount / reload
  assert.equal(writes, 2); // only the two canonical actions
  unsub();
});

let server;
before(async () => { server = await createServer({ root: fileURLToPath(new URL('../../../../', import.meta.url)), server: { middlewareMode: true, hmr: false }, appType: 'custom' }); });
after(async () => { await server?.close(); });
test('molecular glyphs preserve all case identities, directions and equivalent inventories', async () => {
  const { MapFigure, FeatureGlyph } = await server.ssrLoadModule('/src/features/transposable-elements/components/AnatomyWorkbench.jsx');
  for (const c of Object.values(cases)) {
    const html = renderToStaticMarkup(createElement(MapFigure, { c, answers: {}, showBracket: true, id: `test-${c.id}` }));
    assert.equal((html.match(/<svg /g) || []).length, 8);
    assert.equal((html.match(/aria-hidden="true" focusable="false"/g) || []).length, 8);
    assert.doesNotMatch(html, /class="[^"]* bracketed/);
    for (const b of c.blocks) assert.ok(html.includes(`${b.id} ${b.label}`));
    for (const b of c.blocks.filter(b => b.kind === 'gene')) {
      const glyph = renderToStaticMarkup(createElement(FeatureGlyph, { block: b }));
      assert.ok(glyph.includes(`>${b.label}</text>`));
      assert.ok(glyph.includes(c.direction === 'leftward' ? 'M18 32 L39 12' : 'M18 12 H81'));
    }
    const repeats = c.blocks.filter(b => b.kind === 'repeat').map(block => renderToStaticMarkup(createElement(FeatureGlyph, { block })));
    assert.equal(repeats[0], repeats[1]);
    assert.ok(repeats[0].includes('M70 23 L80 32 L70 41'));
    const bracket = renderToStaticMarkup(createElement(MapFigure, { c, answers: { left: `${c.gapPrefix}2`, right: `${c.gapPrefix}6` }, showBracket: true, id: `bracket-${c.id}` }));
    assert.equal((bracket.match(/<span>Inside your bracket/g) || []).length, 4);
    assert.equal((bracket.match(/<span>Outside your bracket/g) || []).length, 4);
    assert.equal((bracket.match(/Inside your bracket\."/g) || []).length, 4);
    assert.equal((bracket.match(/Outside your bracket\."/g) || []).length, 4);
  }
});
test('rendered entry has native named controls, equivalent text, draft limits and original evidence paths', async () => {
  const { default: Workbench } = await server.ssrLoadModule('/src/features/transposable-elements/components/AnatomyWorkbench.jsx');
  const html = renderToStaticMarkup(createElement(Workbench));
  assert.match(html, /Educational draft model/);
  assert.match(html, /scientific approval pending/);
  assert.match(html, /Text equivalent and teaching legend/);
  assert.match(html, /<select id="anatomy-boundaries-B-left"/);
  assert.match(html, /<label for="anatomy-boundaries-B-right"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /Skip to required questions/);
  assert.equal((html.match(/<select /g) || []).length, 2);
  const component = readFileSync(new URL('../components/AnatomyWorkbench.jsx', import.meta.url), 'utf8');
  const model = readFileSync(new URL('../anatomyPractice.js', import.meta.url), 'utf8');
  for (const source of [component, model]) assert.doesNotMatch(source, /progressRepository|localStorage|sessionStorage|recordLesson|resetLesson/);
  const lessons = readFileSync(new URL('../Lessons.jsx', import.meta.url), 'utf8');
  assert.match(lessons, /lesson.id === 'anatomy'/);
  assert.match(lessons, /progressRepository.resetLesson\(lesson.id\); practice.current\?\.clear\(\)/);
  assert.match(lessons, /onInspect={i => record\('inspect', i\)}/);
});


test('polished canvas exposes every supplied clue by keyboard name and a complete native text disclosure', async () => {
  const { MapFigure, featureDescription } = await server.ssrLoadModule('/src/features/transposable-elements/components/AnatomyWorkbench.jsx');
  for (const c of Object.values(cases)) {
    const html = renderToStaticMarkup(createElement(MapFigure, { c, answers: {}, showBracket: true, id: `polish-${c.id}` }));
    assert.equal((html.match(/aria-pressed="false"/g) || []).length, 8);
    for (const b of c.blocks) {
      assert.ok(html.includes(`aria-label="${b.id} ${b.label}: ${featureDescription(b, c)}`));
    }
    assert.match(html, /<details class="anatomy-text"[^>]*><summary>Read diagram as text/);
    assert.match(html, /<details class="anatomy-science"><summary>Scientific details/);
    assert.doesNotMatch(html, /<details[^>]* open/);
    assert.match(html, /Shape key:/);
    assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
  }
});
