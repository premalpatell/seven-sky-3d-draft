/* Seven Sky · interactive explorer (draft, 26 Nov 2026)
   Hero: hover a floor of Tower A → site plan: tower, floor, flat → 3D cutaway of the flat → inside a room.
   All plan data comes from the project brochure (unit plans + typical floor plan). */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const WA = '917433886565';
const IMG = 'assets/img/';
const EXP = 'assets/explorer/';

/* ───────── Data (brochure) ───────── */
// Room pins are in feet from the top-left of each plan crop (see website-tools/explorer notes).
const TYPES = {
  1: { name: 'Type I', towers: 'A, B & C', carpet: 533, plan: 'type1', rooms: [
    { name: 'Living Room', size: `14'-0" × 10'-0"`, at: [27.8, 17.7], photos: ['living-1', 'living-2'] },
    { name: 'Kitchen / Dining', size: `12'-3" × 8'-0"`, at: [26.1, 11.2], photos: ['kitchen-1', 'kitchen-2'] },
    { name: 'Bedroom 1', size: `10'-0" × 11'-0"`, at: [15.0, 11.9], photos: ['bedroom'] },
    { name: 'Bedroom 2', size: `10'-0" × 10'-0"`, at: [5.8, 24.1], photos: ['bedroom'] },
    { name: 'Balcony', size: `4'-3" × 4'-0"`, at: [31.3, 6.5], photos: ['balcony-1', 'balcony-2'] },
    { name: 'Toilet 1', size: `4'-0" × 7'-0"` },
    { name: 'Toilet 2', size: `6'-6" × 4'-0"` },
    { name: 'Wash area', size: `8'-0" × 3'-9"` },
    { name: 'Bedroom balcony', size: `2'-0" wide` }
  ] },
  2: { name: 'Type II', towers: 'D & E', carpet: 553, plan: 'type2', rooms: [
    { name: 'Living / Dining', size: `16'-0" × 10'-0"`, at: [22.6, 13.9], photos: ['living-1', 'living-2'] },
    { name: 'Kitchen', size: `8'-0" × 7'-6"`, at: [34.0, 7.9], photos: ['kitchen-1', 'kitchen-2'] },
    { name: 'Bedroom 1', size: `10'-0" × 11'-0"`, at: [8.4, 12.5], photos: ['bedroom'] },
    { name: 'Bedroom 2', size: `10'-0" × 10'-3"`, at: [22.3, 7.4], photos: ['bedroom'] },
    { name: 'Balcony', size: `3'-9" × 5'-3"`, at: [13.4, 18.1], photos: ['balcony-1', 'balcony-2'] },
    { name: 'Toilet 1', size: `4'-0" × 7'-0"` },
    { name: 'Toilet 2', size: `4'-0" × 5'-9"` },
    { name: 'Wash area', size: `8'-0" × 3'-3"` },
    { name: 'Bedroom balcony', size: `2'-0" wide` }
  ] },
  3: { name: 'Type III', towers: 'F & G', carpet: 573, plan: 'type3', rooms: [
    { name: 'Living Room', size: `14'-0" × 10'-0"`, at: [19.3, 22.9], photos: ['living-1', 'living-2'] },
    { name: 'Kitchen', size: `14'-0" × 7'-6"`, at: [18.5, 11.7], photos: ['kitchen-1', 'kitchen-2'] },
    { name: 'Bedroom 1', size: `11'-0" × 10'-0"`, at: [7.3, 8.7], photos: ['bedroom'] },
    { name: 'Bedroom 2', size: `10'-0" × 10'-0"`, at: [7.3, 14.0], photos: ['bedroom'] },
    { name: 'Balcony', size: `4'-6" × 4'-3"`, at: [9.9, 23.7], photos: ['balcony-1', 'balcony-2'] },
    { name: 'Toilet 1', size: `4'-0" × 7'-0"` },
    { name: 'Toilet 2', size: `4'-0" × 5'-6"` },
    { name: 'Wash area', size: `6'-6" × 4'-0"` },
    { name: 'Bedroom balcony', size: `2'-0" wide` }
  ] }
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
// c = tower label, u = flat number labels, as positioned on the brochure's typical floor plan.
// ready: A, F and G are the towers handing over from December 2026 (client, Oct 2026).
const TOWERS = {
  A: { type: 1, floors: range(2, 7), ready: true,  c: [1385, 390], u: { '01': [1372, 343], '02': [1407, 343], '04': [1372, 437], '03': [1407, 437] } },
  B: { type: 1, floors: range(1, 7), ready: false, c: [1140, 342], u: { '04': [1107, 315], '01': [1177, 315], '03': [1107, 370], '02': [1177, 370] } },
  C: { type: 1, floors: range(1, 7), ready: false, c: [905, 342],  u: { '04': [872, 315], '01': [940, 315], '03': [872, 370], '02': [940, 370] } },
  D: { type: 2, floors: range(1, 7), ready: false, c: [718, 407],  u: { '01': [703, 340], '02': [738, 340], '04': [703, 467], '03': [738, 467] } },
  E: { type: 2, floors: range(1, 7), ready: false, c: [588, 407],  u: { '04': [568, 340], '01': [601, 340], '03': [568, 467], '02': [601, 467] } },
  F: { type: 3, floors: range(1, 7), ready: true,  c: [358, 548],  u: { '02': [320, 510], '03': [398, 503], '01': [322, 555], '04': [398, 555] } },
  G: { type: 3, floors: range(1, 7), ready: true,  c: [340, 355],  u: { '04': [298, 337], '01': [377, 322], '03': [298, 377], '02': [377, 372] } }
};
const SITE = { x: 86, y: 95, w: 1828, h: 638 };           // crop of the brochure page used for siteplan.webp
const toPct = ([x, y]) => [(x - SITE.x) / SITE.w * 100, (y - SITE.y) / SITE.h * 100];
const ord = n => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
const floorName = n => `${ord(n)} floor`;
const statusText = t => t.ready ? 'Possession from December 2026' : 'Under construction';
const waLink = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
const sufs = t => Object.keys(t.u).sort();

/* ───────── Hero: Tower A, floor by floor ───────── */
function initHero(openExplorer) {
  const sec = $('.xh'); if (!sec) return;
  const sticky = $('.xh__sticky', sec), stage = $('#xh-stage'), svg = $('#xh-floors');
  const tip = $('#xh-tip'), idx = $('#xh-index'), copy = $('#xh-copy'), hint = $('#xh-hint');
  const IW = 1908, IH = 1247, TX = 822;
  const NS = 'http://www.w3.org/2000/svg';

  // Floor bands traced on dusk-fg-1908.webp (image pixels). Tower A: shops on G + 1st, flats on 2nd to 7th.
  const bands = [];
  for (let k = 0; k < 6; k++) {
    const mt = 200 + 93 * k, lt = 285 + 84 * k;
    bands.push({ f: 7 - k, pts: [[535, lt], [725, lt], [725, mt], [965, mt], [1110, mt + 18], [1110, mt + 111], [965, mt + 93], [725, mt + 93], [725, lt + 84], [535, lt + 84]] });
  }
  bands.push({ f: 0, shop: true, pts: [[520, 792], [725, 792], [725, 760], [1140, 776], [1140, 985], [520, 985]] });

  const ty = TYPES[1];
  bands.forEach(b => {
    b.poly = document.createElementNS(NS, 'polygon');
    b.poly.setAttribute('points', b.pts.map(p => p.join(',')).join(' '));
    if (b.shop) b.poly.classList.add('is-shop');
    svg.appendChild(b.poly);
    const li = document.createElement('li');
    li.innerHTML = b.shop
      ? `<button type="button" class="is-shop" tabindex="-1"><b>G·1</b><span>Shops · sold</span></button>`
      : `<button type="button"><b>${b.f}</b><span>${floorName(b.f)}</span></button>`;
    b.btn = li.firstElementChild; idx.appendChild(li);
  });

  let hot = null, pinned = false;
  function setTip(b) {
    tip.classList.toggle('is-shop', !!b.shop);
    $('#xh-tip-t').textContent = b.shop ? 'Ground & 1st floor' : floorName(b.f).replace(/^./, c => c.toUpperCase());
    $('#xh-tip-m').textContent = b.shop ? '21 shops · all sold' : `4 homes · 2 BHK · ${ty.carpet} sq.ft · A-${b.f}01 to A-${b.f}04`;
  }
  function placeTip(x, y) {
    const r = sticky.getBoundingClientRect(), tw = tip.offsetWidth || 230, th = tip.offsetHeight || 140;
    let lx = x - r.left + 22, ly = y - r.top - th / 2;
    if (lx + tw > r.width - 12) lx = x - r.left - tw - 22;
    if (!finePointer) { lx = (r.width - tw) / 2; ly = y - r.top - th - 28; }   // touch: centred, above the finger
    lx = Math.max(12, Math.min(r.width - tw - 12, lx));
    ly = Math.max(84, Math.min(r.height - th - 12, ly));
    tip.style.left = lx + 'px'; tip.style.top = ly + 'px';
  }
  function setHot(b) {
    if (hot === b) return;
    hot?.poly.classList.remove('is-hot'); hot?.btn.classList.remove('is-hot');
    hot = b;
    if (b) { b.poly.classList.add('is-hot'); b.btn.classList.add('is-hot'); setTip(b); tip.hidden = false; }
    else if (!pinned) tip.hidden = true;
  }
  const go = b => { if (b && !b.shop) openExplorer({ tower: 'A', floor: b.f }); };

  bands.forEach(b => {
    b.poly.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { setHot(b); placeTip(e.clientX, e.clientY); } });
    b.poly.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') placeTip(e.clientX, e.clientY); });
    b.poly.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !pinned) setHot(null); });
    b.poly.addEventListener('click', e => {
      if (finePointer) return go(b);
      pinned = true; tip.classList.add('is-pinned'); setHot(null); setHot(b); placeTip(e.clientX, e.clientY);
    });
    b.btn.addEventListener('pointerenter', () => {
      setHot(b); const r = b.btn.getBoundingClientRect(); placeTip(r.left - (tip.offsetWidth || 230) - 40, r.top + r.height / 2);
    });
    b.btn.addEventListener('pointerleave', () => { if (!pinned) setHot(null); });
    b.btn.addEventListener('focus', () => b.btn.dispatchEvent(new Event('pointerenter')));
    b.btn.addEventListener('click', () => go(b));
  });
  if (finePointer) $('#xh-tip-go').innerHTML = 'Click to explore <svg class="icon"><use href="#i-arrow"/></svg>';
  $('#xh-tip-go').addEventListener('click', () => go(hot));
  document.addEventListener('click', e => {
    if (pinned && !e.target.closest('#xh-tip') && !e.target.closest('#xh-floors')) { pinned = false; tip.classList.remove('is-pinned'); setHot(null); }
  });

  // Desktop: fit the render to the screen height and slide it right so Tower A stands beside the
  // headline; its left edge fades into navy. Mobile: cover the screen with the tower centred.
  let W = 0, wantX = 0.66;
  function layout() {
    W = sticky.clientWidth; const H = sticky.clientHeight;
    const wide = W > 900;
    wantX = wide ? 0.66 : 0.5;
    let s = wide ? (H / IH) * 1.06 : Math.max(W / IW, H / IH);
    if (wide) s = Math.max(s, W * (1 - wantX) / (IW - TX), W * 0.26 / TX);   // no gap on the right; inset ≤ 40%
    const sw = IW * s, sh = IH * s;
    let left = W * wantX - TX * s;
    left = wide ? Math.max(W - sw, left) : Math.min(0, Math.max(W - sw, left));
    Object.assign(stage.style, { width: sw + 'px', height: sh + 'px', left: left + 'px', top: (H - sh) / 2 + 'px' });
    sec.classList.toggle('is-inset', wide && left > 0);
    onScroll();
  }
  // scroll: zoom into the tower (as in the reference reel), fade the headline, show the floor index
  function onScroll() {
    const r = sec.getBoundingClientRect(), span = sec.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, span)));
    if (!reduce) {
      const e = p * p * (3 - 2 * p);
      const shift = W > 900 ? -(wantX - 0.42) * W * e : 0;
      stage.style.transform = `translate3d(${shift}px,0,0) scale(${1 + 0.45 * e})`;
    }
    const o = Math.max(0, 1 - p * 2.2);
    copy.style.opacity = o; copy.style.pointerEvents = o < 0.3 ? 'none' : '';
    hint.style.opacity = p > 0.25 ? 0 : 1;
    sec.classList.toggle('is-zoomed', p > 0.4);
  }
  addEventListener('resize', layout); addEventListener('scroll', onScroll, { passive: true });
  layout();

  // one gentle scan up the tower so visitors see it is interactive
  if (!reduce) setTimeout(() => {
    const floors = bands.filter(b => !b.shop).reverse();
    floors.forEach((b, i) => {
      setTimeout(() => b.poly.classList.add('is-scan'), i * 140);
      setTimeout(() => b.poly.classList.remove('is-scan'), i * 140 + 520);
    });
  }, 1700);
}

