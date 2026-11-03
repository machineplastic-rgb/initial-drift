// Puerto de montaña: trazado, terreno low-poly, carretera, quitamiedos, muros con grafitis, árboles, señales y farolas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash2(x, y) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, y) => vnoise(x, y) * 0.6 + vnoise(x * 2.1 + 5, y * 2.1) * 0.28 + vnoise(x * 4.3, y * 4.3 + 9) * 0.12;

// Trazado: bajada de unos 1,4 km con S, horquillas y curvas rápidas.
const CP = [[0, 80, -420], [10, 77, -380], [-12, 73, -330], [-38, 69, -290], [-30, 65, -250], [0, 61, -222], [32, 57, -192], [48, 54, -152], [40, 51, -112], [10, 48, -84], [-20, 45, -62], [-28, 43, -32], [-10, 41, -6], [25, 39, 10], [50, 37, 22], [54, 35.5, 46], [64, 34.5, 62], [78, 34, 68], [91, 33.5, 62], [97, 33, 47], [96, 32, 25], [100, 31, 0], [114, 29.5, -28], [136, 28, -50], [165, 26, -62], [195, 24, -60], [215, 22, -40], [222, 20, -10], [212, 18, 20], [200, 16, 50], [214, 14, 80], [240, 12, 96], [270, 10, 100]];
export const ROAD_HALF = 3.8, EDGE = 5.1;

export function buildTrack() {
  const curve = new THREE.CatmullRomCurve3(CP.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const len = curve.getLength(), N = Math.round(len / 0.8), ds = len / N;
  const S = [];
  const pts = curve.getSpacedPoints(N);
  for (let i = 0; i <= N; i++) {
    const u = i / N, t3 = curve.getTangentAt(u), t = new THREE.Vector3(t3.x, 0, t3.z).normalize();
    S.push({ p: pts[i], t, l: new THREE.Vector3(t.z, 0, -t.x), u, slope: t3.y, s: i * ds, curv: 0 });
  }
  for (let i = 0; i <= N; i++) { const a = S[Math.max(0, i - 6)].t, b = S[Math.min(N, i + 6)].t; const ang = Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z); S[i].curv = ang / (ds * (Math.min(N, i + 6) - Math.max(0, i - 6))); }
  // curvatura suavizada para la IA
  const sm = S.map((_, i) => { let s = 0, n = 0; for (let k = -12; k <= 12; k++) { const j = i + k; if (j >= 0 && j <= N) { s += S[j].curv; n++; } } return s / n; }); S.forEach((s, i) => (s.curvS = sm[i]));
  const T = { curve, len, S, N, ds, group: new THREE.Group(), lamps: [], dyn: {} };
  T.at = (u, lat = 0) => { u = THREE.MathUtils.clamp(u, 0, 1); const f = u * N, i = Math.min(N - 1, Math.floor(f)), k = f - i, a = S[i], b = S[i + 1]; const p = a.p.clone().lerp(b.p, k), t = a.t.clone().lerp(b.t, k).normalize(); const l = new THREE.Vector3(t.z, 0, -t.x); return { pos: p.addScaledVector(l, lat), t, l, slope: a.slope, i, curv: a.curvS + (b.curvS - a.curvS) * k }; };
  T.nearest = (x, z, hint) => {
    let best = 1e18, bi = 0; const lo = hint == null ? 0 : Math.max(0, hint - 40), hi = hint == null ? N : Math.min(N, hint + 40);
    for (let i = lo; i <= hi; i++) { const p = S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; bi = i; } }
    const s = S[bi]; const along = (x - s.p.x) * s.t.x + (z - s.p.z) * s.t.z; let i2 = bi, k = 0;
    if (along >= 0 && bi < N) { i2 = bi; k = Math.min(1, along / ds); } else if (bi > 0) { i2 = bi - 1; k = Math.max(0, 1 + along / ds); }
    const a = S[i2], b = S[Math.min(N, i2 + 1)], y = a.p.y + (b.p.y - a.p.y) * k;
    const lat = (x - s.p.x) * s.l.x + (z - s.p.z) * s.l.z;
    return { i: bi, u: (i2 + k) / N, lat, y, s };
  };
  buildScenery(T);
  return T;
}

