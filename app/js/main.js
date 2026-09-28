import { EDITION } from './data/edition.js';
import { CAUSES, PILLARS, causeById, pillarOf } from './data/causes.js';
import { CITIES, cityByName } from './data/cities.js';
import { allocate, unitsFunded, describeUnits, formatEuros, PLATFORM_RATE } from './core/impact.js';
import { STAGES, trackDonation, causeTotals, editionTotals } from './core/ledger.js';
import { jitterLocation, spanningLine, lineLengthKm, haversineKm } from './core/geo.js';
import { certificateCode, sha256Hex } from './core/certificate.js';
import { allDonations, myDonations, addDonation, donationById, nextHandNo } from './store.js';
import { HandStudio, loadImageFromFile, sampleHand, stylize, drawEnergyLine, drawCaption } from './ui/handArt.js';
import { LineMap } from './ui/lineMap.js';
import { renderShareCard, shareOrDownload } from './ui/shareCard.js';

const view = document.getElementById('view');
const today = () => new Date().toISOString().slice(0, 10);
let teardown = () => {};

// ---------- helpers ----------

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const $ = (sel, root = view) => root.querySelector(sel);
const $$ = (sel, root = view) => [...root.querySelectorAll(sel)];

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 3200);
}

const fmtDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const handLabel = (n) => `Main n° ${String(n).padStart(4, '0')}`;
const colorOfDonation = (d) => pillarOf(causeById(d.causeId)).color;

function handsForMap() {
  const mineIds = new Set(myDonations().map((d) => d.id));
  return allDonations().map((d) => ({ ...d, mine: mineIds.has(d.id) }));
}

function allocationBlock(amount, cause) {
  const a = allocate(amount, cause);
  const pillar = pillarOf(cause);
  const parts = [
    ['Reaches the programme', a.programme, pillar.color],
    [`Field partner running costs (${Math.round(cause.partnerOverhead * 100)}%)`, a.partner, 'rgba(246,232,214,0.45)'],
    [`Lynia platform (${Math.round(PLATFORM_RATE * 100)}%)`, a.platform, 'rgba(174,230,255,0.5)'],
    ['Card payment fees', a.payment, 'rgba(246,232,214,0.2)'],
  ];
  return `
    <p class="impact-callout">${esc(describeUnits(unitsFunded(a.programme, cause), cause))}</p>
    <div class="alloc-bar" role="img" aria-label="Breakdown of ${esc(formatEuros(amount))}">
      ${parts.map(([, v, c]) => `<span style="width:${(v / a.amount) * 100}%;background:${c}"></span>`).join('')}
    </div>
    <div class="alloc-legend">
      ${parts
        .map(
          ([label, v, c]) =>
            `<span><span class="dot" style="color:${c};background:${c};box-shadow:none"></span> ${esc(label)}</span><span class="v">${formatEuros(v, { decimals: 2 })}</span>`,
        )
        .join('')}
    </div>`;
}

function stagesBlock(track) {
  return `<ol class="stages">
    ${STAGES.map((s, i) => {
      const done = i <= track.stageIndex;
      const when = track.reached[s.id];
      return `<li class="${done ? 'done' : ''} ${i === track.stageIndex ? 'current' : ''}">
        <b>${esc(s.label)}${when ? ` · <span class="muted">${fmtDate(when)}</span>` : ''}</b>
        <span>${esc(s.detail)}</span>
        ${s.id === 'verified' && done && track.batch?.report ? `<br><span class="small">${esc(track.batch.report.title)}. Evidence: ${esc(track.batch.report.evidence)}.</span>` : ''}
      </li>`;
    }).join('')}
  </ol>`;
}

function heroArt(canvas, { handNo = 1, cause = CAUSES[0] } = {}) {
  const size = canvas.width;
  const g = canvas.getContext('2d');
  g.drawImage(stylize(sampleHand(900), size), 0, 0);
  drawEnergyLine(
    g,
    [
      [0.36, 0.34],
      [0.33, 0.45],
      [0.34, 0.56],
      [0.4, 0.66],
      [0.5, 0.74],
    ],
    size,
    { strand: pillarOf(cause).color, seed: handNo },
  );
  drawCaption(g, size, { edition: EDITION, handNo, place: 'Nice', pillar: pillarOf(cause) });
}

// ---------- views ----------

