// Escenarios y tramos: generador de trazados, terreno low poly, carretera, vallas, árboles, atrezo,
// pórticos de salida y meta, flechas de notas en las curvas, cielo, niebla y luz.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, fbm, clamp, smooth } from './util.js';
import { mergeStatic, mergeChildren } from './merge.js';

export const ROAD_HALF = 4.0, EDGE = 5.7;
export const SCENES = {
  kirisame: { name: 'KIRISAME', kana: '霧雨峠', place: 'JAPÓN', surface: 'ASFALTO', road: 'asphalt', grip: 1.0, smoke: '#efeae4', drop: 70, hills: 6,
    sky: ['#56679f', '#f1b39e', '#e7a7a3'], fog: ['#d7a2a7', 70, 520], sun: ['#ffd4ac', 2.4, [-0.55, 0.42, 0.45]], hemi: ['#cbd3ff', '#5a4a56', 0.95], mount: '#8a7aa5',
    ground: ['#556f45', '#678452', '#8d7f74'], trees: 'cedar', prof: 'mountain', barrier: 'guardrail', props: 'japan',
    grade: { exposure: 1.0, sat: 1.12, contrast: 1.06, lift: [0.03, 0.01, 0.04], gain: [1.02, 0.98, 0.98], shadowTint: [0.7, 0.7, 1.0], hiTint: [1.0, 0.92, 0.85], gradCol: [1.0, 0.3, 0.6], gradAmt: 0.35, gradDir: [0.7, -1], vignette: 0.28, grain: 0.035 },
    stages: ['Bajada del Cedro', 'Curvas del Torii', 'Paso de Medianoche'] },
  tannenwald: { name: 'TANNENWALD', kana: '黒い森', place: 'BOSQUE', surface: 'TIERRA', road: 'dirt', grip: 0.86, smoke: '#b9a183', drop: 25, hills: 10,
    sky: ['#8c94b3', '#d7cfd6', '#cbc2cb'], fog: ['#b6b2bf', 40, 330], sun: ['#fff0dc', 1.8, [-0.3, 0.6, 0.5]], hemi: ['#d6dcf0', '#4b5646', 1.15], mount: '#6f7a86',
    ground: ['#3d5a3c', '#4c6b45', '#7b7066'], trees: 'pine', prof: 'forest', barrier: 'tape', props: 'forest',
    grade: { exposure: 1.02, sat: 1.0, contrast: 1.08, lift: [0.02, 0.02, 0.05], gain: [1, 1, 1.02], shadowTint: [0.65, 0.75, 1.0], hiTint: [1.0, 0.95, 0.95], gradCol: [1.0, 0.15, 0.55], gradAmt: 0.4, gradDir: [0.8, -1], vignette: 0.32, grain: 0.04 },
    stages: ['Senda de los Abetos', 'Barro Negro', 'Claro del Leñador'] },
  mesa: { name: 'MESA ROJA', kana: '赤い台地', place: 'DESIERTO', surface: 'ARENA', road: 'sand', grip: 0.8, smoke: '#e7c39a', drop: 10, hills: 4,
    sky: ['#5f9bd6', '#ffd9a8', '#f3c08c'], fog: ['#f1c99c', 90, 700], sun: ['#ffe2b8', 2.8, [-0.7, 0.5, 0.3]], hemi: ['#d9ecff', '#b8784e', 1.25], mount: '#c97a55',
    ground: ['#d9a067', '#e2b07a', '#b8623f'], trees: 'cactus', prof: 'desert', barrier: 'tires', props: 'desert',
    grade: { exposure: 1.0, sat: 1.15, contrast: 1.05, lift: [0.03, 0.02, 0.0], gain: [1.03, 1.0, 0.95], shadowTint: [0.7, 0.75, 1.0], hiTint: [1.0, 0.93, 0.82], gradCol: [1.0, 0.45, 0.2], gradAmt: 0.25, gradDir: [0.6, -1], vignette: 0.25, grain: 0.035 },
    stages: ['Cañón del Polvo', 'Gasolinera 66', 'Recta del Espejismo'] },
  yukiguni: { name: 'YUKIGUNI', kana: '雪国', place: 'NIEVE', surface: 'NIEVE', road: 'snow', grip: 0.72, smoke: '#ffffff', drop: 55, hills: 9,
    sky: ['#7d98c2', '#e3ecf5', '#dde6ef'], fog: ['#dbe4ee', 50, 420], sun: ['#ffffff', 2.0, [-0.4, 0.5, 0.5]], hemi: ['#e8f0ff', '#b4c0d2', 1.6], mount: '#a8b6c9',
    ground: ['#eef2f6', '#f8fafc', '#8e98a6'], trees: 'snowpine', prof: 'snow', barrier: 'snowbank', props: 'snow',
    grade: { exposure: 0.95, sat: 1.05, contrast: 1.06, lift: [0.0, 0.02, 0.05], gain: [0.98, 1.0, 1.04], shadowTint: [0.6, 0.72, 1.0], hiTint: [0.98, 0.98, 1.0], gradCol: [0.5, 0.4, 1.0], gradAmt: 0.25, gradDir: [0.7, -1], vignette: 0.25, grain: 0.03 },
    stages: ['Bosque Helado', 'Lago de Hielo', 'Paso de la Ventisca'] },
};
export const SCENE_IDS = Object.keys(SCENES);

