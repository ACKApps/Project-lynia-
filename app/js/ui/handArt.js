// Turns a photo of a hand into a piece of the edition: a duotone print in the spirit of the
// Nice hoardings, with the donor's own life line traced over the palm as a translucent
// thread of energy that runs off both edges, ready to meet the next hand.
//
// Everything happens on the device. The raw photo is never uploaded or stored: only the
// finished, softened print is kept (fine palm-print ridges are blurred away on purpose).

const ART_SIZE = 1080;
const DEFAULT_LINE = [
  [0.36, 0.34],
  [0.33, 0.45],
  [0.34, 0.56],
  [0.4, 0.66],
  [0.5, 0.74],
];

const SHADOW = [9, 10, 26];
const MID = [92, 70, 88];
const HIGHLIGHT = [246, 232, 214];

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be read as an image.'));
    };
    img.src = url;
  });
}

/** A drawn open palm, so the studio can be tried without a camera. */
export function sampleHand(size = 900) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size / 900;
  const bg = g.createRadialGradient(450 * s, 420 * s, 50 * s, 450 * s, 450 * s, 640 * s);
  bg.addColorStop(0, '#5a4a45');
  bg.addColorStop(1, '#141018');
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);

  const skin = g.createLinearGradient(0, 200 * s, 0, 900 * s);
  skin.addColorStop(0, '#e9c2a3');
  skin.addColorStop(1, '#c48f72');
  g.fillStyle = skin;
  g.strokeStyle = 'rgba(80,45,35,0.5)';
  g.lineWidth = 3 * s;

  const finger = (x, y, w, h, angle) => {
    g.save();
    g.translate(x * s, y * s);
    g.rotate(angle);
    g.beginPath();
    g.roundRect(-w * s / 2, -h * s, w * s, h * s, (w * s) / 2);
    g.fill();
    g.stroke();
    g.restore();
  };
  finger(365, 430, 70, 260, -0.12);
  finger(445, 410, 74, 300, -0.02);
  finger(525, 420, 72, 285, 0.07);
  finger(598, 455, 62, 225, 0.2);
  finger(300, 600, 84, 230, -0.95);

  g.beginPath();
  g.ellipse(475 * s, 590 * s, 185 * s, 215 * s, 0.05, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.roundRect(360 * s, 700 * s, 230 * s, 220 * s, 40 * s);
  g.fill();

  g.strokeStyle = 'rgba(110,60,45,0.55)';
  g.lineCap = 'round';
  const crease = (pts, w) => {
    g.lineWidth = w * s;
    g.beginPath();
    g.moveTo(pts[0] * s, pts[1] * s);
    g.bezierCurveTo(pts[2] * s, pts[3] * s, pts[4] * s, pts[5] * s, pts[6] * s, pts[7] * s);
    g.stroke();
  };
  crease([330, 470, 470, 440, 560, 470, 640, 480], 4);
  crease([340, 520, 430, 500, 520, 540, 600, 600], 4);
  crease([350, 440, 300, 560, 360, 700, 450, 760], 5);
  crease([520, 760, 510, 650, 520, 560, 560, 470], 2.5);
  return c;
}