/* ───────── Explorer overlay ───────── */
const xp = $('#xp');
const state = { view: null, tower: null, floor: null, unit: null, room: null, photo: 0, lastFocus: null };

function setView(name) {
  state.view = name;
  $$('.xp__view', xp).forEach(v => v.classList.toggle('is-active', v.dataset.view === name || (name === 'room' && v.dataset.view === 'unit')));
  renderCrumbs();
  if (name === 'unit' || name === 'room') three.start(); else three.stop();
}

function openExplorer(opts = {}) {
  if (xp.hidden) {
    state.lastFocus = document.activeElement;
    xp.hidden = false; document.body.classList.add('xp-open');
    requestAnimationFrame(() => xp.classList.add('is-open'));
    history.pushState({ xp: 1 }, '');
  }
  state.tower = opts.tower || null; state.floor = opts.floor || null; state.unit = null;
  const m = opts.unit && /^([A-G])-(\d)(\d\d)$/.exec(opts.unit);
  if (m) { state.tower = m[1]; state.floor = +m[2]; showUnit(m[3]); }
  else showSite();
  $('#xp-close').focus({ preventScroll: true });
}
function reallyClose() {
  xp.classList.remove('is-open'); document.body.classList.remove('xp-open'); three.stop();
  setTimeout(() => { if (!xp.classList.contains('is-open')) xp.hidden = true; }, 420);
  state.lastFocus?.focus?.({ preventScroll: true });
}
function closeExplorer() { if (history.state && history.state.xp) history.back(); else reallyClose(); }
addEventListener('popstate', () => { if (!xp.hidden) reallyClose(); });

