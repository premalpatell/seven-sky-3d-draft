// Procedural furniture, and where it stands in each flat type (positions read off the brochure's unit plans, in feet).
// Every piece is modelled facing +z with its back at -z, standing on y = 0.
// Placement is checked against the walls: pieces that belong against a wall are slid back until they touch it,
// and anything that would cut into a wall is pushed clear.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { tex } from './textures.js';

export function furniturePalette() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const weave = tex.weave();
  const fab = (c) => std({ map: tex.fabric(c), bumpMap: weave, bumpScale: 0.9, roughness: 0.93 });
  const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), toneMapped: true });
  return {
    oak: std({ map: tex.oak(), roughness: 0.5 }),
    walnut: std({ map: tex.walnut(), roughness: 0.45 }),
    slats: std({ map: tex.slats(), roughness: 0.55 }),
    white: std({ color: 0xf4f2ee, roughness: 0.32 }),
    cream: std({ color: 0xe9e1d3, roughness: 0.4 }),
    fabricGrey: fab('#b9b4ac'),
    fabricSand: fab('#cdbea4'),
    fabricCream: fab('#ece6da'),
    pillow: fab('#f5f3ee'),
    duvet: fab('#eef0f0'),
    linen: fab('#d9cfbd'),
    accent: fab('#a9724f'),
    accentBlue: fab('#5f7487'),
    accentGreen: fab('#6e806a'),
    granite: std({ map: tex.granite(), roughness: 0.22, metalness: 0.05 }),
    marble: std({ map: tex.marble(), roughness: 0.16 }),
    steel: std({ map: tex.brushed(), color: 0xffffff, roughness: 0.36, metalness: 0.85 }),
    steelDark: std({ color: 0x8b9096, roughness: 0.3, metalness: 0.9 }),
    chrome: std({ color: 0xeef0f2, roughness: 0.08, metalness: 1.0 }),
    brass: std({ color: 0xc8a160, roughness: 0.3, metalness: 1.0 }),
    blackMetal: std({ color: 0x1e1f22, roughness: 0.42, metalness: 0.6 }),
    ceramic: std({ color: 0xfbfbf9, roughness: 0.08 }),
    ceramicIn: std({ color: 0xdcdcd8, roughness: 0.1 }),
    stone: std({ color: 0xd8d2c8, roughness: 0.42 }),
    glass: std({ color: 0xd8ecf5, roughness: 0.03, metalness: 0.0, transparent: true, opacity: 0.14, depthWrite: false, envMapIntensity: 0.35 }),
    plant: std({ color: 0x4f803f, roughness: 0.62, side: THREE.DoubleSide }),
    plant2: std({ color: 0x386630, roughness: 0.62, side: THREE.DoubleSide }),
    soil: std({ color: 0x3a2c22, roughness: 1 }),
    pot: std({ color: 0xb56f4e, roughness: 0.75 }),
    potWhite: std({ color: 0xece8e1, roughness: 0.45 }),
    fruit: std({ color: 0xe0892c, roughness: 0.45 }),
    fruit2: std({ color: 0x9fb04a, roughness: 0.45 }),
    tv: std({ color: 0x07080a, roughness: 0.1, metalness: 0.35 }),
    rug: std({ map: tex.rug(), roughness: 1 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc982, emissiveIntensity: 1.5, roughness: 0.8, side: THREE.DoubleSide }),
    led: glow(1.7, 1.38, 0.95),
    mirror: std({ color: 0xe9eef1, roughness: 0.04, metalness: 0.85, emissive: 0xffffff, emissiveMap: tex.mirrorGlow(), emissiveIntensity: 0.42 }),
    blackGlass: std({ color: 0x0e0f12, roughness: 0.06, metalness: 0.25 }),
    tile: std({ map: tex.wallTile(), roughness: 0.18 }),
    dark: std({ color: 0x26272a, roughness: 0.6 }),
    art0: std({ map: tex.art(0), roughness: 0.8 }), art1: std({ map: tex.art(1), roughness: 0.8 }), art2: std({ map: tex.art(2), roughness: 0.8 }),
  };
}

const RB = (w, h, d, r = 0.25, s = 3) => new RoundedBoxGeometry(w, h, d, s, Math.max(0.005, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01)));
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CY = (rt, rb, h, n = 20, open = false) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open);
function put(g, geo, mat, x, y, z, ry = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; g.add(m); return m; }
// parts above the dollhouse cut (wall cupboards, cooker hood, shower head) only show once you're inside
const up = (m) => { m.userData.upper = true; return m; };