// ---------------------------------------------------------------- trazado
export function genTrack(sceneId, stage, reverse = false) {
  const SC = SCENES[sceneId], r = rng(1000 + SCENE_IDS.indexOf(sceneId) * 97 + stage * 31);
  const pts = []; let x = 0, z = 0, h = (r() - 0.5) * 0.6; const lim = 1.45, target = 1150 + stage * 90;
  const push = () => pts.push([x, z]);
  push();
  let total = 0, guard = 0;
  while (total < target && guard++ < 400) {
    if (r() < 0.28 || guard < 2) { const L = 30 + r() * 55; for (let s = 0; s < L; s++) { x += Math.cos(h); z += Math.sin(h); push(); } total += L; continue; }
    const kind = r(); let R, A;
    if (kind < 0.25) { R = 13 + r() * 6; A = (2.2 + r() * 0.75); } else if (kind < 0.7) { R = 24 + r() * 26; A = 0.7 + r() * 1.0; } else { R = 55 + r() * 70; A = 0.35 + r() * 0.5; }
    let dir = r() < 0.5 ? 1 : -1; if (h + dir * A > lim || h + dir * A < -lim) dir = -dir;
    const nh = clamp(h + dir * A, -lim, lim); A = Math.abs(nh - h); if (A < 0.25) continue;
    const L = R * A; for (let s = 0; s < L; s++) { h += (dir * A) / L; x += Math.cos(h); z += Math.sin(h); push(); } total += L;
  }
  if (reverse) pts.reverse();
  // muestras cada ~1 m con altura
  const N = pts.length - 1, S = [];
  for (let i = 0; i <= N; i++) {
    const s = i, u = s / N; const y = SC.drop * (1 - u) + (fbm(s / 140 + stage * 3, 7.3) - 0.5) * SC.hills * 2;
    S.push({ p: new THREE.Vector3(pts[i][0], y, pts[i][1]), s, t: new THREE.Vector3(), l: new THREE.Vector3(), curv: 0, slope: 0 });
  }
  for (let i = 0; i <= N; i++) { const a = S[Math.max(0, i - 1)].p, b = S[Math.min(N, i + 1)].p; const t = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize(); S[i].t.copy(t); S[i].l.set(t.z, 0, -t.x); S[i].slope = (b.y - a.y) / (Math.hypot(b.x - a.x, b.z - a.z) || 1); }
  for (let i = 0; i <= N; i++) { const a = S[Math.max(0, i - 5)].t, b = S[Math.min(N, i + 5)].t; S[i].curv = Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z) / ((Math.min(N, i + 5) - Math.max(0, i - 5)) || 1); }
  const sm = S.map((_, i) => { let s = 0, n = 0; for (let k = -10; k <= 10; k++) { const j = i + k; if (j >= 0 && j <= N) { s += S[j].curv; n++; } } return s / n; }); S.forEach((s, i) => (s.curvS = sm[i]));
  const T = { scene: sceneId, stage, S, N, ds: 1, len: N, iStart: 30, iGoal: N - 30, group: new THREE.Group() };
  T.nearest = (px, pz, hint) => {
    let best = 1e18, bi = 0; const lo = hint == null ? 0 : Math.max(0, hint - 40), hi = hint == null ? N : Math.min(N, hint + 40);
    for (let i = lo; i <= hi; i++) { const p = S[i].p, d = (p.x - px) ** 2 + (p.z - pz) ** 2; if (d < best) { best = d; bi = i; } }
    const s = S[bi], along = (px - s.p.x) * s.t.x + (pz - s.p.z) * s.t.z; let i2 = bi, k = 0;
    if (along >= 0 && bi < N) { k = Math.min(1, along); } else if (bi > 0) { i2 = bi - 1; k = Math.max(0, 1 + along); }
    const a = S[i2], b = S[Math.min(N, i2 + 1)], y = a.p.y + (b.p.y - a.p.y) * k;
    return { i: bi, u: (i2 + k) / N, lat: (px - s.p.x) * s.l.x + (pz - s.p.z) * s.l.z, y, s };
  };
  T.at = (u, lat = 0) => { u = clamp(u, 0, 1); const f = u * N, i = Math.min(N - 1, Math.floor(f)), k = f - i, a = S[i], b = S[i + 1]; const p = a.p.clone().lerp(b.p, k), t = a.t.clone().lerp(b.t, k).normalize(); const l = new THREE.Vector3(t.z, 0, -t.x); return { pos: p.addScaledVector(l, lat), t, l, i, curv: a.curvS + (b.curvS - a.curvS) * k, slope: a.slope }; };
  T.progress = (i) => clamp((i - T.iStart) / (T.iGoal - T.iStart), 0, 1.05);
  // tiempo de referencia (perfil de velocidad) para medallas e IA
  { const v = new Float32Array(N + 1), vmax = 58, aLat = 9 * SC.grip, acc = 7, dec = 14; for (let i = 0; i <= N; i++) v[i] = Math.min(vmax, Math.sqrt(aLat / Math.max(Math.abs(S[i].curvS), 1e-4)));
    for (let i = 1; i <= N; i++) v[i] = Math.min(v[i], Math.sqrt(v[i - 1] ** 2 + 2 * acc)); for (let i = N - 1; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] ** 2 + 2 * dec)); v[T.iStart] = 0;
    let t = 0; for (let i = T.iStart; i < T.iGoal; i++) t += 1 / Math.max(3, (v[i] + v[i + 1]) / 2); T.refTime = t; T.vprof = v; }
  return T;
}