function renderCrumbs() {
  const c = [];
  const link = (go, txt) => `<button type="button" data-go="${go}">${txt}</button>`;
  const here = txt => `<span aria-current="page">${txt}</span>`;
  const { view, tower, floor, unit } = state;
  c.push(view === 'site' && !tower ? here('All towers') : link('towers', 'All towers'));
  if (tower) c.push(view === 'site' ? here(`Tower ${tower}${floor ? ' · ' + floorName(floor) : ''}`) : link('tower', `Tower ${tower} · ${floorName(floor)}`));
  if (unit) c.push(view === 'unit' ? here(`Flat ${tower}-${floor}${unit}`) : link('unit', `Flat ${tower}-${floor}${unit}`));
  if (view === 'room') c.push(here(TYPES[TOWERS[tower].type].rooms[state.room].name));
  $('#xp-crumbs').innerHTML = c.join('<i aria-hidden="true">/</i>');
}

/* site plan */
let mapBuilt = false;
function buildMap() {
  const marks = $('#xp-marks');
  for (const [k, t] of Object.entries(TOWERS)) {
    const ty = TYPES[t.type], [x, y] = toPct(t.c);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'xp__tmark'; b.dataset.tower = k; b.style.left = x + '%'; b.style.top = y + '%';
    b.setAttribute('aria-label', `Tower ${k}, ${ty.name}, ${ty.carpet} sq.ft`);
    b.innerHTML = `${k}<span class="xp__tmark-lbl">${ty.name} · ${ty.carpet} sq.ft</span>`;
    marks.appendChild(b);
    for (const [suf, pos] of Object.entries(t.u)) {
      // push each marker out from the core onto its flat, so neighbouring labels never collide
      const dx = pos[0] - t.c[0], dy = pos[1] - t.c[1];
      const [ux, uy] = toPct([t.c[0] + Math.sign(dx) * Math.max(Math.abs(dx) * 1.6, 42), t.c[1] + Math.sign(dy) * Math.max(Math.abs(dy) * 1.6, 42)]);
      const u = document.createElement('button');
      u.type = 'button'; u.className = 'xp__umark'; u.dataset.utower = k; u.dataset.suf = suf; u.hidden = true;
      u.style.left = ux + '%'; u.style.top = uy + '%';
      marks.appendChild(u);
    }
  }
  new ResizeObserver(() => fitMap(false)).observe($('#xp-map'));
  mapBuilt = true;
}
function fitMap(animate = true) {
  const map = $('#xp-map'), inner = $('#xp-mapinner');
  const W = map.clientWidth, H = map.clientHeight, A = 4600 / 1605;
  if (!W || !H) return;
  let w = W, h = W / A; if (h > H) { h = H; w = H * A; }
  inner.style.width = w + 'px'; inner.style.height = h + 'px';
  // overview: zoom a little so the seven towers (13.9%–71.1% across the plan) fill the frame
  let k = Math.max(1, Math.min(1.35, (H * 0.9) / h, W / (w * 0.7)));
  let tx = W / 2 - k * w * 0.425, ty = H / 2 - k * h * 0.5;
  if (state.tower) {
    const [px, py] = toPct(TOWERS[state.tower].c);
    k = Math.max(1.8, Math.min(4.4, (0.5 * W) / (0.1 * w), (0.8 * H) / (0.36 * h)));
    tx = W / 2 - k * w * px / 100; ty = H / 2 - k * h * py / 100;
  }
  if (!animate) inner.style.transition = 'none';
  inner.style.transform = `translate(${tx}px,${ty}px) scale(${k})`;
  if (!animate) { void inner.offsetWidth; inner.style.transition = ''; }
  $('#xp-marks').style.setProperty('--s', (1 / k).toFixed(3));
  map.classList.toggle('has-tower', !!state.tower);
  $$('.xp__umark', map).forEach(u => {
    u.hidden = u.dataset.utower !== state.tower;
    u.textContent = state.floor ? `${u.dataset.utower}-${state.floor}${u.dataset.suf}` : `Flat ${u.dataset.suf}`;
  });
}
function showSite() {
  if (!mapBuilt) buildMap();
  setView('site'); renderSitePanel(); requestAnimationFrame(() => fitMap(true));
}
function renderSitePanel() {
  const p = $('#xp-site-panel'); p.scrollTop = 0;
  if (!state.tower) {
    p.innerHTML = `<p class="xp__kicker">Step 1 of 3</p>
      <h2 class="xp__h">Choose a tower</h2>
      <p class="xp__p">Seven G+7 towers around a central garden, jogging track and clubhouse. Pick a tower on the plan or from the list.</p>
      <p class="xp__sub">Towers</p>
      <div class="xp__towers">${Object.entries(TOWERS).map(([k, t]) => `
        <button type="button" class="xp__tower" data-tower="${k}"><b>${k}</b>
          <span>${TYPES[t.type].name} · ${TYPES[t.type].carpet} sq.ft · 2 BHK</span>
          <small>${statusText(t)}${k === 'A' ? ' · shops below' : ''}</small></button>`).join('')}
      </div>`;
    return;
  }
  const t = TOWERS[state.tower], ty = TYPES[t.type], f = state.floor;
  p.innerHTML = `<button type="button" class="xp__back" data-go="towers"><svg class="icon xp__flip"><use href="#i-arrow"/></svg>All towers</button>
    <p class="xp__kicker">Step 2 of 3 · Tower ${state.tower}</p>
    <h2 class="xp__h">${f ? floorName(f).replace(/^./, c => c.toUpperCase()) : 'Pick a floor'}</h2>
    <div class="xp__chips"><span>${ty.name}</span><span>2 BHK</span><span>${ty.carpet} sq.ft RERA carpet</span></div>
    <p style="margin-top:.8rem"><span class="xp__status${t.ready ? ' is-ready' : ''}">${statusText(t)}</span></p>
    <p class="xp__sub">Floor</p>
    <div class="xp__floors">${t.floors.map(n => `<button type="button" data-floor="${n}" aria-pressed="${n === f}">${n}</button>`).join('')}</div>
    ${f ? `<p class="xp__sub">Flats on this floor</p>
      <div class="xp__units">${sufs(t).map(s => `<button type="button" data-suf="${s}"><b>${state.tower}-${f}${s}</b><small>2 BHK · ${ty.carpet} sq.ft</small></button>`).join('')}</div>
      <p class="xp__note">Choose a flat here or on the plan to see it in 3D.</p>`
    : `<p class="xp__note">Each floor has 4 flats around 2 lifts and a staircase.${state.tower === 'A' ? ' The ground and 1st floors of Tower A are shops, all sold.' : ''}</p>`}`;
}
function selectTower(k) { state.tower = k; state.floor = null; renderSitePanel(); renderCrumbs(); fitMap(true); }
function selectFloor(n) { state.floor = n; renderSitePanel(); renderCrumbs(); fitMap(true); }