const F = {
  bed(P, { w = 5.4, l = 6.6 } = {}) {
    const g = new THREE.Group();
    put(g, BX(w - 0.7, 0.3, l - 0.7), P.dark, 0, 0.15, 0);                                    // recessed plinth
    put(g, RB(w, 0.75, l, 0.08), P.oak, 0, 0.675, 0);                                           // frame
    put(g, RB(w - 0.12, 0.6, l - 0.25, 0.2, 4), P.white, 0, 1.35, 0.04);                        // mattress
    const dl = l * 0.64, dz = l / 2 - dl / 2;                                                   // duvet over the foot two-thirds
    put(g, RB(w + 0.06, 0.2, dl, 0.09, 3), P.duvet, 0, 1.69, dz);
    for (const s of [-1, 1]) put(g, BX(0.05, 0.72, dl), P.duvet, s * (w / 2 + 0.04), 1.38, dz);
    put(g, BX(w + 0.12, 0.72, 0.05), P.duvet, 0, 1.38, l / 2 + 0.04);
    put(g, RB(w + 0.08, 0.26, 0.55, 0.12, 3), P.duvet, 0, 1.74, l / 2 - dl + 0.22);           // turned-down edge
    put(g, RB(w + 0.14, 0.09, 1.15, 0.04), P.linen, 0, 1.83, l / 2 - 0.85);                     // folded throw
    for (const s of [-1, 1]) put(g, BX(0.04, 0.5, 1.15), P.linen, s * (w / 2 + 0.09), 1.6, l / 2 - 0.85);
    for (const s of [-1, 1]) { const m = put(g, RB(w * 0.43, 0.5, 1.2, 0.24, 4), P.pillow, s * w * 0.235, 1.95, -l / 2 + 0.75); m.rotation.x = -0.55; }
    for (const s of [-1, 1]) { const m = put(g, RB(1.25, 1.0, 0.3, 0.14, 4), s < 0 ? P.accentBlue : P.fabricSand, s * 0.75, 2.0, -l / 2 + 1.35); m.rotation.x = -0.3; m.rotation.z = s * 0.06; }
    { const m = put(g, RB(1.8, 0.62, 0.3, 0.13, 4), P.accent, 0, 1.92, -l / 2 + 1.6); m.rotation.x = -0.25; }
    put(g, RB(w, 3.9, 0.3, 0.06), P.oak, 0, 1.95, -l / 2 - 0.17);                               // headboard backing
    const n = Math.round((w - 0.2) / 0.5), cw = (w - 0.2) / n;                                   // channel-tufted upholstery
    for (let i = 0; i < n; i++) put(g, RB(cw - 0.035, 2.5, 0.26, 0.11, 3), P.fabricSand, -(w - 0.2) / 2 + cw * (i + 0.5), 2.45, -l / 2 + 0.1);
    return g;
  },
  nightstand(P) {
    const g = new THREE.Group();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, CY(0.045, 0.03, 0.35, 8), P.walnut, sx * 0.56, 0.175, sz * 0.5);
    put(g, RB(1.4, 1.3, 1.3, 0.05), P.oak, 0, 1.0, 0);
    put(g, BX(1.32, 0.025, 0.02), P.dark, 0, 1.12, 0.655);
    put(g, BX(0.45, 0.045, 0.05), P.brass, 0, 1.38, 0.68);
    put(g, new THREE.SphereGeometry(0.27, 20, 14).scale(1, 1.15, 1), P.ceramic, -0.2, 1.95, -0.05);
    put(g, CY(0.025, 0.025, 0.45, 8), P.brass, -0.2, 2.35, -0.05);
    put(g, CY(0.34, 0.45, 0.55, 28, true), P.lamp, -0.2, 2.72, -0.05);
    put(g, BX(0.62, 0.1, 0.5), P.accentBlue, 0.36, 1.7, 0.25);
    put(g, BX(0.55, 0.09, 0.45), P.cream, 0.37, 1.8, 0.24, 0.2);
    return g;
  },
  wardrobe(P, { w = 5.6, d = 2.0, h = 7.0 } = {}) {
    const g = new THREE.Group();
    put(g, BX(w, h - 0.3, d - 0.1), P.walnut, 0, 0.3 + (h - 0.3) / 2, -0.05);
    put(g, BX(w - 0.1, 0.3, d - 0.35), P.dark, 0, 0.15, -0.12);
    const n = Math.max(2, Math.round(w / 1.5)), dw = w / n, hd = h - 0.38;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + dw * (i + 0.5);
      put(g, BX(dw - 0.025, hd, 0.06), P.walnut, x, 0.32 + hd / 2, d / 2 - 0.02);
      const hx = x + (i % 2 ? -1 : 1) * (dw / 2 - 0.16);
      put(g, BX(0.045, 2.3, 0.06), P.blackMetal, hx, 3.7, d / 2 + 0.05);
    }
    return g;
  },
  dresser(P, { w = 4.8 } = {}) {
    const g = new THREE.Group();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, CY(0.06, 0.035, 0.5, 8), P.walnut, sx * (w / 2 - 0.25), 0.25, sz * 0.5);
    put(g, RB(w, 1.85, 1.45, 0.05), P.oak, 0, 1.43, 0);
    for (const y of [1.05, 1.67]) put(g, BX(w - 0.1, 0.025, 0.02), P.dark, 0, y, 0.73);
    put(g, BX(0.02, 1.8, 0.02), P.dark, 0, 1.43, 0.73);
    for (const y of [0.78, 1.36, 1.98]) for (const s of [-1, 1]) put(g, BX(0.42, 0.04, 0.05), P.brass, s * w / 4, y, 0.76);
    const mr = Math.min(1.05, w * 0.24);
    const mir = put(g, CY(mr, mr, 0.05, 48), P.mirror, 0, 2.36 + mr + 0.35, -0.6); mir.rotation.x = Math.PI / 2;
    const fr = put(g, new THREE.TorusGeometry(mr + 0.02, 0.05, 8, 48), P.brass, 0, 2.36 + mr + 0.35, -0.57); fr.rotation.x = 0;
    put(g, CY(0.14, 0.2, 0.7, 16), P.ceramic, w / 2 - 0.55, 2.71, 0.05);
    put(g, CY(0.012, 0.012, 0.8, 4), P.plant2, w / 2 - 0.55, 3.3, 0.05);
    put(g, BX(0.8, 0.12, 0.55), P.linen, -w / 2 + 0.7, 2.42, 0.1, -0.15);
    return g;
  },
  sofa(P, { L = 6.4, D = 2.9, throwOn = true } = {}) {
    const g = new THREE.Group(), H0 = 0.3, inner = L - 1.0, n = L > 5.5 ? 3 : L > 3.6 ? 2 : 1, cw = inner / n;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, CY(0.055, 0.035, H0, 8), P.blackMetal, sx * (L / 2 - 0.35), H0 / 2, sz * (D / 2 - 0.35));
    put(g, RB(L, 0.55, D, 0.1), P.fabricGrey, 0, H0 + 0.275, 0);                                 // base
    for (const s of [-1, 1]) put(g, RB(0.5, 1.45, D, 0.17, 4), P.fabricGrey, s * (L / 2 - 0.25), H0 + 0.725, 0);   // track arms
    put(g, RB(inner + 0.02, 1.3, 0.4, 0.12), P.fabricGrey, 0, H0 + 1.2, -D / 2 + 0.2);         // back frame
    for (let i = 0; i < n; i++) {
      const x = -inner / 2 + cw * (i + 0.5);
      put(g, RB(cw - 0.04, 0.42, D - 0.62, 0.17, 4), P.fabricGrey, x, H0 + 0.76, 0.2);          // seat cushion
      const b = put(g, RB(cw - 0.06, 1.15, 0.5, 0.2, 4), P.fabricGrey, x, H0 + 1.5, -D / 2 + 0.62); b.rotation.x = -0.14;
    }
    const pil = (mat, x, rz, s = 1) => { const m = put(g, RB(1.05 * s, 1.0 * s, 0.3, 0.15, 4), mat, x, H0 + 1.4, -D / 2 + 1.02); m.rotation.x = -0.28; m.rotation.z = rz; };
    if (n === 1) pil(P.accent, 0, 0.08);
    else { pil(P.accent, -(inner / 2 - 0.62), 0.12); pil(P.fabricCream, inner / 2 - 0.62, -0.1); if (n === 3) pil(P.accentBlue, -(inner / 2 - 1.45), -0.06, 0.9); }
    if (throwOn && n > 1) {                                                                      // linen throw over one arm
      put(g, BX(0.62, 0.04, 1.4), P.linen, L / 2 - 0.25, H0 + 1.47, 0.25);
      put(g, BX(0.04, 0.85, 1.4), P.linen, L / 2 + 0.01, H0 + 1.06, 0.25);
    }
    return g;
  },
  armchair(P) { return F.sofa(P, { L: 2.9, D: 2.8, throwOn: false }); },
  coffee(P, { w = 3.6, d = 2.0 } = {}) {
    const g = new THREE.Group();
    put(g, RB(w, 0.1, d, 0.04), P.marble, 0, 1.36, 0);
    put(g, BX(w - 0.16, 0.12, d - 0.16), P.walnut, 0, 1.25, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, BX(0.12, 1.2, 0.12), P.walnut, sx * (w / 2 - 0.16), 0.6, sz * (d / 2 - 0.16));
    put(g, RB(w - 0.35, 0.07, d - 0.35, 0.03), P.walnut, 0, 0.32, 0);
    put(g, RB(1.0, 0.05, 0.62, 0.025), P.brass, w * 0.18, 1.44, 0.05);
    put(g, CY(0.12, 0.16, 0.42, 16), P.ceramic, w * 0.18 + 0.25, 1.67, 0.05);
    put(g, BX(0.85, 0.1, 0.62), P.accentBlue, -w * 0.2, 1.46, -0.05, 0.12);
    put(g, BX(0.75, 0.09, 0.55), P.cream, -w * 0.2, 1.55, -0.05, -0.05);
    put(g, BX(0.9, 0.12, 0.65), P.linen, -w * 0.15, 0.42, 0);
    return g;
  },
  coffeeRound(P, { r = 1.25 } = {}) {
    const g = new THREE.Group();
    put(g, CY(r, r, 0.1, 48), P.marble, 0, 1.36, 0);
    put(g, CY(r * 0.3, r * 0.42, 1.25, 24), P.blackMetal, 0, 0.66, 0);
    put(g, CY(r * 0.55, r * 0.6, 0.08, 32), P.blackMetal, 0, 0.04, 0);
    put(g, CY(0.42, 0.22, 0.22, 24), P.ceramic, 0.25, 1.52, 0.1);
    for (const [x, z, m] of [[0.15, 0.05, P.fruit], [0.35, 0.18, P.fruit2], [0.3, -0.05, P.fruit]]) put(g, new THREE.SphereGeometry(0.11, 12, 8), m, x, 1.68, z);
    put(g, BX(0.75, 0.1, 0.55), P.accent, -0.45, 1.46, -0.2, 0.3);
    return g;
  },
  rug(P, { w = 7.5, d = 5.4 } = {}) { const g = new THREE.Group(); const m = put(g, RB(w, 0.06, d, 0.02, 1), P.rug, 0, 0.045, 0); m.castShadow = false; return g; },
  tv(P, { w = 6.0 } = {}) {
    const g = new THREE.Group(), pw = Math.max(4.4, w * 0.82), cl = w + 0.4;
    put(g, BX(pw, 5.7, 0.16), P.slats, 0, 3.15, -0.9);                                          // slatted walnut wall panel
    put(g, BX(cl, 0.95, 1.25), P.white, 0, 1.28, -0.2);                                           // floating console
    put(g, BX(cl + 0.02, 0.06, 1.27), P.oak, 0, 1.785, -0.2);
    for (const s of [-1, 1]) put(g, BX(0.02, 0.85, 0.02), P.dark, s * cl / 6, 1.26, 0.43);
    put(g, BX(cl - 0.3, 0.03, 0.05), P.led, 0, 0.79, 0.2);                                       // warm strip under the console
    const tw = Math.min(4.6, pw * 0.86), th = tw * 0.5625;
    put(g, BX(tw + 0.06, th + 0.06, 0.1), P.blackMetal, 0, 4.15, -0.76);
    put(g, BX(tw, th, 0.02), P.tv, 0, 4.15, -0.7);
    put(g, BX(2.4, 0.2, 0.32), P.blackMetal, 0, 1.92, -0.05);                                   // soundbar
    put(g, CY(0.15, 0.22, 0.85, 18), P.ceramic, -cl / 2 + 0.45, 2.24, -0.2);
    put(g, CY(0.012, 0.012, 0.9, 4), P.plant2, -cl / 2 + 0.45, 2.95, -0.2);
    put(g, BX(0.9, 0.12, 0.62), P.accentGreen, cl / 2 - 0.6, 1.88, -0.2, 0.08);
    put(g, BX(0.8, 0.11, 0.55), P.cream, cl / 2 - 0.6, 2.0, -0.2, -0.1);
    put(g, new THREE.SphereGeometry(0.16, 14, 10), P.brass, cl / 2 - 0.55, 2.21, -0.2);
    return g;
  },
  dining(P, { w = 4.2, d = 2.6, chairs = 4 } = {}) {
    const g = new THREE.Group();
    put(g, RB(w, 0.14, d, 0.05), P.oak, 0, 2.43, 0);
    put(g, BX(w - 0.6, 0.22, d - 0.6), P.oak, 0, 2.25, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, CY(0.09, 0.06, 2.3, 10), P.walnut, sx * (w / 2 - 0.4), 1.15, sz * (d / 2 - 0.35));
    const per = chairs / 2;
    for (const sz of [-1, 1]) for (let i = 0; i < per; i++) {
      const c = new THREE.Group();
      put(c, RB(1.4, 0.24, 1.35, 0.1, 3), P.fabricSand, 0, 1.55, 0);
      const b = put(c, RB(1.35, 1.2, 0.16, 0.07, 3), P.fabricSand, 0, 2.38, -0.62); b.rotation.x = -0.1;
      for (const lx of [-1, 1]) for (const lz of [-1, 1]) put(c, CY(0.05, 0.035, 1.45, 8), P.walnut, lx * 0.55, 0.72, lz * 0.52);
      c.position.set(-w / 2 + (i + 0.5) * w / per, 0, sz * (d / 2 + 0.5)); c.rotation.y = sz < 0 ? 0 : Math.PI; g.add(c);
    }
    put(g, BX(1.0, 0.012, d - 0.25), P.linen, 0, 2.505, 0);                                       // runner
    put(g, CY(0.42, 0.24, 0.24, 24), P.ceramic, 0, 2.63, 0);
    for (const [x, z, m] of [[-0.12, 0.05, P.fruit], [0.14, -0.08, P.fruit2], [0.05, 0.16, P.fruit]]) put(g, new THREE.SphereGeometry(0.12, 12, 8), m, x, 2.8, z);
    return g;
  },
  kitchen(P, { len = 8, depth = 2.0, sink = null, hob = null, wall = true } = {}) {
    const g = new THREE.Group(), fz = depth / 2;
    put(g, BX(len, 0.35, depth - 0.3), P.dark, 0, 0.175, -0.15);                                  // toe kick
    put(g, BX(len, 2.35, depth - 0.08), P.cream, 0, 1.525, -0.04);
    const nD = Math.max(1, Math.round(len / 1.5)), dw = len / nD;
    for (let i = 0; i < nD; i++) {
      const x = -len / 2 + dw * (i + 0.5);
      put(g, BX(dw - 0.03, 1.62, 0.05), P.white, x, 1.23, fz - 0.03);                             // door
      put(g, BX(dw - 0.03, 0.56, 0.05), P.white, x, 2.37, fz - 0.03);                             // drawer
      put(g, BX(dw * 0.42, 0.035, 0.05), P.steelDark, x, 2.55, fz + 0.02);
      put(g, BX(dw * 0.42, 0.035, 0.05), P.steelDark, x, 1.92, fz + 0.02);
    }
    put(g, BX(len + 0.05, 0.14, depth + 0.08), P.granite, 0, 2.77, 0.02);                         // counter
    const used = [];
    if (sink !== null) {
      used.push(sink);
      put(g, BX(1.95, 0.015, 1.35), P.steel, sink, 2.846, 0.05);
      put(g, BX(1.75, 0.01, 1.15), P.steelDark, sink, 2.855, 0.05);
      put(g, CY(0.07, 0.08, 0.14, 12), P.chrome, sink, 2.91, -0.65);
      put(g, CY(0.04, 0.04, 1.05, 10), P.chrome, sink, 3.4, -0.65);
      const arc = put(g, new THREE.TorusGeometry(0.3, 0.04, 8, 18, Math.PI), P.chrome, sink, 3.92, -0.35); arc.rotation.y = Math.PI / 2;
      put(g, CY(0.035, 0.035, 0.2, 8), P.chrome, sink, 3.82, -0.05);
      put(g, RB(1.15, 0.06, 0.8, 0.02), P.oak, sink + (sink > 0 ? -1.75 : 1.75), 2.87, 0.15, 0.08);   // chopping board
    }
    if (hob !== null) {
      used.push(hob);
      put(g, BX(2.0, 0.04, 1.5), P.blackGlass, hob, 2.86, 0.05);
      for (const [bx, bz, r] of [[-0.5, -0.25, 0.22], [0.5, -0.25, 0.22], [0, 0.35, 0.17]]) {
        const ring = put(g, new THREE.TorusGeometry(r, 0.025, 6, 20), P.blackMetal, hob + bx, 2.9, bz); ring.rotation.x = Math.PI / 2;
        put(g, CY(0.09, 0.11, 0.05, 14), P.brass, hob + bx, 2.9, bz);
      }
      for (let k = -1; k <= 1; k++) { const kn = put(g, CY(0.07, 0.07, 0.08, 14), P.blackMetal, hob + k * 0.45, 2.37, fz + 0.04); kn.rotation.x = Math.PI / 2; }
    }
    // canisters at the free end of the counter
    const ends = [-len / 2 + 0.7, len / 2 - 0.7].sort((a, b) => Math.min(...used.map(u => Math.abs(b - u)), 9) - Math.min(...used.map(u => Math.abs(a - u)), 9));
    if (len > 4) for (let k = 0; k < 3; k++) put(g, CY(0.16, 0.16, 0.42 + k * 0.08, 16), k === 1 ? P.oak : P.white, ends[0] + (k - 1) * 0.36, 2.84 + (0.42 + k * 0.08) / 2, -0.55);
    if (wall) {
      put(g, BX(len, 2.15, 0.05), P.tile, 0, 3.92, -depth / 2 + 0.03);                           // backsplash
      // wall cupboards, with a gap for the chimney hood over the hob
      const gap = hob !== null ? [hob - 1.3, hob + 1.3] : null, segs = gap ? [[-len / 2, gap[0]], [gap[1], len / 2]] : [[-len / 2, len / 2]];
      for (const [a, b] of segs) {
        const L = b - a; if (L < 0.8) continue; const cx = (a + b) / 2, z = -depth / 2 + 0.58;
        up(put(g, BX(L, 2.2, 1.15), P.cream, cx, 6.1, z));
        const n = Math.max(1, Math.round(L / 1.5)), ew = L / n;
        for (let i = 0; i < n; i++) {
          up(put(g, BX(ew - 0.03, 2.14, 0.05), P.white, a + ew * (i + 0.5), 6.1, z + 0.6));
          up(put(g, BX(ew * 0.4, 0.035, 0.05), P.steelDark, a + ew * (i + 0.5), 5.12, z + 0.64));
        }
        up(put(g, BX(L - 0.1, 0.03, 0.06), P.led, cx, 4.985, z + 0.4));                        // under-cupboard light
      }
      if (gap) {
        const h = up(put(g, BX(2.4, 0.07, 1.45), P.blackGlass, hob, 5.15, -depth / 2 + 0.8)); h.rotation.x = -0.32;
        up(put(g, BX(2.4, 0.4, 0.9), P.steel, hob, 5.45, -depth / 2 + 0.47));
        up(put(g, BX(0.95, 1.6, 0.75), P.steel, hob, 6.45, -depth / 2 + 0.4));
      }
    }
    return g;
  },
  island(P, { len = 3.8 } = {}) {
    const g = F.kitchen(P, { len, depth: 2.0, wall: false });
    put(g, CY(0.45, 0.25, 0.26, 24), P.ceramic, 0.2, 2.97, 0);
    for (const [x, z, m] of [[0.08, 0.05, P.fruit], [0.32, -0.08, P.fruit2], [0.22, 0.16, P.fruit]]) put(g, new THREE.SphereGeometry(0.12, 12, 8), m, x, 3.14, z);
    return g;
  },
  fridge(P) {
    const g = new THREE.Group();
    put(g, RB(2.3, 5.85, 2.05, 0.06), P.steel, 0, 2.98, -0.08);
    for (const s of [-1, 1]) put(g, RB(1.13, 5.55, 0.12, 0.04), P.steel, s * 0.58, 3.0, 0.98);
    put(g, BX(0.03, 5.55, 0.05), P.dark, 0, 3.0, 0.98);
    for (const s of [-1, 1]) { put(g, BX(0.05, 2.6, 0.06), P.chrome, s * 0.14, 3.5, 1.12); for (const y of [2.3, 4.7]) put(g, BX(0.05, 0.06, 0.1), P.chrome, s * 0.14, y, 1.07); }
    put(g, RB(0.5, 0.8, 0.03, 0.03), P.blackGlass, -0.58, 4.05, 1.05);
    put(g, BX(2.2, 0.08, 1.8), P.dark, 0, 0.04, -0.1);
    return g;
  },
  wc(P) {
    const g = new THREE.Group(), oval = (geo) => geo.scale(1, 1, 1.32);
    put(g, oval(CY(0.4, 0.34, 0.95, 28)), P.ceramic, 0, 0.48, 0.15);
    put(g, oval(CY(0.6, 0.44, 0.36, 32)), P.ceramic, 0, 1.12, 0.2);
    put(g, oval(CY(0.5, 0.5, 0.02, 32)), P.ceramicIn, 0, 1.31, 0.2);
    put(g, oval(CY(0.62, 0.62, 0.06, 32)), P.ceramic, 0, 1.34, 0.2);
    put(g, RB(0.9, 0.5, 0.45, 0.12), P.ceramic, 0, 1.25, -0.48);
    put(g, RB(1.35, 1.15, 0.5, 0.12, 3), P.ceramic, 0, 1.92, -0.72);
    put(g, RB(1.42, 0.08, 0.55, 0.03), P.ceramic, 0, 2.53, -0.72);
    put(g, CY(0.08, 0.08, 0.03, 16), P.chrome, 0, 2.58, -0.72);
    return g;
  },
  vanity(P, { w = 1.8 } = {}) {
    const g = new THREE.Group(), mw = Math.min(w + 0.1, 1.9);
    put(g, RB(w, 1.15, 1.4, 0.04), P.walnut, 0, 2.2, -0.05);
    if (w > 1.55) put(g, BX(0.02, 1.05, 0.02), P.dark, 0, 2.2, 0.66);
    put(g, BX(w + 0.05, 0.08, 1.45), P.marble, 0, 2.82, -0.04);
    put(g, CY(0.55, 0.4, 0.42, 32).scale(1, 1, 0.82), P.ceramic, 0, 3.07, 0.05);
    put(g, CY(0.48, 0.48, 0.015, 32).scale(1, 1, 0.82), P.ceramicIn, 0, 3.27, 0.05);
    put(g, CY(0.04, 0.04, 1.0, 10), P.chrome, 0, 3.36, -0.55);
    const sp = put(g, CY(0.03, 0.03, 0.42, 8), P.chrome, 0, 3.84, -0.36); sp.rotation.x = Math.PI / 2;
    put(g, RB(mw + 0.12, 2.42, 0.02, 0.25), P.led, 0, 4.75, -0.75);                                // back-lit halo
    put(g, RB(mw, 2.3, 0.05, 0.22), P.mirror, 0, 4.75, -0.715);
    return g;
  },
  shower(P, { w = 3.0, d = 3.0 } = {}) {
    const g = new THREE.Group(), gw = Math.min(w * 0.62, w - 0.6);
    put(g, BX(w, 0.08, d), P.stone, 0, 0.04, 0);
    put(g, BX(0.55, 0.012, 0.12), P.steelDark, 0, 0.085, 0);
    put(g, BX(gw, 5.95, 0.04), P.glass, -w / 2 + gw / 2, 3.06, d / 2);
    put(g, BX(0.05, 5.95, 0.07), P.chrome, -w / 2 + gw, 3.06, d / 2);
    put(g, BX(gw, 0.06, 0.08), P.chrome, -w / 2 + gw / 2, 0.11, d / 2);
    up(put(g, CY(0.03, 0.03, 0.9, 8), P.chrome, 0, 7.05, -d / 2 + 0.45)).rotation.x = Math.PI / 2;
    up(put(g, CY(0.42, 0.42, 0.04, 28), P.chrome, 0, 7.0, -d / 2 + 0.9));
    put(g, CY(0.17, 0.17, 0.06, 18), P.chrome, 0, 3.6, -d / 2 + 0.03).rotation.x = Math.PI / 2;
    put(g, BX(0.32, 0.05, 0.05), P.chrome, 0.1, 3.6, -d / 2 + 0.09);
    return g;
  },
  washer(P) {
    const g = new THREE.Group();
    put(g, RB(2.0, 2.8, 1.95, 0.08), P.white, 0, 1.4, -0.02);
    put(g, BX(1.9, 0.36, 0.03), P.cream, 0, 2.47, 0.96);
    put(g, BX(0.55, 0.22, 0.02), P.white, -0.6, 2.47, 0.98);
    put(g, CY(0.13, 0.13, 0.06, 18), P.chrome, 0.55, 2.47, 0.99).rotation.x = Math.PI / 2;
    put(g, CY(0.62, 0.62, 0.08, 36), P.blackGlass, 0, 1.25, 0.96).rotation.x = Math.PI / 2;
    put(g, new THREE.TorusGeometry(0.66, 0.07, 10, 36), P.chrome, 0, 1.25, 0.99);
    return g;
  },
  usink(P) {
    const g = new THREE.Group();
    put(g, BX(2.2, 2.7, 1.6), P.white, 0, 1.35, 0);
    put(g, BX(2.25, 0.1, 1.65), P.stone, 0, 2.75, 0);
    put(g, BX(1.6, 0.01, 1.1), P.steelDark, 0, 2.805, 0.1);
    put(g, CY(0.04, 0.04, 0.8, 8), P.chrome, 0, 3.2, -0.62);
    put(g, CY(0.03, 0.03, 0.4, 8), P.chrome, 0, 3.6, -0.45).rotation.x = Math.PI / 2;
    return g;
  },
  plant(P, { h = 3.4, white = false } = {}) {
    const g = new THREE.Group(), pm = white ? P.potWhite : P.pot;
    put(g, CY(0.6, 0.44, 1.25, 24), pm, 0, 0.625, 0);
    put(g, CY(0.64, 0.62, 0.14, 24), pm, 0, 1.2, 0);
    put(g, CY(0.55, 0.55, 0.04, 20), P.soil, 0, 1.2, 0);
    put(g, CY(0.035, 0.06, h - 0.9, 6), P.walnut, 0, 1.2 + (h - 0.9) / 2, 0);
    const leaf = new THREE.SphereGeometry(1, 12, 6); leaf.scale(0.3, 0.035, 0.52); leaf.translate(0, 0, 0.5);
    const n = Math.round(10 + h * 2.4);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), ang = i * 2.39996, y = 1.5 + t * (h - 1.5);
      const m = put(g, leaf, i % 3 ? P.plant : P.plant2, Math.cos(ang) * 0.06, y, Math.sin(ang) * 0.06);
      m.rotation.order = 'YXZ'; m.rotation.set(-0.25 - 0.55 * t + Math.sin(i * 1.7) * 0.15, Math.PI / 2 - ang, Math.sin(i * 2.3) * 0.4);
      const sc = 0.75 + 0.35 * Math.sin(Math.PI * Math.min(1, t * 1.15)); m.scale.setScalar(sc);
    }
    return g;
  },
  balcony(P) {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      const c = new THREE.Group();
      for (const lx of [-1, 1]) for (const lz of [-1, 1]) put(c, CY(0.04, 0.04, 1.2, 8), P.blackMetal, lx * 0.65, 0.6, lz * 0.62);
      put(c, RB(1.55, 0.12, 1.5, 0.04), P.oak, 0, 1.2, 0);
      put(c, RB(1.45, 0.28, 1.35, 0.12, 4), P.fabricSand, 0, 1.4, 0.05);
      const b = put(c, RB(1.5, 1.3, 0.12, 0.05), P.oak, 0, 2.05, -0.7); b.rotation.x = -0.16;
      put(c, RB(1.0, 0.9, 0.28, 0.13, 4), s < 0 ? P.accentBlue : P.accent, 0, 2.0, -0.45).rotation.x = -0.25;
      c.position.set(s * 1.15, 0, 0); c.rotation.y = s * 0.35; g.add(c);
    }
    put(g, CY(0.55, 0.55, 0.06, 32), P.oak, 0, 1.75, 0.55);
    put(g, CY(0.05, 0.05, 1.7, 8), P.blackMetal, 0, 0.88, 0.55);
    put(g, CY(0.35, 0.35, 0.04, 20), P.blackMetal, 0, 0.03, 0.55);
    put(g, CY(0.12, 0.16, 0.3, 16), P.ceramic, 0.12, 1.93, 0.55);
    const pl = F.plant(P, { h: 2.6 }); pl.position.set(-1.6, 0, 1.2); g.add(pl);
    return g;
  },
  art(P, { w = 2.6, h = 1.8, seed = 0, y = 4.9 } = {}) {
    const g = new THREE.Group();
    put(g, BX(w + 0.12, h + 0.12, 0.08), P.blackMetal, 0, y, 0);
    put(g, BX(w - 0.1, h - 0.1, 0.02), P['art' + (seed % 3)], 0, y, 0.045);
    return g;
  },
};

