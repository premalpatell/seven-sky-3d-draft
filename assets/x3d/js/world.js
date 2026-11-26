// Renderer, scene, lighting moods, post-processing and the animation clock.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { navyBackdrop } from './textures.js';

export const ease = {
  inOut: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  out: k => 1 - Math.pow(1 - k, 3),
  outExpo: k => (k === 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inOutSine: k => -(Math.cos(Math.PI * k) - 1) / 2,
};

export function detectQuality() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  const q = new URLSearchParams(location.search).get('q');
  if (q === 'low' || q === 'high') return q;
  return (coarse || mem <= 4 || cores <= 4) ? 'low' : 'high';
}

// the sun rakes across the north facades the hero camera sees (three-quarter light; the east ends fall into soft shade)
export const SUN_DIR = new THREE.Vector3(-0.22, 0.6, -0.77).normalize();
const HAZE = new THREE.Color(0x9fc3ec);

function makeSky() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      zenith: { value: new THREE.Color(0x0b4fc7) }, mid: { value: new THREE.Color(0x2a7fe6) }, horizon: { value: HAZE.clone() },
      ground: { value: new THREE.Color(0x6f7f8f) }, glow: { value: new THREE.Color(0xffd9b0) }, sun: { value: SUN_DIR.clone() },
    },
    vertexShader: 'varying vec3 vDir; void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `
      uniform vec3 zenith, mid, horizon, ground, glow, sun; varying vec3 vDir;
      float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return v; }
      void main() {
        vec3 d = normalize(vDir); float h = d.y; vec3 col;
        if (h < 0.0) col = mix(horizon, ground, smoothstep(0.0, -0.2, h));
        else { col = mix(horizon, mid, smoothstep(0.0, 0.2, h)); col = mix(col, zenith, smoothstep(0.16, 0.8, h)); }
        vec2 hz = normalize(d.xz + 1e-4), sz = normalize(sun.xz + 1e-4);
        float s = max(dot(hz, sz), 0.0);
        col += glow * pow(s, 5.0) * (1.0 - smoothstep(0.0, 0.3, abs(h))) * 0.45;
        if (h > 0.015) {
          vec2 uv = d.xz / (h + 0.06);
          float c = fbm(uv * 0.55 + vec2(3.0, 1.0));
          float w = fbm(vec2(uv.x * 0.35, uv.y * 1.6) + 7.0);
          float cl = smoothstep(0.52, 0.8, c * 0.55 + w * 0.5) * smoothstep(0.015, 0.16, h) * (1.0 - 0.55 * smoothstep(0.55, 0.95, h));
          vec3 cc = mix(horizon * 1.05, vec3(1.0, 0.98, 0.96), 0.55) * mix(0.82, 1.08, c);
          col = mix(col, cc, cl * 0.75);
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(7000, 48, 24), m);
  dome.frustumCulled = false; dome.renderOrder = -1;
  return dome;
}

