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

test('the failing part of a predictable password is named so the learner knows what to change', () => {
  const result = passwordStrength('Mariem123456_');
  assert.equal(result.level.id, 'weak');
  assert.deepEqual(unmet('Mariem123456_'), ['pattern']);
  assert.match(result.fixes[0], /“123456”/);
  assert.match(passwordStrength('Harbour98765!lamp').fixes[0], /“98765”/);
  assert.match(passwordStrength('Harbourzzzz!7lamp').fixes[0], /“zzzz”/);
  assert.match(passwordStrength('Kovac-river-7!Tide', {name: 'Marina Kovac'}).fixes[0], /“kovac”/);
  assert.match(passwordStrength('Short1!').fixes[0], /Add 5 more characters/);
  assert.deepEqual(passwordStrength('Mariem-harbour-7!').fixes, []);
  assert.equal(passwordStrength('Mariem-harbour-7!').level.id, 'strong');
});