// ---------- texturas ----------
function roadTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 2048; const g = c.getContext('2d'), r = mulberry(5);
  g.fillStyle = '#44464c'; g.fillRect(0, 0, 512, 2048);
  for (let k = 0; k < 9000; k++) { const v = 50 + r() * 40; g.fillStyle = `rgb(${v},${v},${v + 4})`; g.fillRect(r() * 512, r() * 2048, 2, 2); }
  for (let k = 0; k < 7; k++) { g.fillStyle = `rgba(30,31,35,${0.25 + r() * 0.3})`; g.fillRect(40 + r() * 380, r() * 2048, 40 + r() * 140, 60 + r() * 260); }
  g.strokeStyle = 'rgba(25,25,28,.6)'; g.lineWidth = 2; for (let k = 0; k < 14; k++) { let x = r() * 512, y = r() * 2048; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (r() - 0.5) * 40; y += r() * 40; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = '#eceae2'; g.fillRect(14, 0, 14, 2048); g.fillRect(484, 0, 14, 2048);
  g.fillStyle = '#f2b51f'; g.fillRect(244, 0, 9, 2048); g.fillRect(259, 0, 9, 2048);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function wallTex() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 256; const g = c.getContext('2d'), r = mulberry(21);
  g.fillStyle = '#b9b5ab'; g.fillRect(0, 0, 2048, 256);
  for (let k = 0; k < 4000; k++) { const v = 160 + r() * 40; g.fillStyle = `rgb(${v},${v - 3},${v - 9})`; g.fillRect(r() * 2048, r() * 256, 3, 3); }
  g.fillStyle = 'rgba(60,58,54,.5)'; for (let x = 0; x < 2048; x += 256) g.fillRect(x, 0, 4, 256);
  const tags = ['峠', 'KAI', '速', 'ONIBI', '魂', 'REN', 'ドリフト', 'MIKA', '走', 'YUTO', '夜', 'GEN', 'ギャア', 'DAICHI', '鬼火'];
  const cols = ['#ff3d6e', '#ffd23f', '#3cf2ff', '#7dff5a', '#b46bff', '#ff7a1a', '#141414'];
  for (let k = 0; k < 16; k++) {
    const x = 60 + k * 125 + r() * 40, y = 120 + r() * 70, txt = tags[k % tags.length], col = cols[(r() * cols.length) | 0];
    g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 0.4); g.font = `${70 + r() * 40}px ${/[A-Z]/.test(txt) ? "'Permanent Marker'" : "'Dela Gothic One'"}`; g.lineWidth = 8; g.strokeStyle = '#141414'; g.strokeText(txt, 0, 0); g.fillStyle = col; g.fillText(txt, 0, 0);
    for (let d = 0; d < 4; d++) { g.fillStyle = col; g.fillRect(r() * 90, 6, 3, 10 + r() * 40); } g.restore();
    if (r() < 0.5) { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); const cx = x + 40, cy = 50; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 9 : 22; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function signTex(dir) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#f2c230'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#141414'; g.save(); g.translate(64, 64); g.scale(dir, 1);
  g.beginPath(); g.moveTo(-30, -44); g.lineTo(18, 0); g.lineTo(-30, 44); g.lineTo(-8, 44); g.lineTo(40, 0); g.lineTo(-8, -44); g.closePath(); g.fill(); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function bannerTex(txt, sub) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d');
  g.fillStyle = '#141414'; g.fillRect(0, 0, 1024, 160); for (let x = 0; x < 1024; x += 40) { g.fillStyle = (x / 40) % 2 ? '#141414' : '#f2efe6'; g.fillRect(x, 0, 40, 18); g.fillRect(x + 20, 142, 40, 18); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = "84px 'Permanent Marker'"; g.fillStyle = '#ffd23f'; g.fillText(txt, 420, 84); g.font = "70px 'Dela Gothic One'"; g.fillStyle = '#f2efe6'; g.fillText(sub, 820, 84);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.35, 'rgba(255,210,140,.45)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); return t;
}

// ---------- escenario ----------
function buildScenery(T) {
  const { S, N, ds } = T, G = T.group;
  const RS = S.filter((_, i) => i % 4 === 0);
  const RX = Float32Array.from(RS, (s) => s.p.x), RZ = Float32Array.from(RS, (s) => s.p.z), RY = Float32Array.from(RS, (s) => s.p.y), LX = Float32Array.from(RS, (s) => s.l.x), LZ = Float32Array.from(RS, (s) => s.l.z);
  const roadInfo = (x, z) => { let best = 1e18, bi = 0, ws = 0, ys = 0; for (let k = 0; k < RX.length; k++) { const dx = x - RX[k], dz = z - RZ[k]; const d2 = dx * dx + dz * dz; if (d2 < best) { best = d2; bi = k; } const w = 1 / ((d2 + 9) * (d2 + 9)); ws += w; ys += w * RY[k]; } return { sd: Math.sqrt(best) * (((x - RX[bi]) * LX[bi] + (z - RZ[bi]) * LZ[bi]) > 0 ? 1 : -1), ry: ys / ws }; };
  const profile = (sd, x, z) => { const a = Math.abs(sd), n = fbm(x * 0.03, z * 0.03) - 0.5; if (sd > 0) { if (a < 6.0) return -0.5; if (a < 7.2) return -0.5 + ((a - 6.0) / 1.2) * 2.2; const e = a - 7.2; return 1.7 + Math.min(e * 1.1, 12 + (e - 11) * 0.5) + n * 8 * Math.min(1, e / 12); } if (a < 6.0) return -0.5; const e = a - 6.0; return -0.9 - e * 0.55 - e * e * 0.006 + n * 7 * Math.min(1, e / 12); };
  T.groundY = (x, z) => { const i = roadInfo(x, z); return Math.max(-14, i.ry + profile(i.sd, x, z)); };
  // terreno
  const x0 = -140, x1 = 330, z0 = -480, z1 = 170, res = 2.6, nx = Math.round((x1 - x0) / res) + 1, nz = Math.round((z1 - z0) / res) + 1;
  const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), cc = new THREE.Color(), sideArr = new Int8Array(nx * nz);
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) { const x = x0 + ix * res, z = z0 + iz * res, info = roadInfo(x, z), k = iz * nx + ix; pos[k * 3] = x; pos[k * 3 + 1] = Math.max(-14, info.ry + profile(info.sd, x, z)); pos[k * 3 + 2] = z; sideArr[k] = info.sd > 0 ? 1 : -1; }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let q = 0;
  for (let iz = 0; iz < nz - 1; iz++) for (let ix = 0; ix < nx - 1; ix++) { const a = iz * nx + ix, b = a + 1, c = a + nx, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  let tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setIndex(new THREE.BufferAttribute(idx, 1)); tg.computeVertexNormals();
  const nrm = tg.attributes.normal;
  for (let k = 0; k < nx * nz; k++) { const steep = 1 - nrm.getY(k), n = hash2(k % 7919, (k / 7919) | 0) * 0.08; if (steep > 0.35) cc.set('#8a857b').offsetHSL(0, 0, n - 0.04); else if (sideArr[k] > 0) cc.set('#5e8c48').offsetHSL(0.02 * n, 0, n - 0.04); else cc.set('#4c7a3e').offsetHSL(0.02 * n, 0, n - 0.04); col[k * 3] = cc.r; col[k * 3 + 1] = cc.g; col[k * 3 + 2] = cc.b; }
  tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg = tg.toNonIndexed(); tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 })); terrain.receiveShadow = true; G.add(terrain);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: '#41673a', roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -14.05; G.add(floor);
  // cinta (columna = [lateral, altura, v])
  const ribbon = (cols, mat, keep = null, vScale = 1) => {
    const n = S.length, m = cols.length, P = new Float32Array(n * m * 3), UV = new Float32Array(n * m * 2), I = [];
    for (let i = 0; i < n; i++) { const s = S[i]; for (let j = 0; j < m; j++) { const k = i * m + j; P[k * 3] = s.p.x + s.l.x * cols[j][0]; P[k * 3 + 1] = s.p.y + cols[j][1]; P[k * 3 + 2] = s.p.z + s.l.z * cols[j][0]; UV[k * 2] = cols[j][2] ?? j / (m - 1); UV[k * 2 + 1] = (s.s / vScale); } }
    for (let i = 0; i < n - 1; i++) { if (keep && !keep(i)) continue; for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = a + 1, c = a + m, d = c + 1; I.push(a, c, b, b, c, d); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); const me = new THREE.Mesh(g, mat); me.receiveShadow = true; G.add(me); return me;
  };
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex(), roughness: 0.85 }); T.roadMat = roadMat;
  ribbon([[-ROAD_HALF, 0, 0], [ROAD_HALF, 0, 1]], roadMat, null, 40);
  const grav = new THREE.MeshStandardMaterial({ color: '#8f887a', roughness: 1, flatShading: true });
  ribbon([[-6.4, -0.6], [-5.6, -0.08], [-ROAD_HALF, -0.01]], grav); ribbon([[ROAD_HALF, -0.01], [5.3, -0.04], [5.5, -0.2]], grav);
  const wallM = new THREE.MeshStandardMaterial({ map: wallTex(), roughness: 0.9 });
  { // muro de contención con grafitis: u a lo largo (cada 24 m), v vertical
    const wall = ribbon([[5.5, -0.2], [5.9, 1.9]], wallM), uv = wall.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, S[Math.floor(i / 2)].s / 24, i % 2 ? 0.98 : 0.02); uv.needsUpdate = true; }
  ribbon([[5.9, 1.9], [6.6, 1.95]], new THREE.MeshStandardMaterial({ color: '#8d8a82', roughness: 1 }));
  // quitamiedos
  ribbon([[-5.3, 0.5], [-5.37, 0.67], [-5.3, 0.84]], new THREE.MeshStandardMaterial({ color: '#e9e8e2', roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide, flatShading: true }));
  const nPost = Math.floor(T.len / 3.5), posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), new THREE.MeshStandardMaterial({ color: '#cfcdc6' }), nPost), dmy = new THREE.Object3D();
  for (let i = 0; i < nPost; i++) { const s = S[Math.min(N, Math.round((i * 3.5) / ds))]; dmy.position.set(s.p.x - s.l.x * 5.28, s.p.y + 0.42, s.p.z - s.l.z * 5.28); dmy.rotation.set(0, Math.atan2(s.t.x, s.t.z), 0); dmy.updateMatrix(); posts.setMatrixAt(i, dmy.matrix); }
  posts.castShadow = true; G.add(posts);
  // árboles low-poly (pinos) con color por vértice
  const part = (geo, color) => { const g = geo.toNonIndexed(); const c = new THREE.Color(color), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g; };
  const tr = []; const trunk = new THREE.CylinderGeometry(0.22, 0.3, 3, 5); trunk.translate(0, 1.5, 0); tr.push(part(trunk, '#6b4a33'));
  for (const [r0, h, y, c] of [[2.6, 4.2, 4.0, '#2f5e3a'], [2.0, 3.8, 6.2, '#356b40'], [1.3, 3.2, 8.2, '#3b7546']]) { const c0 = new THREE.ConeGeometry(r0, h, 6, 1); c0.translate(0, y, 0); tr.push(part(c0, c)); }
  const treeGeo = mergeGeometries(tr); treeGeo.computeVertexNormals();
  const NT = 1700, trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 }), NT), rT = mulberry(99), tc = new THREE.Color();
  let ti = 0, guard = 0;
  while (ti < NT && guard++ < 40000) {
    let x, z; if (rT() < 0.85) { const s = S[(rT() * N) | 0]; const off = rT() < 0.5 ? 8 + rT() * 46 : -(7.5 + rT() * 60); x = s.p.x + s.l.x * off + (rT() - 0.5) * 6; z = s.p.z + s.l.z * off + (rT() - 0.5) * 6; } else { x = x0 + rT() * (x1 - x0); z = z0 + rT() * (z1 - z0); }
    const info = roadInfo(x, z); if (info.sd > -7.5 && info.sd < 8) continue; const y = Math.max(-14, info.ry + profile(info.sd, x, z)), sc = 0.8 + rT() * 0.8;
    dmy.position.set(x, y - 0.3, z); dmy.rotation.set((rT() - 0.5) * 0.1, rT() * 6.28, (rT() - 0.5) * 0.1); dmy.scale.set(sc, sc * (0.85 + rT() * 0.5), sc); dmy.updateMatrix(); trees.setMatrixAt(ti, dmy.matrix); tc.setHSL(0.3 + (rT() - 0.5) * 0.06, 0.3 + rT() * 0.2, 0.75 + rT() * 0.35); trees.setColorAt(ti, tc); ti++;
  }
  trees.count = ti; trees.castShadow = true; G.add(trees);
  const bushG = new THREE.IcosahedronGeometry(1, 0); bushG.scale(1, 0.65, 1);
  const NB = 900, bushes = new THREE.InstancedMesh(bushG, new THREE.MeshStandardMaterial({ color: '#4f8a3e', flatShading: true, roughness: 0.95 }), NB);
  for (let i = 0; i < NB; i++) { const s = S[(rT() * N) | 0]; const off = rT() < 0.5 ? 6.8 + rT() * 3 : -(6.2 + rT() * 3); const x = s.p.x + s.l.x * off, z = s.p.z + s.l.z * off, y = T.groundY(x, z), sc = 0.5 + rT() * 1.1; dmy.position.set(x, y, z); dmy.rotation.set(0, rT() * 6, 0); dmy.scale.set(sc, sc, sc); dmy.updateMatrix(); bushes.setMatrixAt(i, dmy.matrix); tc.setHSL(0.27 + (rT() - 0.5) * 0.08, 0.45, 0.32 + rT() * 0.12); bushes.setColorAt(i, tc); }
  G.add(bushes);
  const rockG = new THREE.DodecahedronGeometry(1, 0), NR = 260, rocks = new THREE.InstancedMesh(rockG, new THREE.MeshStandardMaterial({ color: '#8b877e', flatShading: true }), NR);
  for (let i = 0; i < NR; i++) { const s = S[(rT() * N) | 0]; const off = 9 + rT() * 20; const x = s.p.x + s.l.x * off, z = s.p.z + s.l.z * off, y = T.groundY(x, z), sc = 0.4 + rT() * 1.6; dmy.position.set(x, y, z); dmy.rotation.set(rT() * 3, rT() * 3, rT() * 3); dmy.scale.set(sc, sc * 0.7, sc); dmy.updateMatrix(); rocks.setMatrixAt(i, dmy.matrix); }
  rocks.castShadow = true; G.add(rocks);
  // señales de curva (chevrones) en el exterior de las curvas cerradas
  const signMats = { 1: new THREE.MeshStandardMaterial({ map: signTex(1) }), [-1]: new THREE.MeshStandardMaterial({ map: signTex(-1) }) }, poleM = new THREE.MeshStandardMaterial({ color: '#555' });
  for (let i = 20; i < N - 20; i += Math.round(9 / ds)) {
    const s = S[i]; if (Math.abs(s.curvS) < 1 / 40) continue; const dir = Math.sign(s.curvS), lat = dir > 0 ? 5.3 : -6.0;
    const gS = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.04), [poleM, poleM, poleM, poleM, signMats[dir > 0 ? 1 : -1], poleM]); b.position.y = 1.35; gS.add(b);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), poleM); p.position.y = 0.55; gS.add(p);
    gS.position.set(s.p.x + s.l.x * lat, s.p.y, s.p.z + s.l.z * lat); gS.rotation.y = Math.atan2(-s.t.x, -s.t.z); G.add(gS);
  }
  // farolas
  const glow = glowTex(), lampM = new THREE.MeshStandardMaterial({ color: '#3a3b3f' }), headM = new THREE.MeshStandardMaterial({ color: '#fff2c6', emissive: '#ffe1a0', emissiveIntensity: 2 });
  for (let i = 40; i < N - 20; i += Math.round(62 / ds)) {
    const s = S[i], base = new THREE.Vector3(s.p.x - s.l.x * 5.9, s.p.y, s.p.z - s.l.z * 5.9), gL = new THREE.Group(); gL.position.copy(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 6.5, 6), lampM); pole.position.y = 3.25; gL.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.6), lampM); arm.position.set(0, 6.4, 0); gL.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.6), headM); head.position.set(0, 6.3, 0.8); gL.add(head);
    gL.lookAt(base.x + s.l.x, base.y, base.z + s.l.z); G.add(gL);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#ffd9a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); const hp = new THREE.Vector3(0, 6.3, 0.8).applyMatrix4(gL.matrixWorld.compose(gL.position, gL.quaternion, gL.scale)); sp.position.copy(hp); sp.scale.set(3, 3, 1); sp.layers.set(1); G.add(sp);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 20), new THREE.MeshBasicMaterial({ map: glow, color: '#ffcf8a', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); pool.rotation.x = -Math.PI / 2; pool.position.set(hp.x, s.p.y + 0.03, hp.z); pool.layers.set(1); G.add(pool);
    T.lamps.push({ head, sp, pool });
  }
  // arcos de salida y meta
  const arch = (i, txt, sub) => { const s = S[i], gA = new THREE.Group(); const pm = new THREE.MeshStandardMaterial({ color: '#141414' });
    for (const lat of [-6.2, 6.2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 0.4), pm); p.position.set(0, 3, lat); gA.add(p); }
    const bn = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 12.8), [pm, pm, pm, pm, new THREE.MeshBasicMaterial({ map: bannerTex(txt, sub) }), new THREE.MeshBasicMaterial({ map: bannerTex(txt, sub) })]); bn.position.y = 5.6; gA.add(bn);
    gA.position.copy(s.p); gA.rotation.y = Math.atan2(-s.t.z, s.t.x); G.add(gA); return gA; };
  T.archStart = arch(25, 'START', '峠'); T.archGoal = arch(N - 25, 'GOAL', '終');
  // montañas lejanas
  const mg = []; const rM = mulberry(3);
  for (let k = 0; k < 46; k++) { const a = (k / 46) * Math.PI * 2, R = 700 + rM() * 300, h = 120 + rM() * 260; const c = new THREE.ConeGeometry(160 + rM() * 140, h, 5, 1); c.translate(60 + Math.cos(a) * R, h / 2 - 30, -160 + Math.sin(a) * R); mg.push(c.toNonIndexed()); }
  const mountains = new THREE.Mesh(mergeGeometries(mg), new THREE.MeshStandardMaterial({ color: '#5f7a6a', flatShading: true, roughness: 1 })); G.add(mountains); T.mountains = mountains;
}