function homeView() {
  const hands = allDonations();
  const totals = editionTotals(hands);
  const km = lineLengthKm(spanningLine(hands));
  view.innerHTML = `
    <section class="hero wrap">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">Édition ${String(EDITION.number).padStart(2, '0')} · ${esc(EDITION.artwork.title)} · ${esc(EDITION.artist.name)}</p>
          <h1>The art of giving</h1>
          <p class="lede">Every gift becomes a hand in a living artwork. Your palm, photographed and turned into a print after <em>${esc(EDITION.artwork.title)}</em>, joins the hand of the person who gave next door, and the next, until the whole community holds one line. And every euro is followed until someone on the ground confirms what it became.</p>
          <div class="manifesto">${EDITION.manifesto.map(esc).join('<br>')}</div>
          <div class="btn-row">
            <a class="btn" href="#/give">Give and add your hand</a>
            <a class="btn btn-ghost" href="#/line">See the line</a>
          </div>
        </div>
        <div class="hero-art"><canvas id="hero-canvas" width="900" height="900" aria-label="A hand turned into a print, its life line glowing and leaving the frame"></canvas></div>
      </div>
    </section>

    <section class="wrap">
      <div class="stats">
        <div class="stat"><b>${totals.hands.toLocaleString('en-GB')}</b><span>hands on the line</span></div>
        <div class="stat"><b>${totals.cities}</b><span>cities, ${totals.countries} countries</span></div>
        <div class="stat"><b>${Math.round(km).toLocaleString('en-GB')} km</b><span>length of the line</span></div>
        <div class="stat"><b>${formatEuros(totals.raised)}</b><span>given, every euro traced</span></div>
      </div>
      <p class="small" style="margin-top:10px">Demo community shown for the prototype.</p>
    </section>

    <section class="wrap">
      <p class="eyebrow">How it works</p>
      <h2>No more giving into a hole</h2>
      <div class="steps">
        <div class="card"><h3>Choose a cause</h3><p class="muted">Concrete projects with a named partner and a published unit cost: a school meal, a book, a square metre of roof.</p></div>
        <div class="card"><h3>See what it becomes</h3><p class="muted">Before you pay, see exactly how your €10, €30 or €500 splits, and what it buys on the ground.</p></div>
        <div class="card"><h3>Your hand becomes the art</h3><p class="muted">Photograph your palm and trace your life line. It becomes a numbered print of the edition, made on your phone.</p></div>
        <div class="card"><h3>Join the line</h3><p class="muted">Your hand lands in your neighbourhood and connects to the nearest hand. Share it: not “I gave”, but “I hold the line”.</p></div>
      </div>
    </section>

    <section class="wrap artist">
      <div>
        <p class="eyebrow">The first edition</p>
        <h2>${esc(EDITION.artwork.title)}<br><span class="muted" style="font-size:.6em">${esc(EDITION.artist.name)}</span></h2>
        <p>${esc(EDITION.artwork.description)}</p>
        <p class="muted">${esc(EDITION.artwork.context)} The platform takes her idea off the hoardings and across Europe, the Middle East and Africa: one hand per gift, one thread of energy from palm to palm.</p>
      </div>
      <div class="card">
        <dl class="facts">
          <dt>Artist</dt><dd>${esc(EDITION.artist.name)}, born ${esc(EDITION.artist.born)}</dd>
          <dt>Studios</dt><dd>${esc(EDITION.artist.studios)}</dd>
          <dt>Practice</dt><dd>${esc(EDITION.artist.practice)}</dd>
          <dt>Artwork</dt><dd><em>${esc(EDITION.artwork.title)}</em> (${esc(EDITION.artwork.translation)})</dd>
          <dt>Where</dt><dd>${esc(EDITION.artwork.place)}</dd>
          <dt>Edition</dt><dd>${fmtDate(EDITION.opens)} to ${fmtDate(EDITION.closes)}, then the anniversary</dd>
        </dl>
      </div>
    </section>

    <section class="wrap">
      <p class="eyebrow">Transparency</p>
      <h2>Every euro, followed</h2>
      <div class="give-grid">
        <div class="card">${stagesBlock(trackDonation({ amount: 30, date: '2026-05-10' }, CAUSES[1]))}</div>
        <div class="card"><p class="muted" style="margin:0">Example: €30 for ${esc(CAUSES[1].title.toLowerCase())}</p>${allocationBlock(30, CAUSES[1])}</div>
      </div>
    </section>`;
  heroArt($('#hero-canvas'));
}

