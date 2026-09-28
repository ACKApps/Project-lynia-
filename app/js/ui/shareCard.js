// The share card: not "look, I donated" but "I hold the line". The amount stays private
// unless the donor chooses to show it.

import { formatEuros } from '../core/impact.js';

const W = 1080;
const H = 1350;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function renderShareCard({ donation, cause, pillar, edition, totals, showAmount }) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#07071a';
  g.fillRect(0, 0, W, H);
  const art = await loadImage(donation.art);
  g.drawImage(art, 0, 0, W, W);

  const pad = 64;
  g.fillStyle = '#f6e8d6';
  g.font = 'italic 400 58px "Cormorant Garamond", Georgia, serif';
  g.fillText('Je tiens la ligne.', pad, W + 92);
  g.font = '400 26px "Inter", system-ui, sans-serif';
  g.fillStyle = 'rgba(246,232,214,0.8)';
  const who = `One of ${totals.hands.toLocaleString('en-GB')} hands across ${totals.cities} cities`;
  g.fillText(who, pad, W + 140);
  const what = showAmount
    ? `${formatEuros(donation.amount)} that ${pillar.verb}: ${cause.title}`
    : `A line that ${pillar.verb}: ${cause.title}`;
  g.fillStyle = pillar.color;
  g.fillText(truncate(g, what, W - pad * 2), pad, W + 182);

  g.fillStyle = 'rgba(246,232,214,0.5)';
  g.font = '400 20px "Inter", system-ui, sans-serif';
  g.fillText(`Lynia · ${edition.artwork.title} · d’après ${edition.artist.name}`, pad, H - 48);
  g.textAlign = 'right';
  g.fillText(donation.certificate ?? '', W - pad, H - 48);
  return c;
}

function truncate(g, text, max) {
  if (g.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 3 && g.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

export async function shareOrDownload(canvas, filename, text) {
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'downloaded';
}
