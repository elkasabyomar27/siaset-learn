import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordStrength} from '../../frontend/src/auth/passwordStrength.js';

const unmet = (password, context) => passwordStrength(password, context).checks.filter(check => !check.met).map(check => check.id);

test('empty password has no level and is not acceptable', () => {
  const result = passwordStrength('');
  assert.equal(result.level.id, 'empty');
  assert.equal(result.acceptable, false);
});

test('short or patterned passwords are weak and say what to fix', () => {
  assert.equal(passwordStrength('Ab1!xyz').level.id, 'weak');
  assert.deepEqual(unmet('Ab1!xyz'), ['length']);
  for (const password of ['MyPassword2024!', 'Qwerty!Garden99', 'aaaaGarden!9xyz', 'Garden!1234xyzQ']) {
    const result = passwordStrength(password);
    assert.equal(result.level.id, 'weak', password);
    assert.deepEqual(unmet(password), ['pattern'], password);
  }
});

test('passwords containing the email name or display name are rejected', () => {
  const context = {email: 'marina.k@example.com', name: 'Marina Kovac'};
  assert.ok(unmet('Kovac-river-7!Tide', context).includes('personal'));
  assert.ok(unmet('marina.k-River7!x', context).includes('personal'));
  assert.equal(passwordStrength('Tidal-river-7!Moss', context).acceptable, true);
});

test('strength rises with character variety and length', () => {
  assert.equal(passwordStrength('quietharbourlamp').level.id, 'fair');
  assert.equal(passwordStrength('quietharbour7lamp').level.id, 'good');
  assert.equal(passwordStrength('Quiet harbour 7 lamp!').level.id, 'strong');
  assert.deepEqual(unmet('quietharbourlamp'), ['upper', 'number', 'symbol']);
});
