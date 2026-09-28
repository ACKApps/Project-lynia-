// Geography helpers: distances, privacy jitter, and the "line" that joins every hand.

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/** Great-circle distance in kilometres between two {lat, lon} points. */
export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Small deterministic string hash (FNV-1a, 32-bit). */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic PRNG (mulberry32) so seeds and jitter are stable across reloads. */
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Move a city-level location by a stable offset of minKm..maxKm so that hands in the
 * same city don't stack, and nobody's home can be recovered from the map.
 */
export function jitterLocation(point, key, minKm = 0.6, maxKm = 3) {
  const rand = mulberry32(hashString(key));
  const bearing = rand() * 2 * Math.PI;
  const distKm = minKm + rand() * (maxKm - minKm);
  const dLat = toDeg(distKm / EARTH_RADIUS_KM) * Math.cos(bearing);
  const dLon =
    (toDeg(distKm / EARTH_RADIUS_KM) * Math.sin(bearing)) / Math.max(0.2, Math.cos(toRad(point.lat)));
  return { lat: round(point.lat + dLat, 4), lon: round(point.lon + dLon, 4) };
}

function round(v, digits) {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

/**
 * Minimum spanning tree over the hands (Prim's algorithm, O(n²), fine for tens of
 * thousands of points client-side). Each hand holds its nearest neighbour's hand, so the
 * one next door in Nice connects to you, and the whole community forms one unbroken line.
 * Returns edges as { from, to, km } using indices into `points`.
 */
export function spanningLine(points) {
  const n = points.length;
  if (n < 2) return [];
  const inTree = new Uint8Array(n);
  const best = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const edges = [];
  best[0] = 0;
  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inTree[i] && (u === -1 || best[i] < best[u])) u = i;
    }
    inTree[u] = 1;
    if (parent[u] !== -1) edges.push({ from: parent[u], to: u, km: best[u] });
    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const d = haversineKm(points[u], points[v]);
      if (d < best[v]) {
        best[v] = d;
        parent[v] = u;
      }
    }
  }
  return edges;
}

/** Total length in km of a set of edges. */
export function lineLengthKm(edges) {
  return edges.reduce((sum, e) => sum + e.km, 0);
}

/** Spherical Mercator projection to unit coordinates (x, y in "world units"). */
export function project(lon, lat) {
  const clamped = Math.max(-85, Math.min(85, lat));
  return { x: toRad(lon), y: -Math.log(Math.tan(Math.PI / 4 + toRad(clamped) / 2)) };
}

export function unproject(x, y) {
  return { lon: toDeg(x), lat: toDeg(2 * Math.atan(Math.exp(-y)) - Math.PI / 2) };
}