function coverCrop(source, size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const w = source.naturalWidth || source.videoWidth || source.width;
  const h = source.naturalHeight || source.videoHeight || source.height;
  const side = Math.min(w, h);
  if ('filter' in g) g.filter = `blur(${(size / 900) * 1.4}px)`;
  g.drawImage(source, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  return c;
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

/** Duotone print: luminance → S-curve → shadow / mid / highlight ramp, with grain and vignette. */
export function stylize(source, size = ART_SIZE) {
  const c = coverCrop(source, size);
  const g = c.getContext('2d', { willReadFrequently: true });
  const img = g.getImageData(0, 0, size, size);
  const px = img.data;
  let seed = 1337;
  const noise = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  for (let i = 0; i < px.length; i += 4) {
    let l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
    l = l * l * (3 - 2 * l); // S-curve
    l = Math.min(1, Math.max(0, l + noise() * 0.05));
    const [from, to, t] = l < 0.5 ? [SHADOW, MID, l * 2] : [MID, HIGHLIGHT, (l - 0.5) * 2];
    px[i] = mix(from[0], to[0], t);
    px[i + 1] = mix(from[1], to[1], t);
    px[i + 2] = mix(from[2], to[2], t);
  }
  g.putImageData(img, 0, 0);
  if ('filter' in g) g.filter = 'none';
  const v = g.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.75);
  v.addColorStop(0, 'rgba(5,5,16,0)');
  v.addColorStop(1, 'rgba(5,5,16,0.8)');
  g.fillStyle = v;
  g.fillRect(0, 0, size, size);
  return c;
}

/** Catmull-Rom through the traced points, sampled densely, in pixel space. */
export function smoothPath(points, size, samplesPerSegment = 16) {
  const p = points.map(([x, y]) => [x * size, y * size]);
  if (p.length < 2) return p;
  const out = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(p.at(-1));
  return out;
}

/** Continue the line off both ends of the palm until it leaves the frame. */
export function extendToEdges(path, size) {
  if (path.length < 2) return path;
  const k = Math.min(6, path.length - 1);
  const dir = (a, b) => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  };
  const run = (from, d) => {
    const pts = [];
    for (let t = size / 40; t <= size * 1.5; t += size / 40) {
      const q = [from[0] + d[0] * t, from[1] + d[1] * t];
      pts.push(q);
      if (q[0] < -20 || q[1] < -20 || q[0] > size + 20 || q[1] > size + 20) break;
    }
    return pts;
  };
  const head = run(path[0], dir(path[0], path[k])).reverse();
  const tail = run(path.at(-1), dir(path.at(-1), path.at(-1 - k)));
  return [...head, ...path, ...tail];
}

function strokePath(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke();
}

