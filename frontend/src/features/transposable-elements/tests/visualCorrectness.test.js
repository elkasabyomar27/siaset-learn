import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createInitial, transition} from '../engine/index.js';
const frontend=new URL('../../../../',import.meta.url);
const read=path=>readFileSync(new URL(path,frontend),'utf8');

test('calculated circular and linear molecules render statically without focusable controls, while laboratory inspection remains available',async()=>{
 const server=await createServer({root:fileURLToPath(frontend),server:{middlewareMode:true},appType:'custom'});
 try {
  const {default:MoleculeView}=await server.ssrLoadModule('/src/features/transposable-elements/components/MoleculeView.jsx');
  const initial=createInitial();
  const calculated=transition(initial,{type:'tn5.transpose',targetBoundary:200}).state;
  for(const molecule of [...initial.molecules,...calculated.molecules]){
   const staticHtml=renderToStaticMarkup(createElement(MoleculeView,{molecule}));
   assert.doesNotMatch(staticHtml,/<button|role="button"|tabindex=|aria-pressed=/i);
   assert.match(staticHtml,/molecule-static/);
   if(molecule.features.some(f=>f.kind!=='backbone')) assert.match(staticHtml,/<span class="feature-pill/);
   const interactiveHtml=renderToStaticMarkup(createElement(MoleculeView,{molecule,onSelect:()=>{}}));
   assert.match(interactiveHtml,/role="button" tabindex="0"/);
  }
 } finally {await server.close();}
});

test('scientific palette is independently defined and shared by molecule strokes, legend and feature labels',()=>{
 const css=read('src/scientific.css');
 assert.doesNotMatch(css,/var\(--color-brand|var\(--gold/);
 for(const kind of ['donor','target','element','tsd','res']){
  assert.match(css,new RegExp(`--scientific-${kind}: #[0-9a-f]{6}`));
  assert.ok(css.includes(`.legend .${kind} { background: var(--scientific-${kind}); }`));
 }
 assert.ok(read('src/main.jsx').indexOf("import './scientific.css'")>read('src/main.jsx').indexOf("import './theme.css'"));
 assert.doesNotMatch(read('src/features/transposable-elements/ConsequenceExplorer.jsx'),/onSelect=/);
});

