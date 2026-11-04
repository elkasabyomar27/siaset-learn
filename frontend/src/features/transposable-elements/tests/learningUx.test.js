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

test('shared navigation renders exactly one current destination for each learning route', async () => {

    const {default: FeatureNav} = await server.ssrLoadModule('/src/features/transposable-elements/FeatureNav.jsx');
    for (const [path, label] of [
      ['/learn/transposable-elements', 'Curriculum'],
      ['/learn/transposable-elements/introduction', 'Curriculum'],
      ['/lab/transposable-elements?experiment=tn3', 'Guided labs'],
      ['/lab/transposable-elements/sandbox', 'Molecular sandbox'],
      ['/learn/transposable-elements/assessment', 'Cumulative assessment'],
      ['/learn/transposable-elements/progress', 'Your progress'],
    ]) {
      const html = renderToStaticMarkup(createElement(MemoryRouter, {initialEntries: [path]}, createElement(FeatureNav)));
      assert.equal((html.match(/aria-current="page"/g) || []).length, 1, path);
      assert.match(html, new RegExp(`aria-current="page"[^>]*>${label}</a>`));
    }

});
