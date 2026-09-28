import test from 'node:test';
import assert from 'node:assert/strict';
import { trackDonation, causeTotals, editionTotals, batchFor } from '../app/js/core/ledger.js';
import { CAUSES } from '../app/js/data/causes.js';
import { seedDonations } from '../app/js/data/seed.js';
import { certificateCode } from '../app/js/core/certificate.js';

const cause = CAUSES[0];

test('a gift is assigned to the month it was given in', () => {
  assert.equal(batchFor({ date: '2026-03-14' }, cause).cutoff, '2026-03-31');
  assert.equal(batchFor({ date: '2026-03-31' }, cause).cutoff, '2026-03-31');
  assert.equal(batchFor({ date: '2026-04-01' }, cause).cutoff, '2026-04-30');
});

test('stages advance with the settlement calendar', () => {
  const gift = { amount: 30, date: '2026-03-14' };
  assert.equal(trackDonation(gift, cause, '2026-03-20').stage, 'received');
  assert.equal(trackDonation(gift, cause, '2026-04-09').stage, 'transferred');
  assert.equal(trackDonation(gift, cause, '2026-05-06').stage, 'deployed');
  const done = trackDonation(gift, cause, '2026-06-10');
  assert.equal(done.stage, 'verified');
  assert.ok(done.batch.report.evidence);
});

test('gifts after the last scheduled batch wait as received', () => {
  assert.equal(trackDonation({ amount: 10, date: '2026-12-01' }, cause, '2027-03-01').stage, 'received');
});

test('seed is deterministic and totals are consistent', () => {
  const a = seedDonations();
  const b = seedDonations();
  assert.deepEqual(a, b);
  const perCause = causeTotals(a, CAUSES);
  const edition = editionTotals(a);
  assert.equal(perCause.reduce((s, t) => s + t.hands, 0), edition.hands);
  assert.equal(perCause.reduce((s, t) => s + t.raised, 0), edition.raised);
  assert.ok(a.every((d) => d.demo));
});

test('certificate codes are stable and change with the art', async () => {
  const fields = { edition: 'LV01', handNo: 143, causeId: cause.id, date: '2026-09-28', city: 'Nice', artDigest: 'abc' };
  const c1 = await certificateCode(fields);
  assert.match(c1, /^LV01-0143-[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.equal(c1, await certificateCode(fields));
  assert.notEqual(c1, await certificateCode({ ...fields, artDigest: 'abd' }));
});