/** The energy thread: layered glow, a white core, the cause's strand twisting round it, sparks. */
export function drawEnergyLine(g, points, size, { strand = '#f2b84b', seed = 7 } = {}) {
  const palm = smoothPath(points, size);
  const full = extendToEdges(palm, size);
  const u = size / 1080;
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.globalCompositeOperation = 'screen';
  const layers = [
    [44, 'rgba(110,200,255,0.10)', 50],
    [18, 'rgba(160,225,255,0.22)', 26],
    [7, 'rgba(210,245,255,0.65)', 12],
    [2.2, 'rgba(255,255,255,0.95)', 4],
  ];
  for (const [w, color, blur] of layers) {
    g.lineWidth = w * u;
    g.strokeStyle = color;
    g.shadowColor = 'rgba(150,220,255,0.9)';
    g.shadowBlur = blur * u;
    strokePath(g, full);
  }

  // The cause strand: a thin coloured thread spiralling around the core.
  const twisted = full.map((pt, i) => {
    const a = full[Math.max(0, i - 1)];
    const b = full[Math.min(full.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const off = Math.sin(i / 5) * 7 * u;
    return [pt[0] + nx * off, pt[1] + ny * off];
  });
  g.lineWidth = 1.6 * u;
  g.strokeStyle = strand;
  g.shadowColor = strand;
  g.shadowBlur = 10 * u;
  g.globalAlpha = 0.85;
  strokePath(g, twisted);

  // Sparks, stable for a given hand.
  let s = seed;
  const rand = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  g.globalAlpha = 1;
  g.shadowColor = 'rgba(200,240,255,1)';
  for (let i = 0; i < 70; i++) {
    const pt = full[Math.floor(rand() * full.length)];
    const r = (0.6 + rand() * 2.2) * u;
    g.shadowBlur = 8 * u;
    g.fillStyle = `rgba(230,250,255,${0.35 + rand() * 0.6})`;
    g.beginPath();
    g.arc(pt[0] + (rand() - 0.5) * 26 * u, pt[1] + (rand() - 0.5) * 26 * u, r, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  return { palm, full };
}

/** Caption band: title, "after" the artist, edition, hand number, place, certificate. */
export function drawCaption(g, size, { edition, handNo, place, pillar, certificate }) {
  const u = size / 1080;
  const band = g.createLinearGradient(0, size * 0.72, 0, size);
  band.addColorStop(0, 'rgba(5,5,16,0)');
  band.addColorStop(1, 'rgba(5,5,16,0.92)');
  g.fillStyle = band;
  g.fillRect(0, size * 0.72, size, size * 0.28);

  const pad = 56 * u;
  g.fillStyle = '#f6e8d6';
  g.textBaseline = 'alphabetic';
  g.font = `italic 400 ${64 * u}px "Cormorant Garamond", Georgia, serif`;
  g.fillText(edition.artwork.title, pad, size - 118 * u);
  g.font = `400 ${26 * u}px "Cormorant Garamond", Georgia, serif`;
  g.fillStyle = 'rgba(246,232,214,0.85)';
  g.fillText(`d’après ${edition.artist.name} · Édition ${String(edition.number).padStart(2, '0')}`, pad, size - 78 * u);

  g.textAlign = 'right';
  g.font = `500 ${30 * u}px "Inter", system-ui, sans-serif`;
  g.fillStyle = '#f6e8d6';
  g.fillText(`Main n° ${String(handNo).padStart(4, '0')}`, size - pad, size - 122 * u);
  g.font = `400 ${22 * u}px "Inter", system-ui, sans-serif`;
  g.fillStyle = 'rgba(246,232,214,0.8)';
  g.fillText(`${place} · ${pillar.label}`, size - pad, size - 86 * u);
  if (certificate) {
    g.font = `400 ${17 * u}px ui-monospace, "SFMono-Regular", Menlo, monospace`;
    g.fillStyle = 'rgba(246,232,214,0.55)';
    g.fillText(certificate, size - pad, size - 50 * u);
  }
  g.textAlign = 'left';
}

/** Interactive studio: shows the stylised print and lets the donor trace their life line. */
export class HandStudio {
  constructor(canvas, { onChange } = {}) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.size = canvas.width;
    this.base = null;
    this.points = DEFAULT_LINE.map((p) => [...p]);
    this.traced = false;
    this.strand = '#f2b84b';
    this.onChange = onChange;
    this.tracing = null;
    this.#bindPointer();
    this.render();
  }

  setSource(source) {
    this.base = stylize(source, this.size);
    this.render();
    this.onChange?.();
  }

  setStrand(color) {
    this.strand = color;
    this.render();
  }

  resetLine() {
    this.points = DEFAULT_LINE.map((p) => [...p]);
    this.traced = false;
    this.render();
    this.onChange?.();
  }

  #bindPointer() {
    const c = this.canvas;
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      return [
        Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      ];
    };
    c.addEventListener('pointerdown', (e) => {
      if (!this.base) return;
      c.setPointerCapture(e.pointerId);
      this.tracing = [pos(e)];
      e.preventDefault();
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.tracing) return;
      const p = pos(e);
      const last = this.tracing.at(-1);
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.02) {
        this.tracing.push(p);
        this.render(this.tracing);
      }
    });
    const end = () => {
      if (!this.tracing) return;
      if (this.tracing.length >= 3) {
        this.points = simplify(soften(this.tracing), 0.035);
        this.traced = true;
      }
      this.tracing = null;
      this.render();
      this.onChange?.();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
  }

  render(live) {
    const { g, size } = this;
    g.clearRect(0, 0, size, size);
    if (!this.base) {
      g.fillStyle = '#0b0b1c';
      g.fillRect(0, 0, size, size);
      return;
    }
    g.drawImage(this.base, 0, 0);
    const pts = live ?? this.points;
    if (pts.length >= 2) drawEnergyLine(g, pts, size, { strand: this.strand });
  }

  /** Final print with caption, as a JPEG data URL (small enough to keep in the browser). */
  exportArt({ edition, handNo, place, pillar, certificate, size = 720, quality = 0.86 }) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.drawImage(this.base, 0, 0, size, size);
    drawEnergyLine(g, this.points, size, { strand: pillar.color, seed: handNo });
    drawCaption(g, size, { edition, handNo, place, pillar, certificate });
    return c.toDataURL('image/jpeg', quality);
  }
}

/** Moving average (endpoints kept) to take the tremor out of a finger-traced line. */
export function soften(points, passes = 2) {
  let pts = points;
  for (let k = 0; k < passes; k++) {
    pts = pts.map((p, i) =>
      i === 0 || i === pts.length - 1
        ? p
        : [(pts[i - 1][0] + p[0] * 2 + pts[i + 1][0]) / 4, (pts[i - 1][1] + p[1] * 2 + pts[i + 1][1]) / 4],
    );
  }
  return pts;
}

/** Keep only points at least `minGap` apart so the traced line stays smooth. */
export function simplify(points, minGap) {
  const out = [points[0]];
  for (const p of points.slice(1, -1)) {
    const last = out.at(-1);
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= minGap) out.push(p);
  }
  out.push(points.at(-1));
  return out;
}
