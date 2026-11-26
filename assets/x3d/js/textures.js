// Procedural textures (generated on a canvas, so the whole 3D model downloads as a few KB of data).
import * as THREE from 'three';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function canvasTexture(size, draw, { repeat = [1, 1], srgb = true, aniso = 8, h = size } = {}) {
  const c = document.createElement('canvas'); c.width = size; c.height = h;
  const g = c.getContext('2d'); draw(g, size, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = aniso;
  return t;
}

function noise(g, w, h, amount, seed, alpha = 0.08) {
  const r = rng(seed), img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amount; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  // soft blotches
  for (let i = 0; i < 40; i++) {
    const x = r() * w, y = r() * h, rad = 20 + r() * 80, a = alpha * r();
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const v = r() > 0.5 ? 255 : 0;
    gr.addColorStop(0, `rgba(${v},${v},${v},${a})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

export const tex = {
  // sand-coloured facade plaster, as on the Seven Sky renders
  stucco: () => canvasTexture(256, (g, w, h) => { g.fillStyle = '#b09272'; g.fillRect(0, 0, w, h); noise(g, w, h, 10, 7, 0.04); }, { repeat: [0.08, 0.08] }),
  stuccoBump: () => canvasTexture(256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); noise(g, w, h, 60, 11, 0.12); }, { repeat: [0.08, 0.08], srgb: false }),
  paving: () => canvasTexture(512, (g, w, h) => {
    g.fillStyle = '#9c9890'; g.fillRect(0, 0, w, h); noise(g, w, h, 18, 3, 0.06);
    g.strokeStyle = 'rgba(60,55,50,.35)'; g.lineWidth = 2;
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
  }, { repeat: [1 / 16, 1 / 16] }),
  asphalt: () => canvasTexture(512, (g, w, h) => { g.fillStyle = '#3b3d40'; g.fillRect(0, 0, w, h); noise(g, w, h, 26, 5, 0.05); }, { repeat: [1 / 30, 1 / 30] }),
  grass: () => canvasTexture(512, (g, w, h) => {
    g.fillStyle = '#5d7d3f'; g.fillRect(0, 0, w, h); const r = rng(9);
    for (let i = 0; i < 9000; i++) { const v = 70 + r() * 70; g.fillStyle = `rgba(${v * 0.6 | 0},${v | 0},${v * 0.35 | 0},.5)`; g.fillRect(r() * w, r() * h, 1.5, 3); }
    // mowing stripes
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.022)' : 'rgba(0,0,0,.022)'; g.fillRect(i * w / 8, 0, w / 8, h); }
  }, { repeat: [1 / 24, 1 / 24] }),
  track: () => canvasTexture(256, (g, w, h) => { g.fillStyle = '#a8654a'; g.fillRect(0, 0, w, h); noise(g, w, h, 30, 13, 0.04); }, { repeat: [1 / 10, 1 / 10] }),
  sand: () => canvasTexture(256, (g, w, h) => { g.fillStyle = '#d8c39a'; g.fillRect(0, 0, w, h); noise(g, w, h, 40, 17, 0.05); }, { repeat: [1 / 8, 1 / 8] }),
  oak: () => canvasTexture(512, (g, w, h) => {
    const r = rng(21); g.fillStyle = '#c9a47a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) { const v = Math.sin(y * 0.07 + Math.sin(y * 0.011) * 7 + Math.sin(y * 0.31) * 0.4) * 0.5 + 0.5; g.fillStyle = `rgba(118,76,40,${0.03 + v * 0.11})`; g.fillRect(0, y, w, 1); }
    for (let i = 0; i < 110; i++) { const y = r() * h; g.fillStyle = `rgba(90,55,25,${r() * 0.14})`; g.fillRect(0, y, w, 0.6 + r()); }
    for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h; g.strokeStyle = 'rgba(95,58,28,.18)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, 26 + r() * 20, 4 + r() * 3, 0, 0, Math.PI * 2); g.stroke(); }
  }, { repeat: [1, 1] }),
  walnut: () => canvasTexture(512, (g, w, h) => {
    const r = rng(23); g.fillStyle = '#6f4d34'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) { const v = Math.sin(y * 0.09 + Math.sin(y * 0.017) * 6) * 0.5 + 0.5; g.fillStyle = `rgba(32,18,9,${0.05 + v * 0.14})`; g.fillRect(0, y, w, 1); }
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,220,180' : '20,10,5'},${r() * 0.08})`; g.fillRect(0, r() * h, w, 0.6 + r()); }
  }),
  fabric: (base = '#9b968e') => canvasTexture(128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(0, y, w, 1); }
    for (let x = 0; x < w; x += 2) { g.fillStyle = 'rgba(0,0,0,.04)'; g.fillRect(x, 0, 1, h); }
  }, { repeat: [3, 3] }),
  granite: () => canvasTexture(256, (g, w, h) => {
    g.fillStyle = '#1e1e21'; g.fillRect(0, 0, w, h); const r = rng(31);
    for (let i = 0; i < 2200; i++) { const v = 40 + r() * 120; g.fillStyle = `rgba(${v},${v},${v + 8},${0.35 * r()})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  }),
  wallTile: () => canvasTexture(256, (g, w, h) => {
    g.fillStyle = '#e9e5dc'; g.fillRect(0, 0, w, h); noise(g, w, h, 6, 41, 0.03);
    g.strokeStyle = 'rgba(150,140,125,.55)'; g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); }
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
  }, { repeat: [1, 1] }),
  rug: () => canvasTexture(512, (g, w, h) => {
    g.fillStyle = '#d4c4a8'; g.fillRect(0, 0, w, h); noise(g, w, h, 22, 51, 0.04);
    const r = rng(52);
    for (let i = 0; i < 14000; i++) { const v = r() > 0.5 ? 255 : 60; g.fillStyle = `rgba(${v},${v},${v},.05)`; g.fillRect(r() * w, r() * h, 1, 2); }
    g.strokeStyle = 'rgba(96,74,52,.55)'; g.lineWidth = 10; g.strokeRect(22, 22, w - 44, h - 44);
    g.strokeStyle = 'rgba(96,74,52,.3)'; g.lineWidth = 3; g.strokeRect(44, 44, w - 88, h - 88);
    // soft abstract motif
    g.strokeStyle = 'rgba(150,120,90,.22)'; g.lineWidth = 5;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w * (0.3 + 0.08 * i), h * 0.55, 60 + i * 26, Math.PI * 1.05, Math.PI * 1.75); g.stroke(); }
  }),
  // what a mirror 'sees' in a bright room: soft light above, warmer wall tones below (so mirrors never read as black holes)
  mirrorGlow: () => canvasTexture(64, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w * 0.3, h);
    gr.addColorStop(0, '#9aa3aa'); gr.addColorStop(0.45, '#7d8388'); gr.addColorStop(0.7, '#8a8277'); gr.addColorStop(1, '#6f6a63');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(w * 0.15, 0); g.lineTo(w * 0.35, 0); g.lineTo(w * 0.05, h); g.lineTo(0, h); g.closePath(); g.fill();
  }, { aniso: 1 }),
  // woven upholstery relief (used as a bump map, not colour)
  weave: () => canvasTexture(128, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { const o = ((x + y) / 4) % 2; g.fillStyle = o ? '#9a9a9a' : '#6a6a6a'; g.fillRect(x, y, 4, 2); g.fillStyle = o ? '#707070' : '#949494'; g.fillRect(x, y + 2, 4, 2); }
    noise(g, w, h, 30, 81, 0.02);
  }, { repeat: [6, 6], srgb: false }),
  // white marble with soft grey veins
  marble: () => canvasTexture(512, (g, w, h) => {
    g.fillStyle = '#f2efea'; g.fillRect(0, 0, w, h); noise(g, w, h, 8, 91, 0.05);
    const r = rng(92);
    for (let k = 0; k < 9; k++) {
      let x = r() * w, y = r() * h; const a0 = r() * Math.PI;
      g.strokeStyle = `rgba(120,118,115,${0.12 + r() * 0.25})`; g.lineWidth = 0.6 + r() * 2.2; g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 60; s++) { const a = a0 + Math.sin(s * 0.3 + k) * 0.7; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); }
      g.stroke();
    }
  }),
  // brushed stainless steel (fine horizontal streaks)
  brushed: () => canvasTexture(256, (g, w, h) => {
    g.fillStyle = '#c3c6c9'; g.fillRect(0, 0, w, h); const r = rng(101);
    for (let i = 0; i < 900; i++) { const v = 150 + r() * 90; g.fillStyle = `rgba(${v},${v},${v + 4},.35)`; g.fillRect(0, r() * h, w, 0.6 + r()); }
  }),
  // walnut slatted wall panel behind the TV
  slats: () => canvasTexture(512, (g, w, h) => {
    g.fillStyle = '#6e4c33'; g.fillRect(0, 0, w, h); const r = rng(111);
    for (let x = 0; x < w; x += 2) { const v = Math.sin(x * 0.21 + Math.sin(x * 0.03) * 4) * 0.5 + 0.5; g.fillStyle = `rgba(35,20,10,${0.05 + v * 0.1})`; g.fillRect(x, 0, 2, h); }
    for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(30,18,8,${r() * 0.12})`; g.fillRect(r() * w, 0, 1, h); }
    for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(15,8,3,.75)'; g.fillRect(x, 0, 5, h); g.fillStyle = 'rgba(255,230,200,.06)'; g.fillRect(x + 5, 0, 2, h); }
  }),
  // framed abstract art prints (warm, calm palette)
  art: (seed = 1) => canvasTexture(256, (g, w, h) => {
    const r = rng(seed * 7919), pal = [['#e9dfcf', '#c58b5f', '#7f8f7a', '#2f3a48'], ['#efe8dc', '#b9a27f', '#5d7186', '#d7b48a'], ['#f1ece3', '#8a9a86', '#c9a074', '#3b3f45']][seed % 3];
    g.fillStyle = pal[0]; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = pal[1 + (i % 3)]; g.globalAlpha = 0.75; g.beginPath(); g.arc(w * (0.2 + r() * 0.6), h * (0.25 + r() * 0.55), 30 + r() * 70, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1; g.strokeStyle = pal[3]; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.1, h * 0.8); g.bezierCurveTo(w * 0.4, h * 0.5, w * 0.6, h * 0.95, w * 0.9, h * 0.6); g.stroke();
    noise(g, w, h, 10, seed, 0.02);
  }, { repeat: [1, 1] }),
  // lane markings for the roads
  lane: () => canvasTexture(256, (g, w, h) => {
    g.fillStyle = '#3b3d40'; g.fillRect(0, 0, w, h); noise(g, w, h, 26, 61, 0.05);
    g.fillStyle = 'rgba(235,235,225,.85)'; g.fillRect(w / 2 - 3, 0, 6, h * 0.55);
  }, { repeat: [1, 1] }),
  // surrounding city blocks: pale walls with window bands (map) + the few lit windows (glow map)
  cityWindows: () => {
    const r1 = rng(71), r2 = rng(71);
    const draw = (glow, r) => (g, w, h) => {
      g.fillStyle = glow ? '#000' : '#ffffff'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) {
        const lit = r() < 0.12, tone = r();
        if (glow) g.fillStyle = lit ? `rgb(${255},${200 + tone * 40 | 0},${130 + tone * 40 | 0})` : '#000';
        else g.fillStyle = lit ? '#f4dcb0' : `rgb(${132 + tone * 30 | 0},${148 + tone * 30 | 0},${166 + tone * 30 | 0})`;
        g.fillRect(x * 42 + 9, y * 32 + 9, 24, 15);
      }
    };
    return [canvasTexture(256, draw(false, r1), { aniso: 4 }), canvasTexture(256, draw(true, r2), { aniso: 4 })];
  },
};

// vertical gradient for the "model" backdrop used in the floor and flat views (like the reel)
export function navyBackdrop() {
  return canvasTexture(16, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#0c1f45'); gr.addColorStop(0.55, '#0a1a3a'); gr.addColorStop(1, '#050d22');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, { h: 256, aniso: 1 });
}
