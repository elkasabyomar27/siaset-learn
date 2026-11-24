import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import topics from '../curriculum/topics.json' with {type: 'json'};
let server, routePresentation;
before(async () => {
  server = await createServer({root: fileURLToPath(new URL('../../../../', import.meta.url)), server: {middlewareMode: true, hmr: false}, appType: 'custom'});
  ({routePresentation} = await server.ssrLoadModule('/src/features/transposable-elements/routePresentation.js'));
});
after(async () => { await server?.close(); });

test('route titles and navigation distinguish lessons, tools, fallback routes and URL-selected experiments', () => {
  for (const topic of topics.filter(t => t.lessonId)) {
    const page = routePresentation(`/learn/transposable-elements/${topic.id}`);
    assert.equal(page.title, `${topic.title} — Lesson ${topic.order}`);
    assert.equal(page.section, 'curriculum');
  }
  const lab = '/lab/transposable-elements';
  assert.match(routePresentation(lab).title, /Tn5 conservative/);
  assert.match(routePresentation(lab, '?experiment=tn3').title, /Tn3 replicative/);
  assert.equal(routePresentation(lab, '?experiment=invalid').identity, routePresentation(lab).identity);
  assert.equal(routePresentation(lab, '?experiment=tn3&unrelated=1').identity, routePresentation(lab, '?experiment=tn3').identity);
  assert.deepEqual(routePresentation(`${lab}/`, '?experiment=tn3'), routePresentation(lab, '?experiment=tn3'));
  assert.equal(routePresentation('/missing').title, 'Page not found');
  assert.equal(routePresentation('/learn/transposable-elements/missing').section, null);
});

test('the lab header is the single navigation and marks exactly one current destination per route', async () => {
  const {default: WorkspaceShell} = await server.ssrLoadModule('/src/ui/WorkspaceShell.jsx');
  const {AuthProvider} = await server.ssrLoadModule('/src/auth/AuthProvider.jsx');
  const render = path => renderToStaticMarkup(createElement(MemoryRouter, {initialEntries: [path]}, createElement(AuthProvider, null, createElement(WorkspaceShell, null, 'page'))));
  for (const [path, label] of [
    ['/lab', 'Lab room'],
    ['/stations', 'Station finder'],
    ['/learn/transposable-elements', 'Station finder'],
    ['/learn/transposable-elements/introduction', 'Lab room'],
    ['/lab/transposable-elements?experiment=tn3', 'Lab room'],
    ['/lab/transposable-elements/sandbox', 'Lab room'],
    ['/practice', 'Practice'],
    ['/learn/transposable-elements/assessment', 'Practice'],
    ['/notebook', 'Notebook'],
    ['/learn/transposable-elements/progress', 'Notebook'],
    ['/classes', 'Classroom'],
    ['/teach', 'Classroom'],
  ]) {
    const html = render(path);
    const current = html.match(/<a[^>]*aria-current="page"[^>]*>/g) || [];
    assert.equal(current.length, 1, path);
    assert.match(current[0], new RegExp(`aria-label="${label}"`), path);
    assert.equal(/class="feature-nav"|class="section-switcher/.test(html), false, path);
  }
  // The public landing page carries its own section links and no current lab destination.
  const landing = render('/');
  assert.equal((landing.match(/aria-current="page"/g) || []).length, 0);
  assert.match(landing, /href="#fields"/);
});
