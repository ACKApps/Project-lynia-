import test from 'node:test';
import assert from 'node:assert/strict';
import { allocate, unitsFunded, describeUnits } from '../app/js/core/impact.js';
import { CAUSES } from '../app/js/data/causes.js';

test('allocation always adds back up to the gift', () => {
  for (const cause of CAUSES) {
    for (const amount of [1, 10, 20, 30, 50, 100, 500, 1234.56]) {
      const a = allocate(amount, cause);
      const sum = Math.round((a.payment + a.platform + a.partner + a.programme) * 100) / 100;
      assert.equal(sum, a.amount, `${cause.id} €${amount}`);
      assert.ok(a.programme > 0);
    }
  }
});

test('most of a typical gift reaches the programme', () => {
  const a = allocate(30, CAUSES[0]);
  assert.ok(a.programme / a.amount > 0.8, `programme share ${a.programme / a.amount}`);
});

test('rejects non-positive amounts', () => {
  assert.throws(() => allocate(0, CAUSES[0]), RangeError);
  assert.throws(() => allocate(-5, CAUSES[0]), RangeError);
});

test('units are described concretely', () => {
  const meals = CAUSES.find((c) => c.id === 'thies-school-meals');
  assert.match(describeUnits(unitsFunded(25, meals), meals), /^≈ 55 school meals$/);
  const build = CAUSES.find((c) => c.id === 'kisumu-childrens-home');
  assert.equal(describeUnits(unitsFunded(70, build), build), '≈ 50% of one square metre built');
});