// how far each piece reaches from its origin: half width, back (-z) and front (+z), and whether it's tall enough to block a view
const REACH = {
  bed: p => [(p.w ?? 5.4) / 2 + 0.1, (p.l ?? 6.6) / 2 + 0.32, (p.l ?? 6.6) / 2 + 0.1],
  nightstand: () => [0.7, 0.66, 0.72], wardrobe: p => [(p.w ?? 5.6) / 2, (p.d ?? 2) / 2, (p.d ?? 2) / 2 + 0.08, 1],
  dresser: p => [(p.w ?? 4.8) / 2, 0.74, 0.78], sofa: p => [(p.L ?? 6.4) / 2 + 0.05, (p.D ?? 2.9) / 2, (p.D ?? 2.9) / 2],
  armchair: () => [1.5, 1.4, 1.4], coffee: p => [(p.w ?? 3.6) / 2, (p.d ?? 2) / 2, (p.d ?? 2) / 2],
  coffeeRound: p => [p.r ?? 1.25, p.r ?? 1.25, p.r ?? 1.25], rug: p => [(p.w ?? 7.5) / 2, (p.d ?? 5.4) / 2, (p.d ?? 5.4) / 2],
  tv: p => [Math.max(4.4, (p.w ?? 6) * 0.82, (p.w ?? 6) + 0.4) / 2, 0.98, 0.45],
  dining: p => [(p.w ?? 4.2) / 2, (p.d ?? 2.6) / 2 + 1.25, (p.d ?? 2.6) / 2 + 1.25],
  kitchen: p => [(p.len ?? 8) / 2, (p.depth ?? 2) / 2, (p.depth ?? 2) / 2 + 0.07], island: p => [(p.len ?? 3.8) / 2, 1.0, 1.07],
  fridge: () => [1.15, 1.11, 1.16, 1], wc: () => [0.71, 0.97, 1.05], vanity: p => [Math.max((p.w ?? 1.8) / 2, Math.min((p.w ?? 1.8) + 0.1, 1.9) / 2 + 0.06), 0.77, 0.7],
  shower: p => [(p.w ?? 3) / 2, (p.d ?? 3) / 2, (p.d ?? 3) / 2 + 0.04], washer: () => [1.0, 1.0, 1.06], usink: () => [1.13, 0.83, 0.83],
  plant: () => [0.65, 0.65, 0.65], balcony: () => [2.0, 1.3, 1.6], art: p => [(p.w ?? 2.6) / 2 + 0.06, 0.04, 0.06],
};
// pieces that stand against a wall (searched for up to 1.2 ft behind them; art up to 6 ft)
const SNAP = new Set(['bed', 'nightstand', 'wardrobe', 'dresser', 'sofa', 'tv', 'kitchen', 'fridge', 'wc', 'vanity', 'shower', 'washer', 'usink', 'art']);
const FACE = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };
const BACK = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };

