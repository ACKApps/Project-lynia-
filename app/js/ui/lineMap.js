// The living map: every hand placed in its neighbourhood, each one holding its nearest
// neighbour's through the energy line, so the whole community forms one unbroken thread.

import { EMEA_OUTLINES } from '../data/emea-outlines.js';
import { project, unproject, spanningLine } from '../core/geo.js';

const EMEA_BOUNDS = { west: -20, east: 60, south: -36, north: 62 };
const MAX_SCALE = 200000;

export class LineMap {
  constructor(canvas, { onSelect, colorOf } = {}) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.onSelect = onSelect;
    this.colorOf = colorOf ?? (() => '#fff');
    this.hands = [];
    this.edges = [];
    this.projected = [];
    this.images = new Map();
    this.highlight = null; // cause id to emphasise
    this.selected = null;
    this.reveal = Infinity; // hands with index >= reveal are hidden (anniversary replay)
    this.view = { cx: 0, cy: 0, scale: 1 };
    this.dpr = 1;
    this.t0 = performance.now();
    this.land = EMEA_OUTLINES.map((ring) => {
      const pts = [];
      for (let i = 0; i < ring.length; i += 2) pts.push(project(ring[i], ring[i + 1]));
      return pts;
    });
    this.#resize();
    this.#bind();
    this.fitBounds(EMEA_BOUNDS);
    this.#loop();
  }

  setHands(hands) {
    this.hands = hands;
    this.projected = hands.map((h) => project(h.lon, h.lat));
    this.edges = spanningLine(hands);
    // Reveal each edge when the later of its two hands joins (for the replay).
    this.edges.forEach((e) => (e.order = Math.max(e.from, e.to)));
    for (const h of hands) {
      if (h.art && !this.images.has(h.id)) {
        const img = new Image();
        img.src = h.art;
        this.images.set(h.id, img);
      }
    }
  }

  fitBounds({ west, east, south, north }, padding = 0.08) {
    const a = project(west, north);
    const b = project(east, south);
    const { width, height } = this.#cssSize();
    const scale = Math.min(width / (b.x - a.x), height / (b.y - a.y)) * (1 - padding);
    this.view = { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, scale };
  }

  flyTo(lon, lat, scale) {
    const target = project(lon, lat);
    const from = { ...this.view };
    const to = { cx: target.x, cy: target.y, scale };
    const start = performance.now();
    const dur = 1400;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const ls = Math.log(from.scale) + (Math.log(to.scale) - Math.log(from.scale)) * e;
      this.view = { cx: from.cx + (to.cx - from.cx) * e, cy: from.cy + (to.cy - from.cy) * e, scale: Math.exp(ls) };
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  zoomBy(factor, px, py) {
    const { width, height } = this.#cssSize();
    px ??= width / 2;
    py ??= height / 2;
    const before = this.#toWorld(px, py);
    this.view.scale = Math.min(MAX_SCALE, Math.max(this.minScale ?? 80, this.view.scale * factor));
    const after = this.#toWorld(px, py);
    this.view.cx += before.x - after.x;
    this.view.cy += before.y - after.y;
  }

  resetView() {
    this.fitBounds(EMEA_BOUNDS);
  }

  #cssSize() {
    const r = this.canvas.getBoundingClientRect();
    return { width: r.width || 800, height: r.height || 500 };
  }

  #toScreen(x, y) {
    const { width, height } = this.#cssSize();
    return [(x - this.view.cx) * this.view.scale + width / 2, (y - this.view.cy) * this.view.scale + height / 2];
  }

  #toWorld(px, py) {
    const { width, height } = this.#cssSize();
    return { x: (px - width / 2) / this.view.scale + this.view.cx, y: (py - height / 2) / this.view.scale + this.view.cy };
  }

  #resize() {
    const { width, height } = this.#cssSize();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    const a = project(EMEA_BOUNDS.west, EMEA_BOUNDS.north);
    const b = project(EMEA_BOUNDS.east, EMEA_BOUNDS.south);
    this.minScale = Math.min(width / (b.x - a.x), height / (b.y - a.y)) * 0.5;
  }

  #bind() {
    const c = this.canvas;
    const pointers = new Map();
    let dragged = false;
    let pinch = null;
    const local = (e) => {
      const r = c.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, local(e));
      dragged = false;
      if (pointers.size === 2) {
        const [p, q] = [...pointers.values()];
        pinch = Math.hypot(p[0] - q[0], p[1] - q[1]);
      }
    });
    c.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) {
        this.hover = this.#hit(...local(e));
        c.style.cursor = this.hover != null ? 'pointer' : 'grab';
        return;
      }
      const prev = pointers.get(e.pointerId);
      const cur = local(e);
      pointers.set(e.pointerId, cur);
      if (pointers.size === 2 && pinch) {
        const [p, q] = [...pointers.values()];
        const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        this.zoomBy(d / pinch, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
        pinch = d;
        dragged = true;
        return;
      }
      const dx = cur[0] - prev[0];
      const dy = cur[1] - prev[1];
      if (Math.abs(dx) + Math.abs(dy) > 1) dragged = true;
      this.view.cx -= dx / this.view.scale;
      this.view.cy -= dy / this.view.scale;
    });
    const up = (e) => {
      const pos = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!dragged && pos) {
        const hit = this.#hit(...pos);
        this.selected = hit;
        this.onSelect?.(hit == null ? null : this.hands[hit], pos);
      }
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoomBy(Math.exp(-e.deltaY * 0.0015), ...local(e));
      },
      { passive: false },
    );
    this.observer = new ResizeObserver(() => this.#resize());
    this.observer.observe(c);
  }

  #hit(px, py) {
    let best = null;
    let bestD = 18;
    this.projected.forEach((p, i) => {
      if (i >= this.reveal) return;
      const [x, y] = this.#toScreen(p.x, p.y);
      const d = Math.hypot(x - px, y - py);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  #loop() {
    const frame = (now) => {
      if (this.stopped) return;
      this.#draw((now - this.t0) / 1000);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  destroy() {
    this.stopped = true;
    this.observer?.disconnect();
  }

  #draw(time) {
    const { g, dpr } = this;
    const { width, height } = this.#cssSize();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = g.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
    bg.addColorStop(0, '#0d0f24');
    bg.addColorStop(1, '#05050d');
    g.fillStyle = bg;
    g.fillRect(0, 0, width, height);

    // Land
    g.lineWidth = 0.7;
    g.strokeStyle = 'rgba(160,170,230,0.18)';
    g.fillStyle = 'rgba(120,130,200,0.06)';
    for (const ring of this.land) {
      g.beginPath();
      ring.forEach((p, i) => {
        const [x, y] = this.#toScreen(p.x, p.y);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      });
      g.closePath();
      g.fill();
      g.stroke();
    }

    const scr = this.projected.map((p) => this.#toScreen(p.x, p.y));
    const visible = (i) => i < this.reveal;
    const dim = (h) => this.highlight && h.causeId !== this.highlight;

    // The line
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (const e of this.edges) {
      if (!visible(e.order)) continue;
      const [ax, ay] = scr[e.from];
      const [bx, by] = scr[e.to];
      if (Math.max(ax, bx) < -50 || Math.min(ax, bx) > width + 50 || Math.max(ay, by) < -50 || Math.min(ay, by) > height + 50) continue;
      const faded = dim(this.hands[e.from]) && dim(this.hands[e.to]);
      const mx = (ax + bx) / 2 - (by - ay) * 0.12;
      const my = (ay + by) / 2 + (bx - ax) * 0.12;
      const alpha = faded ? 0.08 : 1;
      for (const [w, a] of [[6, 0.07], [2.5, 0.2], [1, 0.75]]) {
        g.lineWidth = w;
        g.strokeStyle = `rgba(170,230,255,${a * alpha})`;
        g.beginPath();
        g.moveTo(ax, ay);
        g.quadraticCurveTo(mx, my, bx, by);
        g.stroke();
      }
      // Flux: a spark travelling along each edge.
      if (!faded) {
        const len = Math.hypot(bx - ax, by - ay);
        const speed = 60 / Math.max(40, len);
        const t = (time * speed + (e.from * 0.137) % 1) % 1;
        const it = 1 - t;
        const fx = it * it * ax + 2 * it * t * mx + t * t * bx;
        const fy = it * it * ay + 2 * it * t * my + t * t * by;
        g.fillStyle = 'rgba(235,250,255,0.9)';
        g.shadowColor = 'rgba(170,230,255,1)';
        g.shadowBlur = 8;
        g.beginPath();
        g.arc(fx, fy, 1.8, 0, Math.PI * 2);
        g.fill();
        g.shadowBlur = 0;
      }
    }
    g.restore();

    // Hands
    const showArt = this.view.scale > 12000; // roughly city level
    this.hands.forEach((h, i) => {
      if (!visible(i)) return;
      const [x, y] = scr[i];
      if (x < -40 || y < -40 || x > width + 40 || y > height + 40) return;
      const color = this.colorOf(h);
      const faded = dim(h);
      const isSel = this.selected === i || this.hover === i;
      const img = this.images.get(h.id);
      g.globalAlpha = faded ? 0.25 : 1;
      if (showArt && img?.complete && img.naturalWidth) {
        const r = isSel ? 30 : 22;
        g.save();
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.clip();
        g.drawImage(img, x - r, y - r, r * 2, r * 2);
        g.restore();
        g.lineWidth = 2;
        g.strokeStyle = color;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
      } else {
        const r = (isSel ? 6 : h.mine ? 5 : 3.2) * (showArt ? 1.6 : 1);
        g.shadowColor = color;
        g.shadowBlur = 12;
        g.fillStyle = color;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
        g.shadowBlur = 0;
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.beginPath();
        g.arc(x, y, r * 0.4, 0, Math.PI * 2);
        g.fill();
      }
      if (h.mine) {
        const pulse = 10 + ((time * 14) % 18);
        g.strokeStyle = `rgba(255,255,255,${0.7 - (pulse - 10) / 30})`;
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(x, y, pulse + (showArt ? 16 : 0), 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
    });
  }

  /** Lon/lat of the current view centre (useful for "near me" features). */
  center() {
    return unproject(this.view.cx, this.view.cy);
  }
}
