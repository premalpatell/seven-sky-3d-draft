// Procedural furniture and per-layout placements (positions read off the brochure's unit plans, in feet).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { tex } from './textures.js';

export function furniturePalette() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    oak: std({ map: tex.oak(), roughness: 0.55, color: 0xffffff }),
    walnut: std({ map: tex.walnut(), roughness: 0.5 }),
    white: std({ color: 0xf4f1ea, roughness: 0.45 }),
    cream: std({ color: 0xe9e0cf, roughness: 0.5 }),
    fabricGrey: std({ map: tex.fabric('#bab5ad'), roughness: 0.95 }),
    fabricBeige: std({ map: tex.fabric('#cdbfa8'), roughness: 0.95 }),
    fabricCream: std({ map: tex.fabric('#ebe4d6'), roughness: 0.95 }),
    duvet: std({ map: tex.fabric('#dfe3e6'), roughness: 0.95 }),
    accent: std({ map: tex.fabric('#b48c6c'), roughness: 0.9 }),
    granite: std({ map: tex.granite(), roughness: 0.28, metalness: 0.05 }),
    steel: std({ color: 0xc9cdd1, roughness: 0.25, metalness: 0.85 }),
    chrome: std({ color: 0xe8ebee, roughness: 0.1, metalness: 1.0 }),
    ceramic: std({ color: 0xf7f7f4, roughness: 0.12 }),
    glass: std({ color: 0xd8ecf5, roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.28, depthWrite: false }),
    plant: std({ color: 0x4f803f, roughness: 0.7, side: THREE.DoubleSide }),
    plant2: std({ color: 0x386630, roughness: 0.7, side: THREE.DoubleSide }),
    soil: std({ color: 0x3a2c22, roughness: 1 }),
    pot: std({ color: 0xb0694a, roughness: 0.75 }),
    tv: std({ color: 0x0b0c0f, roughness: 0.18, metalness: 0.4 }),
    rug: std({ map: tex.rug(), roughness: 1 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc982, emissiveIntensity: 1.6, roughness: 0.8 }),
    mirror: std({ color: 0xdfe6ea, roughness: 0.02, metalness: 1.0 }),
    blackGlass: std({ color: 0x101114, roughness: 0.08, metalness: 0.2 }),
    tile: std({ map: tex.wallTile(), roughness: 0.25 }),
    dark: std({ color: 0x2a2b2e, roughness: 0.6 }),
  };
}

const RB = (w, h, d, r = 0.25, s = 3) => new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01));
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function put(g, geo, mat, x, y, z, ry = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; g.add(m); return m; }

