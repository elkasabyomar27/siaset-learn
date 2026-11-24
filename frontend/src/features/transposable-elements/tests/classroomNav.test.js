import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';

let server, nav, pages, AuthProvider;
before(async () => {
  server = await createServer({root: fileURLToPath(new URL('../../../../', import.meta.url)), server: {middlewareMode: true, hmr: false}, appType: 'custom'});
  nav = await server.ssrLoadModule('/src/classroom/ClassroomNav.jsx');
  ({AuthProvider} = await server.ssrLoadModule('/src/auth/AuthProvider.jsx'));
  pages = {
    '/classes': (await server.ssrLoadModule('/src/classroom/MyClasses.jsx')).default,
    '/teach': (await server.ssrLoadModule('/src/classroom/Teach.jsx')).default,
    '/play': (await server.ssrLoadModule('/src/classroom/QuizPlay.jsx')).default,
  };
});
after(async () => { await server?.close(); });

const at = (path, element) => renderToStaticMarkup(createElement(MemoryRouter, {initialEntries: [path]}, createElement(AuthProvider, null, element)));

test('classroom menu links My classes, Live quiz and Teach, marking the current one', () => {
  const out = at('/classes', createElement(nav.default));
  assert.match(out, /<nav[^>]*aria-label="Classroom"/);
  for (const [href, label] of [['/classes', 'My classes'], ['/play', 'Live quiz'], ['/teach', 'Teach']]) assert.match(out, new RegExp(`href="${href}"[^>]*>${label}<`));
  assert.equal((out.match(/aria-current="page"/g) || []).length, 1);
  assert.match(out, /aria-current="page"[^>]*href="\/classes"|href="\/classes"[^>]*aria-current="page"/);
});

test('every classroom page shows the menu, so Teach is reachable from My classes', () => {
  for (const [path, Page] of Object.entries(pages)) {
    const out = at(path, createElement(Page));
    assert.match(out, /aria-label="Classroom"/, path);
    assert.match(out, /href="\/teach"/, path);
  }
});
