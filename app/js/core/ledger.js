// The impact ledger: follows each donation from the moment it is given to the moment
// someone on the ground confirms what it became. No more giving "into a hole".

import { allocate, unitsFunded } from './impact.js';

export const STAGES = [
  { id: 'received', label: 'Received', detail: 'Your gift is held in the ring-fenced account for this cause.' },
  { id: 'transferred', label: 'Sent to partner', detail: 'Pooled with the month’s gifts and wired to the field partner.' },
  { id: 'deployed', label: 'On the ground', detail: 'The partner has spent it on the programme (purchases, salaries, transport).' },
  { id: 'verified', label: 'Verified', detail: 'Delivery confirmed with evidence: photos, receipts, partner report, audit.' },
];

const stageIndex = (id) => STAGES.findIndex((s) => s.id === id);

/**
 * Each cause settles gifts in monthly batches. A donation belongs to the first batch whose
 * cutoff is on or after the gift date; its stage is how far that batch has progressed.
 */
export function batchFor(donation, cause) {
  return (cause.batches ?? []).find((b) => b.cutoff >= donation.date) ?? null;
}

export function trackDonation(donation, cause, today = new Date().toISOString().slice(0, 10)) {
  const batch = batchFor(donation, cause);
  const reached = { received: donation.date };
  if (batch) {
    if (batch.transferredOn && batch.transferredOn <= today) reached.transferred = batch.transferredOn;
    if (reached.transferred && batch.deployedOn && batch.deployedOn <= today) reached.deployed = batch.deployedOn;
    if (reached.deployed && batch.verifiedOn && batch.verifiedOn <= today) reached.verified = batch.verifiedOn;
  }
  const current = STAGES.filter((s) => reached[s.id]).at(-1).id;
  return {
    stage: current,
    stageIndex: stageIndex(current),
    reached,
    batch,
    allocation: allocate(donation.amount, cause),
  };
}

/** Totals per cause: money, hands, cities, and concrete units funded. */
export function causeTotals(donations, causes) {
  const byId = Object.fromEntries(
    causes.map((c) => [c.id, { cause: c, raised: 0, programme: 0, units: 0, hands: 0, cities: new Set() }]),
  );
  for (const d of donations) {
    const t = byId[d.causeId];
    if (!t) continue;
    const a = allocate(d.amount, t.cause);
    t.raised += d.amount;
    t.programme += a.programme;
    t.hands += 1;
    t.cities.add(d.city);
  }
  return causes.map((c) => {
    const t = byId[c.id];
    return {
      ...t,
      units: unitsFunded(t.programme, c),
      cities: t.cities.size,
      progress: c.goal ? Math.min(1, t.raised / c.goal) : null,
    };
  });
}

export function editionTotals(donations) {
  const cities = new Set(donations.map((d) => d.city));
  const countries = new Set(donations.map((d) => d.country));
  const raised = donations.reduce((s, d) => s + d.amount, 0);
  return { hands: donations.length, cities: cities.size, countries: countries.size, raised };
}