// [kind, x, y (plan feet), facing, params]
export const LAYOUTS = {
  1: [
    ['rug', 24.6, 19.2, 'S', { w: 8.0, d: 5.6 }], ['sofa', 18.95, 19.0, 'E', { L: 4.8 }], ['sofa', 24.3, 22.45, 'N', { L: 6.6 }],
    ['art', 18.95, 19.0, 'E', { w: 3.0, h: 2.0, seed: 0 }],
    ['coffee', 25.0, 19.3, 'S', { w: 3.6, d: 2.0 }], ['tv', 31.2, 17.5, 'W', { w: 5.6 }], ['plant', 18.95, 22.9, 'S', { h: 3.6 }],
    ['dining', 29.2, 11.9, 'S', { w: 4.4, d: 2.7, chairs: 4 }],
    ['kitchen', 20.75, 9.6, 'E', { len: 8.0, sink: 2.1, hob: -2.1 }], ['fridge', 26.25, 6.9, 'S'],
    ['bed', 12.6, 6.9, 'E', { w: 5.4, l: 6.6 }], ['nightstand', 10.0, 3.45, 'E'], ['nightstand', 10.0, 10.35, 'E'],
    ['art', 12.6, 6.9, 'E', { w: 3.4, h: 1.5, seed: 1, y: 5.0 }],
    ['wardrobe', 18.3, 7.4, 'W', { w: 5.6 }], ['plant', 10.6, 1.4, 'S', { h: 2.4 }], ['plant', 12.5, 1.4, 'S', { h: 2.0, white: true }],
    ['bed', 3.95, 19.25, 'E', { w: 5.4, l: 6.6 }], ['nightstand', 1.35, 15.8, 'E'], ['nightstand', 1.35, 22.7, 'E'],
    ['art', 3.95, 19.25, 'E', { w: 3.4, h: 1.5, seed: 2, y: 5.0 }],
    ['wardrobe', 9.75, 20.9, 'W', { w: 5.8 }],
    ['wc', 5.75, 10.9, 'E'], ['vanity', 5.75, 12.85, 'E', { w: 1.8 }], ['shower', 7.05, 6.6, 'S', { w: 3.8, d: 3.2 }],
    ['wc', 11.65, 20.3, 'E'], ['vanity', 14.5, 21.0, 'N', { w: 1.3 }], ['shower', 16.35, 20.6, 'N', { w: 2.1, d: 2.4 }],
    ['washer', 20.75, 2.7, 'S'], ['usink', 24.2, 2.1, 'S'], ['balcony', 29.7, 6.1, 'S'],
  ],
  2: [
    ['rug', 22.3, 16.6, 'S', { w: 7.5, d: 5.4 }], ['sofa', 23.2, 19.5, 'N', { L: 6.6 }], ['armchair', 18.9, 14.7, 'E'],
    ['art', 23.2, 19.5, 'N', { w: 3.6, h: 1.6, seed: 0 }],
    ['coffeeRound', 22.6, 16.2, 'S', { r: 1.25 }], ['tv', 21.0, 11.7, 'S', { w: 6.0 }], ['plant', 16.9, 20.1, 'S', { h: 3.4 }],
    ['dining', 29.0, 14.9, 'S', { w: 4.0, d: 2.5, chairs: 4 }],
    ['kitchen', 36.4, 5.05, 'S', { len: 6.4, sink: -1.0 }], ['kitchen', 38.6, 8.85, 'W', { len: 5.2, hob: 0.3 }], ['fridge', 33.1, 10.6, 'N'],
    ['bed', 8.1, 7.95, 'S', { w: 5.4, l: 6.5 }], ['nightstand', 4.65, 5.2, 'S'], ['nightstand', 11.55, 5.2, 'S'],
    ['art', 8.1, 7.95, 'S', { w: 3.4, h: 1.5, seed: 1, y: 5.0 }],
    ['wardrobe', 1.5, 12.8, 'E', { w: 5.6 }], ['dresser', 8.3, 14.95, 'N', { w: 5.0 }], ['plant', 1.4, 6.5, 'S', { h: 2.4 }],
    ['bed', 22.0, 3.85, 'S', { w: 5.4, l: 6.5 }], ['nightstand', 18.55, 1.4, 'S'], ['nightstand', 25.45, 1.4, 'S'],
    ['art', 22.0, 3.85, 'S', { w: 3.4, h: 1.5, seed: 2, y: 5.0 }],
    ['wardrobe', 20.6, 9.75, 'N', { w: 6.0 }],
    ['wc', 15.95, 5.45, 'W'], ['vanity', 16.1, 10.4, 'W', { w: 1.6 }], ['shower', 14.3, 7.9, 'E', { w: 2.6, d: 2.6 }],
    ['wc', 28.3, 4.6, 'E'], ['shower', 28.7, 2.0, 'S', { w: 2.2, d: 2.6 }], ['vanity', 31.2, 3.9, 'W', { w: 1.6 }],
    ['washer', 38.9, 2.3, 'W'], ['usink', 35.4, 1.5, 'S'], ['balcony', 13.5, 18.4, 'S'],
  ],
  3: [
    ['bed', 7.6, 4.0, 'S', { w: 5.4, l: 6.5 }], ['nightstand', 4.15, 1.45, 'S'], ['nightstand', 11.05, 1.45, 'S'],
    ['art', 7.6, 4.0, 'S', { w: 3.4, h: 1.5, seed: 1, y: 5.0 }],
    ['wardrobe', 1.65, 8.7, 'E', { w: 5.0 }], ['dresser', 7.35, 10.75, 'N', { w: 3.6 }], ['plant', 1.1, 3.2, 'S', { h: 2.4 }],
    ['bed', 7.6, 18.55, 'N', { w: 5.4, l: 6.5 }], ['nightstand', 4.15, 21.1, 'N'], ['nightstand', 11.05, 21.1, 'N'],
    ['art', 7.6, 18.55, 'N', { w: 3.4, h: 1.5, seed: 2, y: 5.0 }],
    ['wardrobe', 1.65, 14.65, 'E', { w: 5.0 }], ['dresser', 7.35, 12.75, 'S', { w: 3.6 }],
    ['kitchen', 25.65, 12.2, 'W', { len: 8.0, sink: -2.6, hob: 1.7 }], ['island', 21.7, 14.85, 'N', { len: 3.8 }], ['fridge', 20.9, 9.75, 'S'],
    ['dining', 15.8, 18.3, 'E', { w: 4.2, d: 2.8, chairs: 4 }],
    ['rug', 21.4, 22.0, 'S', { w: 7.0, d: 5.0 }], ['sofa', 21.2, 19.0, 'S', { L: 5.2 }], ['sofa', 25.1, 22.2, 'W', { L: 4.0 }],
    ['art', 21.2, 19.0, 'S', { w: 3.2, h: 1.6, seed: 0 }],
    ['coffee', 21.2, 22.0, 'S', { w: 3.2, d: 1.5 }], ['tv', 21.0, 25.65, 'N', { w: 5.4 }],
    ['wc', 15.95, 4.45, 'W'], ['vanity', 16.1, 6.75, 'W', { w: 1.5 }], ['shower', 13.9, 2.2, 'S', { w: 2.2, d: 2.8 }],
    ['wc', 21.05, 7.0, 'W'], ['shower', 18.5, 3.9, 'S', { w: 2.4, d: 2.6 }], ['vanity', 15.9, 8.6, 'S', { w: 1.8 }],
    ['washer', 28.0, 6.4, 'W'], ['usink', 24.2, 4.6, 'S'], ['balcony', 10.0, 24.3, 'S'],
  ],
};

