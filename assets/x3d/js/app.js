// Seven Sky in 3D: site -> tower -> floor (slides out like a drawer) -> flat -> inside each room.
import * as THREE from 'three';
import { World, detectQuality, ease } from './world.js';
import { buildSite, HERO_TARGET } from './site.js';
import { Towers, FH } from './towers.js';
import { Interior } from './interior.js';

const $ = (s, el = document) => el.querySelector(s);
const WA = '917433886565';
const TYPES = { 1: { name: 'Type I', carpet: 533 }, 2: { name: 'Type II', carpet: 553 }, 3: { name: 'Type III', carpet: 573 } };
const READY = new Set(['A', 'F', 'G']);              // handing over from December 2026 (client, Oct 2026)
const ord = n => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
const status = T => READY.has(T) ? 'Possession Dec 2026' : 'Under construction';
const ROOM_ORDER = ['living', 'kitchen', 'bed', 'balcony', 'toilet', 'wash'];
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

const root = $('#x3d');
if (root) boot().catch(err => { console.error(err); $('#x3d-loader-t').textContent = 'Sorry, the 3D view could not start on this device.'; });

async function boot() {
  const canvas = $('#x3d-canvas');
  const load = n => fetch(`assets/x3d/data/${n}.json`).then(r => r.json());
  const [data, t1, t2, t3] = await Promise.all(['world', 'type1', 'type2', 'type3'].map(load));
  const units = { 1: t1, 2: t2, 3: t3 };
  const P = data.site.plot, off = { x: (Math.min(...P.map(p => p[0])) + Math.max(...P.map(p => p[0]))) / 2, z: (Math.min(...P.map(p => p[1])) + Math.max(...P.map(p => p[1]))) / 2 };
  const W = new World(canvas, detectQuality());
  const site = buildSite(W, data, off); W.scene.add(site.root);
  const towers = new Towers(W, data, units, off);
  const interior = new Interior(W, units, off);
  W.focusShadows(new THREE.Vector3(0, 0, 0), 290);
  W.setMood('site');

  const S = { mode: 'site', T: null, F: null, flat: null, room: null, busy: false, hover: null };
  const heroFor = () => {
    const target = new THREE.Vector3(HERO_TARGET.x, W.w / W.h < 1 ? 18 : 40, HERO_TARGET.z), dir = new THREE.Vector3(0.5, 0, -0.866).normalize();
    const dist = W.w / W.h < 1 ? 560 : 430, el = THREE.MathUtils.degToRad(W.w / W.h < 1 ? 7 : 5);
    return { pos: target.clone().addScaledVector(dir, dist * Math.cos(el)).add(new THREE.Vector3(0, dist * Math.sin(el), 0)), target };
  };
  const HERO = heroFor();
  W.camera.position.copy(HERO.pos); W.controls.target.copy(HERO.target); W.camera.lookAt(HERO.target);
  controlsFor('site');

  // ---------- UI ----------
  const ui = {
    app: $('#x3d-app'), card: $('#x3d-card'), line: $('#x3d-leader line'), leader: $('#x3d-leader'), pins: $('#x3d-pins'),
    panel: $('#x3d-panel'), room: $('#x3d-room'), crumb: $('#x3d-crumb'), hint: $('#x3d-hint'), intro: $('#x3d-intro'), help: $('#x3d-help'),
  };
  function setMode(mode) {
    S.mode = mode; root.dataset.mode = mode;
    const app = mode !== 'site';
    if (app && !document.body.classList.contains('x3d-on')) { S.scrollY = scrollY; document.body.classList.add('x3d-on'); }
    if (!app && document.body.classList.contains('x3d-on')) { document.body.classList.remove('x3d-on'); scrollTo(0, S.scrollY || 0); }
    hideCard(); ui.pins.innerHTML = '';
    ui.hint.textContent = { site: finePointer ? 'Hover a floor to explore' : 'Tap a floor to explore', tower: finePointer ? 'Hover a floor · click to open it' : 'Tap a floor to open it', floor: finePointer ? 'Choose a flat' : 'Tap a flat', flat: 'Choose a room to step inside', room: '' }[mode];
    ui.help.textContent = mode === 'room' ? (finePointer ? 'Drag to look around · scroll to zoom' : 'Drag to look around') : '';
    renderCrumb();
    controlsFor(mode);
  }
  function renderCrumb() {
    const c = ui.crumb, parts = [];
    if (S.mode === 'tower') parts.push(['site', '← All towers']);
    if (S.mode === 'floor') parts.push(['tower', `← Tower ${S.T}`]);
    if (S.mode === 'flat') parts.push(['floor', `← ${ord(S.F)} floor`]);
    c.innerHTML = parts.map(([go, t]) => `<button type="button" data-go="${go}">${t}</button>`).join('') +
      (S.mode !== 'site' && S.mode !== 'room' ? `<span>${[S.T && 'Tower ' + S.T, S.F && ord(S.F) + ' floor', S.flat && 'Flat ' + S.T + '-' + S.F + S.flat].filter(Boolean).join(' · ')}</span>` : '');
  }
  function hideCard() { ui.card.hidden = true; ui.leader.style.opacity = 0; S.cardFor = null; }
  function floorCard(T, F) {
    const t = towers.byName[T], ty = TYPES[t.type];
    ui.card.innerHTML = `<div class="x3d-card__n"><small>Floor</small><b>${F}</b></div>
      <div class="x3d-card__b"><p class="x3d-card__t">Tower ${T} · 2 BHK</p><p class="x3d-card__m">4 homes · ${ty.name} · ${ty.carpet} sq.ft carpet</p>
      <p class="x3d-card__p"><span>${status(T)}</span> · from ₹30.99 L*</p>
      ${finePointer ? '' : `<button type="button" class="x3d-card__go" data-open-floor="${T}|${F}">Open ${ord(F)} floor →</button>`}</div>`;
    ui.card.hidden = false; S.cardFor = { kind: 'floor', T, F };
  }
  function flatCard(f) {
    const ty = TYPES[towers.byName[S.T].type];
    ui.card.innerHTML = `<div class="x3d-card__n"><small>Flat</small><b>${f.num}</b></div>
      <div class="x3d-card__b"><p class="x3d-card__t">${f.code} · 2 BHK</p><p class="x3d-card__m">${ty.name} · ${ty.carpet} sq.ft carpet · 2 toilets</p>
      <p class="x3d-card__p"><span>${status(S.T)}</span></p>
      ${finePointer ? '' : `<button type="button" class="x3d-card__go" data-open-flat="${f.num}">View flat ${f.code} →</button>`}</div>`;
    ui.card.hidden = false; S.cardFor = { kind: 'flat', f };
  }
  function placeCard() {
    if (ui.card.hidden || !S.cardFor) return;
    const w = W.w, h = W.h, cw = ui.card.offsetWidth, ch = ui.card.offsetHeight;
    let ax, ay;
    if (S.cardFor.kind === 'floor') { const a = towers.floorAnchor(S.cardFor.T, S.cardFor.F, W.camera, w, h); if (!a) return; ax = a.x; ay = a.y; }
    else { const v = S.cardFor.f.centre.clone(); v.y += 4; v.project(W.camera); ax = (v.x * 0.5 + 0.5) * w; ay = (-v.y * 0.5 + 0.5) * h; }
    let cx = ax + 70, cy = ay - ch / 2, lx = cx;
    if (cx + cw > w - 16) { cx = ax - 70 - cw; lx = cx + cw; }
    cy = Math.max(90, Math.min(h - ch - 90, cy));
    ui.card.style.transform = `translate(${cx}px, ${cy}px)`;
    ui.line.setAttribute('x1', ax); ui.line.setAttribute('y1', ay); ui.line.setAttribute('x2', lx); ui.line.setAttribute('y2', cy + ch / 2);
    ui.leader.style.opacity = 1;
  }

  // ---------- camera choreography ----------
  function controlsFor(mode) {
    const c = W.controls; c.autoRotate = mode === 'site' && !W.reduce; c.autoRotateSpeed = 0.22 * Math.sign(c.autoRotateSpeed || 1);
    c.enableZoom = mode !== 'site' && mode !== 'room'; c.rotateSpeed = mode === 'room' ? -0.32 : 0.5;
    const L = { site: [150, 1100, 1.0, 1.54], tower: [40, 420, 0.45, 1.56], floor: [40, 300, 0.15, 1.25], flat: [22, 160, 0.15, 1.25], room: [0.05, 2, 0.25, 2.8] }[mode];
    [c.minDistance, c.maxDistance, c.minPolarAngle, c.maxPolarAngle] = L;
  }
  const horiz = (from, to) => { const d = new THREE.Vector3().subVectors(to, from); d.y = 0; return d.normalize(); };
  const Y = new THREE.Vector3(0, 1, 0), sheet = () => matchMedia('(max-width: 900px)').matches;
  // distance at which something rw wide and rh tall (half-extents, ft) fills the free part of the screen
  function fitDist(rw, rh, sx = 0, sy = 0, fill = 0.86) {
    const fpx = ((W.h + sy) / 2) / Math.tan(THREE.MathUtils.degToRad(34 / 2)), aw = W.w - sx, ah = W.h - sy;
    return Math.max(fpx * rw / (fill * aw / 2), fpx * rh / (fill * ah / 2));
  }
  // camera spot on an orbit round a target: horizontal direction, distance, elevation (radians)
  const orbitPos = (target, dir, dist, el) => target.clone().addScaledVector(dir, dist * Math.cos(el)).addScaledVector(Y, dist * Math.sin(el));
  // on the navy model views the key light comes from behind-left of the camera, so walls throw soft shadows forwards
  function modelLight(camPos, target) { const d = horiz(target, camPos).applyAxisAngle(Y, 2.35); d.y = 1.35; W.setKeyDir(d); }
  const allow = d => { const c = W.controls; c.maxDistance = Math.max(c.maxDistance, d * 1.6); c.minDistance = Math.min(c.minDistance, d * 0.35); };
  const roomFov = (v) => (W.w / W.h < 1 ? Math.min(90, v.fov + 20) : v.fov);   // portrait phones need a taller lens to see as wide
  function showWorld(on, except) {
    W.touchShadows();
    site.root.visible = on;
    for (const [n, t] of Object.entries(towers.byName)) t.group.visible = on || n === except;
  }

  async function goSite(push = true) {
    if (S.busy) return; S.busy = true;
    if (S.T) towers.restore(S.T); interior.dispose(); showWorld(true);
    W.setMood('site'); W.focusShadows(new THREE.Vector3(0, 0, 0), 290); towers.highlight(null);
    S.T = S.F = S.flat = S.room = null; setMode('site'); W.setShift(0, 0, 600);
    W.camera.fov !== 34 && (W.camera.fov = 34, W.camera.updateProjectionMatrix());
    const H = heroFor(); await W.fly(H.pos, H.target, 1900, { lift: 30, fov: 34 });
    S.busy = false; push && setHash();
  }
  async function goTower(T, F, push = true) {
    if (S.busy) return; S.busy = true;
    if (S.T && S.T !== T) towers.restore(S.T);
    if (S.mode === 'floor' || S.mode === 'flat' || S.mode === 'room') { await closeFloor(); }
    showWorld(true); W.setMood('site');
    const t = towers.byName[T]; S.T = T; S.F = F || null; S.flat = S.room = null;
    setMode('tower'); W.setShift(0, 0, 600);
    const target = new THREE.Vector3(t.center.x, 44, t.center.z);
    const dist = fitDist(t.radius * 1.15, 50, 0, 0, 0.66), here = horiz(target, W.camera.position);
    let dir = here, bestS = -Infinity;
    for (let k = 0; k < 24; k++) {
      const th = k / 24 * Math.PI * 2, d = new THREE.Vector3(Math.sin(th), 0, Math.cos(th)), cam = target.clone().addScaledVector(d, dist);
      let blocked = 0;
      for (const o of Object.values(towers.byName)) {
        if (o === t) continue;
        const seg = new THREE.Line3(new THREE.Vector3(target.x, 0, target.z), new THREE.Vector3(cam.x, 0, cam.z)), cp = new THREE.Vector3();
        seg.closestPointToPoint(new THREE.Vector3(o.center.x, 0, o.center.z), true, cp);
        if (cp.distanceTo(new THREE.Vector3(o.center.x, 0, o.center.z)) < o.radius + 6) blocked++;
      }
      const sc = -blocked * 10 + d.dot(here) * 2 - Math.max(0, d.z) * 0.8;        // clear view first, then stay close to where we are, front (north) preferred
      if (sc > bestS) { bestS = sc; dir = d; }
    }
    const pos = orbitPos(target, dir, dist, THREE.MathUtils.degToRad(6)); allow(dist);
    if (F) towers.setFloorLights(T, F, true);
    W.focusShadows(target, 140);
    await W.fly(pos, target, 1700, { lift: 25, fov: 34 });
    S.busy = false; push && setHash();
  }
  async function goFloor(T, F, push = true) {
    if (S.busy) return; S.busy = true;
    const t = towers.byName[T], from = S.mode, prevFlat = S.flat;
    const open = (from === 'flat' || from === 'room') && interior.group && interior.key === T + F;
    S.T = T; S.F = F; S.flat = S.room = null;
    towers.highlight(null); towers.setFloorLights(T, F, false);
    ui.panel.hidden = true; ui.room.hidden = true;
    setMode('floor'); W.setShift(0, 0, 900);
    if (!open) { interior.build(t, F); interior.key = T + F; interior.prewarm(); }
    interior.setInside(false); interior.hoverFlat(null);
    const fc = new THREE.Vector3(t.center.x, F * FH, t.center.z);
    const portrait = W.w / W.h < 1, longX = t.ext.x >= t.ext.z, longAxis = longX ? t.axisX : t.axisZ, shortAxis = longX ? t.axisZ : t.axisX;
    const L = Math.max(t.ext.x, t.ext.z), Sh = Math.min(t.ext.x, t.ext.z), here = horiz(fc, W.camera.position);
    let dir = (portrait ? longAxis : shortAxis).clone(); if (dir.dot(here) < 0) dir.negate();
    if (!open) dir.applyAxisAngle(Y, portrait ? 0.22 : 0.35); else dir = here;
    const across = portrait ? Sh : L, along = portrait ? L : Sh, dFloor = fitDist(across / 2 * 1.08, along / 2 * 0.72 + 4, 0, 0, portrait ? 0.74 : 0.8);
    const pos = orbitPos(fc, dir, dFloor, 0.8); allow(dFloor);
    modelLight(pos, fc); W.focusShadows(fc, t.radius + 10);
    if (open) {
      if (from === 'room') { W.setMood('model'); showWorld(false, T); towers.drawer(T, F, 1); towers.setShell(T, F, false); }
      const fi = interior.flats.find(x => x.num === prevFlat)?.i ?? null, h0 = interior.H;
      const back = W.tween(900, k => { interior.focus(fi, 1 - k); interior.setWallHeight(h0 + (6.2 - h0) * k); });
      await Promise.all([back, W.fly(pos, fc.clone().add(new THREE.Vector3(0, 2, 0)), 1500, { lift: 8, fov: 34 })]);
    } else {
      interior.focus(null); interior.setWallHeight(6.2);
      let switched = false;
      const drawer = W.tween(1900, k => {
        towers.drawer(T, F, k);
        if (k > 0.12) towers.setShell(T, F, false);
        if (!switched && k > 0.42) { switched = true; W.setMood('model'); showWorld(false, T); }
      }, ease.inOut);
      await Promise.all([drawer, W.fly(pos, fc.clone().add(new THREE.Vector3(0, 2, 0)), 1900, { lift: 10, fov: 34 })]);
    }
    S.busy = false; push && setHash();
  }
  async function closeFloor() {
    if (!S.T || !S.F) return;
    const T = S.T, F = S.F;
    interior.setInside(false); ui.panel.hidden = true; ui.room.hidden = true; W.setShift(0, 0, 600);
    if (S.mode === 'room') { W.setMood('model'); showWorld(false, T); towers.drawer(T, F, 1); towers.setShell(T, F, false); }
    await W.tween(700, k => { towers.drawer(T, F, 1 - k); }, ease.inOut);
    towers.setShell(T, F, true); towers.restore(T); interior.dispose(); interior.key = null;
    showWorld(true); W.setMood('site');
  }
  async function goFlat(num, push = true) {
    if (S.busy) return; S.busy = true;
    const wasRoom = S.mode === 'room';
    const f = interior.flats.find(x => x.num === num); if (!f) { S.busy = false; return; }
    S.flat = num; S.room = null; setMode('flat'); ui.room.hidden = true;
    if (wasRoom) {
      W.setMood('model'); showWorld(false, S.T); towers.drawer(S.T, S.F, 1); towers.setShell(S.T, S.F, false);
      interior.setInside(false); W.tween(900, k => interior.setWallHeight(9.4 - 3.2 * k));
    }
    interior.hoverFlat(null);
    W.tween(800, k => interior.focus(f.i, k));
    renderPanel(f);
    const sx = sheet() ? 0 : ui.panel.offsetWidth, sy = sheet() ? ui.panel.offsetHeight : 0;
    W.setShift(sx, sy, wasRoom ? 1500 : 1400);
    const t = towers.byName[S.T], u = units[t.type], c = f.centre.clone(); c.y = S.F * FH + 1.5;
    const out = horiz(t.center, c).applyAxisAngle(Y, 0.6), r = Math.hypot(u.w, u.h) / 2;
    const dFlat = fitDist(r, r * 0.72, sx, sy, sheet() ? 0.8 : 0.64), pos = orbitPos(c, out, dFlat, 0.86); allow(dFlat);
    modelLight(pos, c); W.focusShadows(c, 40);
    await W.fly(pos, c, wasRoom ? 1500 : 1400, { fov: 34, lift: wasRoom ? 18 : 6 });
    renderPins(f);
    S.busy = false; push && setHash();
  }
  async function goRoom(name, push = true) {
    if (S.busy) return; S.busy = true;
    const f = interior.flats.find(x => x.num === S.flat), v = interior.roomView(f.i, name); if (!v) { S.busy = false; return; }
    const first = S.mode !== 'room';
    S.room = name; setMode('room'); ui.panel.hidden = true; ui.pins.innerHTML = '';
    renderRoomBar(f, v.room);
    const sun = interior.sunFor(f.i, name);
    if (first) {
      interior.focus(null); W.setShift(0, 0, 1400);
      let inside = false;
      const walls = W.tween(1700, k => {
        interior.setWallHeight(6.2 + 3.2 * k);
        if (!inside && k > 0.72) {
          inside = true; interior.setInside(true, f.i); W.setMood('inside'); showWorld(true);
          towers.restore(S.T); towers.setShell(S.T, S.F, false);           // the rest of the building is there when you look out
          if (sun) W.setKeyDir(sun); W.focusShadows(f.centre.clone().setY(S.F * FH + 4), 30);
        }
      });
      await Promise.all([walls, W.fly(v.pos, v.target, 2000, { fov: roomFov(v), lift: 0 })]);
    } else {
      if (sun) W.setKeyDir(sun); W.focusShadows(f.centre.clone().setY(S.F * FH + 4), 30);
      await W.fly(v.pos, v.target, 1300, { fov: roomFov(v) });
    }
    // look-around: orbit a point a few inches in front of the eyes
    const d = new THREE.Vector3().subVectors(v.target, v.pos).normalize();
    W.controls.target.copy(v.pos).addScaledVector(d, 0.3); W.camera.position.copy(v.pos); W.controls.update();
    S.busy = false; push && setHash();
  }

  // ---------- panel, room dots, room bar ----------
  function roomsOf() { const u = units[towers.byName[S.T].type]; return [...u.rooms].sort((a, b) => ROOM_ORDER.indexOf(a.kind) - ROOM_ORDER.indexOf(b.kind)); }
  function renderPanel(f) {
    const ty = TYPES[towers.byName[S.T].type], code = f.code;
    const msg = `Namaste! I'm interested in flat ${code} at Seven Sky (Tower ${S.T}, ${ord(S.F)} floor, ${ty.name} 2 BHK, ${ty.carpet} sq.ft carpet). Please share the price and availability.`;
    ui.panel.innerHTML = `<p class="x3d-k">Floor ${S.F} · Tower ${S.T} · ${status(S.T)}</p>
      <h2 class="x3d-h">Flat ${code}</h2>
      <div class="x3d-stats"><div><b>2</b><small>Bedrooms</small></div><div><b>2</b><small>Toilets</small></div><div><b>${ty.carpet}</b><small>Sq.ft carpet</small></div></div>
      <p class="x3d-price"><small>From</small> ₹30.99 L<sup>*</sup></p>
      <p class="x3d-desc">A ${ty.name} 2 BHK: living room, kitchen${towers.byName[S.T].type === 1 ? '-dining' : ''}, two bedrooms, two toilets, a wash area and a balcony.</p>
      <ul class="x3d-rooms">${roomsOf().map(r => `<li><button type="button" data-room="${r.name}"><i></i>${r.name}<span>${r.size || ''}</span></button></li>`).join('')}</ul>
      <a class="x3d-btn x3d-btn--wa" href="https://wa.me/${WA}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Enquire on WhatsApp</a>
      <button type="button" class="x3d-btn x3d-btn--line" data-go="floor">Back to ${ord(S.F)} floor</button>
      <p class="x3d-note">3D model built from the brochure's ${ty.name} plan; your flat may be its mirror image. Furniture is indicative. *Starting price, T&amp;C apply.</p>`;
    ui.panel.hidden = false; ui.panel.scrollTop = 0;
  }
  function renderPins(f) {
    ui.pins.innerHTML = roomsOf().map(r => `<button type="button" class="x3d-pin" data-room="${r.name}" aria-label="${r.name}"><span>${r.name}</span></button>`).join('');
    const u = units[towers.byName[S.T].type];
    S.pinPts = roomsOf().map(r => new THREE.Vector3((r.c[0]), 3.2, (r.c[1])).applyMatrix4(f.group.matrix));
  }
  function renderRoomBar(f, room) {
    const ty = TYPES[towers.byName[S.T].type];
    ui.room.innerHTML = `<div class="x3d-room__l"><button type="button" class="x3d-btn x3d-btn--dark" data-go="flat">← Back to floor plan</button>
        <div><p class="x3d-k">Floor ${S.F} · Flat ${f.code} · ${ty.name}</p><h2 class="x3d-room__t">${room.name}</h2>${room.size ? `<p class="x3d-room__s">${room.size}</p>` : ''}</div></div>
      <div class="x3d-room__tabs">${roomsOf().map(r => `<button type="button" data-room="${r.name}" class="${r.name === room.name ? 'is-on' : ''}">${r.name}</button>`).join('')}</div>`;
    ui.room.hidden = false;
  }

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hitAt(x, y, objs) {
    const r = canvas.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, W.camera); return ray.intersectObjects(objs, false)[0] || null;
  }
  function hoverAt(x, y) {
    if (S.busy) return;
    if (S.mode === 'site' || S.mode === 'tower') {
      const objs = S.mode === 'tower' ? towers.pickables.filter(h => h.userData.tower === S.T) : towers.pickables;
      const h = hitAt(x, y, objs), d = h?.object.userData;
      const key = d ? d.tower + d.floor : null;
      if (key === S.hover) return;
      if (S.hover && S.hoverD && !(S.mode === 'tower' && S.hoverD.tower === S.T && S.hoverD.floor === S.F)) towers.setFloorLights(S.hoverD.tower, S.hoverD.floor, false);
      S.hover = key; S.hoverD = d;
      towers.highlight(d?.tower, d?.floor);
      if (d) { floorCard(d.tower, d.floor); towers.setFloorLights(d.tower, d.floor, true); canvas.style.cursor = 'pointer'; }
      else { hideCard(); canvas.style.cursor = ''; }
    } else if (S.mode === 'floor') {
      const h = hitAt(x, y, interior.flats.map(f => f.floor)), idx = h ? h.object.userData.flat : null;
      if (idx === S.hover) return; S.hover = idx;
      interior.hoverFlat(idx);
      if (idx !== null && idx !== undefined) { flatCard(interior.flats[idx]); canvas.style.cursor = 'pointer'; } else { hideCard(); canvas.style.cursor = ''; }
    }
  }
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !e.buttons) hoverAt(e.clientX, e.clientY); });
  canvas.addEventListener('pointerleave', () => { if (S.mode === 'site' || S.mode === 'tower') { if (S.hoverD && S.mode === 'site') towers.setFloorLights(S.hoverD.tower, S.hoverD.floor, false); towers.highlight(null); hideCard(); S.hover = null; S.hoverD = null; } });
  canvas.addEventListener('click', e => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    if (S.busy) return;
    if (!finePointer) {             // touch: first tap previews, second tap (or the card button) opens
      const prev = S.hover; hoverAt(e.clientX, e.clientY);
      if (S.hover === null || S.hover !== prev) return;
    }
    if (S.mode === 'site' && S.hoverD) return goTower(S.hoverD.tower, S.hoverD.floor);
    if (S.mode === 'tower' && S.hoverD) return goFloor(S.hoverD.tower, S.hoverD.floor);
    if (S.mode === 'floor' && S.hover !== null && S.hover !== undefined) return goFlat(interior.flats[S.hover].num);
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('button, a'); if (!b) return;
    const d = b.dataset;
    if (d.go === 'site') goSite(); else if (d.go === 'tower') goTower(S.T, S.F); else if (d.go === 'floor') goFloor(S.T, S.F);
    else if (d.go === 'flat') goFlat(S.flat);
    else if (d.room) goRoom(d.room);
    else if (d.tower) goTower(d.tower, null);
    else if (d.openFloor) { const [T, F] = d.openFloor.split('|'); S.mode === 'site' ? goTower(T, +F) : goFloor(T, +F); }
    else if (d.openFlat) goFlat(d.openFlat);
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || S.busy) return;
    if (S.mode === 'room') goFlat(S.flat); else if (S.mode === 'flat') goFloor(S.T, S.F); else if (S.mode === 'floor') goTower(S.T, S.F); else if (S.mode === 'tower') goSite();
  });
  // zoom inside a room = narrow the lens
  canvas.addEventListener('wheel', e => {
    if (S.mode !== 'room') return; e.preventDefault();
    W.camera.fov = THREE.MathUtils.clamp(W.camera.fov + e.deltaY * 0.03, 38, 80); W.camera.updateProjectionMatrix();
  }, { passive: false });
  // other entry points on the page
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-x3d-flat]'); if (!a) return; e.preventDefault();
    const m = /^([A-G])-(\d)(\d\d)$/.exec(a.dataset.x3dFlat); if (!m) return;
    root.scrollIntoView({ behavior: 'smooth' });
    (async () => { await goTower(m[1], +m[2], false); await goFloor(m[1], +m[2], false); await goFlat(m[3]); })();
  });

  // ---------- per-frame ----------
  const heroDir = new THREE.Vector3(0.5, 0, -0.866);
  W.onFrame.add(() => {
    if (S.mode === 'site' && W.controls.autoRotate) {         // sway +-35 deg round the hero direction
      const o = new THREE.Vector3().subVectors(W.camera.position, W.controls.target); o.y = 0; o.normalize();
      const rel = Math.atan2(heroDir.x * o.z - heroDir.z * o.x, heroDir.x * o.x + heroDir.z * o.z);
      if (rel > 0.6) W.controls.autoRotateSpeed = Math.abs(W.controls.autoRotateSpeed);
      else if (rel < -0.6) W.controls.autoRotateSpeed = -Math.abs(W.controls.autoRotateSpeed);
    }
    placeCard();
    if (S.mode === 'flat' && S.pinPts) {
      const pins = ui.pins.children;
      S.pinPts.forEach((p, i) => {
        const v = p.clone().project(W.camera), el = pins[i]; if (!el) return;
        el.style.transform = `translate(${(v.x * 0.5 + 0.5) * W.w}px, ${(-v.y * 0.5 + 0.5) * W.h}px)`;
        el.style.visibility = v.z < 1 ? 'visible' : 'hidden';
      });
    }
  });

  // ---------- deep links: #/A/5/03/Living%20Room ----------
  function setHash() {
    const parts = [S.T, S.mode === 'floor' || S.mode === 'flat' || S.mode === 'room' ? S.F : null, S.flat, S.room].filter(v => v !== null && v !== undefined);
    const h = parts.length ? '#/' + parts.map(encodeURIComponent).join('/') : '#explore';
    if (location.hash !== h) history.pushState({ x3d: 1 }, '', h);
  }
  async function route() {
    const m = location.hash.match(/^#\/([A-G])(?:\/(\d))?(?:\/(\d\d))?(?:\/(.+))?$/);
    if (!m) { if (S.mode !== 'site') goSite(false); return; }
    const [, T, F, flat, room] = m;
    if (!F) return goTower(T, null, false);
    if (S.T !== T || S.F !== +F || !interior.group) { if (S.mode === 'site') await goTower(T, +F, false); await goFloor(T, +F, false); }
    if (!flat) { if (S.mode !== 'floor') await goFloor(T, +F, false); return; }
    if (S.flat !== flat || S.mode === 'room' && !room) await goFlat(flat, false);
    if (room) await goRoom(decodeURIComponent(room), false);
  }
  addEventListener('popstate', route);

  // ready
  await interior.ready;
  $('#x3d-loader').classList.add('is-done');
  setMode('site');
  if (/^#\/[A-G]/.test(location.hash)) route();
  window.__x3d = { W, towers, interior, S, goTower, goFloor, goFlat, goRoom, goSite };
}
