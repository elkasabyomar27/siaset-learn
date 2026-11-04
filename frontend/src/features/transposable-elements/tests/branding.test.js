import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const frontend=new URL('../../../../',import.meta.url);
const read=path=>readFileSync(new URL(path,frontend),'utf8');
test('brand variants and favicon are standalone SVGs with accessible identity and scalable dimensions',()=>{
 for(const tone of ['light','dark'])for(const variant of ['logo-full','logo-compact','monogram']){
  const svg=read(`public/branding/siaset-${variant}-${tone}.svg`);
  assert.match(svg,/<svg[^>]+viewBox="0 0 \d+ \d+"/);
  assert.match(svg,/<title[^>]*>SiaSet/);
  assert.ok(!/<image|data:image|https?:\/\/(?!www.w3.org)/.test(svg));
  assert.ok(svg.includes('#F5B75E')&&svg.includes('#176D80'));
 }
 const html=read('index.html');
 assert.ok(html.includes('/branding/favicon.svg')&&read('public/branding/favicon.svg').includes('<svg'));
 assert.match(html,/theme-color" content="#10283F"/);
 assert.ok(html.includes('SiaSet — Transposable Elements Virtual Laboratory'));
});
test('theme declares official tokens and uses local typography without changing molecular palette',()=>{
 const css=read('src/theme.css');
 for(const color of ['#10283F','#176D80','#68D9D1','#F5B75E','#F5F8FC'])assert.ok(css.includes(color));
 for(const semantic of ['--color-text','--color-border','--color-focus','--color-success','--color-error','--color-disabled','--color-molecular-background'])assert.ok(css.includes(semantic));
 assert.ok(!read('src/styles.css').includes('fonts.googleapis.com'));
 const source=read('src/main.jsx');assert.ok(source.includes('<Brand tone="dark"/>')&&source.includes('aria-label="SiaSet home"'));
 const molecule=read('src/features/transposable-elements/components/MoleculeView.jsx');
 assert.ok(molecule.includes("donor:'var(--scientific-donor)'")&&molecule.includes("tsd:'var(--scientific-tsd)'"));
});