/* unit */
function showUnit(suf) {
  const t = TOWERS[state.tower];
  if (!state.floor) state.floor = t.floors[0];
  state.unit = suf; state.room = null;
  setView('unit'); renderUnitPanel();
  three.show(t.type);
}
function renderUnitPanel() {
  const t = TOWERS[state.tower], ty = TYPES[t.type], code = `${state.tower}-${state.floor}${state.unit}`;
  const msg = `Namaste! I'm interested in flat ${code} at Seven Sky (Tower ${state.tower}, ${floorName(state.floor)}, ${ty.name} 2 BHK, ${ty.carpet} sq.ft carpet). Please share the price and availability.`;
  $('#xp-unit-panel').scrollTop = 0;
  $('#xp-unit-panel').innerHTML = `<button type="button" class="xp__back" data-go="tower"><svg class="icon xp__flip"><use href="#i-arrow"/></svg>Tower ${state.tower} · ${floorName(state.floor)}</button>
    <p class="xp__kicker">Step 3 of 3 · Your home</p>
    <h2 class="xp__h">Flat ${code}</h2>
    <div class="xp__chips"><span>${ty.name}</span><span>2 BHK</span><span>${ty.carpet} sq.ft RERA carpet</span></div>
    <p style="margin-top:.8rem"><span class="xp__status${t.ready ? ' is-ready' : ''}">${statusText(t)}</span></p>
    <p class="xp__sub">Rooms</p>
    <ul class="xp__rooms">${ty.rooms.map((r, i) => `<li>${r.photos ? `<button type="button" data-room="${i}">${r.name}</button>` : r.name}<span>${r.size}</span></li>`).join('')}</ul>
    <div class="xp__price"><p>2 BHK from</p><strong>₹30.99 Lakh*</strong><small>The price depends on the tower and floor. Ask us for this flat's price.</small></div>
    <div class="xp__ctas">
      <a class="btn btn--wa" href="${waLink(msg)}" target="_blank" rel="noopener"><svg class="icon icon--fill"><use href="#i-wa"/></svg>Ask about ${code} on WhatsApp</a>
      <button class="btn btn--ghost" type="button" data-go="visit"><svg class="icon"><use href="#i-cal"/></svg>Book a free site visit</button>
    </div>
    <p class="xp__note">3D model built from the brochure's typical ${ty.name} plan; your flat may be its mirror image. Room sizes are from the brochure. Furniture is indicative. *Starting price; T&amp;C apply.</p>`;
}

