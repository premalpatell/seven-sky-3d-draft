// A furnished floor: four flats (walls, polished vitrified floors, windows, curtains, doors, furniture) round the lift core.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { furniturePalette, buildFurniture, footprints } from './furniture.js';
import { flatMatrix, FH } from './towers.js';
import { canvasTexture } from './textures.js';

const CUT = 6.2, FULL = FH - 0.6, EYE = 5.25, STUB = 1.0;
const FLOOR_TINT = new THREE.Color(0xfff1df), GHOST_FLOOR = new THREE.Color(0xb9bcc4);
const WALL = new THREE.Color(0xf4f0e8), GHOST_WALL = new THREE.Color(0xd7d9de);
const tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), ts = new THREE.Vector3(), tp = new THREE.Vector3();
const boxM = (u, v, w, d, y0, h) => tm.compose(tp.set(u + w / 2, y0 + h / 2, v + d / 2), tq.identity(), ts.set(Math.max(w, 0.05), h, Math.max(d, 0.05)));

function mergeByMaterial(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  root.traverse(o => {
    if (!o.isMesh) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(o.matrixWorld);
    if (!buckets.has(o.material)) buckets.set(o.material, []);
    buckets.get(o.material).push(g);
  });
  return [...buckets].map(([mat, geos]) => { const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = !mat.transparent; m.receiveShadow = true; return m; });
}

// does the segment a->b cross the box? (Liang-Barsky)
function segBox(ax, ay, bx, by, x0, y0, x1, y1) {
  let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay;
  const clip = (p, q) => { if (Math.abs(p) < 1e-9) return q >= 0; const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } return true; };
  return clip(-dx, ax - x0) && clip(dx, x1 - ax) && clip(-dy, ay - y0) && clip(dy, y1 - ay) && t0 <= t1;
}
const boxDist = (x, y, q) => Math.hypot(Math.max(q.x0 - x, 0, x - q.x1), Math.max(q.y0 - y, 0, y - q.y1));

// a pleated curtain panel (sheer, gathered at the side of a window)
function pleated(w, h) {
  const g = new THREE.PlaneGeometry(w, h, Math.max(8, Math.round(w * 14)), 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / w + 0.5) * Math.PI * 2 * Math.max(2, Math.round(w * 2.6))) * 0.11);
  g.computeVertexNormals(); return g;
}
// soft wash of light on the ceiling from a cove (bright at the edges, fading inwards)
const coveTex = () => canvasTexture(128, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const e = Math.min(x, y, w - 1 - x, h - 1 - y) / (w * 0.5), a = Math.pow(Math.max(0, 1 - e / 0.32), 2.2);
    const i = (y * w + x) * 4; img.data[i] = 255; img.data[i + 1] = 214; img.data[i + 2] = 160; img.data[i + 3] = a * 255;
  }
  g.putImageData(img, 0, 0);
}, { aniso: 1 });

