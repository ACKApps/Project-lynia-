import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, jitterLocation, spanningLine, lineLengthKm, project, unproject } from '../app/js/core/geo.js';

const nice = { lat: 43.7102, lon: 7.262 };
const cannes = { lat: 43.5528, lon: 7.0174 };
const paris = { lat: 48.8566, lon: 2.3522 };

test('haversine gives real distances', () => {
  const d = haversineKm(nice, paris);
  assert.ok(d > 680 && d < 700, `Nice–Paris ${d}`);
  assert.equal(haversineKm(nice, nice), 0);
});

test('jitter is stable and stays within 0.6–3 km', () => {
  for (let i = 0; i < 200; i++) {
    const key = `hand-${i}`;
    const a = jitterLocation(nice, key);
    assert.deepEqual(a, jitterLocation(nice, key));
    const d = haversineKm(nice, a);
    assert.ok(d >= 0.55 && d <= 3.05, `${key}: ${d} km`);
  }
});

test('the line joins every hand exactly once, to its nearest neighbours', () => {
  const pts = [paris, nice, cannes, { lat: 43.73, lon: 7.28 }];
  const edges = spanningLine(pts);
  assert.equal(edges.length, pts.length - 1);
  // Paris should hang off the Riviera by a single edge, the Riviera hands by short ones.
  const long = edges.filter((e) => e.km > 100);
  assert.equal(long.length, 1);
  const seen = new Set(edges.flatMap((e) => [e.from, e.to]));
  assert.equal(seen.size, pts.length);
  assert.ok(lineLengthKm(edges) < haversineKm(paris, nice) + 30);
});

test('spanning line handles tiny inputs', () => {
  assert.deepEqual(spanningLine([]), []);
  assert.deepEqual(spanningLine([nice]), []);
});

test('projection round-trips', () => {
  const p = project(nice.lon, nice.lat);
  const back = unproject(p.x, p.y);
  assert.ok(Math.abs(back.lat - nice.lat) < 1e-9 && Math.abs(back.lon - nice.lon) < 1e-9);
});