const F = {
  bed(P, { w = 5.4, l = 6.6 } = {}) {
    const g = new THREE.Group();
    put(g, RB(w, 1.0, l, 0.15), P.oak, 0, 0.5, 0);
    put(g, RB(w - 0.3, 0.75, l - 0.35, 0.3), P.white, 0, 1.35, 0.05);
    put(g, RB(w - 0.1, 0.32, l * 0.62, 0.15), P.duvet, 0, 1.78, l * 0.19);
    put(g, RB(w - 0.05, 0.36, 1.3, 0.15), P.accent, 0, 1.82, l / 2 - 1.0);
    for (const s of [-1, 1]) put(g, RB(w * 0.42, 0.45, 1.25, 0.2), P.fabricCream, s * w * 0.23, 1.95, -l / 2 + 1.0);
    put(g, RB(w + 0.5, 3.4, 0.45, 0.15), P.fabricBeige, 0, 1.7, -l / 2 - 0.1);
    return g;
  },
  nightstand(P) {
    const g = new THREE.Group();
    put(g, RB(1.6, 1.8, 1.4, 0.08), P.oak, 0, 0.9, 0);
    put(g, new THREE.CylinderGeometry(0.22, 0.3, 0.7, 14), P.ceramic, 0, 2.15, 0);
    put(g, new THREE.CylinderGeometry(0.42, 0.52, 0.65, 18, 1, true), P.lamp, 0, 2.75, 0);
    return g;
  },
  wardrobe(P, { w = 5.6, d = 2.0, h = 7.0 } = {}) {
    const g = new THREE.Group();
    put(g, BX(w, h, d), P.walnut, 0, h / 2, 0);
    const n = Math.max(2, Math.round(w / 1.8));
    for (let i = 1; i < n; i++) put(g, BX(0.04, h - 0.3, 0.05), P.dark, -w / 2 + i * w / n, h / 2, d / 2 + 0.01);
    for (let i = 0; i < n; i++) put(g, BX(0.06, 1.4, 0.12), P.chrome, -w / 2 + (i + 0.5) * w / n + (i % 2 ? -0.35 : 0.35), h * 0.5, d / 2 + 0.06);
    return g;
  },
  dresser(P, { w = 4.8 } = {}) {
    const g = new THREE.Group();
    put(g, BX(w, 2.6, 1.5), P.oak, 0, 1.3, 0);
    put(g, BX(w * 0.55, 2.2, 0.08), P.mirror, 0, 4.1, -0.7);
    return g;
  },
  sofa(P, { L = 6.4, D = 2.9 } = {}) {
    const g = new THREE.Group();
    put(g, RB(L, 1.1, D, 0.25), P.fabricGrey, 0, 0.85, 0);
    const n = L > 5.5 ? 3 : 2, cw = (L - 1.1) / n;
    for (let i = 0; i < n; i++) put(g, RB(cw - 0.06, 0.45, D - 0.85, 0.2), P.fabricGrey, -L / 2 + 0.55 + cw * (i + 0.5), 1.6, 0.25);
    put(g, RB(L - 1.0, 1.55, 0.7, 0.28), P.fabricGrey, 0, 2.2, -D / 2 + 0.45);
    for (const s of [-1, 1]) put(g, RB(0.55, 1.75, D, 0.25), P.fabricGrey, s * (L / 2 - 0.27), 1.2, 0);
    for (const s of [-1, 1]) put(g, RB(1.15, 1.1, 0.38, 0.18), P.fabricCream, s * (L / 2 - 1.35), 2.15, -D / 2 + 0.95);
    if (L > 5.5) put(g, RB(1.0, 0.95, 0.34, 0.16), P.fabricBeige, 0.35, 2.05, -D / 2 + 0.98);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, BX(0.22, 0.3, 0.22), P.walnut, sx * (L / 2 - 0.3), 0.15, sz * (D / 2 - 0.3));
    return g;
  },
  coffee(P, { w = 3.6, d = 2.0 } = {}) {
    const g = new THREE.Group();
    put(g, RB(w, 0.16, d, 0.06), P.oak, 0, 1.4, 0);
    put(g, RB(w - 0.4, 0.12, d - 0.4, 0.05), P.oak, 0, 0.35, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, BX(0.14, 1.3, 0.14), P.walnut, sx * (w / 2 - 0.2), 0.7, sz * (d / 2 - 0.2));
    put(g, RB(0.9, 0.18, 0.7, 0.04), P.cream, 0.5, 1.57, 0.1);
    return g;
  },
  coffeeRound(P, { r = 1.25 } = {}) {
    const g = new THREE.Group();
    put(g, new THREE.CylinderGeometry(r, r, 0.16, 32), P.white, 0, 1.4, 0);
    put(g, new THREE.CylinderGeometry(r * 0.45, r * 0.55, 1.3, 24), P.oak, 0, 0.67, 0);
    return g;
  },
  rug(P, { w = 7.5, d = 5.4 } = {}) { const g = new THREE.Group(); const m = put(g, BX(w, 0.06, d), P.rug, 0, 0.04, 0); m.castShadow = false; return g; },
  tv(P, { w = 6.0 } = {}) {
    const g = new THREE.Group(), pw = Math.max(4.2, w * 0.78);
    put(g, BX(pw, 5.8, 0.22), P.walnut, 0, 4.75, -0.88);
    put(g, BX(w + 0.6, 1.0, 1.35), P.white, 0, 1.35, -0.32);
    put(g, BX(w + 0.62, 0.07, 1.37), P.walnut, 0, 1.885, -0.32);
    put(g, BX(Math.min(4.6, pw * 0.86), 2.6, 0.1), P.tv, 0, 4.5, -0.72);
    put(g, new THREE.CylinderGeometry(0.16, 0.22, 0.75, 14), P.ceramic, -w / 2 + 0.4, 2.3, -0.4);
    put(g, RB(0.9, 0.28, 0.65, 0.04), P.cream, w / 2 - 0.5, 2.06, -0.35);
    return g;
  },
  dining(P, { w = 4.2, d = 2.6, chairs = 4 } = {}) {
    const g = new THREE.Group();
    put(g, RB(w, 0.16, d, 0.06), P.oak, 0, 2.5, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, BX(0.18, 2.4, 0.18), P.walnut, sx * (w / 2 - 0.35), 1.2, sz * (d / 2 - 0.3));
    const per = chairs / 2;
    for (const sz of [-1, 1]) for (let i = 0; i < per; i++) {
      const x = -w / 2 + (i + 0.5) * w / per, z = sz * (d / 2 + 0.55);
      const c = new THREE.Group();
      put(c, RB(1.45, 0.32, 1.45, 0.12), P.fabricCream, 0, 1.55, 0);
      put(c, RB(1.45, 1.6, 0.22, 0.1), P.fabricCream, 0, 2.45, 0.68);
      for (const lx of [-1, 1]) for (const lz of [-1, 1]) put(c, BX(0.12, 1.45, 0.12), P.walnut, lx * 0.6, 0.72, lz * 0.6);
      c.position.set(x, 0, z); c.rotation.y = sz < 0 ? 0 : Math.PI; g.add(c);
    }
    put(g, new THREE.CylinderGeometry(0.35, 0.25, 0.6, 16), P.ceramic, 0, 2.9, 0);
    return g;
  },
  kitchen(P, { len = 8, depth = 2.0, sink = null, hob = null } = {}) {
    const g = new THREE.Group();
    put(g, BX(len, 2.75, depth), P.cream, 0, 1.375, 0);
    put(g, BX(len + 0.05, 0.14, depth + 0.12), P.granite, 0, 2.82, 0.05);
    put(g, BX(len, 2.1, 0.06), P.tile, 0, 3.95, -depth / 2 + 0.03);
    put(g, BX(len, 2.2, 1.1), P.white, 0, 6.1, -depth / 2 + 0.55);
    for (let i = 1; i < Math.round(len / 1.5); i++) { put(g, BX(0.03, 2.6, 0.03), P.dark, -len / 2 + i * 1.5, 1.35, depth / 2 + 0.01); }
    if (sink !== null) { put(g, BX(1.9, 0.12, 1.3), P.steel, sink, 2.9, 0.1); put(g, new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), P.chrome, sink, 3.3, -0.6); }
    if (hob !== null) {
      put(g, BX(2.0, 0.06, 1.5), P.blackGlass, hob, 2.92, 0.1);
      for (const bx of [-0.45, 0.45]) for (const bz of [-0.3, 0.35]) put(g, new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), P.dark, hob + bx, 2.97, bz);
      put(g, BX(2.2, 0.9, 1.6), P.steel, hob, 5.0, -0.25);
    }
    return g;
  },
  island(P, { len = 3.8, hob = 0 } = {}) {
    const g = F.kitchen(P, { len, depth: 2.0, hob });
    g.children.filter(c => c.position.y > 3.5 && c.position.y < 7 && c.geometry.parameters?.height > 2).forEach(c => g.remove(c));   // no wall cabinets
    g.children.filter(c => c.material === P.tile).forEach(c => g.remove(c));
    return g;
  },
  fridge(P) { const g = new THREE.Group(); put(g, RB(2.3, 5.9, 2.2, 0.12), P.steel, 0, 2.95, 0); put(g, BX(0.08, 2.2, 0.1), P.chrome, 0.85, 3.8, 1.12); return g; },
  wc(P) {
    const g = new THREE.Group();
    put(g, RB(1.25, 1.3, 1.7, 0.4), P.ceramic, 0, 0.65, 0.15);
    put(g, RB(1.35, 0.12, 1.55, 0.06), P.ceramic, 0, 1.36, 0.2);
    put(g, RB(1.4, 1.25, 0.55, 0.12), P.ceramic, 0, 1.6, -0.75);
    return g;
  },
  vanity(P, { w = 1.8 } = {}) {
    const g = new THREE.Group();
    put(g, BX(w, 1.9, 1.4), P.walnut, 0, 1.6, -0.1);
    put(g, RB(w - 0.3, 0.35, 1.05, 0.15), P.ceramic, 0, 2.7, 0);
    put(g, new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), P.chrome, 0, 3.05, -0.45);
    put(g, BX(w, 2.4, 0.06), P.mirror, 0, 4.6, -0.78);
    return g;
  },
  shower(P, { w = 3.0, d = 3.0 } = {}) {
    const g = new THREE.Group();
    put(g, BX(w, 0.08, d), P.tile, 0, 0.05, 0);
    put(g, BX(w, 6.4, 0.06), P.glass, 0, 3.3, d / 2);
    put(g, new THREE.CylinderGeometry(0.4, 0.4, 0.06, 20), P.chrome, 0, 7.0, -d / 2 + 0.6);
    put(g, BX(0.06, 1.0, 0.06), P.chrome, 0, 7.4, -d / 2 + 0.35);
    return g;
  },
  washer(P) {
    const g = new THREE.Group();
    put(g, RB(2.0, 2.8, 2.0, 0.1), P.white, 0, 1.4, 0);
    const door = put(g, new THREE.CylinderGeometry(0.62, 0.62, 0.1, 28), P.blackGlass, 0, 1.25, 1.0); door.rotation.x = Math.PI / 2;
    const ring = put(g, new THREE.TorusGeometry(0.66, 0.06, 8, 28), P.chrome, 0, 1.25, 1.03); ring.rotation.x = 0;
    return g;
  },
  usink(P) { const g = new THREE.Group(); put(g, BX(2.2, 2.8, 1.6), P.white, 0, 1.4, 0); put(g, BX(1.7, 0.15, 1.2), P.steel, 0, 2.85, 0.05); return g; },
  plant(P, { h = 3.4 } = {}) {
    const g = new THREE.Group();
    put(g, new THREE.CylinderGeometry(0.6, 0.44, 1.25, 20), P.pot, 0, 0.625, 0);
    put(g, new THREE.CylinderGeometry(0.64, 0.62, 0.14, 20), P.pot, 0, 1.2, 0);
    put(g, new THREE.CylinderGeometry(0.55, 0.55, 0.04, 20), P.soil, 0, 1.2, 0);
    put(g, new THREE.CylinderGeometry(0.035, 0.06, h - 0.9, 6), P.walnut, 0, 1.2 + (h - 0.9) / 2, 0);
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
      put(c, RB(1.5, 0.3, 1.5, 0.1), P.fabricBeige, 0, 1.4, 0);
      put(c, RB(1.5, 1.4, 0.2, 0.08), P.walnut, 0, 2.1, -0.65);
      for (const lx of [-1, 1]) for (const lz of [-1, 1]) put(c, BX(0.1, 1.3, 0.1), P.dark, lx * 0.6, 0.65, lz * 0.6);
      c.position.set(s * 1.15, 0, 0); c.rotation.y = s * 0.35; g.add(c);
    }
    put(g, new THREE.CylinderGeometry(0.55, 0.55, 0.08, 20), P.white, 0, 1.9, 0.55);
    put(g, new THREE.CylinderGeometry(0.06, 0.06, 1.85, 8), P.dark, 0, 0.93, 0.55);
    const pl = F.plant(P, { h: 2.6 }); pl.position.set(-1.6, 0, 1.2); g.add(pl);
    return g;
  },
};

