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

test('the sidebar is the single navigation and marks exactly one current destination per route', async () => {
  const {default: WorkspaceShell} = await server.ssrLoadModule('/src/ui/WorkspaceShell.jsx');
  const {AuthProvider} = await server.ssrLoadModule('/src/auth/AuthProvider.jsx');
  for (const [path, label] of [
    ['/', 'Overview'],
    ['/learn/transposable-elements', 'Curriculum'],
    ['/learn/transposable-elements/introduction', 'Curriculum'],
    ['/lab/transposable-elements?experiment=tn3', 'Guided labs'],
    ['/lab/transposable-elements/sandbox', 'Sandbox'],
    ['/learn/transposable-elements/assessment', 'Assessment'],
    ['/learn/transposable-elements/progress', 'Progress'],
  ]) {
    const html = renderToStaticMarkup(createElement(MemoryRouter, {initialEntries: [path]}, createElement(AuthProvider, null, createElement(WorkspaceShell, null, 'page'))));
    const current = html.match(/<a[^>]*aria-current="page"[^>]*>/g) || [];
    assert.equal(current.length, 1, path);
    assert.match(current[0], new RegExp(`aria-label="${label}"`), path);
    assert.equal(/class="feature-nav"|class="section-switcher/.test(html), false, path);
  }
});
