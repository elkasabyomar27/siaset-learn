import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { createServer } from 'vite';
import topics from '../curriculum/topics.json' with { type: 'json' };
import { topicHref, lessons } from '../curriculum/lessons.js';
import { journeyGroups, journeyStops, focusJourneyTarget } from '../journey.js';
import { createProgressRepository } from '../progressRepository.js';
import { STORAGE_KEY } from '../lessonProgress.js';

let server, JourneyMap;
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../../../../', import.meta.url)), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ JourneyMap } = await server.ssrLoadModule('/src/features/transposable-elements/Curriculum.jsx'));
});
after(async () => { await server?.close(); });
const render = (props = {}, route = '/learn/transposable-elements') => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [route] }, createElement(JourneyMap, { progress: {}, labs: {}, pathname: route, ...props })));

test('five stable-ID groups partition all fifteen topics in original order with canonical lab queries', () => {
  assert.deepEqual(journeyGroups.map(g => g.topics.length), [4, 3, 2, 4, 2]);
  assert.deepEqual(journeyGroups.flatMap(g => g.topics), topics.map(t => t.id));
  const stops = journeyStops({}, {}, '/learn/transposable-elements');
  assert.deepEqual(stops.map(s => s.href), topics.map(topicHref));
  assert.equal(stops[5].href, '/lab/transposable-elements?experiment=tn5');
  assert.equal(stops[6].href, '/lab/transposable-elements?experiment=tn3');
  assert.ok(stops.every(s => !s.completed && !s.current));
});

test('each canonical destination identifies exactly one current stop independently of completion', () => {
  for (const topic of topics) {
    const url = new URL(topicHref(topic), 'http://local');
    const stops = journeyStops({}, {}, url.pathname, url.search);
    assert.deepEqual(stops.filter(s => s.current).map(s => s.id), [topic.id]);
    assert.ok(stops.every(s => !s.completed));
  }
  for (const query of ['', '?experiment=invalid', '?experiment=tn5']) assert.equal(journeyStops({}, {}, '/lab/transposable-elements/', query).find(s => s.current).id, 'conservative');
  assert.equal(journeyStops({}, {}, '/lab/transposable-elements', '?experiment=tn3&extra=1').find(s => s.current).id, 'replicative');
  for (const path of ['/', '/lab/transposable-elements/sandbox', '/learn/transposable-elements/assessment', '/learn/transposable-elements/progress']) assert.ok(journeyStops({}, {}, path).every(s => !s.current));
});

test('browsing, rendering both views and group focus leave legacy evidence and storage untouched', () => {
  const lesson = lessons.find(l => l.id === 'anatomy');
  const progress = { anatomy: { inspected: [0, 2], exercise: lesson.exercise.correct } };
  const raw = JSON.stringify({ version: 1, records: progress });
  const values = new Map([[STORAGE_KEY, raw]]); let writes = 0;
  const storage = { get length() { return values.size; }, key: i => [...values.keys()][i], getItem: k => values.get(k) ?? null, setItem: () => { writes++; } };
  const repo = createProgressRepository({ storage: () => storage });
  const snapshot = repo.getSnapshot();
  for (const topic of topics) {
    const url = new URL(topicHref(topic), 'http://local');
    for (const initialView of ['journey', 'list']) render({ ...snapshot, initialView, pathname: url.pathname, search: url.search });
  }
  for (const group of journeyGroups) focusJourneyTarget({ currentTarget: { hash: `#journey-${group.id}`, ownerDocument: { getElementById: () => ({ focus() {} }) } } });
  assert.equal(writes, 0);
  assert.equal(values.get(STORAGE_KEY), raw);
  assert.deepEqual(repo.getSnapshot().progress, progress);
  assert.ok(journeyStops(snapshot.progress, snapshot.labs, '/learn/transposable-elements/anatomy').every(s => !s.completed));
  const complete = { anatomy: { inspected: [0, 1, 2], exercise: lesson.exercise.correct, check: lesson.check.correct } };
  const stops = journeyStops(complete, { tn5: {} }, '/learn/transposable-elements/anatomy');
  assert.deepEqual(stops.filter(s => s.completed).map(s => s.id), ['anatomy', 'conservative']);
  assert.ok(journeyStops({}, {}, '/learn/transposable-elements/anatomy').every(s => !s.completed));
});