/* room */
function showRoom(i) {
  const ty = TYPES[TOWERS[state.tower].type], r = ty.rooms[i];
  state.room = i; state.photo = 0;
  $('#xp-room-k').textContent = `Flat ${state.tower}-${state.floor}${state.unit} · ${ty.name}`;
  $('#xp-room-t').textContent = r.name;
  $('#xp-room-s').textContent = `${r.size} · size from the brochure plan`;
  $('#xp-room-next').hidden = r.photos.length < 2;
  setPhoto();
  setView('room');
  $('#xp-room-back').focus({ preventScroll: true });
}
function setPhoto() {
  const r = TYPES[TOWERS[state.tower].type].rooms[state.room], img = $('#xp-room-img');
  img.src = `${IMG}${r.photos[state.photo]}-1600.webp`;
  img.alt = `${r.name}, indicative interior`;
  img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
}
function backToPlan() { setView('unit'); three.flyBack(); }

/* events */
xp.addEventListener('click', e => {
  const el = e.target.closest('button, a'); if (!el || !xp.contains(el)) return;
  if (el.id === 'xp-close') return closeExplorer();
  if (el.id === 'xp-room-back') return backToPlan();
  if (el.id === 'xp-room-next') { const r = TYPES[TOWERS[state.tower].type].rooms[state.room]; state.photo = (state.photo + 1) % r.photos.length; return setPhoto(); }
  const d = el.dataset;
  if (d.go === 'towers') { state.tower = state.floor = state.unit = null; return showSite(); }
  if (d.go === 'tower') { state.unit = null; return showSite(); }
  if (d.go === 'unit') return backToPlan();
  if (d.go === 'visit') {
    const code = `${state.tower}-${state.floor}${state.unit}`, msg = $('#f-msg');
    if (msg && !msg.value) msg.value = `I'd like to see flat ${code} (${TYPES[TOWERS[state.tower].type].name}).`;
    closeExplorer(); setTimeout(() => $('#contact')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 450); return;
  }
  if (d.room) return three.flyTo(+d.room);
  if (d.tower && state.view === 'site') return selectTower(d.tower);
  if (d.floor) return selectFloor(+d.floor);
  if (d.suf) { if (d.utower) state.tower = d.utower; return showUnit(d.suf); }
});
// hover sync between list and plan
xp.addEventListener('pointerover', e => {
  const el = e.target.closest('[data-tower], [data-suf]'); if (!el) return;
  $$('.is-hot', $('#xp-site-panel')).concat($$('.xp__tmark.is-hot, .xp__umark.is-hot', xp)).forEach(n => n.classList.remove('is-hot'));
  if (el.dataset.tower && !state.tower) $$(`[data-tower="${el.dataset.tower}"]`, xp).forEach(n => n.classList.add('is-hot'));
  if (el.dataset.suf) $$(`[data-suf="${el.dataset.suf}"]`, xp).forEach(n => { if (!n.dataset.utower || n.dataset.utower === state.tower) n.classList.add('is-hot'); });
});
document.addEventListener('keydown', e => {
  if (xp.hidden || e.key !== 'Escape') return;
  if (state.view === 'room') backToPlan();
  else if (state.view === 'unit') { state.unit = null; showSite(); }
  else if (state.tower) { state.tower = state.floor = null; showSite(); }
  else closeExplorer();
});
// page hooks
document.addEventListener('click', e => {
  const o = e.target.closest('[data-xp-open], [data-xp-unit]'); if (!o) return;
  e.preventDefault();
  openExplorer(o.dataset.xpUnit ? { unit: o.dataset.xpUnit } : {});
});