// ---------------------------------------------------------------- texturas
function tex(c, rep) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
function roadTex(kind) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024; const g = c.getContext('2d'), r = rng(kind.length * 7);
  const base = { asphalt: '#4a4b52', dirt: '#8a6a4c', sand: '#d29a62', snow: '#e9eef4' }[kind];
  g.fillStyle = base; g.fillRect(0, 0, 512, 1024);
  for (let k = 0; k < 7000; k++) { const v = r(); g.fillStyle = kind === 'snow' ? `rgba(150,170,200,${v * 0.18})` : `rgba(${v < 0.5 ? '0,0,0' : '255,255,255'},${0.05 + v * 0.06})`; g.fillRect(r() * 512, r() * 1024, 2 + r() * 3, 2 + r() * 3); }
  if (kind === 'asphalt') {
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(30,31,36,${0.25 + r() * 0.3})`; g.fillRect(40 + r() * 380, r() * 1024, 50 + r() * 120, 60 + r() * 200); }
    g.fillStyle = '#efece4'; g.fillRect(18, 0, 14, 1024); g.fillRect(480, 0, 14, 1024);
    g.fillStyle = '#f2b51f'; g.fillRect(246, 0, 8, 1024); g.fillRect(260, 0, 8, 1024);
  } else {
    // roderas
    const ruts = kind === 'snow' ? 'rgba(120,150,190,.35)' : 'rgba(0,0,0,.22)';
    for (const x of [150, 200, 312, 362]) { g.fillStyle = ruts; for (let y = 0; y < 1024; y += 4) g.fillRect(x + Math.sin(y * 0.02 + x) * 6, y, 26, 4); }
    g.fillStyle = kind === 'snow' ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.18)'; g.fillRect(0, 0, 30, 1024); g.fillRect(482, 0, 30, 1024);
  }
  return tex(c);
}
function wallTex() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 256; const g = c.getContext('2d'), r = rng(21);
  g.fillStyle = '#bdb7ad'; g.fillRect(0, 0, 2048, 256); for (let k = 0; k < 3000; k++) { const v = 160 + r() * 40; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(r() * 2048, r() * 256, 3, 3); }
  g.fillStyle = 'rgba(60,58,54,.45)'; for (let x = 0; x < 2048; x += 256) g.fillRect(x, 0, 4, 256);
  const tags = ['峠', 'KAI', '速', 'DRIFT', '魂', 'REN', 'ドリフト', 'MIKA', '走', 'YUTO', '夜', 'GEN', 'ギャア', '鬼火'], cols = ['#ff3d6e', '#ffd23f', '#3cf2ff', '#b8ff2c', '#b46bff', '#ff7a1a', '#16161a'];
  for (let k = 0; k < 14; k++) { const x = 70 + k * 140 + r() * 30, y = 130 + r() * 70, txt = tags[k % tags.length], col = cols[(r() * cols.length) | 0];
    g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 0.3); g.font = `${70 + r() * 40}px ${/[A-Z]/.test(txt) ? "'Permanent Marker'" : "'Dela Gothic One'"}`; g.lineWidth = 9; g.strokeStyle = '#16161a'; g.strokeText(txt, 0, 0); g.fillStyle = col; g.fillText(txt, 0, 0); for (let d = 0; d < 4; d++) g.fillRect(r() * 80, 8, 4, 10 + r() * 36); g.restore(); }
  return tex(c);
}
function bannerTex(a, b, col) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 192; const g = c.getContext('2d');
  g.fillStyle = '#16161a'; g.fillRect(0, 0, 1024, 192); for (let x = 0; x < 1024; x += 48) { g.fillStyle = (x / 48) % 2 ? '#16161a' : '#f2f0ea'; g.fillRect(x, 0, 48, 20); g.fillRect(x + 24, 172, 48, 20); }
  g.textBaseline = 'middle'; g.textAlign = 'center'; g.font = "italic 900 96px 'Kanit'"; g.fillStyle = col; g.fillText(a, 380, 100); g.font = "72px 'Dela Gothic One'"; g.fillStyle = '#f2f0ea'; g.fillText(b, 800, 100);
  return tex(c);
}
function arrowTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#c6f432'; g.strokeStyle = '#16161a'; g.lineWidth = 10; g.beginPath(); g.moveTo(40, 40); g.lineTo(150, 128); g.lineTo(40, 216); g.lineTo(100, 216); g.lineTo(210, 128); g.lineTo(100, 40); g.closePath(); g.fill(); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function signTex(dir) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#f2c230'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#16161a'; g.save(); g.translate(128, 64); g.scale(dir, 1);
  for (const o of [-70, 0, 70]) { g.beginPath(); g.moveTo(o - 26, -44); g.lineTo(o + 18, 0); g.lineTo(o - 26, 44); g.lineTo(o - 6, 44); g.lineTo(o + 38, 0); g.lineTo(o - 6, -44); g.closePath(); g.fill(); }
  g.restore(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------------------------------------------------------------- piezas low poly
const flat = (g) => { g = g.toNonIndexed(); g.computeVertexNormals(); return g; };
function colorize(g, col) { const c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; }
function jitter(g, amt, seed) { const r = rng(seed), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + (r() - 0.5) * amt, p.getY(i) + (r() - 0.5) * amt * 0.6, p.getZ(i) + (r() - 0.5) * amt); return g; }
function treeGeo(kind) {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.22, 0.32, 3, 5); trunk.translate(0, 1.5, 0); parts.push(colorize(flat(trunk), kind === 'cactus' ? '#4d8a3c' : '#6b4a33'));
  if (kind === 'cactus') {
    const body = new THREE.CylinderGeometry(0.45, 0.5, 5, 7); body.translate(0, 2.5, 0); parts[0] = colorize(flat(body), '#4f8d3e');
    for (const [s, h] of [[1, 2.2], [-1, 3.0]]) { const arm = new THREE.CylinderGeometry(0.3, 0.3, 1.6, 6); arm.translate(s * 1.0, h + 0.8, 0); parts.push(colorize(flat(arm), '#4a8439')); const el = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 6); el.rotateZ(Math.PI / 2); el.translate(s * 0.6, h, 0); parts.push(colorize(flat(el), '#4a8439')); }
  } else {
    const L = kind === 'cedar' ? [[2.2, 4.4, 4.2], [1.7, 4.0, 6.6], [1.1, 3.4, 8.8]] : [[2.8, 4.2, 4.0], [2.1, 3.8, 6.0], [1.3, 3.2, 8.0]];
    const cols = kind === 'snowpine' ? ['#3c5a4a', '#43644f', '#4b6e57'] : kind === 'cedar' ? ['#2f5236', '#365c3c', '#3c6644'] : ['#2b4a33', '#31533a', '#385d41'];
    L.forEach(([r0, h, y], i) => { const c = jitter(new THREE.ConeGeometry(r0, h, 7, 1), 0.5, i * 13 + kind.length); c.translate(0, y, 0); parts.push(colorize(flat(c), cols[i])); if (kind === 'snowpine') { const sn = new THREE.ConeGeometry(r0 * 0.55, h * 0.45, 7, 1); sn.translate(0, y + h * 0.3, 0); parts.push(colorize(flat(sn), '#f4f7fa')); } });
  }
  const g = mergeGeometries(parts); g.computeBoundingSphere(); return g;
}

// ---------------------------------------------------------------- construcción del escenario
export function buildScenery(T) {
  const SC = SCENES[T.scene], G = T.group, S = T.S, N = T.N, r = rng(T.stage * 13 + T.scene.length);
  // rejilla espacial de muestras para consultas rápidas
  const CELL = 16, grid = new Map(), key = (cx, cz) => cx * 73856093 ^ cz * 19349663;
  for (let i = 0; i <= N; i += 2) { const p = S[i].p, k = key(Math.floor(p.x / CELL), Math.floor(p.z / CELL)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
  const roadInfo = (x, z) => {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL); let best = 1e18, bi = -1;
    for (let rad = 0; rad < 12 && (bi < 0 || rad < 2); rad++) for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue; const L = grid.get(key(cx + dx, cz + dz)); if (!L) continue; for (const i of L) { const p = S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; bi = i; } } }
    if (bi < 0) return { d: 999, sd: 999, ry: S[0].p.y, i: 0 };
    const s = S[bi], sd = (x - s.p.x) * s.l.x + (z - s.p.z) * s.l.z; return { d: Math.sqrt(best), sd, ry: s.p.y, i: bi };
  };
  const profile = (sd, x, z, ry) => {
    const a = Math.abs(sd), n = fbm(x * 0.02, z * 0.02) - 0.5, e = Math.max(0, a - 6.2);
    if (a < 6.2) return ry - 0.06;
    if (SC.prof === 'mountain') return sd > 0 ? ry + e * 1.1 + n * 14 * smooth(0, 20, e) : ry - e * 0.55 - e * e * 0.004 + n * 8 * smooth(0, 20, e);
    if (SC.prof === 'forest') return ry - (a < 8.5 ? 0.7 * Math.sin(((a - 6.2) / 2.3) * Math.PI) : 0) + Math.max(0, a - 8.5) * 0.22 + n * 10 * smooth(0, 30, e);
    if (SC.prof === 'desert') return ry - 0.12 + n * 3 * smooth(0, 30, e) + Math.max(0, fbm(x * 0.006, z * 0.006) - 0.62) * 60 * smooth(20, 60, e);
    return ry + (a < 8 ? 0.9 * Math.sin(((a - 6.2) / 1.8) * Math.PI * 0.5) : 0.9 + (a - 8) * 0.32) + n * 10 * smooth(0, 25, e); // nieve
  };
  T.groundY = (x, z) => { const i = roadInfo(x, z); return profile(i.sd, x, z, i.ry); };
  // ---- terreno por baldosas (sólo cerca del trazado)
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9; for (const s of S) { minX = Math.min(minX, s.p.x); maxX = Math.max(maxX, s.p.x); minZ = Math.min(minZ, s.p.z); maxZ = Math.max(maxZ, s.p.z); }
  const M = 150, RES = 4, x0 = minX - M, z0 = minZ - M, nx = Math.ceil((maxX - minX + 2 * M) / RES), nz = Math.ceil((maxZ - minZ + 2 * M) / RES);
  const H = new Float32Array((nx + 1) * (nz + 1)), D = new Float32Array((nx + 1) * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = x0 + i * RES, z = z0 + j * RES, inf = roadInfo(x, z); H[j * (nx + 1) + i] = Math.max(-40, profile(inf.sd, x, z, inf.ry)); D[j * (nx + 1) + i] = inf.d; }
  const terrMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });
  const gc = SC.ground.map((c) => new THREE.Color(c)), tc = new THREE.Color();
  const TILE = 40;
  for (let tj = 0; tj < nz; tj += TILE) for (let ti = 0; ti < nx; ti += TILE) {
    const P = [], Cc = [];
    for (let j = tj; j < Math.min(nz, tj + TILE); j++) for (let i = ti; i < Math.min(nx, ti + TILE); i++) {
      const id = (a, b) => b * (nx + 1) + a; if (D[id(i, j)] > M && D[id(i + 1, j + 1)] > M) continue;
      const v = [[i, j], [i, j + 1], [i + 1, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]];
      const ys = v.map(([a, b]) => H[id(a, b)]), dy = Math.max(...ys) - Math.min(...ys), steep = dy / RES;
      const nn = fbm((x0 + i * RES) * 0.05, (z0 + j * RES) * 0.05);
      tc.copy(gc[0]).lerp(gc[1], nn); if (steep > 0.75) tc.copy(gc[2]).offsetHSL(0, 0, (nn - 0.5) * 0.08);
      for (let k = 0; k < 6; k++) { const [a, b] = v[k]; P.push(x0 + a * RES, H[id(a, b)], z0 + b * RES); Cc.push(tc.r, tc.g, tc.b); }
    }
    if (!P.length) continue;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, terrMat); m.receiveShadow = true; G.add(m);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: SC.ground[0], roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.set((minX + maxX) / 2, Math.min(...S.map((s) => s.p.y)) - 30, (minZ + maxZ) / 2); floor.userData.keep = true; G.add(floor);
  // ---- carretera y arcenes
  const ribbon = (cols, mat, vScale = 1, uvFn = null) => {
    const n = S.length, m = cols.length, P = new Float32Array(n * m * 3), UV = new Float32Array(n * m * 2), I = [];
    for (let i = 0; i < n; i++) { const s = S[i]; for (let j = 0; j < m; j++) { const k = i * m + j; P[k * 3] = s.p.x + s.l.x * cols[j][0]; P[k * 3 + 1] = s.p.y + cols[j][1]; P[k * 3 + 2] = s.p.z + s.l.z * cols[j][0]; UV[k * 2] = cols[j][2] ?? j / (m - 1); UV[k * 2 + 1] = s.s / vScale; } }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = a + 1, c = a + m, d = c + 1; I.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
    const me = new THREE.Mesh(g, mat); me.receiveShadow = true; G.add(me); return me;
  };
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex(SC.road), roughness: SC.road === 'snow' ? 0.7 : 0.88 });
  ribbon([[ROAD_HALF, 0.02, 0], [-ROAD_HALF, 0.02, 1]], roadMat, 30);
  const shoulder = new THREE.MeshStandardMaterial({ color: { asphalt: '#7e7568', dirt: '#6c5843', sand: '#c98a55', snow: '#dfe6ee' }[SC.road], roughness: 1, flatShading: true });
  ribbon([[6.4, -0.08], [ROAD_HALF, 0.0]], shoulder); ribbon([[-ROAD_HALF, 0.0], [-6.4, -0.08]], shoulder);
  // ---- vallas según escenario
  const metal = new THREE.MeshStandardMaterial({ color: '#d9dbe0', roughness: 0.35, metalness: 0.5, flatShading: true, side: THREE.DoubleSide });
  const dmy = new THREE.Object3D();
  const postsAlong = (lat, geo, mat, every, yOff = 0) => { const n = Math.floor(N / every), im = new THREE.InstancedMesh(geo, mat, n); for (let k = 0; k < n; k++) { const s = S[k * every]; dmy.position.set(s.p.x + s.l.x * lat, s.p.y + yOff, s.p.z + s.l.z * lat); dmy.rotation.set(0, Math.atan2(s.t.x, s.t.z), 0); dmy.updateMatrix(); im.setMatrixAt(k, dmy.matrix); } im.castShadow = true; im.receiveShadow = true; G.add(im); return im; };
  if (SC.barrier === 'guardrail') {
    ribbon([[-6.0, 0.48], [-6.06, 0.64], [-6.0, 0.8]], metal); postsAlong(-6.02, new THREE.BoxGeometry(0.1, 0.85, 0.1), new THREE.MeshStandardMaterial({ color: '#c9cbd0' }), 3, 0.42);
    const wall = ribbon([[6.6, -0.1], [6.9, 2.4]], new THREE.MeshStandardMaterial({ map: wallTex(), roughness: 0.9 }));
    const uv = wall.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, S[Math.floor(i / 2)].s / 26, i % 2 ? 0.98 : 0.02); uv.needsUpdate = true;
  }
  if (SC.barrier === 'tape') { const pole = new THREE.MeshStandardMaterial({ color: '#d9d4c8', roughness: 0.8 }); for (const lat of [6.2, -6.2]) { postsAlong(lat, new THREE.CylinderGeometry(0.05, 0.05, 1.1, 5), pole, 6, 0.55); ribbon([[lat, 0.82], [lat, 0.96]], new THREE.MeshStandardMaterial({ color: '#ff3d3d', side: THREE.DoubleSide, roughness: 0.6 })); } }
  if (SC.barrier === 'tires') { const tire = new THREE.TorusGeometry(0.42, 0.2, 5, 10); tire.rotateX(Math.PI / 2); const tm = new THREE.MeshStandardMaterial({ color: '#1d1d21', roughness: 0.9, flatShading: true }); for (const lat of [6.3, -6.3]) { for (const y of [0.2, 0.55]) postsAlong(lat, tire, tm, 2, y); } }
  if (SC.barrier === 'snowbank') { const sb = new THREE.MeshStandardMaterial({ color: '#f6f9fc', roughness: 0.95, flatShading: true }); ribbon([[6.0, 0], [6.5, 0.9], [7.4, 1.1], [8.2, 0.2]], sb); ribbon([[-8.2, 0.2], [-7.4, 1.1], [-6.5, 0.9], [-6.0, 0]], sb); const pm = new THREE.MeshStandardMaterial({ color: '#ff7a1a' }); postsAlong(6.1, new THREE.CylinderGeometry(0.03, 0.03, 1.8, 5), pm, 10, 0.9); postsAlong(-6.1, new THREE.CylinderGeometry(0.03, 0.03, 1.8, 5), pm, 10, 0.9); }
  // ---- árboles
  const tg = treeGeo(SC.trees), NT = SC.trees === 'cactus' ? 500 : 1500, trees = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 }), NT), cc = new THREE.Color();
  let ti = 0, guard = 0;
  while (ti < NT && guard++ < 30000) {
    const s = S[(r() * N) | 0], side = r() < 0.5 ? 1 : -1, off = side * (9 + Math.pow(r(), 1.6) * 110);
    const x = s.p.x + s.l.x * off + (r() - 0.5) * 8, z = s.p.z + s.l.z * off + (r() - 0.5) * 8, inf = roadInfo(x, z); if (inf.d < 8.5) continue;
    const y = profile(inf.sd, x, z, inf.ry), sc = 0.8 + r() * 0.9; dmy.position.set(x, y - 0.2, z); dmy.rotation.set((r() - 0.5) * 0.08, r() * 6.28, (r() - 0.5) * 0.08); dmy.scale.set(sc, sc * (0.85 + r() * 0.45), sc); dmy.updateMatrix(); trees.setMatrixAt(ti, dmy.matrix);
    cc.setHSL(0, 0, 0.8 + r() * 0.35); trees.setColorAt(ti, cc); ti++;
  }
  trees.count = ti; trees.castShadow = true; trees.receiveShadow = true; G.add(trees);
  // ---- rocas y matorrales
  const rockG = flat(jitter(new THREE.DodecahedronGeometry(1, 0), 0.3, 5)), rocks = new THREE.InstancedMesh(rockG, new THREE.MeshStandardMaterial({ color: SC.ground[2], roughness: 1, flatShading: true }), 220);
  for (let k = 0; k < 220; k++) { const s = S[(r() * N) | 0], off = (r() < 0.5 ? 1 : -1) * (8 + r() * 30), x = s.p.x + s.l.x * off, z = s.p.z + s.l.z * off, inf = roadInfo(x, z), sc = 0.4 + r() * 1.8; dmy.position.set(x, profile(inf.sd, x, z, inf.ry), z); dmy.rotation.set(r() * 3, r() * 3, r() * 3); dmy.scale.set(sc, sc * 0.6, sc); dmy.updateMatrix(); rocks.setMatrixAt(k, dmy.matrix); }
  rocks.castShadow = true; G.add(rocks);
  // ---- flechas de notas y señales de curva
  const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
  const sgn = { 1: new THREE.MeshStandardMaterial({ map: signTex(1) }), [-1]: new THREE.MeshStandardMaterial({ map: signTex(-1) }) }, poleM = new THREE.MeshStandardMaterial({ color: '#555' });
  T.notes = [];
  for (let i = 40; i < N - 40; i++) {
    const c = S[i].curvS; if (Math.abs(c) < 1 / 30 || Math.abs(S[i - 1].curvS) >= 1 / 30) continue;
    const dir = Math.sign(c), sev = Math.abs(c) > 1 / 16 ? 1 : Math.abs(c) > 1 / 22 ? 2 : 3; T.notes.push({ i, dir, sev });
    for (let k = 0; k < 3; k++) { const s = S[Math.max(0, i - 18 + k * 5)], a = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), arrowMat); a.rotation.x = -Math.PI / 2; a.rotation.z = Math.atan2(s.t.x, s.t.z) - Math.PI / 2 + (dir > 0 ? -0.5 : 0.5); a.position.set(s.p.x, s.p.y + 0.045, s.p.z); a.renderOrder = 1; G.add(a); }
    const s = S[i + 6], lat = dir > 0 ? 6.4 : -6.4, b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.05), poleM); b.position.set(s.p.x + s.l.x * lat, s.p.y + 1.2, s.p.z + s.l.z * lat); b.rotation.y = Math.atan2(-s.t.x, -s.t.z); b.castShadow = true; G.add(b);
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.66), sgn[dir > 0 ? 1 : -1]); fp.position.copy(b.position).add(new THREE.Vector3(-s.t.x * 0.03, 0, -s.t.z * 0.03)); fp.rotation.y = b.rotation.y; G.add(fp);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 5), poleM); pl.position.set(b.position.x, s.p.y + 0.45, b.position.z); G.add(pl);
    i += 25;
  }
  // ---- pórticos de salida y meta (estructura de celosía con relojes)
  const truss = new THREE.MeshStandardMaterial({ color: '#c9ccd2', roughness: 0.4, metalness: 0.6 }), clockM = new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.6 });
  const gantry = (i, a, b, col) => {
    const s = S[i], g = new THREE.Group();
    for (const lat of [-7, 7]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 0.5), truss); t.position.set(0, 3.1, lat); g.add(t); for (let y = 0.6; y < 6; y += 0.8) { const x = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), truss); x.position.set(0, y, lat); x.rotation.x = 0.6; g.add(x); } const ck = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 1.1), clockM); ck.position.set(0.3, 3.4, lat + (lat > 0 ? -0.8 : 0.8)); g.add(ck); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 14.5), [new THREE.MeshBasicMaterial({ map: bannerTex(a, b, col) }), new THREE.MeshBasicMaterial({ map: bannerTex(a, b, col) }), truss, truss, truss, truss]); beam.position.y = 6.2; g.add(beam);
    g.position.copy(s.p); g.rotation.y = Math.atan2(-s.t.z, s.t.x); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); G.add(g); return g;
  };
  T.gStart = gantry(T.iStart, 'START', 'スタート', '#c6f432'); T.gGoal = gantry(T.iGoal, 'GOAL', 'ゴール', '#ff2d8a');
  // ---- atrezo del escenario
  buildProps(T, SC, roadInfo, profile, r);
  // ---- montañas lejanas
  const mg = [], rM = rng(3 + T.stage), cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2, R0 = Math.max(maxX - minX, maxZ - minZ) / 2 + 380;
  for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2, Rr = R0 + rM() * 260, h = 120 + rM() * 260; const c = new THREE.ConeGeometry(160 + rM() * 140, h, 5, 1); c.translate(cx + Math.cos(a) * Rr, h / 2 - 40 + Math.min(...S.map((s) => s.p.y)), cz + Math.sin(a) * Rr); mg.push(c.toNonIndexed()); }
  const mm = new THREE.Mesh(mergeGeometries(mg), new THREE.MeshStandardMaterial({ color: SC.mount, flatShading: true, roughness: 1 })); mm.material.fog = true; mm.userData.keep = true; G.add(mm);
  mergeChildren(G); mergeStatic(G);
  T.center = new THREE.Vector3(cx, 0, cz);
  return T;
}

function buildProps(T, SC, roadInfo, profile, r) {
  const G = T.group, S = T.S, N = T.N;
  const place = (mesh, i, lat, rotY = 0) => { const s = S[i], x = s.p.x + s.l.x * lat, z = s.p.z + s.l.z * lat, inf = roadInfo(x, z); mesh.position.set(x, Math.abs(lat) < 7 ? s.p.y : profile(inf.sd, x, z, inf.ry), z); mesh.rotation.y = Math.atan2(s.t.x, s.t.z) + rotY; mesh.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); G.add(mesh); return mesh; };
  const box = (w, h, d, col, x = 0, y = 0, z = 0, emissive) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, flatShading: true, emissive: emissive || '#000', emissiveIntensity: emissive ? 0.8 : 0 })); m.position.set(x, y, z); return m; };
  const grp = (...ms) => { const g = new THREE.Group(); ms.forEach((m) => g.add(m)); return g; };
  if (SC.props === 'japan') {
    // torii en la salida
    const red = '#c8321f', torii = grp(box(0.5, 5, 0.5, red, 0, 2.5, -4.6), box(0.5, 5, 0.5, red, 0, 2.5, 4.6), box(0.7, 0.5, 11.5, red, 0, 5.1, 0), box(0.4, 0.4, 10, '#16161a', 0, 4.4, 0)); place(torii, T.iStart + 45, 0, Math.PI / 2);
    for (let k = 0; k < 14; k++) { const i = 60 + ((r() * (N - 120)) | 0), lat = (r() < 0.5 ? 1 : -1) * (8 + r() * 4); const kind = r();
      if (kind < 0.35) place(grp(box(0.8, 1.9, 0.7, '#e9e6dd', 0, 0.95, 0, null), box(0.05, 0.8, 0.6, '#9ad8ff', 0.41, 1.2, 0, '#7cc8ff'), box(0.06, 0.25, 0.6, '#ff3d6e', 0.41, 0.4, 0, '#ff3d6e')), i, lat, lat > 0 ? Math.PI / 2 : -Math.PI / 2); // máquina expendedora
      else if (kind < 0.7) place(grp(box(0.6, 0.4, 0.6, '#9a958c', 0, 0.2, 0), box(0.25, 0.9, 0.25, '#9a958c', 0, 0.85, 0), box(0.7, 0.5, 0.7, '#a8a399', 0, 1.5, 0, null), box(0.4, 0.3, 0.4, '#ffcf6a', 0, 1.5, 0, '#ffb340'), box(0.9, 0.15, 0.9, '#8a857c', 0, 1.85, 0)), i, lat); // linterna de piedra
      else { const tree = grp(box(0.3, 2.6, 0.3, '#5a3b2a', 0, 1.3, 0)); const c = new THREE.Mesh(flat(jitter(new THREE.IcosahedronGeometry(2.2, 0), 0.6, k)), new THREE.MeshStandardMaterial({ color: '#f6a8c8', flatShading: true, roughness: 0.8 })); c.position.y = 3.4; tree.add(c); place(tree, i, lat * 1.6); } // cerezo
    }
    // postes eléctricos
    for (let i = 50; i < N - 50; i += 48) place(grp(box(0.25, 8, 0.25, '#6b5a4a', 0, 4, 0), box(0.15, 0.15, 2.4, '#6b5a4a', 0, 7.4, 0)), i, -9);
  }
  if (SC.props === 'forest') {
    for (let k = 0; k < 26; k++) { const i = 40 + ((r() * (N - 80)) | 0), lat = (r() < 0.5 ? 1 : -1) * (8 + r() * 6);
      if (r() < 0.5) { const g = new THREE.Group(); for (let j = 0; j < 6; j++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 4, 7), new THREE.MeshStandardMaterial({ color: j % 2 ? '#7a5a3e' : '#6b4d34', flatShading: true })); l.rotation.z = Math.PI / 2; l.position.set(0, 0.28 + Math.floor(j / 3) * 0.5, (j % 3) * 0.56 - 0.56 + (j > 2 ? 0.28 : 0)); g.add(l); } place(g, i, lat); }
      else { const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 10), new THREE.MeshStandardMaterial({ color: '#d9b45f', flatShading: true })); hb.rotation.z = Math.PI / 2; hb.position.y = 0.7; place(grp(hb), i, lat); }
    }
    // público con banderas cerca de la salida
    for (let k = 0; k < 18; k++) { const c = ['#ff3d6e', '#2bb3c9', '#f2c230', '#7a4bd8', '#f2f0ea'][k % 5]; const p = grp(box(0.45, 1.0, 0.3, c, 0, 0.9, 0), box(0.3, 0.3, 0.3, '#e8c2a0', 0, 1.6, 0)); if (k % 3 === 0) p.add(box(0.02, 1.4, 0.02, '#333', 0.3, 2.0, 0), box(0.02, 0.4, 0.7, c, 0.3, 2.5, 0.35)); place(p, T.iStart + 10 + k * 3, (k % 2 ? 1 : -1) * (9 + (k % 3)), Math.PI / 2 * (k % 2 ? 1 : -1)); }
  }
  if (SC.props === 'desert') {
    for (let k = 0; k < 8; k++) { const i = 50 + ((r() * (N - 100)) | 0), lat = (r() < 0.5 ? 1 : -1) * (40 + r() * 70); const h = 25 + r() * 40, w = 30 + r() * 40; const m = new THREE.Mesh(flat(jitter(new THREE.CylinderGeometry(w * 0.8, w, h, 7, 2), 4, k)), new THREE.MeshStandardMaterial({ color: '#c46a45', flatShading: true, roughness: 1 })); m.position.y = h / 2 - 2; place(grp(m), i, lat); }
    const shack = grp(box(5, 3, 4, '#d9c3a0', 0, 1.5, 0), box(5.6, 0.3, 4.6, '#8a4b35', 0, 3.2, 0), box(1.2, 2, 0.1, '#5a3b2a', 0, 1, 2.01), box(3, 1.2, 0.2, '#e9443a', 0, 4.2, 0, '#e9443a')); place(shack, T.iStart + 80, 12, Math.PI / 2);
    for (let k = 0; k < 10; k++) { const i = 60 + ((r() * (N - 120)) | 0); place(grp(box(0.2, 3, 0.2, '#6b4d34', 0, 1.5, -1.5), box(0.2, 3, 0.2, '#6b4d34', 0, 1.5, 1.5), box(0.2, 1.8, 4.2, ['#ff3d6e', '#2bb3c9', '#f2c230'][k % 3], 0, 3.6, 0)), i, (k % 2 ? 1 : -1) * 11, Math.PI / 2); }
  }
  if (SC.props === 'snow') {
    for (let k = 0; k < 10; k++) { const i = 60 + ((r() * (N - 120)) | 0), lat = (r() < 0.5 ? 1 : -1) * (14 + r() * 20); const cab = grp(box(4, 2.6, 3.4, '#7a4e35', 0, 1.3, 0), box(4.6, 0.6, 4.0, '#f6f9fc', 0, 2.9, 0), box(0.9, 1.0, 0.1, '#ffcf6a', 1.0, 1.4, 1.71, '#ffb340')); place(cab, i, lat, r() * 6); }
  }
}

// ---------------------------------------------------------------- cielo, luz y niebla
export function createSky(scene) {
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunC: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunC; varying vec3 vD;
      void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(hor, top, pow(clamp(y, 0.0, 1.0), 0.6)) : mix(hor, bot, clamp(-y * 4.0, 0.0, 1.0));
        float sd = max(dot(normalize(vD), normalize(sunDir)), 0.0); c += sunC * (smoothstep(0.9985, 0.9992, sd) * 2.5 + pow(sd, 18.0) * 0.35); gl_FragColor = vec4(c, 1.0); }` });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), mat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 220 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; scene.add(sun, sun.target);
  scene.fog = new THREE.Fog(0xffffff, 50, 500);
  const E = { sky, hemi, sun, mat, dir: new THREE.Vector3(0, 1, 0) };
  E.set = (SC) => { mat.uniforms.top.value.set(SC.sky[0]); mat.uniforms.hor.value.set(SC.sky[1]); mat.uniforms.bot.value.set(SC.sky[2]); E.dir.set(...SC.sun[2]).normalize(); mat.uniforms.sunDir.value.copy(E.dir); mat.uniforms.sunC.value.set(SC.sun[0]);
    scene.fog.color.set(SC.fog[0]); scene.fog.near = SC.fog[1]; scene.fog.far = SC.fog[2]; hemi.color.set(SC.hemi[0]); hemi.groundColor.set(SC.hemi[1]); hemi.intensity = SC.hemi[2]; sun.color.set(SC.sun[0]); sun.intensity = SC.sun[1]; };
  E.update = (c) => { sun.position.set(c.x + E.dir.x * 90, c.y + E.dir.y * 90, c.z + E.dir.z * 90); sun.target.position.copy(c); sky.position.copy(c); };
  return E;
}
