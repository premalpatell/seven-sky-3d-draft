// The seven towers, built floor by floor from the brochure's unit plans placed exactly as on the site plan.
import * as THREE from 'three';
import { tex } from './textures.js';
import { flatShape } from './site.js';

export const FH = 10;                    // floor to floor, feet
const TOP = 8 * FH;                      // roof level (G + 7)
const LIT = new THREE.Color(1.6, 1.2, 0.72), UNLIT = [new THREE.Color(0x6a8db9), new THREE.Color(0x7799c3), new THREE.Color(0x5b7eab)];   // lit rooms / glass reflecting the sky

export function flatMatrix(aff, off, y = 0) {
  const [a, b, c, d, tx, tz] = aff, m = new THREE.Matrix4();
  m.set(a, 0, b, tx - off.x, 0, 1, 0, y, c, 0, d, tz - off.z, 0, 0, 0, 1);
  return m;
}
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
function boxM(u, v, w, d, y0, h) { return tmpM.compose(tmpP.set(u + w / 2, y0 + h / 2, v + d / 2), tmpQ.identity(), tmpS.set(Math.max(w, 0.05), h, Math.max(d, 0.05))); }

export class Towers {
  constructor(world, data, units, off) {
    this.world = world; this.off = off; this.units = units; this.byName = {}; this.pickables = [];
    this.root = new THREE.Group(); this.root.name = 'towers';
    const M = this.mat = {
      facade: new THREE.MeshStandardMaterial({ map: tex.stucco(), bumpMap: tex.stuccoBump(), bumpScale: 0.5, roughness: 0.88, color: 0xffffff }),
      slab: new THREE.MeshStandardMaterial({ color: 0xcdb898, roughness: 0.85 }),
      cornice: new THREE.MeshStandardMaterial({ color: 0x7c6350, roughness: 0.8 }),
      glass: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true }),
      rail: new THREE.MeshStandardMaterial({ color: 0x1d2631, roughness: 0.12, metalness: 0.5, transparent: true, opacity: 0.78, depthWrite: false }),
      handrail: new THREE.MeshStandardMaterial({ color: 0x2c3036, roughness: 0.4, metalness: 0.7 }),
      column: new THREE.MeshStandardMaterial({ color: 0x9a8368, roughness: 0.85 }),
      lobby: new THREE.MeshStandardMaterial({ color: 0x2a2620, emissive: 0xffd6a0, emissiveIntensity: 0.55, roughness: 0.2 }),
      tank: new THREE.MeshStandardMaterial({ color: 0xbfc3c7, roughness: 0.6 }),
      hit: new THREE.MeshBasicMaterial({ visible: false }),
      hlLine: new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }),
      hlFill: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, depthWrite: false }),
    };
    this.unitBox = new THREE.BoxGeometry(1, 1, 1);
    let seed = 11; this.rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const [name, t] of Object.entries(data.towers)) this.build(name, t);
    world.scene.add(this.root);
  }

  build(name, t) {
    const u = this.units[t.type], off = this.off, M = this.mat;
    const g = new THREE.Group(); g.name = 'tower-' + name; this.root.add(g);
    const rotY = THREE.MathUtils.degToRad(t.angle), cx = t.cx - off.x, cz = t.cz - off.z;
    const shape = flatShape(t.outline, { x: 0, z: 0 });
    const outlineGeo = (depth) => { const ge = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); ge.rotateX(-Math.PI / 2); return ge; };
    const place = (mesh, y) => { mesh.position.set(cx, y, cz); mesh.rotation.y = rotY; return mesh; };
    const flatMs = t.flats.map(f => flatMatrix(f.aff, off, 0));
    const tower = this.byName[name] = { name, type: t.type, data: t, group: g, floors: new Map(), flatMs, center: new THREE.Vector3(cx, TOP / 2, cz), rotY };

    // per-flat instance recipes (shared by every floor of this tower)
    const wallRec = [], glassRec = [], railRec = [];
    const WALL_H = FH - 0.7;
    for (const m of flatMs) {
      for (const [x, y, w, d] of u.walls) wallRec.push(m.clone().multiply(boxM(x, y, w, d, 0, WALL_H)));
      for (const [x, y, w, d] of u.windows) {
        wallRec.push(m.clone().multiply(boxM(x, y, w, Math.max(d, 0.35), 0, 2.6)));                 // sill
        wallRec.push(m.clone().multiply(boxM(x, y, w, Math.max(d, 0.35), 7.4, WALL_H - 7.4)));      // lintel
        glassRec.push(m.clone().multiply(boxM(x, y, w, Math.max(d, 0.18), 2.6, 4.8)));
      }
      for (const [x, y, w, d] of u.headers) wallRec.push(m.clone().multiply(boxM(x, y, w, d, 7.0, WALL_H - 7.0)));
      for (const [x, y, w, d] of u.rails) railRec.push(m.clone().multiply(boxM(x, y, w, d, 0, 3.4)));
    }
    const slabGeo = outlineGeo(0.9); slabGeo.translate(0, -0.45, 0); slabGeo.scale(1.015, 1, 1.015);
    const hitGeo = outlineGeo(FH - 0.4);

    for (const level of t.floors) {
      const fg = new THREE.Group(); fg.position.y = level * FH; g.add(fg);
      const walls = new THREE.InstancedMesh(this.unitBox, M.facade, wallRec.length);
      wallRec.forEach((m, i) => walls.setMatrixAt(i, m)); walls.castShadow = walls.receiveShadow = true;
      const glass = new THREE.InstancedMesh(this.unitBox, M.glass, glassRec.length);
      const lit = [];
      glassRec.forEach((m, i) => { glass.setMatrixAt(i, m); const on = this.rnd() < 0.36; lit.push(on); glass.setColorAt(i, on ? LIT : UNLIT[i % 3]); });
      const rails = new THREE.InstancedMesh(this.unitBox, M.rail, railRec.length);
      railRec.forEach((m, i) => rails.setMatrixAt(i, m));
      const hand = new THREE.InstancedMesh(this.unitBox, M.handrail, railRec.length);
      railRec.forEach((m, i) => { const mm = m.clone(); mm.multiply(new THREE.Matrix4().makeTranslation(0, 0.5, 0)).multiply(new THREE.Matrix4().makeScale(1.04, 0.06, 1.6)); hand.setMatrixAt(i, mm); });
      const slab = place(new THREE.Mesh(slabGeo, M.slab), 0); slab.position.y = 0; slab.castShadow = slab.receiveShadow = true;
      fg.add(walls, glass, rails, hand, slab);
      const hit = place(new THREE.Mesh(hitGeo, M.hit), 0.2); hit.userData = { tower: name, floor: level }; fg.add(hit);
      this.pickables.push(hit);
      tower.floors.set(level, { group: fg, walls, glass, rails, hand, slab, hit, lit, baseY: level * FH });
    }

    // ground floor: stilt columns + glazed lobby round the lift core (A sits on its shop podium instead)
    const ground = new THREE.Group(); g.add(ground); tower.ground = ground;
    if (t.floors[0] === 1) {
      const pts = t.outline, cols = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, FH, 1.3), M.column, pts.length);
      const R = new THREE.Matrix4().makeRotationY(rotY);
      pts.forEach(([lx, lz], i) => {
        const len = Math.hypot(lx, lz) || 1, ix = lx - lx / len * 0.9, iz = lz - lz / len * 0.9;
        const v = new THREE.Vector3(ix, FH / 2, iz).applyMatrix4(R);
        cols.setMatrixAt(i, tmpM.makeTranslation(cx + v.x, v.y, cz + v.z));
      });
      cols.castShadow = true; ground.add(cols);
      const c = t.core, lob = new THREE.Mesh(new THREE.BoxGeometry(c.x1 - c.x0, FH - 0.8, c.z1 - c.z0), M.lobby);
      const lc = new THREE.Vector3((c.x0 + c.x1) / 2, (FH - 0.8) / 2, (c.z0 + c.z1) / 2).applyMatrix4(R);
      lob.position.set(cx + lc.x, lc.y, cz + lc.z); lob.rotation.y = rotY; ground.add(lob);
      const s1 = place(new THREE.Mesh(slabGeo, M.slab), FH); s1.castShadow = true; ground.add(s1);
    }

    // roof: slab, parapet, cornice, lift/stair headroom and water tank
    const roof = new THREE.Group(); g.add(roof); tower.roof = roof;
    const rs = place(new THREE.Mesh(slabGeo, M.slab), TOP); rs.castShadow = true; roof.add(rs);
    const pts = t.outline, par = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.4) continue;
      const m = new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, TOP + 2.2, (a[1] + b[1]) / 2),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(b[1] - a[1], b[0] - a[0])), new THREE.Vector3(len + 0.6, 3.6, 0.7));
      par.push(m);
    }
    const parM = new THREE.InstancedMesh(this.unitBox, M.facade, par.length); par.forEach((m, i) => parM.setMatrixAt(i, m));
    const corM = new THREE.InstancedMesh(this.unitBox, M.cornice, par.length);
    par.forEach((m, i) => { const mm = m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.55, 0)).multiply(new THREE.Matrix4().makeScale(1.0, 0.12, 1.9)); corM.setMatrixAt(i, mm); });
    const pg = new THREE.Group(); pg.add(parM, corM); place(pg, 0); parM.castShadow = true; roof.add(pg);
    const c = t.core, mum = new THREE.Mesh(new THREE.BoxGeometry(c.x1 - c.x0, 11, c.z1 - c.z0), M.facade);
    const R2 = new THREE.Matrix4().makeRotationY(rotY);
    const mc = new THREE.Vector3((c.x0 + c.x1) / 2, TOP + 5.5, (c.z0 + c.z1) / 2).applyMatrix4(R2);
    mum.position.set(cx + mc.x, mc.y, cz + mc.z); mum.rotation.y = rotY; mum.castShadow = true; roof.add(mum);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(Math.min(14, c.x1 - c.x0), 5, Math.min(9, c.z1 - c.z0)), M.tank);
    tank.position.set(mum.position.x, TOP + 13.6, mum.position.z); tank.rotation.y = rotY; tank.castShadow = true; roof.add(tank);
    const mcap = new THREE.Mesh(new THREE.BoxGeometry(c.x1 - c.x0 + 1.2, 0.9, c.z1 - c.z0 + 1.2), M.cornice);
    mcap.position.set(mum.position.x, TOP + 11.2, mum.position.z); mcap.rotation.y = rotY; roof.add(mcap);

    // footprint radius (for camera framing)
    tower.radius = Math.max(...t.outline.map(([x, z]) => Math.hypot(x, z)));
    // plan extents along the tower's own axes, and those axes in world space (for framing the floor plate)
    const lx = t.outline.map(q => q[0]), lz = t.outline.map(q => q[1]);
    tower.ext = { x: Math.max(...lx) - Math.min(...lx), z: Math.max(...lz) - Math.min(...lz) };
    tower.axisX = new THREE.Vector3(Math.cos(rotY), 0, -Math.sin(rotY)); tower.axisZ = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY));
  }

  // white outline round the floor band + a soft fill, as in the reel (hidden edges stay hidden)
  highlight(name, level) {
    if (this.hl) { this.hl.parent?.remove(this.hl); this.hl = null; }
    if (!name) return;
    const t = this.byName[name], f = t?.floors.get(level); if (!f) return;
    const key = name + level; this.hlCache = this.hlCache || {};
    if (!this.hlCache[key]) {
      const grp = new THREE.Group(), pts = t.data.outline, S = 1.018;
      for (const y of [0.15, FH - 0.35]) {
        const g = new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x * S, y, z * S)));
        const loop = new THREE.LineLoop(g, this.mat.hlLine); loop.renderOrder = 10; grp.add(loop);
      }
      const fill = new THREE.Mesh(f.hit.geometry, this.mat.hlFill); fill.scale.set(1.016, 1, 1.016); fill.position.y = -0.05; fill.renderOrder = 9; grp.add(fill);
      grp.position.set(t.center.x, 0, t.center.z); grp.rotation.y = t.rotY;
      this.hlCache[key] = grp;
    }
    this.hl = this.hlCache[key]; f.group.add(this.hl);
  }

  setFloorLights(name, level, on) {
    const f = this.byName[name]?.floors.get(level); if (!f) return;
    for (let i = 0; i < f.lit.length; i++) f.glass.setColorAt(i, (on || f.lit[i]) ? LIT : UNLIT[i % 3]);
    f.glass.instanceColor.needsUpdate = true;
  }

  // screen-space anchor (right edge, mid-height) of a floor, for the hover card's leader line
  floorAnchor(name, level, camera, w, h) {
    const f = this.byName[name]?.floors.get(level); if (!f) return null;
    const t = this.byName[name], pts = t.data.outline, R = new THREE.Matrix4().makeRotationY(t.rotY);
    let best = null; const v = new THREE.Vector3();
    for (const [lx, lz] of pts) {
      v.set(lx, f.baseY + FH / 2, lz).applyMatrix4(R).add(new THREE.Vector3(t.center.x, 0, t.center.z)).project(camera);
      const sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
      if (!best || sx > best.x) best = { x: sx, y: sy };
    }
    return best;
  }

  // the floor slides out like a drawer: floors above rise, floors below sink, all fade (k: 0 -> 1)
  prepareDrawer(name) {
    const t = this.byName[name]; if (t.fadeAll) return t;
    const cache = new Map();
    const fadeOf = m => { if (m === this.mat.rail) return m; let c = cache.get(m); if (!c) { c = m.clone(); c.transparent = true; cache.set(m, c); } return c; };
    t.fadeAll = [];
    const reg = obj => obj.traverse(o => {
      if (o.isMesh && o.material && o.material !== this.mat.hit && o.material !== this.mat.hlFill) {
        o.userData.orig = o.material; o.userData.fade = fadeOf(o.material); o.userData.floorGroup = obj; t.fadeAll.push(o);
      }
    });
    for (const [, f] of t.floors) reg(f.group);
    reg(t.roof); reg(t.ground);
    t.fadeMats = [...cache.values()];
    return t;
  }
  drawer(name, level, k) {
    this.highlight(null);
    const t = this.prepareDrawer(name), sel = t.floors.get(level)?.group;
    const up = 70 * k, down = 45 * k, o = 1 - Math.min(1, k * 1.25);
    for (const [lv, f] of t.floors) {
      if (lv === level) continue;
      f.group.position.y = f.baseY + (lv > level ? up : -down); f.group.visible = o > 0.01;
    }
    t.roof.position.y = up; t.roof.visible = o > 0.01; t.ground.position.y = -down; t.ground.visible = o > 0.01;
    for (const m of t.fadeAll) { if (m.userData.floorGroup === sel) continue; m.material = k > 0 ? m.userData.fade : m.userData.orig; }
    for (const m of t.fadeMats) m.opacity = o;
    if (k === 0) this.restore(name);
  }
  restore(name) {
    const t = this.byName[name];
    for (const [, f] of t.floors) {
      f.group.position.y = f.baseY; f.group.visible = true;
      f.walls.visible = f.glass.visible = f.rails.visible = f.hand.visible = f.slab.visible = true; f.slab.position.y = 0;
    }
    t.roof.position.y = 0; t.roof.visible = true; t.ground.position.y = 0; t.ground.visible = true;
    if (t.fadeAll) for (const m of t.fadeAll) m.material = m.userData.orig;
    this.showNeighbours();
  }
  // hide/show the exterior shell of one floor (the furnished interior takes its place). Towers that stand back to back
  // (C and D, for instance) overlap by a wall's thickness, so the same floor of a touching tower goes with it
  setShell(name, level, visible) {
    const t = this.byName[name], f = t?.floors.get(level); if (!f) return;
    const shell = (fl, v) => { fl.walls.visible = fl.glass.visible = fl.rails.visible = fl.hand.visible = v; fl.slab.position.y = v ? 0 : -0.47; };
    shell(f, visible);                                 // the slab drops just under the furnished floor and becomes its base
    this.showNeighbours();
    if (!visible) for (const o of Object.values(this.byName)) {
      if (o === t || !this.touching(o, t)) continue;
      const nf = o.floors.get(level); if (!nf) continue;
      shell(nf, false); (this.hiddenN ||= []).push(nf);
    }
  }
  // do two towers' outlines come within 3 ft of each other?
  touching(a, b) {
    const key = [a.name, b.name].sort().join(''); this.touchCache ||= {};
    if (key in this.touchCache) return this.touchCache[key];
    const poly = t => t.data.outline.map(([x, z]) => new THREE.Vector2(x * Math.cos(t.rotY) + z * Math.sin(t.rotY) + t.center.x, -x * Math.sin(t.rotY) + z * Math.cos(t.rotY) + t.center.z));
    const A = poly(a), B = poly(b), seg = (p, q, r) => { const d = r.clone().sub(q), t = Math.max(0, Math.min(1, p.clone().sub(q).dot(d) / Math.max(1e-9, d.lengthSq()))); return p.distanceTo(q.clone().addScaledVector(d, t)); };
    let m = Infinity;
    for (const [P, Q] of [[A, B], [B, A]]) for (const p of P) for (let i = 0; i < Q.length; i++) m = Math.min(m, seg(p, Q[i], Q[(i + 1) % Q.length]));
    return (this.touchCache[key] = m < 3);
  }
  showNeighbours() {
    for (const nf of this.hiddenN || []) { nf.walls.visible = nf.glass.visible = nf.rails.visible = nf.hand.visible = true; nf.slab.position.y = 0; }
    this.hiddenN = [];
  }
}