const FACE = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };

// [kind, x, y (plan feet), facing, params]
export const LAYOUTS = {
  1: [
    ['rug', 25.0, 19.6, 'S', { w: 8.0, d: 5.6 }], ['sofa', 23.1, 22.45, 'N', { L: 6.6 }], ['sofa', 18.95, 19.4, 'E', { L: 4.8 }],
    ['coffee', 25.3, 19.6, 'S', { w: 3.6, d: 2.0 }], ['tv', 31.75, 19.0, 'W', { w: 6.0 }], ['plant', 18.95, 22.9, 'S', { h: 3.6 }],
    ['dining', 29.6, 12.6, 'S', { w: 4.4, d: 2.7, chairs: 4 }],
    ['kitchen', 20.75, 9.6, 'E', { len: 8.0, sink: 2.1, hob: -2.1 }], ['fridge', 26.25, 6.9, 'S'],
    ['bed', 12.6, 6.9, 'E', { w: 5.4, l: 6.6 }], ['nightstand', 10.0, 3.45, 'E'], ['nightstand', 10.0, 10.35, 'E'],
    ['wardrobe', 18.3, 7.4, 'W', { w: 5.6 }], ['plant', 10.6, 1.4, 'S', { h: 2.4 }], ['plant', 12.5, 1.4, 'S', { h: 2.0 }],
    ['bed', 3.95, 19.25, 'E', { w: 5.4, l: 6.6 }], ['nightstand', 1.35, 15.9, 'E'], ['nightstand', 1.35, 22.6, 'E'],
    ['wardrobe', 9.75, 20.9, 'W', { w: 5.8 }],
    ['wc', 5.75, 10.9, 'E'], ['vanity', 5.75, 12.85, 'E', { w: 1.8 }], ['shower', 7.05, 6.6, 'S', { w: 3.8, d: 3.2 }],
    ['wc', 11.65, 20.4, 'E'], ['vanity', 11.75, 18.4, 'E', { w: 1.6 }], ['shower', 16.2, 19.75, 'W', { w: 3.8, d: 2.4 }],
    ['washer', 20.75, 2.7, 'S'], ['usink', 24.2, 2.1, 'S'], ['balcony', 29.7, 6.1, 'S'],
  ],
  2: [
    ['rug', 22.0, 16.8, 'S', { w: 7.5, d: 5.4 }], ['sofa', 22.6, 19.5, 'N', { L: 6.6 }], ['sofa', 18.4, 16.9, 'E', { L: 4.6 }],
    ['coffeeRound', 22.2, 16.6, 'S', { r: 1.25 }], ['tv', 21.0, 11.7, 'S', { w: 6.0 }], ['plant', 16.6, 20.1, 'S', { h: 3.4 }],
    ['dining', 29.6, 14.9, 'S', { w: 4.0, d: 2.5, chairs: 4 }],
    ['kitchen', 36.4, 5.05, 'S', { len: 6.4, sink: -1.0 }], ['kitchen', 38.6, 8.7, 'W', { len: 5.2, hob: 0.3 }], ['fridge', 33.1, 10.6, 'N'],
    ['bed', 8.1, 7.95, 'S', { w: 5.4, l: 6.5 }], ['nightstand', 4.75, 5.2, 'S'], ['nightstand', 11.45, 5.2, 'S'],
    ['wardrobe', 1.5, 12.6, 'E', { w: 5.6 }], ['dresser', 8.3, 14.95, 'N', { w: 5.0 }], ['plant', 1.4, 6.5, 'S', { h: 2.4 }],
    ['bed', 22.0, 3.85, 'S', { w: 5.4, l: 6.5 }], ['nightstand', 18.6, 1.4, 'S'], ['nightstand', 25.4, 1.4, 'S'],
    ['wardrobe', 20.6, 9.75, 'N', { w: 6.0 }],
    ['wc', 15.95, 5.45, 'W'], ['vanity', 16.1, 10.4, 'W', { w: 1.6 }], ['shower', 14.3, 7.9, 'E', { w: 2.6, d: 2.6 }],
    ['wc', 28.3, 4.85, 'E'], ['shower', 30.4, 2.1, 'S', { w: 2.2, d: 2.6 }], ['vanity', 28.2, 7.0, 'S', { w: 1.8 }],
    ['washer', 38.9, 2.3, 'W'], ['usink', 35.4, 1.5, 'S'], ['balcony', 13.5, 18.4, 'S'],
  ],
  3: [
    ['bed', 7.6, 4.0, 'S', { w: 5.4, l: 6.5 }], ['nightstand', 4.25, 1.45, 'S'], ['nightstand', 10.95, 1.45, 'S'],
    ['wardrobe', 1.65, 8.7, 'E', { w: 5.0 }], ['dresser', 7.35, 10.75, 'N', { w: 3.6 }], ['plant', 1.1, 3.2, 'S', { h: 2.4 }],
    ['bed', 7.6, 18.55, 'N', { w: 5.4, l: 6.5 }], ['nightstand', 4.25, 21.1, 'N'], ['nightstand', 10.95, 21.1, 'N'],
    ['wardrobe', 1.65, 14.65, 'E', { w: 5.0 }], ['dresser', 7.35, 12.75, 'S', { w: 3.6 }],
    ['kitchen', 25.65, 12.2, 'W', { len: 8.0, sink: -2.6 }], ['island', 21.7, 14.85, 'N', { len: 3.8, hob: 0 }], ['fridge', 20.9, 9.75, 'S'],
    ['dining', 14.5, 18.3, 'E', { w: 4.2, d: 3.0, chairs: 4 }],
    ['rug', 21.8, 21.0, 'S', { w: 7.0, d: 5.0 }], ['sofa', 22.0, 17.6, 'S', { L: 5.6 }], ['sofa', 25.45, 20.1, 'W', { L: 4.4 }],
    ['coffee', 21.6, 20.6, 'S', { w: 3.2, d: 1.5 }], ['tv', 20.0, 25.65, 'N', { w: 5.4 }],
    ['wc', 15.95, 4.45, 'W'], ['vanity', 16.1, 6.75, 'W', { w: 1.5 }], ['shower', 13.9, 2.2, 'S', { w: 2.2, d: 2.8 }],
    ['wc', 21.05, 7.0, 'W'], ['shower', 18.5, 3.9, 'S', { w: 2.4, d: 2.6 }], ['vanity', 15.9, 8.6, 'S', { w: 1.8 }],
    ['washer', 28.3, 6.4, 'W'], ['usink', 24.2, 4.6, 'S'], ['balcony', 10.0, 24.3, 'S'],
  ],
};