export class Interior {
  constructor(world, units, off) {
    this.world = world; this.units = units; this.off = off;
    this.base = furniturePalette();
    const L = new THREE.TextureLoader();
    this.floorTex = {}; this.masks = {}; this.feet = {}; this.grids = {};
    this.ready = Promise.all([1, 2, 3].map(t => L.loadAsync(`assets/x3d/data/type${t}-floor.webp`).then(tx => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; this.floorTex[t] = tx; })));
    this.unitBox = new THREE.BoxGeometry(1, 1, 1);
    this.cove = coveTex();
    this.group = null; this.H = CUT;
  }

  palette() {  // per-flat material copies so each flat can be dimmed on its own
    const p = {}; for (const [k, m] of Object.entries(this.base)) p[k] = m.clone();
    p.wall = new THREE.MeshStandardMaterial({ color: WALL.clone(), roughness: 0.9 });
    p.skirt = new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.35 });
    p.win = new THREE.MeshStandardMaterial({ color: 0xbcd6e8, roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.2, depthWrite: false });
    p.frame = new THREE.MeshStandardMaterial({ color: 0x33363b, roughness: 0.45, metalness: 0.5 });
    p.door = this.base.walnut.clone();
    p.ceil = new THREE.MeshStandardMaterial({ color: 0xf8f6f1, roughness: 0.95, side: THREE.DoubleSide });
    p.cove = new THREE.MeshStandardMaterial({ color: 0xf8f6f1, roughness: 0.9 });
    p.coveGlow = new THREE.MeshBasicMaterial({ map: this.cove, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 });
    p.strip = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.32, 0.95) });
    p.down = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.38, 1.18) });
    p.curtain = new THREE.MeshStandardMaterial({ color: 0xf7f3ec, roughness: 1, transparent: true, opacity: 0.86, side: THREE.DoubleSide });
    p.rod = new THREE.MeshStandardMaterial({ color: 0x3b3430, roughness: 0.4, metalness: 0.6 });
    return p;
  }

  // is a plan point on this flat's floor? (read from the baked floor's alpha, so outside notches don't count)
  mask(u) {
    if (this.masks[u.type]) return this.masks[u.type];
    const img = this.floorTex[u.type]?.image; if (!img || !img.width) return null;
    const k = 8, W = Math.round(u.w * k), H = Math.round(u.h * k), c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, W, H);
    const a = g.getImageData(0, 0, W, H).data;
    return (this.masks[u.type] = (x, y) => x >= 0 && y >= 0 && x < u.w && y < u.h && a[(Math.floor(y * k) * W + Math.floor(x * k)) * 4 + 3] > 128);
  }
  // the smallest room box holding a point (boxes overlap: an L-shaped living room's box also covers a toilet)
  roomAt(u, x, y) {
    let best = null, ba = Infinity;
    for (const r of u.rooms) { const [x0, y0, x1, y1] = r.bbox; if (x > x0 && x < x1 && y > y0 && y < y1) { const ar = (x1 - x0) * (y1 - y0); if (ar < ba) { ba = ar; best = r; } } }
    return best;
  }
  // which side of a window is indoors (a room that is not the balcony), as a unit vector in plan coords
  insideOf(u, [x, y, w, d]) {
    const m = this.mask(u), c = new THREE.Vector2(x + w / 2, y + d / 2), n = w >= d ? new THREE.Vector2(0, 1) : new THREE.Vector2(1, 0);
    let pick = null;
    for (const s of [1, -1]) {
      const q = c.clone().addScaledVector(n, s * 1.4);
      if (m && !m(q.x, q.y)) continue;
      const r = this.roomAt(u, q.x, q.y); if (!r || r.kind === 'balcony') continue;
      if (!pick) pick = { dir: n.clone().multiplyScalar(s), room: r };
    }
    return pick;
  }

  build(tower, level) {
    this.dispose();
    const g = this.group = new THREE.Group(); g.name = 'interior'; this.type = tower.type;
    const u = this.units[tower.type], y0 = level * FH;
    this.flats = tower.data.flats.map((f, i) => {
      const P = this.palette(), fg = new THREE.Group(); fg.matrixAutoUpdate = false;
      fg.matrix.copy(flatMatrix(f.aff, this.off, y0)); g.add(fg);
      // polished vitrified tiles (as the brochure specifies), with a light clear-coat sheen
      const floorMat = new THREE.MeshPhysicalMaterial({ map: this.floorTex[tower.type], color: FLOOR_TINT.clone(), alphaTest: 0.5, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.14, envMapIntensity: 1.0 });
      P.floor = floorMat;
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(u.w, u.h).rotateX(-Math.PI / 2), floorMat);
      floor.position.set(u.w / 2, 0.03, u.h / 2); floor.receiveShadow = true; floor.userData.flat = i; fg.add(floor);
      const mk = (recs, mat, y0_, h, grow = 0) => {
        const im = new THREE.InstancedMesh(this.unitBox, mat, recs.length);
        recs.forEach((r, k) => im.setMatrixAt(k, boxM(r[0] - grow, r[1] - grow, r[2] + grow * 2, Math.max(r[3], 0.3) + grow * 2, y0_, h)));
        im.castShadow = im.receiveShadow = true; return im;
      };
      // walls (scaled to the cut or full height), skirting, sills, glass, lintels, door headers, door frames
      const wallsG = new THREE.Group(); wallsG.add(mk(u.walls, P.wall, 0, 1)); fg.add(wallsG);
      const skirt = mk(u.walls, P.skirt, 0.02, 0.34, 0.045); skirt.castShadow = false; fg.add(skirt);
      const sillsG = new THREE.Group(); sillsG.add(mk(u.windows, P.wall, 0, 2.6)); fg.add(sillsG);
      const glassG = new THREE.Group(); glassG.position.y = 2.6; const gl = mk(u.windows, P.win, 0, 1); gl.castShadow = false; glassG.add(gl); fg.add(glassG);
      const lintelG = new THREE.Group(); lintelG.position.y = 7.4; lintelG.add(mk(u.windows, P.wall, 0, 1)); fg.add(lintelG);
      const headG = new THREE.Group(); headG.position.y = 7.0; if (u.headers.length) headG.add(mk(u.headers, P.wall, 0, 1)); fg.add(headG);
      const frames = [];
      for (const d of u.doors) {
        if (/balcony/i.test(d.a + d.b)) continue;
        if (d.horiz) { frames.push([d.x0 - 0.08, (d.y0 + d.y1) / 2 - 0.24, 0.16, 0.48], [d.x1 - 0.08, (d.y0 + d.y1) / 2 - 0.24, 0.16, 0.48]); }
        else { frames.push([(d.x0 + d.x1) / 2 - 0.24, d.y0 - 0.08, 0.48, 0.16], [(d.x0 + d.x1) / 2 - 0.24, d.y1 - 0.08, 0.48, 0.16]); }
      }
      const frameG = new THREE.Group(); if (frames.length) frameG.add(mk(frames, P.door, 0, 7.0)); fg.add(frameG);
      // everything that disappears when this flat is only context (another flat is in focus)
      const detail = new THREE.Group(); fg.add(detail);
      const rails = mk(u.rails, P.win, 0, 3.4); rails.castShadow = false; detail.add(rails);
      const hand = mk(u.rails.map(r => [r[0], r[1], r[2], r[3]]), P.frame, 3.35, 0.15); detail.add(hand);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.22, 7.0, 3.3), P.door); door.position.set(u.entry[0] - 0.3, 3.5, u.entry[1] - 0.4); door.castShadow = true; detail.add(door);
      const furn = buildFurniture(P, tower.type);
      mergeByMaterial(furn).forEach(m => detail.add(m));
      // sheer curtains + rods at the living and bedroom windows (only at full wall height)
      const curtG = new THREE.Group(), cgeo = [], rgeo = [];
      for (const win of u.windows) {
        const ins = this.insideOf(u, win); if (!ins || !['living', 'bed'].includes(ins.room.kind)) continue;
        const [x, y, w, d] = win, horiz = w >= d, len = horiz ? w : d, pw = Math.min(1.5, Math.max(0.8, len * 0.2));
        const face = horiz ? (ins.dir.y > 0 ? y + d : y) : (ins.dir.x > 0 ? x + w : x), inset = 0.32;
        for (const end of [0, 1]) {
          const a = (horiz ? x : y) - 0.35 + end * (len + 0.7 - pw) + pw / 2;
          const pg = pleated(pw, 8.75); pg.translate(0, 0.12 + 8.75 / 2, 0);
          if (!horiz) pg.rotateY(Math.PI / 2);
          pg.translate(horiz ? a : face + Math.sign(ins.dir.x) * inset, 0, horiz ? face + Math.sign(ins.dir.y) * inset : a);
          cgeo.push(pg);
        }
        const rod = new THREE.CylinderGeometry(0.05, 0.05, len + 1.0, 8).rotateZ(Math.PI / 2);
        if (!horiz) rod.rotateY(Math.PI / 2);
        rod.translate(horiz ? x + w / 2 : face + Math.sign(ins.dir.x) * inset, 8.95, horiz ? face + Math.sign(ins.dir.y) * inset : y + d / 2);
        rgeo.push(rod);
      }
      if (cgeo.length) { const cm = new THREE.Mesh(mergeGeometries(cgeo), P.curtain); cm.castShadow = true; curtG.add(cm, new THREE.Mesh(mergeGeometries(rgeo), P.rod)); }
      curtG.visible = false; detail.add(curtG);
      // ceiling, false-ceiling coves with a warm wash, downlights (only when you step inside)
      const ceilG = new THREE.Group(); ceilG.visible = false;
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(u.w, u.h).rotateX(Math.PI / 2), P.ceil); ceil.position.set(u.w / 2, FULL, u.h / 2); ceil.castShadow = true; ceilG.add(ceil);
      const coveG = [], stripG = [], downG = [], washG = [];
      for (const r of u.rooms) {
        const [x0, y0r, x1, y1] = r.bbox, rw = x1 - x0, rd = y1 - y0r, big = ['living', 'bed'].includes(r.kind) && rw > 8 && rd > 8;
        let ix0 = x0, ix1 = x1, iy0 = y0r, iy1 = y1;
        if (big) {
          const b = 1.6, t = 0.7, yc = FULL - t / 2;
          coveG.push(new THREE.BoxGeometry(rw, t, b).translate(x0 + rw / 2, yc, y0r + b / 2), new THREE.BoxGeometry(rw, t, b).translate(x0 + rw / 2, yc, y1 - b / 2),
            new THREE.BoxGeometry(b, t, rd - 2 * b).translate(x0 + b / 2, yc, y0r + rd / 2), new THREE.BoxGeometry(b, t, rd - 2 * b).translate(x1 - b / 2, yc, y0r + rd / 2));
          ix0 = x0 + b; ix1 = x1 - b; iy0 = y0r + b; iy1 = y1 - b;
          for (const [sx, sz, sw, sd] of [[ix0, iy0, ix1 - ix0, 0.08], [ix0, iy1 - 0.08, ix1 - ix0, 0.08], [ix0, iy0, 0.08, iy1 - iy0], [ix1 - 0.08, iy0, 0.08, iy1 - iy0]])
            stripG.push(new THREE.BoxGeometry(sw, 0.06, sd).translate(sx + sw / 2, FULL - t + 0.1, sz + sd / 2));
          washG.push(new THREE.PlaneGeometry(ix1 - ix0, iy1 - iy0).rotateX(Math.PI / 2).translate((ix0 + ix1) / 2, FULL - 0.03, (iy0 + iy1) / 2));
        }
        const n = (ix1 - ix0) * (iy1 - iy0) > 70 ? 2 : 1, alongX = (ix1 - ix0) >= (iy1 - iy0), hy = big ? FULL - 0.72 : FULL - 0.02;
        for (let k = 0; k < n; k++) {
          const fx = n === 1 ? 0.5 : (k ? 0.72 : 0.28);
          const px = alongX ? ix0 + (ix1 - ix0) * fx : (ix0 + ix1) / 2, pz = alongX ? (iy0 + iy1) / 2 : iy0 + (iy1 - iy0) * fx;
          downG.push(new THREE.CircleGeometry(0.22, 18).rotateX(Math.PI / 2).translate(px, hy, pz));
        }
      }
      if (coveG.length) { const cv = new THREE.Mesh(mergeGeometries(coveG), P.cove); cv.receiveShadow = true; ceilG.add(cv, new THREE.Mesh(mergeGeometries(stripG), P.strip), new THREE.Mesh(mergeGeometries(washG), P.coveGlow)); }
      if (downG.length) ceilG.add(new THREE.Mesh(mergeGeometries(downG), P.down));
      fg.add(ceilG);
      const mats = Object.values(P);
      const centre = new THREE.Vector3(u.w / 2, 0, u.h / 2).applyMatrix4(fg.matrix);
      return { i, num: f.num, code: `${tower.name}-${level}${f.num}`, group: fg, floor, wallsG, sillsG, glassG, lintelG, headG, frameG, detail, curtG, ceilG, mats, P, centre, data: f, ghost: 0 };
    });
    // lift core: lobby floor, two lifts, a flight of stairs
    const c = tower.data.core, core = new THREE.Group();
    core.position.set(tower.center.x, y0, tower.center.z); core.rotation.y = tower.rotY;
    const lob = new THREE.Mesh(new THREE.BoxGeometry(c.x1 - c.x0, 0.1, c.z1 - c.z0), new THREE.MeshStandardMaterial({ color: 0xd8cdbf, roughness: 0.35 }));
    lob.position.set((c.x0 + c.x1) / 2, 0.05, (c.z0 + c.z1) / 2); lob.receiveShadow = true; core.add(lob);
    const cw = c.x1 - c.x0, cd = c.z1 - c.z0, along = cw > cd;
    const sideSign = { N: -1, S: 1, W: -1, E: 1 };
    const liftPos = sideSign[c.lifts], stairPos = sideSign[c.stairs];
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xe2d9cc, roughness: 0.8 }), steel = this.base.steel;
    for (const k of [-1, 1]) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(5.2, CUT, 5.2), shaftMat);
      const lx = along ? (c.x0 + c.x1) / 2 + liftPos * (cw / 2 - 3) : (c.x0 + c.x1) / 2 + k * 2.8;
      const lz = along ? (c.z0 + c.z1) / 2 + k * 2.8 : (c.z0 + c.z1) / 2 + liftPos * (cd / 2 - 3);
      sh.position.set(lx, CUT / 2, lz); sh.castShadow = sh.receiveShadow = true; core.add(sh);
      const dr = new THREE.Mesh(new THREE.BoxGeometry(along ? 0.1 : 3.2, 5.9, along ? 3.2 : 0.1), steel);
      dr.position.set(lx - (along ? liftPos * 2.65 : 0), 2.95, lz - (along ? 0 : liftPos * 2.65)); core.add(dr);
    }
    const steps = 12, stairMat = new THREE.MeshStandardMaterial({ color: 0xcbc0b2, roughness: 0.7 });
    for (let s = 0; s < steps; s++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(along ? 0.9 : 3.6, 0.5 + s * 0.5, along ? 3.6 : 0.9), stairMat);
      const sx = along ? (c.x0 + c.x1) / 2 + stairPos * (cw / 2 - 1 - s * 0.9) : (c.x0 + c.x1) / 2 - 2;
      const sz = along ? (c.z0 + c.z1) / 2 - 2 : (c.z0 + c.z1) / 2 + stairPos * (cd / 2 - 1 - s * 0.9);
      st.position.set(sx, (0.5 + s * 0.5) / 2, sz); st.castShadow = st.receiveShadow = true; core.add(st);
    }
    g.add(core); this.core = core;
    this.setWallHeight(CUT);
    this.world.scene.add(g);
    return this.flats;
  }

  setWallHeight(H) { this.H = H; this.applyHeights(); }

  // each flat's walls follow the global height, except flats shown only as context, which drop to low "plan" stubs
  applyHeights() {
    for (const f of this.flats || []) {
      const h = this.H + (STUB - this.H) * f.ghost;
      f.wallsG.scale.y = h;
      f.sillsG.scale.y = Math.min(1, h / 2.6);
      f.glassG.scale.y = Math.max(0.01, Math.min(h, 7.4) - 2.6); f.glassG.visible = h > 2.65;
      f.lintelG.scale.y = Math.max(0.001, h - 7.4); f.lintelG.visible = h > 7.45;
      f.headG.scale.y = Math.max(0.001, h - 7.0); f.headG.visible = h > 7.05;
      f.frameG.visible = h > 7.5;
      f.detail.visible = f.ghost < 0.35;
      f.curtG.visible = h > 8.6;
    }
  }

  // one flat in focus: the others become low, cool-toned plan context (null = all equal)
  focus(idx, k = 1) {
    for (const f of this.flats || []) {
      f.ghost = idx !== null && f.i !== idx ? k : 0;
      f.P.floor.color.copy(FLOOR_TINT).lerp(GHOST_FLOOR, f.ghost);
      f.P.wall.color.copy(WALL).lerp(GHOST_WALL, f.ghost);
    }
    this.applyHeights();
    if (this.core) this.core.visible = idx === null || k < 0.5;
  }

  hoverFlat(idx) {
    for (const f of this.flats || []) {
      const on = f.i === idx;
      f.P.floor.emissive.set(on ? 0x3a2a0a : 0x000000); f.P.floor.emissiveIntensity = on ? 0.6 : 0;
      f.P.wall.emissive.set(on ? 0x2a1f0a : 0x000000);
    }
  }

  // the viewpoint for a room: the clear spot farthest from what the room is about (its main window and its furniture),
  // eyes 5'3" up, with nothing tall in the way; small rooms fall back to standing in the doorway
  roomView(idx, roomName) {
    const f = this.flats[idx], u = this.units[this.type];
    const r = u.rooms.find(x => x.name === roomName); if (!r) return null;
    const [x0, y0, x1, y1] = r.bbox, c = new THREE.Vector2((x0 + x1) / 2, (y0 + y1) / 2), fc = new THREE.Vector2(u.w / 2, u.h / 2);
    let p = null, t = null;
    const small = ['toilet', 'wash'].includes(r.kind) || (x1 - x0) * (y1 - y0) < 80;
    let th = 4.4;
    if (r.kind === 'balcony') {
      const rails = u.rails.filter(([rx, ry, rw, rd]) => rx + rw > x0 - 1 && rx < x1 + 1 && ry + rd > y0 - 1 && ry < y1 + 1);
      const R = rails.length ? rails.reduce((a, [rx, ry, rw, rd]) => a.add(new THREE.Vector2(rx + rw / 2, ry + rd / 2)), new THREE.Vector2()).divideScalar(rails.length) : c.clone().add(c.clone().sub(fc).normalize());
      const dir = R.clone().sub(c); if (dir.lengthSq() < 0.01) dir.copy(c.clone().sub(fc)); dir.normalize();
      p = c.clone().addScaledVector(dir, -Math.max(0.4, Math.min(x1 - x0, y1 - y0) / 2 - 0.7)); t = R.clone().addScaledVector(dir, 14); th = 3.6;
    } else {
      const v = small ? (this.doorView(u, r) || this.bestSpot(u, r)) : (this.bestSpot(u, r) || this.doorView(u, r));
      if (v) { p = v.p; t = v.t; if (v.th) th = v.th; }
    }
    if (!p) {
      const door = u.doors.find(d => d.a === r.name || d.b === r.name);
      if (door) { const d = new THREE.Vector2((door.x0 + door.x1) / 2, (door.y0 + door.y1) / 2), dir = c.clone().sub(d).normalize(); p = d.clone().addScaledVector(dir, 1.2); t = c.clone().addScaledVector(dir, 2); }
      else { const dir = c.clone().sub(fc).normalize(); p = c.clone().addScaledVector(dir, -0.4 * Math.min(x1 - x0, y1 - y0)); t = c.clone().addScaledVector(dir, 3); }
    }
    const M = f.group.matrix;
    const pos = new THREE.Vector3(p.x, EYE, p.y).applyMatrix4(M), tgt = new THREE.Vector3(t.x, th, t.y).applyMatrix4(M);
    return { pos, target: tgt, room: r, fov: small ? 76 : 66 };
  }
  // small rooms (toilets, wash areas, tiny kitchens): look in from just outside the doorway, as a photographer would
  doorView(u, r) {
    const G = this.grid(u), feet = this.footOf(u), [x0, y0, x1, y1] = r.bbox, c = new THREE.Vector2((x0 + x1) / 2, (y0 + y1) / 2);
    const opts = u.doors.filter(d => (d.a === r.name || d.b === r.name) && !/balcony/i.test(d.a + d.b)).map(d => {
      const m = new THREE.Vector2((d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2);
      return { m, out: d.horiz ? new THREE.Vector2(0, Math.sign(m.y - c.y) || 1) : new THREE.Vector2(Math.sign(m.x - c.x) || 1, 0) };
    });
    if (!opts.length) {                     // open to the next room (wash areas): try each side, the one facing the flat's middle first
      const v = new THREE.Vector2(u.w / 2, u.h / 2).sub(c);
      const sides = [new THREE.Vector2(1, 0), new THREE.Vector2(-1, 0), new THREE.Vector2(0, 1), new THREE.Vector2(0, -1)].sort((a, b) => b.dot(v) - a.dot(v));
      for (const out of sides) opts.push({ m: c.clone().add(new THREE.Vector2(out.x * (x1 - x0) / 2, out.y * (y1 - y0) / 2)), out });
    }
    for (const { m, out } of opts) for (let s = 2.0; s <= 3.8; s += 0.3) {
      const q = m.clone().addScaledVector(out, s), i = Math.floor(q.x * G.k), j = Math.floor(q.y * G.k);
      if (i < 0 || j < 0 || i >= G.W || j >= G.H || G.g[j * G.W + i]) continue;
      if (feet.some(f => boxDist(q.x, q.y, f) < 0.45)) continue;
      const t = c.clone().addScaledVector(out, -0.4), d = q.distanceTo(t);
      if (this.ray(G, q.x, q.y, Math.atan2(t.y - q.y, t.x - q.x), d) < d - 0.6) continue;     // must actually see into the room
      return { p: q, t, th: 3.4 };
    }
    return null;
  }
  footOf(u) { return this.feet[u.type] || (this.feet[u.type] = footprints(u.type)); }
  // occupancy grid, 4 cells per foot: 1 = wall, door post or outside the flat, 2 = tall furniture (wardrobe, fridge)
  grid(u) {
    if (this.grids[u.type]) return this.grids[u.type];
    const k = 4, W = Math.ceil(u.w * k), H = Math.ceil(u.h * k), g = new Uint8Array(W * H), m = this.mask(u);
    const fill = (x0, y0, x1, y1, v) => {
      for (let j = Math.max(0, Math.floor(y0 * k)); j < Math.min(H, Math.ceil(y1 * k)); j++)
        for (let i = Math.max(0, Math.floor(x0 * k)); i < Math.min(W, Math.ceil(x1 * k)); i++) g[j * W + i] = Math.max(g[j * W + i], v);
    };
    if (m) for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (!m((i + 0.5) / k, (j + 0.5) / k)) g[j * W + i] = 1;
    for (const [x, y, w, d] of u.walls) fill(x - 0.05, y - 0.05, x + w + 0.05, y + Math.max(d, 0.3) + 0.05, 1);
    for (const d of u.doors) {
      if (/balcony/i.test(d.a + d.b)) continue;
      const my = (d.y0 + d.y1) / 2, mx = (d.x0 + d.x1) / 2;
      if (d.horiz) { fill(d.x0 - 0.2, my - 0.35, d.x0 + 0.2, my + 0.35, 1); fill(d.x1 - 0.2, my - 0.35, d.x1 + 0.2, my + 0.35, 1); }
      else { fill(mx - 0.35, d.y0 - 0.2, mx + 0.35, d.y0 + 0.2, 1); fill(mx - 0.35, d.y1 - 0.2, mx + 0.35, d.y1 + 0.2, 1); }
    }
    for (const it of this.footOf(u)) if (it.tall) fill(it.x0, it.y0, it.x1, it.y1, 2);
    return (this.grids[u.type] = { k, W, H, g });
  }
  // how far you can see from (x, y) along angle a before a wall, a tall cupboard or the outside
  ray(G, x, y, a, max = 20) {
    const st = 0.25, dx = Math.cos(a) * st, dy = Math.sin(a) * st;
    for (let s = 0; s < max; s += st) { x += dx; y += dy; const i = Math.floor(x * G.k), j = Math.floor(y * G.k); if (i < 0 || j < 0 || i >= G.W || j >= G.H || G.g[j * G.W + i]) return s; }
    return max;
  }
  // property-photographer framing: a clear spot whose cone of view (±33°) towards the room's feature is open and deep
  bestSpot(u, r) {
    const m = this.mask(u), feet = this.footOf(u), G = this.grid(u);
    const own = (x, y) => (!m || m(x, y)) && this.roomAt(u, x, y) === r;
    const items = feet.filter(it => own(it.cx, it.cy));
    const wins = u.windows.map(w => ({ w, len: Math.max(w[2], w[3]), ins: this.insideOf(u, w) })).filter(o => o.ins && o.ins.room === r);
    const [x0, y0, x1, y1] = r.bbox;
    let fx = (x0 + x1) / 2, fy = (y0 + y1) / 2;
    if (items.length) { fx = items.reduce((a, it) => a + it.cx, 0) / items.length; fy = items.reduce((a, it) => a + it.cy, 0) / items.length; }
    let tx = fx, ty = fy;
    if (wins.length) { const b = wins.reduce((a, o) => (o.len > a.len ? o : a)); tx = (b.w[0] + b.w[2] / 2) * 0.6 + fx * 0.4; ty = (b.w[1] + b.w[3] / 2) * 0.6 + fy * 0.4; }
    const walls = u.walls.map(([wx, wy, ww, wd]) => ({ x0: wx, y0: wy, x1: wx + ww, y1: wy + Math.max(wd, 0.3) }));
    const fan = [-0.78, -0.55, -0.3, 0, 0.3, 0.55, 0.78];                      // the full width of a 66 deg lens
    let best = null;
    for (let x = x0 + 0.8; x <= x1 - 0.8; x += 0.5) for (let y = y0 + 0.8; y <= y1 - 0.8; y += 0.5) {
      if (!own(x, y)) continue;
      let cw = 9; for (const q of walls) cw = Math.min(cw, boxDist(x, y, q)); if (cw < 0.9) continue;
      let cf = 9, ct = 9; for (const q of feet) { const dd = boxDist(x, y, q); if (dd < cf) cf = dd; if (q.tall && dd < ct) ct = dd; }
      if (cf < 0.6 || ct < 1.4) continue;
      const d = Math.hypot(tx - x, ty - y); if (d < 3) continue;
      const a0 = Math.atan2(ty - y, tx - x);
      if (this.ray(G, x, y, a0, d) < d - 1.0) continue;                       // the room's feature must be in plain sight
      let sum = 0, ok = true;
      for (const da of fan) { const L = this.ray(G, x, y, a0 + da, 20); sum += L; if (L < (Math.abs(da) > 0.5 ? 1.8 : 2.6)) { ok = false; break; } }
      if (!ok) continue;                                                       // nothing looming in the picture
      const score = sum / fan.length + 0.25 * d + 0.2 * Math.min(2, cw);
      if (!best || score > best.score) best = { x, y, score };
    }
    return best ? { p: new THREE.Vector2(best.x, best.y), t: new THREE.Vector2(tx, ty) } : null;
  }

  // where the sun should come from so it streams in through this room's biggest window (world direction towards the sun)
  sunFor(idx, roomName) {
    const f = this.flats[idx], u = this.units[this.type], r = u.rooms.find(x => x.name === roomName); if (!r) return null;
    const wins = u.windows.map(w => ({ len: Math.max(w[2], w[3]), ins: this.insideOf(u, w) })).filter(o => o.ins);
    const own = wins.filter(o => o.ins.room === r), pool = own.length ? own : wins;
    if (!pool.length) return null;
    const best = pool.reduce((a, b) => (b.len > a.len ? b : a)).ins;
    const out = new THREE.Vector3(-best.dir.x, 0, -best.dir.y).transformDirection(f.group.matrix);
    out.y = 0; out.normalize(); out.y = Math.tan(THREE.MathUtils.degToRad(34));
    return out.normalize();
  }

  setInside(on, idx) {
    for (const f of this.flats || []) f.ceilG.visible = on && f.i === idx;
  }

  dispose() {
    if (!this.group) return;
    this.setInside(false);
    this.world.scene.remove(this.group);
    this.group.traverse(o => { if (o.isMesh) { if (o.geometry !== this.unitBox) o.geometry.dispose(); } });
    for (const f of this.flats || []) for (const m of f.mats) if (!Object.values(this.base).includes(m)) m.dispose();
    this.group = null; this.flats = null; this.core = null;
  }
}