function giveView(params) {
  const state = {
    step: 1,
    causeId: params.get('cause') ?? null,
    amount: 30,
    hasHand: false,
    city: null,
    consent: true,
  };
  const studioCanvas = document.createElement('canvas');
  studioCanvas.width = studioCanvas.height = 900;
  studioCanvas.className = 'studio-canvas';
  studioCanvas.setAttribute('aria-label', 'Your hand. Drag across your palm to trace your life line.');
  const studio = new HandStudio(studioCanvas, { onChange: () => renderSummary() });
  const STEPS = ['Cause', 'Amount', 'Your hand', 'Your place', 'Confirm'];

  view.innerHTML = `
    <section class="wrap">
      <p class="eyebrow">Give · Édition ${String(EDITION.number).padStart(2, '0')}</p>
      <h1 style="font-size:clamp(2.2rem,5vw,3.4rem)">Add your hand to the line</h1>
      <div class="stepper" id="stepper"></div>
      <div class="give-grid">
        <div id="step"></div>
        <aside class="card summary" id="summary" aria-live="polite"></aside>
      </div>
    </section>`;

  const cause = () => causeById(state.causeId);
  const canNext = () =>
    ({ 1: !!state.causeId, 2: state.amount >= 1, 3: state.hasHand, 4: !!state.city, 5: true })[state.step];

  function renderStepper() {
    $('#stepper').innerHTML = STEPS.map(
      (s, i) => `<span class="${i + 1 === state.step ? 'on' : i + 1 < state.step ? 'done' : ''}">${i + 1}. ${s}</span>`,
    ).join('');
  }

  function renderSummary() {
    const c = cause();
    const box = $('#summary');
    if (!box) return;
    if (!c) {
      box.innerHTML = `<h3>Your gift</h3><p class="muted">Choose a cause to see exactly where your money goes.</p>`;
      return;
    }
    const p = pillarOf(c);
    box.innerHTML = `
      <div class="cause-meta"><span class="dot" style="color:${p.color};background:${p.color}"></span>${esc(p.label)} · ${esc(c.place)}</div>
      <h3>${esc(c.title)}</h3>
      <p class="muted" style="margin:0">${formatEuros(state.amount)} becomes</p>
      ${allocationBlock(state.amount, c)}
      ${state.city ? `<p class="small" style="margin:14px 0 0">Your hand lands near ${esc(state.city.name)} and holds the nearest hand’s line.</p>` : ''}`;
    studio.setStrand(p.color);
  }

  function nav() {
    return `<div class="btn-row" style="margin-top:22px">
      ${state.step > 1 ? '<button class="btn btn-ghost" data-back>Back</button>' : ''}
      ${state.step < 5 ? `<button class="btn" data-next ${canNext() ? '' : 'disabled'}>Continue</button>` : ''}
    </div>`;
  }

  function refreshNext() {
    const b = $('[data-next]');
    if (b) b.disabled = !canNext();
  }

  function renderStep() {
    renderStepper();
    const el = $('#step');
    if (state.step === 1) {
      el.innerHTML = `
        <h2>Which line do you want to hold?</h2>
        <p class="muted">Every cause has a field partner, a concrete unit and monthly proof of delivery.</p>
        <div class="grid" role="radiogroup">
          ${CAUSES.map((c) => {
            const p = pillarOf(c);
            return `<button class="card" data-cause="${c.id}" aria-pressed="${state.causeId === c.id}">
              <div class="cause-meta"><span class="dot" style="color:${p.color};background:${p.color}"></span>${esc(p.label)} · ${esc(c.place)}</div>
              <h3>${esc(c.title)}</h3>
              <p class="muted small" style="margin:0">${formatEuros(c.unit.cost, { decimals: c.unit.cost < 1 ? 2 : 0 })} = one ${esc(c.unit.singular)}</p>
            </button>`;
          }).join('')}
        </div>${nav()}`;
      $$('[data-cause]').forEach((b) =>
        b.addEventListener('click', () => {
          state.causeId = b.dataset.cause;
          $$('[data-cause]').forEach((x) => x.setAttribute('aria-pressed', x === b));
          renderSummary();
          refreshNext();
        }),
      );
    } else if (state.step === 2) {
      const presets = [10, 20, 30, 50, 100, 500];
      el.innerHTML = `
        <h2>How much?</h2>
        <p class="muted">The breakdown on the right is exactly what we will publish for your gift.</p>
        <div class="amounts">${presets
          .map((v) => `<button class="chip" data-amount="${v}" aria-pressed="${state.amount === v}">${formatEuros(v)}</button>`)
          .join('')}</div>
        <label class="small" for="custom">Or another amount (€)</label>
        <input id="custom" type="number" min="1" step="1" inputmode="numeric" value="${presets.includes(state.amount) ? '' : state.amount}" placeholder="e.g. 75" style="max-width:200px">
        ${nav()}`;
      $$('[data-amount]').forEach((b) =>
        b.addEventListener('click', () => {
          state.amount = Number(b.dataset.amount);
          $('#custom').value = '';
          $$('[data-amount]').forEach((x) => x.setAttribute('aria-pressed', x === b));
          renderSummary();
          refreshNext();
        }),
      );
      $('#custom').addEventListener('input', (e) => {
        const v = Math.floor(Number(e.target.value));
        if (v >= 1) {
          state.amount = Math.min(v, 100000);
          $$('[data-amount]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
          renderSummary();
        }
        refreshNext();
      });
    } else if (state.step === 3) {
      el.innerHTML = `
        <h2>Your hand becomes the art</h2>
        <p class="muted">Photograph your open palm, fingers up, in soft light. Then drag your finger along your life line: the thread of energy follows it and runs off both edges, towards the hands beside yours.</p>
        <div class="studio">
          <div class="studio-empty" id="studio-slot">
            ${state.hasHand ? '' : '<div class="hint">Your print will appear here</div>'}
          </div>
          <div>
            <div class="btn-row" style="flex-direction:column;align-items:stretch">
              <label class="btn file-btn">Take or upload a photo<input type="file" accept="image/*" capture="user" id="file"></label>
              <button class="btn btn-ghost" id="sample">Try with a sample hand</button>
              <button class="btn btn-ghost" id="reset-line" ${state.hasHand ? '' : 'disabled'}>Reset the line</button>
            </div>
            <p class="privacy-note" style="margin-top:16px">Your photo never leaves this device. It is turned into a softened print right here (palm-print detail is blurred away), and only that print is kept.</p>
          </div>
        </div>${nav()}`;
      $('#studio-slot').prepend(studioCanvas);
      const ready = () => {
        state.hasHand = true;
        $('.hint')?.remove();
        $('#reset-line').disabled = false;
        refreshNext();
      };
      $('#file').addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          studio.setSource(await loadImageFromFile(file));
          ready();
          toast('Now trace your life line with your finger');
        } catch (err) {
          toast(err.message);
        }
      });
      $('#sample').addEventListener('click', () => {
        studio.setSource(sampleHand());
        ready();
        toast('Drag across the palm to trace a life line');
      });
      $('#reset-line').addEventListener('click', () => studio.resetLine());
    } else if (state.step === 4) {
      const byCountry = CITIES.reduce((m, c) => ((m[c.country] ??= []).push(c), m), {});
      el.innerHTML = `
        <h2>Where does your hand land?</h2>
        <p class="muted">We place your hand in your city, shifted by 0.6–3 km so it shows a neighbourhood, never an address. We do not use your IP address.</p>
        <label class="small" for="city">Your city</label>
        <select id="city">
          <option value="">Choose a city…</option>
          ${Object.entries(byCountry)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(
              ([country, list]) =>
                `<optgroup label="${esc(country)}">${list
                  .map((c) => `<option ${state.city?.name === c.name ? 'selected' : ''}>${esc(c.name)}</option>`)
                  .join('')}</optgroup>`,
            )
            .join('')}
        </select>
        <div class="btn-row" style="margin:12px 0 18px"><button class="btn btn-ghost btn-small" id="locate">Find my nearest city</button></div>
        <label class="check"><input type="checkbox" id="consent" ${state.consent ? 'checked' : ''}> Show my hand on the public line (the print, the city and the cause, never my name or amount).</label>
        ${nav()}`;
      $('#city').addEventListener('change', (e) => {
        state.city = cityByName(e.target.value) ?? null;
        renderSummary();
        refreshNext();
      });
      $('#consent').addEventListener('change', (e) => (state.consent = e.target.checked));
      $('#locate').addEventListener('click', () => {
        if (!navigator.geolocation) return toast('Location is not available in this browser');
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            // Only used to pick the nearest listed city; the coordinates are not kept.
            const here = { lat: coords.latitude, lon: coords.longitude };
            const nearest = CITIES.reduce((best, c) => (haversineKm(here, c) < haversineKm(here, best) ? c : best));
            state.city = nearest;
            $('#city').value = nearest.name;
            renderSummary();
            refreshNext();
            toast(`Nearest city: ${nearest.name}`);
          },
          () => toast('Location not shared. Choose your city from the list.'),
          { maximumAge: 600000, timeout: 10000 },
        );
      });
    } else if (state.step === 5) {
      const c = cause();
      el.innerHTML = `
        <h2>Hold the line</h2>
        <div class="card">
          <p><b>${formatEuros(state.amount)}</b> to <b>${esc(c.title)}</b> (${esc(c.place)})</p>
          <p class="muted">Your hand, ${handLabel(nextHandNo())} of the edition, lands near <b>${esc(state.city.name)}</b>${state.consent ? '' : ' (visible only to you)'}.</p>
          <p class="small">Prototype: no payment is taken. In production this is a card or wallet payment to the ring-fenced account of the cause, with a tax receipt where the partner is eligible.</p>
        </div>
        <div class="btn-row" style="margin-top:22px">
          <button class="btn btn-ghost" data-back>Back</button>
          <button class="btn" id="pay">Give ${formatEuros(state.amount)} (demo)</button>
        </div>`;
      $('#pay').addEventListener('click', async (e) => {
        e.target.disabled = true;
        const d = await createDonation(state, studio);
        location.hash = `#/hand/${d.id}`;
      });
    }
    $('[data-back]')?.addEventListener('click', () => {
      state.step -= 1;
      renderStep();
    });
    $('[data-next]')?.addEventListener('click', () => {
      if (!canNext()) return;
      state.step += 1;
      renderStep();
      window.scrollTo(0, 0);
    });
  }

  if (state.causeId && causeById(state.causeId)) state.step = 2;
  else state.causeId = null;
  renderStep();
  renderSummary();
}