// plan rectangle covered by a piece at (x, y) facing `face`
function bounds(x, y, face, [hw, back, front]) {
  if (face === 'S') return { x0: x - hw, x1: x + hw, y0: y - back, y1: y + front };
  if (face === 'N') return { x0: x - hw, x1: x + hw, y0: y - front, y1: y + back };
  if (face === 'E') return { x0: x - back, x1: x + front, y0: y - hw, y1: y + hw };
  return { x0: x - front, x1: x + back, y0: y - hw, y1: y + hw };
}
// distance along a ray to the first rectangle it enters (Infinity if none within max)
function rayHit(ox, oy, dx, dy, max, rects) {
  let best = Infinity;
  for (const r of rects) {
    let t0 = -Infinity, t1 = Infinity;
    for (const [o, d, a, b] of [[ox, dx, r.x0, r.x1], [oy, dy, r.y0, r.y1]]) {
      if (Math.abs(d) < 1e-9) { if (o < a || o > b) { t0 = Infinity; break; } continue; }
      let ta = (a - o) / d, tb = (b - o) / d; if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    }
    if (t0 <= t1 && t0 >= -0.01 && t0 <= max && t0 < best) best = Math.max(0, t0);
  }
  return best;
}

// final positions for a flat type: snapped to walls, clear of walls (cached per type)
const placedCache = {};
export function placements(u) {
  if (placedCache[u.type]) return placedCache[u.type];
  const walls = u.walls.map(([x, y, w, d]) => ({ x0: x, y0: y, x1: x + Math.max(w, 0.05), y1: y + Math.max(d, 0.3) }));
  const wins = u.windows.map(([x, y, w, d]) => ({ x0: x, y0: y, x1: x + Math.max(w, 0.05), y1: y + Math.max(d, 0.05) }));
  const out = [];
  for (const [kind, x0, y0, face, p = {}] of LAYOUTS[u.type]) {
    let x = x0, y = y0; const R = REACH[kind](p);
    if (SNAP.has(kind)) {
      const [dx, dy] = BACK[face], sx = -dy, sy = dx, reach = kind === 'art' ? 6 : 1.2;
      let hit = Infinity;
      for (const o of kind === 'art' ? [-0.4, 0, 0.4] : [-0.8, 0, 0.8]) hit = Math.min(hit, rayHit(x + sx * o * R[0], y + sy * o * R[0], dx, dy, R[1] + reach, walls));
      if (kind === 'art') {                                   // only hang art on solid wall, never over a window
        if (hit === Infinity) continue;
        let wh = Infinity; for (const o of [-1, 0, 1]) wh = Math.min(wh, rayHit(x + sx * o * R[0], y + sy * o * R[0], dx, dy, hit + 0.4, wins));
        if (wh <= hit + 0.35) continue;
      }
      if (hit < Infinity) { const s = hit - R[1] - 0.03; x += dx * s; y += dy * s; }
    }
    if (kind !== 'art') for (let it = 0; it < 4; it++) {         // push anything still cutting into a wall out of it
      let moved = false; const b = bounds(x, y, face, R);
      for (const w of walls) {
        const px = Math.min(b.x1 - w.x0, w.x1 - b.x0), py = Math.min(b.y1 - w.y0, w.y1 - b.y0);
        if (px <= 0.02 || py <= 0.02) continue;
        if (px < py) x += ((b.x0 + b.x1) < (w.x0 + w.x1) ? -1 : 1) * (px + 0.02); else y += ((b.y0 + b.y1) < (w.y0 + w.y1) ? -1 : 1) * (py + 0.02);
        moved = true; break;
      }
      if (!moved) break;
    }
    out.push({ kind, x, y, face, p, R });
  }
  return (placedCache[u.type] = out);
}

export function buildFurniture(P, u) {
  const root = new THREE.Group();
  for (const { kind, x, y, face, p } of placements(u)) {
    const item = F[kind](P, p);
    item.position.set(x, 0, y); item.rotation.y = FACE[face] ?? 0;
    root.add(item);
  }
  return root;
}

// plan footprints of every placed piece, for choosing clear camera spots inside rooms
export function footprints(u) {
  return placements(u).filter(o => o.kind !== 'rug' && o.kind !== 'art').map(({ kind, x, y, face, R }) => ({ kind, cx: x, cy: y, ...bounds(x, y, face, R), tall: !!R[3] }));
}
