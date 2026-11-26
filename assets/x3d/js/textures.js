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
  stucco: () => canvasTexture(256, (g, w, h) => { g.fillStyle = '#e4c49d'; g.fillRect(0, 0, w, h); noise(g, w, h, 10, 7, 0.04); }, { repeat: [0.08, 0.08] }),
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
    const r = rng(21); g.fillStyle = '#c39a6b'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { const v = Math.sin(y * 0.09 + Math.sin(y * 0.013) * 6) * 0.5 + 0.5; g.fillStyle = `rgba(110,70,35,${0.05 + v * 0.1})`; g.fillRect(0, y, w, 2); }
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(90,55,25,${r() * 0.12})`; g.fillRect(0, r() * h, w, 1); }
  }, { repeat: [1, 1] }),
  walnut: () => canvasTexture(256, (g, w, h) => {
    g.fillStyle = '#6a4a33'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { const v = Math.sin(y * 0.11 + Math.sin(y * 0.02) * 5) * 0.5 + 0.5; g.fillStyle = `rgba(30,18,10,${0.08 + v * 0.12})`; g.fillRect(0, y, w, 2); }
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
  rug: () => canvasTexture(256, (g, w, h) => {
    g.fillStyle = '#c9b597'; g.fillRect(0, 0, w, h); noise(g, w, h, 24, 51, 0.04);
    g.strokeStyle = 'rgba(120,95,70,.35)'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
  }),
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
