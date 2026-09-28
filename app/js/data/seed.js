// Demo community: a deterministic set of hands so the line can be seen before real gifts
// exist. Every seeded hand is flagged `demo: true` and labelled as such in the interface.

import { CITIES } from './cities.js';
import { CAUSES } from './causes.js';
import { EDITION } from './edition.js';
import { jitterLocation, mulberry32 } from '../core/geo.js';

const AMOUNTS = [
  [10, 22],
  [20, 26],
  [30, 18],
  [50, 16],
  [100, 12],
  [250, 4],
  [500, 2],
];

function weighted(rand, items, weightOf) {
  const total = items.reduce((s, it) => s + weightOf(it), 0);
  let r = rand() * total;
  for (const it of items) {
    r -= weightOf(it);
    if (r <= 0) return it;
  }
  return items.at(-1);
}

export function seedDonations({ count = 180, until = '2026-09-27', seed = 2026 } = {}) {
  const rand = mulberry32(seed);
  const start = Date.parse(EDITION.opens);
  const end = Date.parse(until);
  const dates = Array.from({ length: count }, () => start + rand() * (end - start)).sort((a, b) => a - b);
  return dates.map((t, i) => {
    const city = weighted(rand, CITIES, (c) => c.w);
    const cause = weighted(rand, CAUSES, () => 1);
    const [amount] = weighted(rand, AMOUNTS, ([, w]) => w);
    const id = `demo-${String(i + 1).padStart(4, '0')}`;
    return {
      id,
      handNo: i + 1,
      date: new Date(t).toISOString().slice(0, 10),
      amount,
      causeId: cause.id,
      city: city.name,
      country: city.country,
      ...jitterLocation(city, id),
      demo: true,
    };
  });
}