export class World {
  constructor(canvas, quality) {
    this.quality = quality;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.basePR = Math.min(devicePixelRatio, quality === 'high' ? 1.75 : 1.4); this.prScale = 1; this.ft = []; this.good = 0;
    r.setPixelRatio(this.basePR);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.9;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.shadowMap.autoUpdate = false; this.shadowFrames = 3;      // shadows are redrawn only when something moves (see frame)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.3, 9000);
    this.camera.position.set(260, 130, -190);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.07, enablePan: false, rotateSpeed: 0.55, zoomSpeed: 0.7 });
    this.controls.target.set(0, 20, 0);
    this.tweens = new Set(); this.onFrame = new Set();

    // --- blue-hour sky with wispy cloud (as on the reel and the brochure renders) ---
    const sky = this.sky = makeSky(); this.scene.add(sky);
    const pm = new THREE.PMREMGenerator(r);
    const skyScene = new THREE.Scene(); skyScene.add(makeSky());
    this.envSky = pm.fromScene(skyScene, 0.03).texture;
    this.envStudio = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envSky;
    this.backdrop = navyBackdrop();
    this.scene.fog = new THREE.FogExp2(HAZE.clone(), 0.0007);

    // --- lights ---
    this.hemi = new THREE.HemisphereLight(0xe4ecff, 0x9a8a72, 0.8); this.scene.add(this.hemi);
    const key = this.key = new THREE.DirectionalLight(0xffe2c2, 2.4);
    key.position.copy(SUN_DIR).multiplyScalar(400); key.castShadow = true;
    const sz = quality === 'high' ? 4096 : 2048; key.shadow.mapSize.set(sz, sz);
    Object.assign(key.shadow.camera, { left: -300, right: 300, top: 260, bottom: -260, near: 10, far: 1200 });
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.6;
    this.scene.add(key); this.scene.add(key.target);
    this.fill = new THREE.DirectionalLight(0xffe4cc, 0.6); this.fill.position.set(300, 120, 80); this.scene.add(this.fill);
    this.shift = { x: 0, y: 0 };

    // --- post ---
    // the composer renders off-screen, so the canvas's own antialiasing never applies: give its target 4x MSAA
    const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(r, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (quality === 'high') {
      this.ao = new GTAOPass(this.scene, this.camera, 2, 2);
      this.ao.output = GTAOPass.OUTPUT.Default; this.ao.blendIntensity = 0.85;
      this.ao.updateGtaoMaterial({ radius: 2.2, distanceExponent: 1.4, thickness: 2.0, scale: 1.0, samples: 12 });
      this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      this.ao.enabled = false; this.composer.addPass(this.ao);
      this.bloom = new UnrealBloomPass(new THREE.Vector2(2, 2), 0.35, 0.4, 0.92);
      this.composer.addPass(this.bloom);
    }
    this.composer.addPass(new OutputPass());

    this.resize = this.resize.bind(this);
    new ResizeObserver(this.resize).observe(canvas.parentElement);
    this.resize();
    this.clock = new THREE.Clock();
    r.setAnimationLoop(() => this.frame());
  }

  resize() {
    const el = this.renderer.domElement.parentElement, w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.composer.setSize(w, h);
    this.w = w; this.h = h; this.applyShift();
  }

  // shift the picture so the camera's target sits in the middle of the free area
  // (x: width of a right-hand panel in px, y: height of a bottom sheet in px)
  applyShift() {
    const c = this.camera, { x, y } = this.shift, w = this.w, h = this.h;
    if (!w) return;
    if (x > 0.5 || y > 0.5) c.setViewOffset(w + x, h + y, x, y, w, h);
    else { c.clearViewOffset(); c.aspect = w / h; }
    c.updateProjectionMatrix();
  }
  setShift(x, y, ms = 900) {
    const x0 = this.shift.x, y0 = this.shift.y;
    if (Math.abs(x - x0) < 0.5 && Math.abs(y - y0) < 0.5) return Promise.resolve();
    return this.tween(ms, k => { this.shift.x = x0 + (x - x0) * k; this.shift.y = y0 + (y - y0) * k; this.applyShift(); });
  }

  // three looks: blue-hour site, studio model on navy (the reel's floor/flat views), daylight interior
  setMood(mood) {
    const s = this.scene;
    this.mood = mood;
    if (mood === 'site') {
      s.background = null; this.sky.visible = true; s.environment = this.envSky; s.environmentIntensity = 0.42;
      s.fog.density = 0.00085; this.hemi.intensity = 0.8; this.hemi.color.set(0xe4ecff); this.hemi.groundColor.set(0x9a8a72);
      this.key.intensity = 2.7; this.key.color.set(0xffe6c8); this.fill.intensity = 0.6;
      this.setKeyDir(SUN_DIR); this.renderer.toneMappingExposure = 1.0;
      if (this.ao) this.ao.enabled = false;
      if (this.bloom) { this.bloom.strength = 0.35; this.bloom.threshold = 0.92; }
    } else if (mood === 'model') {
      s.background = this.backdrop; this.sky.visible = false; s.environment = this.envStudio; s.environmentIntensity = 0.42;
      s.fog.density = 0.0; this.hemi.intensity = 0.42; this.hemi.color.set(0xdfe8ff); this.hemi.groundColor.set(0x6d6253);
      this.key.intensity = 3.1; this.key.color.set(0xfff3e4); this.fill.intensity = 0.3;
      this.renderer.toneMappingExposure = 1.0;
      if (this.ao) this.ao.enabled = true;
      if (this.bloom) { this.bloom.strength = 0.2; this.bloom.threshold = 0.96; }
    } else if (mood === 'inside') {
      s.background = null; this.sky.visible = true; s.environment = this.envStudio; s.environmentIntensity = 0.62;
      s.fog.density = 0.00045; this.hemi.intensity = 0.55; this.hemi.color.set(0xdbe7ff); this.hemi.groundColor.set(0x9a8670);
      this.key.intensity = 2.6; this.key.color.set(0xfff0dc); this.fill.intensity = 0.15;
      this.renderer.toneMappingExposure = 0.98;
      if (this.ao) this.ao.enabled = true;
      if (this.bloom) { this.bloom.strength = 0.28; this.bloom.threshold = 0.94; }
    }
  }
  // aim the key light (dir points towards the light; any length)
  setKeyDir(dir) {
    const k = this.key, d = dir.clone().normalize(), dist = k.position.distanceTo(k.target.position) || 400;
    k.position.copy(k.target.position).addScaledVector(d, dist);
  }

  // adaptive quality: on a GPU that can't keep up, trade render resolution (then ambient occlusion) for a smooth frame rate,
  // and step back up when there is headroom. Judged on the median of 90 frames, so one-off hitches don't count
  adapt(dt) {
    if (this.tweens.size || document.hidden) return;
    this.ft.push(dt); if (this.ft.length < 90) return;
    const med = [...this.ft].sort((a, b) => a - b)[45]; this.ft.length = 0;
    if (med > 1 / 36) {
      this.good = 0;
      if (this.prScale > 0.62) { this.prScale = Math.max(0.6, this.prScale - 0.15); this.applyPR(); }
      else if (this.ao && !this.aoOff) this.aoOff = true;
    } else if (med < 1 / 56 && this.prScale < 1 && ++this.good >= 3) { this.good = 0; this.prScale = Math.min(1, this.prScale + 0.1); this.applyPR(); }
  }
  applyPR() { this.renderer.setPixelRatio(this.basePR * this.prScale); this.composer.setPixelRatio?.(this.basePR * this.prScale); this.resize(); }

  // ask for the shadows to be redrawn (after showing or hiding something outside a transition)
  touchShadows() { this.shadowFrames = Math.max(this.shadowFrames, 3); }

  // shadow camera follows what matters (the whole site, or one floor)
  focusShadows(center, radius) {
    const k = this.key, cam = k.shadow.camera;
    const dir = new THREE.Vector3().copy(k.position).sub(k.target.position).normalize();
    k.target.position.copy(center); k.position.copy(center).addScaledVector(dir, radius * 3 + 200);
    cam.left = cam.bottom = -radius; cam.right = cam.top = radius; cam.far = radius * 6 + 600; cam.updateProjectionMatrix();
  }

  tween(ms, update, easeFn = ease.inOut) {
    return new Promise(res => {
      this.shadowFrames = Math.max(this.shadowFrames, 3);
      if (this.reduce || ms <= 0) { update(1); return res(); }
      const t = { t0: performance.now(), ms, update, easeFn, res };
      this.tweens.add(t);
    });
  }

  // fly the camera (position + look target) along a gentle arc
  fly(pos, target, ms = 1600, { lift = 0, fov } = {}) {
    const c = this.camera, ctl = this.controls;
    const p0 = c.position.clone(), t0 = ctl.target.clone(), f0 = c.fov;
    const p1 = pos.clone(), t1 = target.clone();
    ctl.enabled = false;
    return this.tween(ms, k => {
      c.position.lerpVectors(p0, p1, k); c.position.y += Math.sin(k * Math.PI) * lift;
      ctl.target.lerpVectors(t0, t1, k);
      if (fov) { c.fov = f0 + (fov - f0) * k; c.updateProjectionMatrix(); }
      c.lookAt(ctl.target);
    }).then(() => { ctl.enabled = true; });
  }

  frame() {
    const now = performance.now(), dt = Math.min(0.05, this.clock.getDelta());
    for (const t of this.tweens) {
      const k = Math.min(1, (now - t.t0) / t.ms);
      t.update(t.easeFn(k));
      if (k >= 1) { this.tweens.delete(t); t.res(); }
    }
    this.sky.position.copy(this.camera.position);
    for (const f of this.onFrame) f(dt, now);
    if (this.controls.enabled) this.controls.update();
    // the sun and everything that casts a shadow only move during transitions (flights, the floor drawer, walls rising),
    // so the shadow map is redrawn then, when the light is re-aimed, and for a few frames after; not on every frame
    const k = this.key, c = k.shadow.camera, sig = `${k.position.x.toFixed(2)},${k.position.y.toFixed(2)},${k.position.z.toFixed(2)},${k.target.position.x.toFixed(2)},${k.target.position.z.toFixed(2)},${c.right},${c.far}`;
    if (this.tweens.size || sig !== this.shadowSig) { this.shadowFrames = 3; this.shadowSig = sig; }
    if (this.shadowFrames > 0) { this.renderer.shadowMap.needsUpdate = true; this.shadowFrames--; }
    this.adapt(dt);
    if (this.aoOff && this.ao) this.ao.enabled = false;
    this.composer.render(dt);
  }
}
