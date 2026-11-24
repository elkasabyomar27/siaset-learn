import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';

let server, picker, dashboard, results, student;
before(async () => {
  server = await createServer({root: fileURLToPath(new URL('../../../../', import.meta.url)), server: {middlewareMode: true, hmr: false}, appType: 'custom'});
  picker = await server.ssrLoadModule('/src/classroom/StationPicker.jsx');
  dashboard = await server.ssrLoadModule('/src/classroom/StationDashboard.jsx');
  results = await server.ssrLoadModule('/src/classroom/stationResults.js');
  student = await server.ssrLoadModule('/src/classroom/MyClasses.jsx');
});
after(async () => { await server?.close(); });

const html = element => renderToStaticMarkup(createElement(MemoryRouter, null, element));
const inspect = (id, lessonId, value) => ({version: 1, id, clock: Number(id.slice(1)), type: 'lesson', lessonId, kind: 'inspect', value});
function view(load, rows = [], submissions = []) {
  const topics = results.assignedTopics(['conservative', 'tsd']);
  const built = results.buildResults(rows, topics);
  return html(createElement(dashboard.StationDashboardView, {load, topics, results: built, totals: results.stationTotals(built, topics), submissions, joinCode: 'ABC234', onRefresh() {}}));
}
const fixture = [
  {user_id: 'u1', display_name: 'Amira', ops: [inspect('o1', 'tsd', 0)]},
  {user_id: 'u2', display_name: 'Ben', ops: []},
];

test('picker lists every station by field and module with selected chips', () => {
  const out = html(createElement(picker.default, {value: ['tsd', 'conservative'], onChange() {}}));
  assert.match(out, /aria-label="Search stations"/);
  assert.match(out, /<legend>Genetics · Transposable Elements<\/legend>/);
  assert.match(out, /<legend>Molecular Biology · DNA Extraction &amp; Purification<\/legend>/);
  assert.match(out, /13 · Target-Site Duplication/);
  assert.equal((out.match(/type="checkbox"/g) || []).length, 18);
  assert.equal((out.match(/checked=""/g) || []).length, 2);
  assert.ok(out.indexOf('Remove 13') < out.indexOf('Remove 06'), 'chips keep the chosen order');
});

test('dashboard lists every student and assigned station', () => {
  const out = view('ready', fixture);
  assert.match(out, /<th[^>]*>06/);
  assert.match(out, /<th[^>]*>13/);
  assert.match(out, />Amira</);
  assert.match(out, />Ben</);
});

test('status labels', () => {
  const out = view('ready', fixture);
  assert.match(out, /Not started/);
  assert.match(out, /1\/\d+ views/);
});

test('headline counts stations only', () => {
  const out = view('ready', fixture, [{user_id: 'u1', file_name: 'a.pdf'}, {user_id: 'u2', file_name: 'b.pdf'}]);
  assert.match(out, /0 of 2 complete/);
  assert.match(out, /File/);
});

test('loading', () => {
  const out = view('loading');
  assert.match(out, /aria-busy="true"/);
  assert.match(out, /Loading progress…/);
});

test('empty class', () => {
  const out = view('ready', []);
  assert.match(out, /No students yet/);
  assert.match(out, /ABC234/);
});

test('rpc error', () => {
  const out = view('error');
  assert.match(out, /Couldn’t load progress/);
  assert.match(out, />Try again</);
});

test('cells are buttons with accessible names', () => {
  const out = view('ready', fixture);
  assert.match(out, /<button[^>]*aria-label="Amira, 13 Target-Site Duplication: In progress"/);
});

const card = stations => html(createElement(student.AssignedStations, {stations, progress: {}, labs: {}}));

test('student card lists assigned stations with own status and links', () => {
  const out = card(['tsd']);
  assert.match(out, /13 · Target-Site Duplication/);
  assert.match(out, />New</);
  assert.match(out, /href="\/learn\/transposable-elements\/tsd"/);
});

test('privacy line', () => {
  assert.ok(card(['tsd']).includes('Your teacher can see your progress and answers on these stations.'));
});

test('file-only assignment', () => {
  const out = card([]);
  assert.equal(out, '');
});