/* ───────── 3D flat (three.js, loaded on first use) ───────── */
const three = {
  T: null, ok: false, running: false, typeId: null, pins: [], tween: null, saved: null,
  async init() {
    if (this.ok) return;
    const T = this.T = await import('three');
    const { OrbitControls } = await import('../vendor/OrbitControls.js');
    const canvas = $('#xp-canvas'), host = $('#xp-stage3d');
    const r = this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(34, 1, 1, 500);
    this.scene.add(new T.HemisphereLight(0xfff4e2, 0x2a3a5e, 2.1));
    const sun = new T.DirectionalLight(0xffffff, 2.4);
    sun.position.set(-14, 62, 22); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    this.scene.add(sun);
    const fill = new T.DirectionalLight(0xbcd2ff, 0.6); fill.position.set(30, 20, -20); this.scene.add(fill);
    const ground = new T.Mesh(new T.PlaneGeometry(220, 220), new T.ShadowMaterial({ opacity: 0.24 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -1.0; ground.receiveShadow = true; this.scene.add(ground);
    const c = this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(c, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 18, maxDistance: 110, minPolarAngle: 0.12, maxPolarAngle: 1.25, rotateSpeed: 0.7 });
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.ok = true;
  },
  resize() {
    if (!this.renderer) return;
    const host = $('#xp-stage3d'), w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    // keep the model centred in the space left free by the info panel
    const wide = w > 900, ox = wide ? Math.min(370, w * 0.3) / 2 + 12 : 0, oy = wide ? 0 : h * 0.2;
    this.camera.aspect = w / h; this.camera.setViewOffset(w, h, ox, oy, w, h); this.camera.updateProjectionMatrix();
    // camera distance that fits the model's footprint (radius R, in feet) into the free part of the
    // screen: beside the panel on desktop, above it on phones
    const R = this.R || 22, tv = Math.tan(17 * Math.PI / 180);
    const fx = wide ? (w - Math.min(370, w * 0.3) - 40) / w : 0.94, fy = wide ? 0.9 : 0.52;
    this.w = w; this.h = h;
    this.fitDist = (R * (wide ? 1 : 1.12)) / Math.sin(Math.atan(Math.min(tv * fy, tv * (w / h) * fx)));
    if (this.controls) this.controls.maxDistance = Math.max(110, this.fitDist * 1.5);
  },
  async show(typeId) {
    const loading = $('#xp-loading'); loading.classList.remove('is-done');
    try { await this.init(); } catch (err) { loading.textContent = 'Sorry, 3D could not load on this device. The floor plans below show the same layout.'; console.error(err); return; }
    if (this.typeId !== typeId) await this.build(typeId);
    loading.classList.add('is-done');
    this.resize(); this.intro();
    if (state.view === 'unit') this.start();
  },
  async build(typeId) {
    const T = this.T, ty = TYPES[typeId];
    const [geo, tex] = await Promise.all([
      fetch(`${EXP}${ty.plan}-geo.json`).then(r => r.json()),
      new T.TextureLoader().loadAsync(`${EXP}${ty.plan}-floor.webp`)
    ]);
    if (this.model) { this.scene.remove(this.model); this.model.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); }); }
    const g = this.model = new T.Group(), W = geo.w, D = geo.h, WALL = 5.4, SILL = 2.2;
    this.R = 0.5 * Math.hypot(W, D);
    tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const plane = new T.PlaneGeometry(W, D);
    const floor = new T.Mesh(plane, new T.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    const slab = new T.MeshBasicMaterial({ map: tex, color: 0x1f2a44, alphaTest: 0.5 });
    for (let i = 1; i <= 9; i++) { const s = new T.Mesh(plane, slab); s.rotation.x = -Math.PI / 2; s.position.y = -i * 0.1; g.add(s); }

    const box = new T.BoxGeometry(1, 1, 1), m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3();
    const inst = (mat, list, fn) => { const im = new T.InstancedMesh(box, mat, list.length); list.forEach((b, i) => { fn(b, p, sc); im.setMatrixAt(i, m.compose(p, q, sc)); }); return im; };
    const C = ([x, y, w, h]) => [x + w / 2 - W / 2, y + h / 2 - D / 2, Math.max(w, 0.32), Math.max(h, 0.32)];
    const walls = inst(new T.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.85 }), geo.walls, (b, p, s) => { const [x, z, w, d] = C(b); p.set(x, WALL / 2, z); s.set(w, WALL, d); });
    walls.castShadow = walls.receiveShadow = true; g.add(walls);
    g.add(inst(new T.MeshBasicMaterial({ color: 0x3a4560 }), geo.walls, (b, p, s) => { const [x, z, w, d] = C(b); p.set(x, WALL + 0.04, z); s.set(w + 0.02, 0.08, d + 0.02); }));
    const sill = inst(new T.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.85 }), geo.windows, (b, p, s) => { const [x, z, w, d] = C(b); p.set(x, SILL / 2, z); s.set(Math.max(w, 0.2), SILL, Math.max(d, 0.2)); });
    sill.castShadow = true; g.add(sill);
    g.add(inst(new T.MeshPhysicalMaterial({ color: 0xa8d8ff, transparent: true, opacity: 0.32, roughness: 0.05, depthWrite: false }), geo.windows, (b, p, s) => { const [x, z, w, d] = C(b); p.set(x, (SILL + WALL) / 2, z); s.set(Math.max(w, 0.12), WALL - SILL, Math.max(d, 0.12)); }));
    this.scene.add(g);

    // room pins
    const pinsEl = $('#xp-pins'); pinsEl.innerHTML = ''; this.pins = [];
    ty.rooms.forEach((r, i) => {
      if (!r.at) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'xp__pin'; b.dataset.room = i; b.textContent = r.name;
      pinsEl.appendChild(b);
      this.pins.push({ el: b, pos: new T.Vector3(r.at[0] - W / 2, 2.6, r.at[1] - D / 2) });
    });
    this.typeId = typeId;
  },
  pose(dist) { const d = dist || this.fitDist; return { pos: new this.T.Vector3(0.3 * d, 0.84 * d, 0.45 * d), target: new this.T.Vector3(0, 0, 0) }; },
  intro() {
    const end = this.pose();
    this.camera.position.set(0.02, this.fitDist * 1.25, 0.04); this.controls.target.set(0, 0, 0);
    this.animate(end.pos, end.target, reduce ? 0 : 1700);
  },
  animate(toPos, toTarget, ms, done) {
    const c = this.camera, ctl = this.controls;
    const fromPos = c.position.clone(), fromT = ctl.target.clone(), t0 = performance.now();
    ctl.enabled = false;
    this.tween = now => {
      const k = ms ? Math.min(1, (now - t0) / ms) : 1, e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      c.position.lerpVectors(fromPos, toPos, e); ctl.target.lerpVectors(fromT, toTarget, e);
      if (k >= 1) { this.tween = null; ctl.enabled = true; done && done(); }
    };
  },
  flyTo(i) {
    if (!this.ok || state.view !== 'unit') return showRoom(i);
    const pin = this.pins.find(p => +p.el.dataset.room === i); if (!pin) return showRoom(i);
    this.saved = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
    const T = this.T, target = new T.Vector3(pin.pos.x, 0, pin.pos.z);
    const dir = this.camera.position.clone().sub(this.controls.target); dir.y = 0; dir.normalize();
    const to = target.clone().add(dir.multiplyScalar(6)).add(new T.Vector3(0, 9, 0));
    $('#xp-pins').classList.add('is-flying');
    this.animate(to, target, reduce ? 0 : 1000, () => { showRoom(i); });
  },
  flyBack() {
    $('#xp-pins').classList.remove('is-flying');
    if (!this.ok) return;
    const s = this.saved || this.pose(); this.saved = null;
    this.animate(s.pos, s.target, reduce ? 0 : 900);
  },
  start() {
    if (!this.ok || this.running) return;
    this.running = true;
    const v = new this.T.Vector3();
    const loop = now => {
      if (!this.running) return;
      this.tween && this.tween(now);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      for (const p of this.pins) {
        v.copy(p.pos).project(this.camera);
        const x = (v.x * 0.5 + 0.5) * this.w, y = (-v.y * 0.5 + 0.5) * this.h;
        p.el.style.transform = `translate(${x - 12}px, ${y - 15}px)`;
        p.el.style.visibility = v.z < 1 ? 'visible' : 'hidden';
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  stop() { this.running = false; }
};

initHero(openExplorer);
