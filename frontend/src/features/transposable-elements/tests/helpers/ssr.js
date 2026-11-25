import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';

// Shared Vite SSR harness for component tests. `load('/src/...')` returns the module;
// `html(Component, props, {url})` renders inside a MemoryRouter at `url` (default '/').
export async function startSsr() {
  const server = await createServer({
    root: fileURLToPath(new URL('../../../../../', import.meta.url)),
    server: {middlewareMode: true, hmr: false}, appType: 'custom', logLevel: 'error',
    // No dependency scan: it races server.close() and prints a spurious error.
    optimizeDeps: {noDiscovery: true, include: []},
  });
  return {
    load: path => server.ssrLoadModule(path),
    html: (Component, props = {}, {url = '/'} = {}) =>
      renderToStaticMarkup(createElement(MemoryRouter, {initialEntries: [url]}, createElement(Component, props))),
    close: () => server.close(),
  };
}
