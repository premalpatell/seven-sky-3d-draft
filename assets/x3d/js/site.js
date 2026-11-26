// The site around the towers: plot, roads, compound wall, gates, garden, clubhouse, Tower A's shop podium,
// trees, cars, street lights and the surrounding city.  Built from the brochure's site plan (feet).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { tex } from './textures.js';

export function flatShape(poly, off) {
  const s = new THREE.Shape();
  poly.forEach(([x, z], i) => (i ? s.lineTo(x - off.x, -(z - off.z)) : s.moveTo(x - off.x, -(z - off.z))));
  return s;
}
export function flatMesh(poly, off, mat, y = 0) {
  const g = new THREE.ShapeGeometry(flatShape(poly, off)); g.rotateX(-Math.PI / 2);
  // planar UVs in feet so tiling textures keep their real-world size
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i); uv[i * 2 + 1] = p.getZ(i); }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const m = new THREE.Mesh(g, mat); m.position.y = y; m.receiveShadow = true; return m;
}
export function extrude(poly, off, depth, mat, y = 0) {
  const g = new THREE.ExtrudeGeometry(flatShape(poly, off), { depth, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.y = y; m.castShadow = m.receiveShadow = true; return m;
}
const box = (w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateY(ry); g.translate(x, y, z); return g; };
function canopy() {
  const ico = new THREE.IcosahedronGeometry(1, 3); ico.deleteAttribute('normal'); ico.deleteAttribute('uv');
  const g = mergeVertices(ico), p = g.attributes.position, v = new THREE.Vector3();   // shared vertices -> smooth shading
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 3.1 + 1.3) * Math.sin(v.y * 2.7 + 0.4) * Math.sin(v.z * 3.4 + 2.1) * 0.22 + Math.sin(v.x * 7.3) * Math.sin(v.z * 6.1) * 0.05;
    v.multiplyScalar(1 + n); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}

// the hero camera sways along this arc (azimuth 115-185 deg round the row, 430-560 ft out): keep it clear of trees and blocks
export const HERO_TARGET = { x: 7, z: 22 };
function nearHeroArc(x, z, clear = 140) {
  for (let a = 112; a <= 188; a += 4) for (const R of [430, 560]) {
    const t = a * Math.PI / 180, px = HERO_TARGET.x + Math.sin(t) * R, pz = HERO_TARGET.z + Math.cos(t) * R;
    if (Math.hypot(x - px, z - pz) < clear) return true;
  }
  return false;
}

export function buildSite(world, data, off) {
  const site = data.site, root = new THREE.Group(); root.name = 'site';
  const M = {
    ground: new THREE.MeshStandardMaterial({ color: 0x6f6d62, roughness: 1 }),
    paving: new THREE.MeshStandardMaterial({ map: tex.paving(), roughness: 0.95, color: 0xd9d4cc }),
    asphalt: new THREE.MeshStandardMaterial({ map: tex.asphalt(), roughness: 0.92 }),
    grass: new THREE.MeshStandardMaterial({ map: tex.grass(), roughness: 1 }),
    track: new THREE.MeshStandardMaterial({ map: tex.track(), roughness: 0.95 }),
    sand: new THREE.MeshStandardMaterial({ map: tex.sand(), roughness: 1 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xe6d6bf, roughness: 0.9 }),
    stucco: new THREE.MeshStandardMaterial({ map: tex.stucco(), roughness: 0.9 }),
    granite: new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.45, metalness: 0.1 }),
    shop: new THREE.MeshStandardMaterial({ color: 0x3a3631, emissive: 0xffd2a0, emissiveIntensity: 0.62, roughness: 0.18, metalness: 0.2 }),
    glassDark: new THREE.MeshStandardMaterial({ color: 0x1d2a3a, roughness: 0.08, metalness: 0.6 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.5, metalness: 0.6 }),
    lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.55, 1.0) }),
    line: new THREE.MeshBasicMaterial({ color: 0xd9d6cc }),
  };
  const [cityMap, cityGlow] = tex.cityWindows();
  M.city = new THREE.MeshStandardMaterial({ map: cityMap, vertexColors: true, roughness: 0.92, emissive: 0xffffff, emissiveMap: cityGlow, emissiveIntensity: 0.8 });

  // ground + plot + roads
  const ground = new THREE.Mesh(new THREE.CircleGeometry(2600, 48).rotateX(-Math.PI / 2), M.ground);
  ground.position.y = -0.3; ground.receiveShadow = true; root.add(ground);
  root.add(flatMesh(site.plot, off, M.paving, 0));
  for (const k of ['road9', 'road18']) root.add(flatMesh(site[k], off, M.asphalt, 0.02));
  root.add(flatMesh(site.road6, off, M.asphalt, 0.04));
  // dashed centre lines + kerbs
  const dashes = [];
  for (const k of ['road9', 'road18']) {
    const p = site[k], a = [(p[0][0] + p[3][0]) / 2, (p[0][1] + p[3][1]) / 2], b = [(p[1][0] + p[2][0]) / 2, (p[1][1] + p[2][1]) / 2];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (let s = 8; s < len - 8; s += 22) {
      const x = a[0] + (b[0] - a[0]) * s / len - off.x, z = a[1] + (b[1] - a[1]) * s / len - off.z;
      dashes.push(box(10, 0.05, 0.6, x, 0.08, z, -ang));
    }
  }
  root.add(new THREE.Mesh(mergeGeometries(dashes), M.line));
  // across the 9 m road: a footpath, then a lawn verge with a clipped hedge (the brochure's street-side foreground)
  const nz = Math.min(...site.road9.map(q => q[1]));
  root.add(flatMesh([[-260, nz - 8], [506, nz - 8], [506, nz], [-260, nz]], off, M.paving, 0.05));
  const z18 = Math.min(...site.road18.map(q => q[1]));                 // where the 18 m road starts (it runs on diagonally to the south)
  root.add(flatMesh([[-260, nz - 80], [900, nz - 80], [900, z18 - 2.4], [-260, z18 - 2.4]], off, M.grass, 0.06));
  root.add(flatMesh([[-260, z18 - 2.4], [521, z18 - 2.4], [510, nz - 8.6], [-260, nz - 8.6]], off, M.grass, 0.06));
  root.add(flatMesh([[562, z18 - 2.4], [900, z18 - 2.4], [900, nz - 8.6], [553, nz - 8.6]], off, M.grass, 0.06));
  const hedge = [];
  for (let x = -250; x < 495; x += 6.5) hedge.push([x - off.x, nz - 12 - off.z]);
  const hg = new THREE.InstancedMesh(canopy(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), hedge.length), hm = new THREE.Matrix4(), hc = new THREE.Color();
  hedge.forEach(([x, z], i) => { hg.setMatrixAt(i, hm.compose(new THREE.Vector3(x, 1.5, z), new THREE.Quaternion(), new THREE.Vector3(3.6, 1.9, 2.4))); hg.setColorAt(i, hc.setHSL(0.25 + (i % 7) * 0.008, 0.48, 0.27 + (i % 3) * 0.025)); });
  hg.castShadow = hg.receiveShadow = true; root.add(hg);
  const verge = (x, z) => z > nz - 82 - off.z && z < nz + 1 - off.z && x < 900 - off.x;

  // compound wall with pillars, open at the two gates
  const plot = site.plot, gates = site.gates, wallG = [];
  const nearGate = (x, z) => gates.some(([[gx0, gz], [gx1]]) => x > gx0 && x < gx1 && Math.abs(z - gz) < 14);
  for (let i = 0; i < plot.length; i++) {
    const a = plot[i], b = plot[(i + 1) % plot.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (let s = 0; s < len; s += 12) {
      const t = (s + 6) / len, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      if (nearGate(x, z)) continue;
      wallG.push(box(Math.min(12, len - s), 5.5, 0.7, x - off.x, 2.75, z - off.z, -ang));
      wallG.push(box(1.4, 6.4, 1.4, a[0] + (b[0] - a[0]) * (s / len) - off.x, 3.2, a[1] + (b[1] - a[1]) * (s / len) - off.z, -ang));
    }
  }
  const wallMesh = new THREE.Mesh(mergeGeometries(wallG), M.wall); wallMesh.castShadow = wallMesh.receiveShadow = true; root.add(wallMesh);
  // gates: security cabins + boom barriers
  for (const [[gx0, gz], [gx1]] of gates) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(8, 9, 8), M.stucco); cab.position.set(gx0 - 6 - off.x, 4.5, gz + 8 - off.z); cab.castShadow = true; root.add(cab);
    const win = new THREE.Mesh(new THREE.BoxGeometry(8.1, 3, 5), M.shop); win.position.set(gx0 - 6 - off.x, 5.5, gz + 8 - off.z); root.add(win);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(gx1 - gx0 - 4, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: 0xd23b2f }));
    boom.position.set((gx0 + gx1) / 2 - off.x, 3.4, gz + 1 - off.z); root.add(boom);
  }

  // garden: jogging track, lawn, children's play area, gazebo, benches
  root.add(flatMesh(site.garden, off, M.track, 0.06));
  root.add(flatMesh(site.lawn, off, M.grass, 0.1));
  root.add(flatMesh(site.play, off, M.sand, 0.1));
  const [gx, gz, gr] = site.gazebo, gaz = new THREE.Group();
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8, 8), M.white); c.position.set(Math.cos(a) * gr * 0.8, 4, Math.sin(a) * gr * 0.8); gaz.add(c); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(gr * 1.15, 4.5, 6), M.granite); roof.position.y = 10.2; gaz.add(roof);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(gr, gr, 0.6, 6), M.white); base.position.y = 0.3; gaz.add(base);
  gaz.position.set(gx - off.x, 0, gz - off.z); gaz.traverse(o => { o.castShadow = true; }); root.add(gaz);
  const g0 = site.lawn; const benches = [];
  for (let x = g0[0][0] + 12; x < g0[1][0] - 50; x += 26) { benches.push(box(5, 1.5, 1.6, x - off.x, 1.4, g0[0][1] + 4 - off.z)); benches.push(box(5, 1.5, 1.6, x - off.x, 1.4, g0[2][1] - 4 - off.z)); }
  root.add(new THREE.Mesh(mergeGeometries(benches), M.metal));
  // play equipment: slide + swings
  const pc = site.play, px = (pc[0][0] + pc[1][0]) / 2 - off.x, pz = (pc[0][1] + pc[2][1]) / 2 - off.z;
  const play = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), new THREE.MeshStandardMaterial({ color: 0xe2a13b })); tower.position.set(0, 3, -6); play.add(tower);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 9), new THREE.MeshStandardMaterial({ color: 0x3b8fd2 })); slide.position.set(0, 3, 0.5); slide.rotation.x = 0.55; play.add(slide);
  const swing = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 0.4), M.metal); swing.position.set(0, 7, 8); play.add(swing);
  for (const sx of [-4, 4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7, 0.3), M.metal); p.position.set(sx, 3.5, 8); play.add(p); }
  play.position.set(px, 0, pz); play.traverse(o => { o.castShadow = true; }); root.add(play);

  // clubhouse: two storeys, glazed garden front, warm lights
  const club = extrude(site.club, off, 24, M.stucco, 0.1); root.add(club);
  const cb = site.club, cx0 = cb[0][0] - off.x, cx1 = cb[1][0] - off.x, cz1 = cb[2][1] - off.z, cz0 = cb[0][1] - off.z;
  for (const y of [5, 16]) { const gl = new THREE.Mesh(new THREE.BoxGeometry((cx1 - cx0) * 0.8, 7, 0.4), M.shop); gl.position.set((cx0 + cx1) / 2, y, cz1 + 0.1); root.add(gl);
    const gl2 = gl.clone(); gl2.position.z = cz0 - 0.1; root.add(gl2); }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(cx1 - cx0 + 2, 1.6, cz1 - cz0 + 2), M.granite); cap.position.set((cx0 + cx1) / 2, 24.8, (cz0 + cz1) / 2); cap.castShadow = true; root.add(cap);

  // Tower A's podium: shops on the ground and first floors, open terrace on top
  const pod = site.podium; const podium = new THREE.Group(); podium.name = 'podium';
  const PT = 19.9;                                                      // podium roof: just under Tower A's first flats (level 2 = 20 ft)
  const podBody = extrude(pod, off, PT, M.granite, 0); podium.add(podBody);
  // shopfronts on every podium edge facing a road (north and the diagonal east side)
  const fronts = [];
  for (let i = 0; i < pod.length; i++) {
    const a = pod[i], b = pod[(i + 1) % pod.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = (b[1] - a[1]) / len, nz = -(b[0] - a[0]) / len;            // outward normal (polygon is clockwise on screen)
    if (i === 3) continue;                                                // west edge faces the internal road: solid
    for (const y of [4.6, 15]) {
      const g = new THREE.BoxGeometry(len - 3, y < 10 ? 7.4 : 6.2, 0.3); g.rotateY(-ang);
      g.translate((a[0] + b[0]) / 2 - off.x + nx * 0.25, y, (a[1] + b[1]) / 2 - off.z + nz * 0.25); fronts.push(g);
    }
  }
  podium.add(new THREE.Mesh(mergeGeometries(fronts), M.shop));
  const terrace = flatMesh(pod, off, M.paving, PT); podium.add(terrace);
  const par = [], shrubs = [];
  for (let i = 0; i < pod.length; i++) {
    const a = pod[i], b = pod[(i + 1) % pod.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = (b[1] - a[1]) / len, nz = -(b[0] - a[0]) / len, mx = (a[0] + b[0]) / 2 - off.x, mz = (a[1] + b[1]) / 2 - off.z;
    par.push(box(len, 3.2, 0.7, mx - nx * 0.35, PT + 1.6, mz - nz * 0.35, -ang));
    par.push(box(len - 1.4, 1.6, 2.2, mx - nx * 1.8, PT + 0.8, mz - nz * 1.8, -ang));                 // planter box
    for (let s = 2.5; s < len - 2; s += 4.5) shrubs.push([a[0] + (b[0] - a[0]) * s / len - off.x - nx * 1.8, a[1] + (b[1] - a[1]) * s / len - off.z - nz * 1.8]);
  }
  const parM = new THREE.Mesh(mergeGeometries(par), M.granite); parM.castShadow = parM.receiveShadow = true; podium.add(parM);
  const sh = new THREE.InstancedMesh(canopy(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), shrubs.length), sm = new THREE.Matrix4(), sc = new THREE.Color();
  shrubs.forEach(([x, z], i) => { sh.setMatrixAt(i, sm.compose(new THREE.Vector3(x, PT + 2.3, z), new THREE.Quaternion(), new THREE.Vector3(1.7, 1.3, 1.7))); sh.setColorAt(i, sc.setHSL(0.24 + (i % 5) * 0.012, 0.45, 0.28 + (i % 3) * 0.03)); });
  sh.castShadow = true; podium.add(sh);
  // granite pylon at the corner, as on the renders
  const pyl = new THREE.Mesh(new THREE.BoxGeometry(4, 30, 4), M.granite); pyl.position.set(pod[1][0] - off.x - 4, 15, pod[1][1] - off.z + 3); pyl.castShadow = true; podium.add(pyl);
  root.add(podium);

  // trees (instanced, slightly varied)
  const trees = site.trees, n = trees.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.8, 9, 6), new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 1 }), n);
  const crown = new THREE.InstancedMesh(canopy(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), n * 2);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(); let r = 7;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  trees.forEach(([x, z], i) => {
    const s = 0.8 + rnd() * 0.6, X = x - off.x, Z = z - off.z;
    trunk.setMatrixAt(i, mtx.compose(new THREE.Vector3(X, 4.5 * s, Z), q, new THREE.Vector3(s, s, s)));
    for (let k = 0; k < 2; k++) {
      const cs = (7 + rnd() * 4) * s;
      crown.setMatrixAt(i * 2 + k, mtx.compose(new THREE.Vector3(X + (rnd() - 0.5) * 3, (11 + k * 4) * s, Z + (rnd() - 0.5) * 3), q, new THREE.Vector3(cs, cs * 0.85, cs)));
      crown.setColorAt(i * 2 + k, col.setHSL(0.22 + rnd() * 0.07, 0.42 + rnd() * 0.12, 0.25 + rnd() * 0.09));
    }
  });
  trunk.castShadow = crown.castShadow = true; crown.receiveShadow = true; root.add(trunk, crown);

  // parked cars
  const cars = site.parking, nc = cars.length;
  const body = new THREE.InstancedMesh(new RoundedBoxGeometry(14, 3.2, 6, 2, 0.9), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }), nc);
  const cabin = new THREE.InstancedMesh(new RoundedBoxGeometry(7.5, 2.4, 5.4, 2, 0.7), new THREE.MeshStandardMaterial({ color: 0x15191f, roughness: 0.15, metalness: 0.7 }), nc);
  const palette = [0xf2f2f0, 0x9aa0a6, 0x23272e, 0x8b1e24, 0x2c4c7a, 0xc9c3b6, 0x5a5f66];
  cars.forEach(([x, z], i) => {
    const ry = (x < 90 ? Math.PI / 2 : 0) + (rnd() - 0.5) * 0.08, Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    body.setMatrixAt(i, mtx.compose(new THREE.Vector3(x - off.x, 2.3, z - off.z), Q, new THREE.Vector3(1, 1, 1)));
    cabin.setMatrixAt(i, mtx.compose(new THREE.Vector3(x - off.x - Math.cos(ry) * 0.8, 4.6, z - off.z + Math.sin(ry) * 0.8), Q, new THREE.Vector3(1, 1, 1)));
    body.setColorAt(i, col.set(palette[i % palette.length]));
  });
  body.castShadow = cabin.castShadow = true; root.add(body, cabin);

  // street lights along both public roads
  const poles = [], bulbs = [];
  for (const k of ['road9', 'road18']) {
    const p = site[k], a = p[k === 'road9' ? 3 : 0], b = p[k === 'road9' ? 2 : 3];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 20; s < len; s += 70) {
      const x = a[0] + (b[0] - a[0]) * s / len - off.x, z = a[1] + (b[1] - a[1]) * s / len - off.z;
      poles.push(box(0.6, 26, 0.6, x, 13, z)); bulbs.push(box(3, 0.8, 1.4, x, 26, z));
    }
  }
  root.add(new THREE.Mesh(mergeGeometries(poles), M.metal), new THREE.Mesh(mergeGeometries(bulbs), M.lamp));

  // ramps to the basement parking
  for (const rp of site.ramps) root.add(flatMesh(rp, off, new THREE.MeshStandardMaterial({ color: 0x23252a, roughness: 0.9 }), 0.12));

  // the neighbourhood: pale low and mid-rise blocks pushed back into the haze, with street trees between them
  const blocks = [], foot = []; let rr = 3;
  const rnd2 = () => ((rr = (rr * 48271) % 2147483647) / 2147483647);
  const P = site.plot, minX = Math.min(...P.map(p => p[0])) - off.x, maxX = Math.max(...P.map(p => p[0])) - off.x;
  const minZ = Math.min(...P.map(p => p[1])) - off.z, maxZ = Math.max(...P.map(p => p[1])) - off.z;
  const tints = [0xf1ece2, 0xe6ddcd, 0xd9d4cb, 0xeadfcb, 0xd2d6da, 0xc9c0b1, 0xe9e4da];
  const ccol = new THREE.Color();
  for (let i = 0; i < 64; i++) {
    const side = i % 4; let x, z;
    if (side === 0) { x = minX - 120 + rnd2() * (maxX - minX + 360); z = minZ - 150 - rnd2() * 560; }      // north, across the 9 m road
    else if (side === 1) { x = minX - 120 + rnd2() * (maxX - minX + 240); z = maxZ + 110 + rnd2() * 560; } // south
    else if (side === 2) { x = minX - 140 - rnd2() * 560; z = minZ - 100 + rnd2() * (maxZ - minZ + 260); } // west
    else { x = maxX + 190 + rnd2() * 560; z = minZ - 140 + rnd2() * (maxZ - minZ + 340); }               // east, across the 18 m road
    const w = 34 + rnd2() * 56, d = 30 + rnd2() * 48, h = 20 + Math.pow(rnd2(), 1.7) * 84;
    if (nearHeroArc(x, z)) continue;
    const g = new THREE.BoxGeometry(w, h, d); g.translate(x, h / 2, z);
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++) {
      if (k >= 8 && k < 12) uv.setXY(k, 0.01, 0.01);                        // roofs: plain
      else uv.setXY(k, uv.getX(k) * Math.max(1, w / 48), uv.getY(k) * (h / 80));
    }
    ccol.set(tints[(i * 5) % tints.length]);
    const n = g.attributes.position.count, ca = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { ca[k * 3] = ccol.r; ca[k * 3 + 1] = ccol.g; ca[k * 3 + 2] = ccol.b; }
    g.setAttribute('color', new THREE.BufferAttribute(ca, 3));
    blocks.push(g); foot.push([x, z, w / 2 + 8, d / 2 + 8]);
  }
  const city = new THREE.Mesh(mergeGeometries(blocks), M.city); city.receiveShadow = true; root.add(city);
  // street trees in the neighbourhood (kept off the blocks, the plot and the two public roads)
  const tp = [];
  for (let i = 0; i < 900 && tp.length < 320; i++) {
    const x = minX - 700 + rnd2() * (maxX - minX + 1400), z = minZ - 700 + rnd2() * (maxZ - minZ + 1400);
    if (x > minX - 50 && x < maxX + 120 && z > minZ - 90 && z < maxZ + 50) continue;
    if (foot.some(([bx, bz, hw, hd]) => Math.abs(x - bx) < hw && Math.abs(z - bz) < hd)) continue;
    if (nearHeroArc(x, z, 230) || verge(x, z)) continue;
    tp.push([x, z]);
  }
  const ctTrunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.8, 9, 5), trunk.material, tp.length);
  const ctCrown = new THREE.InstancedMesh(crown.geometry, crown.material, tp.length);
  tp.forEach(([x, z], i) => {
    const s = 0.9 + rnd2() * 0.8, cs = (8 + rnd2() * 5) * s;
    ctTrunk.setMatrixAt(i, mtx.compose(new THREE.Vector3(x, 4.5 * s, z), q, new THREE.Vector3(s, s, s)));
    ctCrown.setMatrixAt(i, mtx.compose(new THREE.Vector3(x, 12 * s, z), q, new THREE.Vector3(cs, cs * 0.8, cs)));
    ctCrown.setColorAt(i, col.setHSL(0.22 + rnd2() * 0.08, 0.38 + rnd2() * 0.12, 0.25 + rnd2() * 0.1));
  });
  root.add(ctTrunk, ctCrown);
  return { root, podium };
}