async function createDonation(state, studio) {
  const c = causeById(state.causeId);
  const pillar = pillarOf(c);
  const handNo = nextHandNo();
  const id = `me-${Date.now().toString(36)}`;
  const date = today();
  const artDigest = await sha256Hex(JSON.stringify(studio.points));
  const certificate = await certificateCode({
    edition: EDITION.code,
    handNo,
    causeId: c.id,
    date,
    city: state.city.name,
    artDigest,
  });
  const art = studio.exportArt({ edition: EDITION, handNo, place: state.city.name, pillar, certificate });
  const donation = {
    id,
    handNo,
    date,
    amount: state.amount,
    causeId: c.id,
    city: state.city.name,
    country: state.city.country,
    ...jitterLocation(state.city, id),
    public: state.consent,
    certificate,
    art,
  };
  const { persisted } = addDonation(donation);
  if (!persisted) toast('Saved for this visit only: this browser is not keeping data');
  updateMineCount();
  return donation;
}

function handView(id) {
  const d = donationById(id);
  if (!d) {
    view.innerHTML = `<section class="wrap empty"><h2>This hand is not on this device</h2><p class="muted">Hands you give from this browser are kept here.</p><a class="btn" href="#/give">Give and add your hand</a></section>`;
    return;
  }
  const c = causeById(d.causeId);
  const p = pillarOf(c);
  const track = trackDonation(d, c, today());
  const isMine = myDonations().some((m) => m.id === d.id);
  const totals = editionTotals(allDonations());
  view.innerHTML = `
    <section class="wrap">
      <div class="hand-grid">
        <div>
          ${d.art ? `<img class="art" src="${d.art}" alt="${esc(handLabel(d.handNo))}, ${esc(EDITION.artwork.title)} after ${esc(EDITION.artist.name)}">` : `<div class="hero-art"><canvas id="demo-art" width="720" height="720"></canvas></div>`}
          ${d.certificate ? `<p class="cert" style="margin-top:12px">Certificate ${esc(d.certificate)} · ${esc(EDITION.code)} · ${fmtDate(d.date)}</p>` : ''}
        </div>
        <div>
          <p class="eyebrow">${esc(handLabel(d.handNo))} · ${esc(d.city)}${d.demo ? ' · demo' : ''}</p>
          <h2>${isMine ? 'You hold the line' : 'A hand on the line'}</h2>
          <div class="cause-meta"><span class="dot" style="color:${p.color};background:${p.color}"></span>${esc(p.label)} · ${esc(c.place)}</div>
          <p><a href="#/cause/${c.id}">${esc(c.title)}</a></p>
          <div class="card" style="margin:18px 0">
            <h3>Where is this gift?</h3>
            ${stagesBlock(track)}
          </div>
          ${isMine ? `<div class="card" style="margin-bottom:18px"><h3>What ${formatEuros(d.amount)} became</h3>${allocationBlock(d.amount, c)}</div>` : ''}
          <div class="btn-row"><a class="btn btn-ghost" href="#/line/${d.id}">See it on the line</a></div>
        </div>
      </div>
    </section>
    ${
      isMine && d.art
        ? `<section class="wrap">
      <p class="eyebrow">Share</p>
      <h2>Not “I gave”. “I hold the line.”</h2>
      <div class="share-grid">
        <div><canvas id="share-preview" class="share-preview" width="1080" height="1350"></canvas></div>
        <div>
          <label class="check" style="margin-bottom:16px"><input type="checkbox" id="show-amount"> Show the amount on my card</label>
          <div class="btn-row"><button class="btn" id="share">Share my hand</button></div>
          <p class="small" style="margin-top:12px">The card carries your certificate, so anyone can check it against the public ledger.</p>
        </div>
      </div>
    </section>`
        : ''
    }`;

  if (!d.art) heroArt($('#demo-art'), { handNo: d.handNo, cause: c });
  if (isMine && d.art) {
    let card;
    const draw = async () => {
      card = await renderShareCard({ donation: d, cause: c, pillar: p, edition: EDITION, totals, showAmount: $('#show-amount').checked });
      const prev = $('#share-preview');
      prev.getContext('2d').drawImage(card, 0, 0);
    };
    draw();
    $('#show-amount').addEventListener('change', draw);
    $('#share').addEventListener('click', async () => {
      const r = await shareOrDownload(
        card,
        `ligne-de-vie-${String(d.handNo).padStart(4, '0')}.png`,
        `Je tiens la ligne. ${handLabel(d.handNo)}, ${EDITION.artwork.title} d’après ${EDITION.artist.name}.`,
      );
      if (r === 'downloaded') toast('Your card was saved');
    });
  }
}

