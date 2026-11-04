import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGates, signalStops } from '../mobilityGates.js';
import { phenotypeChain, PHENO_GOALS } from '../phenotypeChain.js';

const outcome = (sys, s) => evaluateGates(sys, s).outcome;

test('maize Ac/Ds: Ds alone not permitted; Ac in trans permits; Ds stays non-autonomous', () => {
  assert.equal(outcome('maize', {element: 'Ds', acInTrans: false}), 'not permitted');
  const trans = evaluateGates('maize', {element: 'Ds', acInTrans: true});
  assert.equal(trans.outcome, 'permitted');
  assert.match(trans.autonomy, /^Non-autonomous, complemented in trans/);
  assert.match(evaluateGates('maize', {element: 'Ac'}).autonomy, /^Autonomous/);
  assert.equal(outcome('maize', {element: 'Ac', permissiveHost: false}), 'undetermined');
});

test('IS10: RNA-OUT reduces, inactive pIN closes, another source permits', () => {
  assert.equal(outcome('is10', {pIN: true, rnaOut: true}), 'reduced');
  assert.equal(outcome('is10', {pIN: true, rnaOut: false}), 'permitted');
  assert.equal(outcome('is10', {pIN: false, rnaOut: false}), 'not permitted');
  assert.equal(outcome('is10', {pIN: false, otherSource: true}), 'permitted');
  const closed = evaluateGates('is10', {pIN: false});
  assert.equal(signalStops(closed.gates), 0);
});

test('CACTA1: silenced is reduced; ddm1 relaxes silencing but stays undetermined', () => {
  assert.equal(outcome('cacta1', {ddm1: false}), 'reduced');
  assert.equal(outcome('cacta1', {ddm1: true}), 'undetermined');
  assert.throws(() => evaluateGates('tn7', {}));
});

test('phenotype chain reproduces the lesson contexts', () => {
  const out = i => phenotypeChain(i).phenotype.outcome;
  assert.equal(out({site: 'coding', backup: 'none', medium: 'required'}), 'likely altered');
  assert.equal(out({site: 'intergenic'}), 'likely unchanged');
  assert.equal(out({site: 'regulatory', promoterInfo: 'unknown'}), 'undetermined');
  const masked = phenotypeChain({site: 'coding', backup: 'none', medium: 'supplied'});
  assert.equal(masked.phenotype.outcome, 'likely unchanged'); assert.equal(masked.maskedLoss, true);
  assert.equal(out({site: 'regulatory', promoterInfo: 'sole', medium: 'required'}), 'likely altered');
  assert.equal(out({site: 'coding', backup: 'unknown'}), 'undetermined');
  assert.equal(out({site: 'coding', medium: 'unknown'}), 'undetermined');
  assert.throws(() => phenotypeChain({site: 'nowhere'}));
});

test('every phenotype goal is reachable', () => {
  const configs = [{site: 'coding'}, {site: 'coding', medium: 'supplied'}, {site: 'regulatory'}, {site: 'intergenic'}];
  for (const g of PHENO_GOALS) assert.ok(configs.some(c => g.done(phenotypeChain(c))), g.id);
});