export function buildFurniture(P, type) {
  const root = new THREE.Group();
  for (const [kind, x, y, face, params] of LAYOUTS[type]) {
    const item = F[kind](P, params || {});
    item.position.set(x, 0, y); item.rotation.y = FACE[face] ?? 0;
    root.add(item);
  }
  return root;
}

// approximate plan footprints (ft) of every placed item, for choosing clear camera spots inside rooms
const FOOT = {
  bed: p => [(p.w ?? 5.4) + 0.3, (p.l ?? 6.6) + 0.4], nightstand: () => [1.6, 1.4], wardrobe: p => [p.w ?? 5.6, 2.0, 1],
  dresser: p => [p.w ?? 4.8, 1.5], sofa: p => [p.L ?? 6.4, p.D ?? 2.9], coffee: p => [p.w ?? 3.6, p.d ?? 2.0],
  coffeeRound: p => [2 * (p.r ?? 1.25), 2 * (p.r ?? 1.25)], tv: p => [(p.w ?? 6) + 0.6, 1.7], dining: p => [(p.w ?? 4.2) + 0.4, (p.d ?? 2.6) + 2.6],
  kitchen: p => [p.len ?? 8, p.depth ?? 2.0], island: p => [p.len ?? 3.8, 2.0], fridge: () => [2.3, 2.2, 1], wc: () => [1.4, 2.2],
  vanity: p => [p.w ?? 1.8, 1.4], shower: p => [p.w ?? 3, p.d ?? 3], washer: () => [2, 2], usink: () => [2.2, 1.6], plant: () => [1.3, 1.3],
  balcony: () => [4.0, 2.6], rug: () => [0, 0],
};
export function footprints(type) {
  return LAYOUTS[type].filter(([k]) => k !== 'rug').map(([kind, x, y, face, p = {}]) => {
    const [w, d, tall] = FOOT[kind](p), turned = face === 'E' || face === 'W', hw = (turned ? d : w) / 2, hd = (turned ? w : d) / 2;
    return { kind, cx: x, cy: y, x0: x - hw, x1: x + hw, y0: y - hd, y1: y + hd, tall: !!tall };
  });
}