function mountMap(canvas, hands) {
  const map = new LineMap(canvas, { colorOf: colorOfDonation });
  map.setHands(hands);
  return map;
}

function lineView(focusId) {
  const hands = handsForMap().filter((h) => h.public !== false || h.mine);
  const edges = spanningLine(hands);
  const totals = editionTotals(hands);
  view.innerHTML = `
    <div class="map-shell">
      <canvas class="map-canvas" id="map" aria-label="Map of every hand, joined by the line"></canvas>
      <div class="map-overlay">
        <div class="map-title">
          <h1>The line</h1>
          <p class="small" style="margin:4px 0 0">${totals.hands.toLocaleString('en-GB')} hands · ${totals.cities} cities · ${Math.round(lineLengthKm(edges)).toLocaleString('en-GB')} km of line. Each hand holds its nearest neighbour’s.</p>
        </div>
        <div class="map-filters" role="group" aria-label="Highlight a cause">
          <button class="chip" data-filter="" aria-pressed="true">All causes</button>
          ${CAUSES.map((c) => {
            const p = pillarOf(c);
            return `<button class="chip" data-filter="${c.id}" aria-pressed="false"><span class="dot" style="color:${p.color};background:${p.color}"></span>${esc(p.label)} · ${esc(c.place.split(',')[0])}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="map-controls">
        <button id="zin" aria-label="Zoom in">+</button>
        <button id="zout" aria-label="Zoom out">−</button>
        <button id="zfit" aria-label="Show all of EMEA">◎</button>
        ${myDonations().length ? '<button id="zme" aria-label="Go to my hand">✋</button>' : ''}
      </div>
      <div class="hand-panel" id="panel" hidden></div>
    </div>`;
  const map = mountMap($('#map'), hands);
  const panel = $('#panel');
  map.onSelect = (h) => {
    if (!h) {
      panel.hidden = true;
      return;
    }
    const c = causeById(h.causeId);
    const p = pillarOf(c);
    const i = hands.indexOf(h);
    const neighbours = edges
      .filter((e) => e.from === i || e.to === i)
      .map((e) => hands[e.from === i ? e.to : e.from]);
    panel.hidden = false;
    panel.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      ${h.art ? `<img src="${h.art}" alt="">` : ''}
      <p class="eyebrow" style="margin-bottom:6px">${esc(handLabel(h.handNo))}${h.mine ? ' · yours' : h.demo ? ' · demo' : ''}</p>
      <div class="cause-meta"><span class="dot" style="color:${p.color};background:${p.color}"></span>${esc(p.label)} · ${esc(c.place)}</div>
      <p style="margin:0 0 6px">${esc(h.city)} · joined ${fmtDate(h.date)}</p>
      <p class="small">Holds the line of ${neighbours.length} ${neighbours.length === 1 ? 'hand' : 'hands'}: ${neighbours
        .slice(0, 3)
        .map((n) => esc(n.city))
        .join(', ')}${neighbours.length > 3 ? '…' : ''}</p>
      <a class="btn btn-small btn-ghost" href="#/hand/${h.id}">${h.mine ? 'My gift' : 'Open'}</a>`;
    panel.querySelector('.close').addEventListener('click', () => {
      panel.hidden = true;
      map.selected = null;
    });
  };
  $$('[data-filter]').forEach((b) =>
    b.addEventListener('click', () => {
      map.highlight = b.dataset.filter || null;
      $$('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    }),
  );
  $('#zin').addEventListener('click', () => map.zoomBy(1.8));
  $('#zout').addEventListener('click', () => map.zoomBy(1 / 1.8));
  $('#zfit').addEventListener('click', () => map.resetView());
  const goTo = (h) => {
    map.flyTo(h.lon, h.lat, 60000);
    map.selected = hands.indexOf(h);
    map.onSelect(h);
  };
  $('#zme')?.addEventListener('click', () => goTo(hands.filter((h) => h.mine).at(-1)));
  const focus = focusId && hands.find((h) => h.id === focusId);
  if (focus) setTimeout(() => goTo(focus), 400);
  teardown = () => map.destroy();
}

function causesView() {
  const totals = causeTotals(allDonations(), CAUSES);
  view.innerHTML = `
    <section class="wrap">
      <p class="eyebrow">Causes · ${PILLARS.length} pillars</p>
      <h1 style="font-size:clamp(2.2rem,5vw,3.4rem)">Concrete, named, verified</h1>
      <p class="muted" style="max-width:44em">Each cause belongs to a pillar (${PILLARS.map((p) => p.label).join(', ')}) so that people who give to the same kind of cause find each other. To be listed, a cause needs a named field partner, a published unit cost and monthly proof of delivery.</p>
      <div class="grid" style="margin-top:24px">
        ${totals
          .map(({ cause: c, raised, units, hands, cities, progress }) => {
            const p = pillarOf(c);
            return `<a class="card" href="#/cause/${c.id}" style="text-decoration:none;color:inherit">
              <div class="cause-meta"><span class="dot" style="color:${p.color};background:${p.color}"></span>${esc(p.label)} · ${esc(c.place)}</div>
              <h3>${esc(c.title)}</h3>
              <div class="progress"><span style="width:${(progress ?? 0) * 100}%;background:${p.color};color:${p.color}"></span></div>
              <p class="small" style="margin:0 0 10px">${formatEuros(Math.round(raised))} of ${formatEuros(c.goal)} · ${hands} hands in ${cities} cities</p>
              <p style="margin:0;font:italic 400 1.3rem/1.2 var(--serif)">${esc(describeUnits(units, c))} so far</p>
            </a>`;
          })
          .join('')}
      </div>
    </section>`;
}

function causeView(id) {
  const c = causeById(id);
  if (!c) return notFound();
  const p = pillarOf(c);
  const [t] = causeTotals(allDonations(), [c]);
  const donors = allDonations().filter((d) => d.causeId === id);
  const topCities = Object.entries(donors.reduce((m, d) => ((m[d.city] = (m[d.city] ?? 0) + 1), m), {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const now = today();
  const batches = c.batches.filter((b) => b.cutoff <= now).reverse();
  const stageOf = (b) =>
    b.verifiedOn <= now ? 'verified' : b.deployedOn <= now ? 'deployed' : b.transferredOn <= now ? 'transferred' : 'received';
  view.innerHTML = `
    <section class="wrap">
      <div class="cause-meta"><span class="dot" style="color:${p.color};background:${p.color}"></span>${esc(p.label)} · ${esc(c.place)} · demo cause</div>
      <h1 style="font-size:clamp(2.2rem,5vw,3.4rem)">${esc(c.title)}</h1>
      <div class="give-grid">
        <div>
          <p style="font-size:1.1rem">${esc(c.story)}</p>
          <p class="muted">Field partner: ${esc(c.partner)}. Unit: one ${esc(c.unit.singular)} = ${formatEuros(c.unit.cost, { decimals: c.unit.cost < 1 ? 2 : 0 })}.</p>
          <div class="stats" style="margin:24px 0">
            <div class="stat"><b>${formatEuros(Math.round(t.raised))}</b><span>of ${formatEuros(c.goal)}</span></div>
            <div class="stat"><b>${t.hands}</b><span>hands, ${t.cities} cities</span></div>
            <div class="stat"><b>${Math.floor(t.units).toLocaleString('en-GB')}</b><span>${esc(c.unit.plural)}</span></div>
          </div>
          <h3>Monthly proof</h3>
          <p class="small">Gifts are pooled each month, wired to the partner, spent, then verified with evidence.</p>
          ${batches
            .map(
              (b) => `<div class="batch">
                <span class="muted">${new Date(`${b.cutoff}T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                <span>${esc(b.report.title)}<br><span class="small">${esc(b.report.evidence)}</span></span>
                <span class="badge ${stageOf(b)}">${esc(STAGES.find((s) => s.id === stageOf(b)).label)}</span>
              </div>`,
            )
            .join('')}
        </div>
        <aside class="card summary">
          <h3>The community</h3>
          <p class="small">Hands holding this line come from:</p>
          <p>${topCities.map(([city, n]) => `${esc(city)} <span class="muted">(${n})</span>`).join(' · ')}</p>
          <p class="muted" style="margin:18px 0 0">A €30 gift becomes</p>
          ${allocationBlock(30, c)}
          <div class="btn-row" style="margin-top:18px"><a class="btn" href="#/give?cause=${c.id}">Hold this line</a></div>
        </aside>
      </div>
    </section>`;
}

function anniversaryView() {
  const hands = handsForMap().filter((h) => h.public !== false || h.mine);
  const totals = editionTotals(hands);
  const km = lineLengthKm(spanningLine(hands));
  const perCause = causeTotals(hands, CAUSES);
  const max = Math.max(...perCause.map((t) => t.raised));
  view.innerHTML = `
    <section class="wrap">
      <p class="eyebrow">Anniversary · ${fmtDate(EDITION.closes)}</p>
      <h1 style="font-size:clamp(2.2rem,5vw,3.4rem)">One year, one line</h1>
      <p class="muted" style="max-width:46em">When the edition closes, the whole line is unveiled: every hand, where it held on, and what the community made real, cause by cause. Then the line passes to the next artist, and the community carries on holding it.</p>
      <div class="stats" style="margin:24px 0">
        <div class="stat"><b>${totals.hands.toLocaleString('en-GB')}</b><span>hands</span></div>
        <div class="stat"><b>${totals.countries}</b><span>countries</span></div>
        <div class="stat"><b>${Math.round(km).toLocaleString('en-GB')} km</b><span>of line</span></div>
        <div class="stat"><b>${formatEuros(totals.raised)}</b><span>given</span></div>
      </div>
      <div class="map-inline"><canvas class="map-canvas" id="map"></canvas>
        <div class="map-controls"><button id="replay" aria-label="Replay the year">▶</button></div>
      </div>
      <p class="small" style="margin-top:8px">Press ▶ to replay the year: each hand appears on the day it joined.</p>
    </section>
    <section class="wrap">
      <h2>What the line made real</h2>
      <div class="bars">
        ${perCause
          .map(({ cause: c, raised, units }) => {
            const p = pillarOf(c);
            return `<div class="bar-row">
              <span>${esc(c.title)}<br><span class="small">${esc(describeUnits(units, c))}</span></span>
              <div class="track"><span style="width:${(raised / max) * 100}%;background:${p.color}"></span></div>
              <span class="v">${formatEuros(Math.round(raised))}</span>
            </div>`;
          })
          .join('')}
      </div>
    </section>
    <section class="wrap">
      <h2>The line passes on</h2>
      <div class="grid">
        <div class="card"><p class="eyebrow">Édition 01</p><h3>${esc(EDITION.artwork.title)}</h3><p class="muted">${esc(EDITION.artist.name)} · ${fmtDate(EDITION.opens)} to ${fmtDate(EDITION.closes)}</p></div>
        <div class="card" style="border-style:dashed"><p class="eyebrow">Édition 02</p><h3>A new artist</h3><p class="muted">Chosen with the community. Every hand from Édition 01 stays on the map, and the new line starts from it.</p></div>
      </div>
    </section>`;
  const map = mountMap($('#map'), hands);
  let timer = null;
  $('#replay').addEventListener('click', () => {
    clearInterval(timer);
    map.reveal = 0;
    const perTick = Math.max(1, Math.ceil(hands.length / 240));
    timer = setInterval(() => {
      map.reveal += perTick;
      if (map.reveal >= hands.length) {
        map.reveal = Infinity;
        clearInterval(timer);
      }
    }, 40);
  });
  teardown = () => {
    clearInterval(timer);
    map.destroy();
  };
}

function mineView() {
  const mine = myDonations();
  if (!mine.length) {
    view.innerHTML = `<section class="wrap empty"><h2>No hand yet</h2><p class="muted">Your prints and their journey will appear here.</p><a class="btn" href="#/give">Give and add your hand</a></section>`;
    return;
  }
  view.innerHTML = `
    <section class="wrap">
      <p class="eyebrow">My hands</p>
      <h1 style="font-size:clamp(2.2rem,5vw,3.4rem)">The lines you hold</h1>
      <div class="grid">
        ${mine
          .slice()
          .reverse()
          .map((d) => {
            const c = causeById(d.causeId);
            const t = trackDonation(d, c, today());
            return `<a class="card" href="#/hand/${d.id}" style="text-decoration:none;color:inherit">
              <img src="${d.art}" alt="" style="border-radius:10px;margin-bottom:12px">
              <p class="eyebrow" style="margin-bottom:6px">${esc(handLabel(d.handNo))} · ${esc(d.city)}</p>
              <h3>${esc(c.title)}</h3>
              <span class="badge ${t.stage}">${esc(STAGES[t.stageIndex].label)}</span>
            </a>`;
          })
          .join('')}
      </div>
    </section>`;
}

function notFound() {
  view.innerHTML = `<section class="wrap empty"><h2>Nothing here</h2><a class="btn" href="#/">Back home</a></section>`;
}

// ---------- router ----------

function updateMineCount() {
  const n = myDonations().length;
  document.getElementById('nav-mine').textContent = n ? `My hands (${n})` : 'My hands';
}

function route() {
  teardown();
  teardown = () => {};
  const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query);
  const [head, arg] = parts;
  document.querySelectorAll('.nav a').forEach((a) => {
    const target = a.getAttribute('href').replace('#/', '');
    a.toggleAttribute('aria-current', target === (head ?? ''));
    if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page');
  });
  const routes = {
    undefined: () => homeView(),
    give: () => giveView(params),
    line: () => lineView(arg),
    causes: () => causesView(),
    cause: () => causeView(arg),
    hand: () => handView(arg),
    anniversary: () => anniversaryView(),
    mine: () => mineView(),
  };
  (routes[head] ?? notFound)();
  window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
}

window.addEventListener('hashchange', route);
updateMineCount();
route();