test('map and flat list have identical ordered, unlocked links, names, status and accessible controls', () => {
  for (const initialView of ['journey', 'list']) {
    const html = render({ initialView, pathname: '/learn/transposable-elements/anatomy' });
    const hrefs = [...html.matchAll(/class="journey-stop[^"]*"[^>]*href="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(hrefs, topics.map(topicHref));
    assert.equal((html.match(/Official completion: Incomplete/g) || []).length, 15);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert.equal((html.match(/class="journey-current"/g) || []).length, 1);
    assert.equal((html.match(/aria-hidden="true" focusable="false"/g) || []).length, 5);
    assert.match(html, /<fieldset><legend>Navigation view/);
    assert.match(html, /type="radio" name="journey-view"/);
    assert.doesNotMatch(html, /aria-disabled|disabled="|tabindex="0"/);
    assert.match(html, /navigation metaphor/);
    for (const group of journeyGroups) {
      assert.ok(html.includes(`href="#journey-${group.id}"`));
      assert.ok(html.includes(`id="journey-${group.id}" tabindex="-1"`));
    }
  }
});

test('native group jumps move focus without suppressing anchor behavior or starting motion', () => {
  let focused;
  focusJourneyTarget({ currentTarget: { hash: '#journey-context', ownerDocument: { getElementById(id) { assert.equal(id, 'journey-context'); return { focus: options => { focused = options; } }; } } } });
  assert.deepEqual(focused, { preventScroll: true });
});

test('recorded completion and current location remain separate in rendered text after record changes', () => {
  const lesson = lessons.find(l => l.id === 'anatomy');
  const progress = { anatomy: { inspected: [0, 1, 2], exercise: lesson.exercise.correct, check: lesson.check.correct } };
  const complete = render({ progress, labs: { tn5: {} }, pathname: '/lab/transposable-elements', search: '?experiment=tn3' });
  assert.equal((complete.match(/Official completion: Completed/g) || []).length, 2);
  assert.match(complete, /2 \/ 15/);
  assert.match(complete, /Incomplete · guided review not recorded<\/span><span class="journey-current">Current location/);
  assert.equal((complete.match(/role="list"/g) || []).length, 5);
  const afterReset = render({ pathname: '/lab/transposable-elements', search: '?experiment=tn3' });
  assert.equal((afterReset.match(/Official completion: Completed/g) || []).length, 0);
  assert.equal((afterReset.match(/class="journey-current"/g) || []).length, 1);
});

test('responsive and reduced-motion rules flatten links and remove decorative motion', () => {
  const css = readFileSync(new URL('../journey.css', import.meta.url), 'utf8');
  assert.match(css, /@media\(max-width:700px\).*journey-track li\{width:100%\}/s);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\).*transition:none!important;animation:none!important/s);
  assert.match(css, /min-height:44px/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(css, /@keyframes|perspective:|(?<!-)transform:|scroll-behavior:smooth/);
  const source = readFileSync(new URL('../Curriculum.jsx', import.meta.url), 'utf8') + readFileSync(new URL('../journey.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|progressRepository|recordLesson|recordLab|setInterval|requestAnimationFrame/);
});

test('concept previews reuse existing objectives in both views and regions retain named landmarks', () => {
  for (const initialView of ['journey', 'list']) {
    const html = render({ initialView });
    assert.equal((html.match(/class="journey-preview"/g) || []).length, 15);
    for (const topic of topics) assert.ok(html.includes(topic.learningObjectives[0]));
    for (const group of journeyGroups) assert.ok(html.includes(`journey-region-${group.id}`));
    assert.match(html, /scientific approval pending/);
    assert.match(html, /navigation, not a reaction mechanism/);
  }
});



test('compact navigation retains optional previews without adding nested link controls', () => {
  for (const initialView of ['journey', 'list']) {
    const html = render({ initialView });
    assert.equal((html.match(/class="journey-preview" hidden=""/g) || []).length, 15);
    assert.match(html, /type="checkbox"/);
    assert.match(html, /Show concept previews/);
    assert.match(html, /<details class="journey-model-note"><summary>About this pathway/);
    assert.doesNotMatch(html, /<details[^>]* open/);
    const links = [...html.matchAll(/<a class="journey-stop[^]*?<\/a>/g)].map(m => m[0]);
    assert.equal(links.length, 15);
    for (const link of links) assert.doesNotMatch(link, /<button|<input|<summary/);
  }
});
