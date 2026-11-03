// Generador de coches caricatura: low-poly, decoración propia, sombreado toon y piezas de tuning japonés.
import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- utilidades ----------
function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function arc(cx, cy, R, n = 8) { const o = []; for (let i = 0; i <= n; i++) { const a = Math.PI - (Math.PI * i) / n; o.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } return o; }

// ---------- decoración ----------
// Lienzo 2048x2048: filas 0-512 lateral derecho, 512-1024 lateral izquierdo, 1024-1536 techo/capó, 1536-2048 frontal (izq.) y trasera (der.).
const SPX = 4.5, SPY = 1.8, KX = 2048 / SPX, KY = 512 / SPY, KZ = 512 / 2.2;
const sideXY = (left, xm, ym) => { const x = ((xm + SPX / 2) / SPX) * 2048; return [left ? 2048 - x : x, (left ? 512 : 0) + (SPY - ym) * KY]; };
const topXY = (xm, zm) => [((xm + SPX / 2) / SPX) * 2048, 1024 + (zm + 1.1) * KZ];
const fbXY = (rear, zm, ym) => [(rear ? 1024 : 0) + ((zm + 1.1) / 2.2) * 1024, 1536 + ((SPY - ym) / SPY) * 512];

function clipAbove(poly, yb) { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; const ia = a[1] >= yb, ib = b[1] >= yb; if (ia) out.push(a); if (ia !== ib) { const t = (yb - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, yb]); } } return out; }
function inset(poly, d) { const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length; return poly.map(([x, y]) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1; return [x - (dx / l) * d * 1.4, y - (dy / l) * d]; }); }

function liveryCanvas(S, cabin) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 2048; const g = c.getContext('2d'); const R = mulberry(S.seed || 7);
  g.fillStyle = cabin && S.roof ? S.roof : S.color; g.fillRect(0, 0, 2048, 2048);
  const rectM = (left, x0, y0, x1, y1, fill) => { const [ax, ay] = sideXY(left, x0, y0), [bx, by] = sideXY(left, x1, y1); g.fillStyle = fill; g.fillRect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)); };
  const atM = (left, xm, ym, fn) => { const [cx, cy] = sideXY(left, xm, ym); g.save(); g.translate(cx, cy); g.scale(1, KY / KX); fn(); g.restore(); };
  const textM = (left, str, xm, ym, hm, font, fill, rot = 0) => atM(left, xm, ym, () => { g.rotate(rot); g.font = `${hm * KX}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fill; g.fillText(str, 0, 0); });
  const polyM = (left, pts) => { g.beginPath(); pts.forEach(([x, y], i) => { const [px, py] = sideXY(left, x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); };
  const lineM = (left, pts, w, col) => { polyM(left, pts); g.lineWidth = w; g.strokeStyle = col; g.stroke(); };
  const seam = 'rgba(25,10,8,.75)';
  for (const left of [false, true]) {
    if (!cabin) {
      if (S.lower) rectM(left, -2.3, S.lowerY || 0.42, 2.3, 0, S.lower);
      for (const st of S.sideStripes || []) rectM(left, -2.3, st.y + st.h / 2, 2.3, st.y - st.h / 2, st.c);
      if (S.patina) {
        rectM(left, S.door[1] + 0.02, 0.84, S.door[0] - 0.02, 0.3, S.patina.door);
        const r2 = mulberry(left ? 11 : 5);
        for (let k = 0; k < 14; k++) { const x = -1.9 + r2() * 3.8, y = 0.24 + r2() * (k < 9 ? 0.2 : 0.55), rx = 0.05 + r2() * 0.16, ry = 0.03 + r2() * 0.08; atM(left, x, y, () => { g.fillStyle = k % 3 ? '#8b4a2b' : '#a65c32'; g.beginPath(); for (let a = 0; a < 18; a++) { const ang = (a / 18) * Math.PI * 2, rr = 0.75 + r2() * 0.45; g.lineTo(Math.cos(ang) * rx * KX * rr, Math.sin(ang) * ry * KX * rr * 2.6); } g.fill(); }); }
      }
      if (S.pattern === 'sakura') { const r2 = mulberry(left ? 3 : 9); for (let k = 0; k < 26; k++) { const x = -1.8 + r2() * 3.4, y = 0.3 + r2() * 0.5, s = 0.03 + r2() * 0.05; atM(left, x, y, () => { g.rotate(r2() * 6); g.fillStyle = k % 4 ? '#fff4f8' : '#b8418a'; for (let p = 0; p < 5; p++) { g.rotate(1.2566); g.beginPath(); g.ellipse(0, -s * KX * 0.55, s * KX * 0.32, s * KX * 0.55, 0, 0, 6.3); g.fill(); } }); } }
      if (S.pattern === 'bolt') { polyM(left, [[-1.9, 0.62], [-0.4, 0.62], [-0.2, 0.5], [0.6, 0.66], [0.4, 0.52], [1.6, 0.6], [1.6, 0.52], [0.3, 0.44], [0.5, 0.56], [-0.3, 0.42], [-0.5, 0.54], [-1.9, 0.54]]); g.fillStyle = '#141414'; g.fill(); }
      if (S.number) { atM(left, S.numX ?? -0.05, 0.58, () => { g.fillStyle = S.numBg || '#f2efe6'; g.beginPath(); g.roundRect(-0.28 * KX, -0.19 * KX, 0.56 * KX, 0.38 * KX, 22); g.fill(); }); textM(left, S.number, S.numX ?? -0.05, 0.575, 0.3, "'Dela Gothic One'", S.numFg || '#141414'); }
      for (const s of S.stickers || []) { if (s.bg) atM(left, s.x, s.y, () => { g.fillStyle = s.bg; g.fillRect(-s.w / 2 * KX, -s.h * 0.75 * KX, s.w * KX, s.h * 1.5 * KX); }); textM(left, s.t, s.x, s.y, s.h, s.font || "900 'Zen Kaku Gothic New'", s.fg || '#f2efe6', s.rot || 0); }
      lineM(left, [[S.door[0], 0.27], [S.door[0] + 0.02, 0.84]], 3, seam); lineM(left, [[S.door[1], 0.27], [S.door[1] + 0.02, 0.88]], 3, seam);
      rectM(left, S.door[1] + 0.12, 0.775, S.door[1] + 0.28, 0.745, 'rgba(25,10,8,.85)');
      rectM(left, (S.front || 1.9) - 0.12, 0.54, (S.front || 1.9) - 0.03, 0.5, '#f0a03a');
    } else {
      // ventanillas a partir del perfil del habitáculo
      const belt = Math.max(S.cab[0][1], S.cab[S.cab.length - 1][1]) + 0.07;
      const win = inset(clipAbove(S.cab, belt), 0.07);
      polyM(left, win); const gr = g.createLinearGradient(0, sideXY(left, 0, 1.5)[1], 0, sideXY(left, 0, belt)[1]); gr.addColorStop(0, '#53687c'); gr.addColorStop(1, '#1b232c'); g.fillStyle = gr; g.fill(); g.lineWidth = 10; g.strokeStyle = '#121214'; g.stroke();
      rectM(left, S.bpillar - 0.05, 1.8, S.bpillar + 0.05, belt - 0.01, S.roof || S.color);
      lineM(left, [[S.bpillar + 0.55, belt + 0.45], [S.bpillar + 0.3, belt + 0.05]], 16, 'rgba(255,255,255,.4)');
      lineM(left, [[S.bpillar - 0.25, belt + 0.45], [S.bpillar - 0.48, belt + 0.06]], 12, 'rgba(255,255,255,.3)');
      if (S.driver) atM(left, S.bpillar + 0.28, belt + 0.18, () => { g.fillStyle = S.driver; g.beginPath(); g.arc(0, 0, 0.12 * KX, Math.PI, 0); g.lineTo(0.12 * KX, 0.08 * KX); g.lineTo(-0.12 * KX, 0.08 * KX); g.fill(); });
    }
  }
  // techo, capó, maletero
  const rectT = (x0, z0, x1, z1, fill) => { const [ax, ay] = topXY(x0, z0), [bx, by] = topXY(x1, z1); g.fillStyle = fill; g.fillRect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)); };
  const n = S.cab.length, cabHW = S.cabW / 2;
  if (!cabin) {
    if (S.patina) { rectT(S.cab[0][0], -0.95, 2.3, 0.95, S.patina.hood); const r2 = mulberry(4); for (let k = 0; k < 8; k++) { const [x, y] = topXY(-2 + r2() * 4, -0.8 + r2() * 1.6); g.fillStyle = '#8b4a2b'; g.beginPath(); g.ellipse(x, y, 20 + r2() * 50, 10 + r2() * 30, r2() * 3, 0, 6.3); g.fill(); } }
    for (const z of S.topStripes || []) rectT(-2.3, z - 0.07, 2.3, z + 0.07, S.topStripeC || '#f2efe6');
    if (S.hoodVents) for (const z of [-0.36, 0.36]) rectT(S.cab[0][0] + 0.45, z - 0.05, S.cab[0][0] + 0.75, z + 0.05, '#141414');
    g.strokeStyle = seam; g.lineWidth = 3; g.beginPath();
    for (const [a, b] of [[[S.cab[0][0] + 0.06, -0.9], [S.cab[0][0] + 0.06, 0.9]], [[S.cab[0][0] + 0.06, -0.72], [2.2, -0.72]], [[S.cab[0][0] + 0.06, 0.72], [2.2, 0.72]]]) { const [ax, ay] = topXY(...a), [bx, by] = topXY(...b); g.moveTo(ax, ay); g.lineTo(bx, by); }
    g.stroke();
  } else {
    for (const z of S.topStripes || []) rectT(-2.3, z - 0.07, 2.3, z + 0.07, S.topStripeC || '#f2efe6');
    const trap = (x0, x1, h) => { g.beginPath(); [[x0, -h], [x1, -h * 0.9], [x1, h * 0.9], [x0, h]].forEach(([x, z], i) => { const [px, py] = topXY(x, z); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.fillStyle = '#26323e'; g.fill(); g.lineWidth = 10; g.strokeStyle = '#121214'; g.stroke(); };
    trap(S.cab[0][0] - 0.05, S.cab[1][0] + 0.05, cabHW * 0.82); trap(S.cab[n - 3][0] + 0.05, S.cab[n - 4][0] - 0.05, cabHW * 0.78);
    if (S.banner) { rectT(S.cab[1][0] + 0.02, -cabHW * 0.7, S.cab[1][0] + 0.16, cabHW * 0.7, '#141414'); const [bx, by] = topXY(S.cab[1][0] + 0.09, 0); g.save(); g.translate(bx, by); g.rotate(-Math.PI / 2); g.scale(1, KX / KZ); g.fillStyle = '#f2efe6'; g.font = "900 14px 'Zen Kaku Gothic New'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(S.banner, 0, 0); g.restore(); }
    // cristal en frontal/trasera por si la cara cae en esa zona
    for (const rear of [false, true]) { const [ax, ay] = fbXY(rear, -cabHW * 0.8, 1.6), [bx, by] = fbXY(rear, cabHW * 0.8, Math.max(S.cab[0][1], S.cab[n - 3][1]) + 0.05); g.fillStyle = '#26323e'; g.fillRect(ax, ay, bx - ax, by - ay); }
  }
  // frontal / trasera
  for (const z of S.topStripes || []) for (const rear of [false, true]) { const [ax] = fbXY(rear, z - 0.07, 0), [bx] = fbXY(rear, z + 0.07, 0); g.fillStyle = S.topStripeC || '#f2efe6'; g.fillRect(ax, cabin ? 1536 : 1536, bx - ax, 512); }
  if (!cabin && S.lower) for (const rear of [false, true]) { const [ax, ay] = fbXY(rear, -1.1, S.lowerY || 0.42); g.fillStyle = S.lower; g.fillRect(ax, ay, 1024, 2048 - ay); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 8; return t;
}
function liveryUV(geo) {
  if (geo.index) geo = geo.toNonIndexed();
  const p = geo.attributes.position, uv = new Float32Array(p.count * 2), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)).normalize();
    for (let k = 0; k < 3; k++) {
      const v = [a, b, c][k]; let u, w;
      if (Math.abs(n.z) >= Math.abs(n.x) && Math.abs(n.z) >= Math.abs(n.y)) { u = (v.x + SPX / 2) / SPX; w = 0.25 * (1 - v.y / SPY); if (n.z < 0) { u = 1 - u; w += 0.25; } }
      else if (Math.abs(n.y) >= Math.abs(n.x)) { u = (v.x + SPX / 2) / SPX; w = 0.5 + 0.25 * ((v.z + 1.1) / 2.2); }
      else { u = (n.x > 0 ? 0 : 0.5) + 0.5 * ((v.z + 1.1) / 2.2); w = 0.75 + 0.25 * (1 - v.y / SPY); }
      uv[(i + k) * 2] = u; uv[(i + k) * 2 + 1] = w;
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return toCreasedNormals(geo, 0.55);
}
function plateTex(txt, top = '峠  500') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#1e6a3a'; g.lineWidth = 10; g.strokeRect(8, 8, 496, 240);
  g.fillStyle = '#1e6a3a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = "900 54px 'Zen Kaku Gothic New'"; g.fillText(top, 256, 66);
  g.font = "900 46px 'Zen Kaku Gothic New'"; g.fillText('さ', 70, 170); g.font = "120px 'Dela Gothic One'"; g.fillText(txt, 290, 168);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function wakabaTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 160; const g = c.getContext('2d');
  g.fillStyle = '#f2efe6'; g.fillRect(0, 0, 128, 160);
  g.fillStyle = '#f2c230'; g.beginPath(); g.moveTo(8, 8); g.lineTo(64, 40); g.lineTo(64, 152); g.lineTo(8, 120); g.closePath(); g.fill();
  g.fillStyle = '#2f9b4a'; g.beginPath(); g.moveTo(120, 8); g.lineTo(64, 40); g.lineTo(64, 152); g.lineTo(120, 120); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function tireTex(txt) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#1f1f22'; g.fillRect(0, 0, 1024, 64); g.fillStyle = '#efece4'; g.font = "900 34px 'Zen Kaku Gothic New'"; g.textBaseline = 'middle';
  for (let k = 0; k < 2; k++) g.fillText(txt, 40 + k * 512, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- materiales ----------
const grad = new THREE.DataTexture(new Uint8Array([95, 175, 255]), 3, 1, THREE.RedFormat); grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
const toon = (o) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });

function extrude(pts, width, bevel = 0.035) {
  const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1]))); const depth = width - bevel * 2;
  const g = new THREE.ExtrudeGeometry(sh, { depth, steps: 1, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 1, curveSegments: 3 });
  g.translate(0, 0, -depth / 2); return g;
}
function deform(g, fn) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = fn(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, v[0], v[1], v[2]); } g.computeVertexNormals(); return g; }

// ---------- los 6 coches ----------
const A = (cx, cy, R) => arc(cx, cy, R, 8);
export const CARS = [
  { id: 'hayate', name: 'Hayate S', kana: 'ハヤテ · 疾風', owner: 'Kai', color: '#d8432b', lower: '#1b1c20', sideStripes: [{ y: 0.445, h: 0.025, c: '#f2efe6' }], topStripes: [-0.2, 0.2], number: '23', banner: 'HAYATE  RACING', seed: 3,
    stickers: [{ t: 'SHIRAKAWA', x: 1.45, y: 0.62, h: 0.07, bg: '#141414', w: 0.52 }, { t: '峠', x: -1.5, y: 0.66, h: 0.15, font: "'Yuji Syuku'", fg: '#d8432b', bg: '#f2efe6', w: 0.2 }, { t: 'TOUGE CLUB', x: -1.1, y: 0.33, h: 0.055 }],
    r: 0.36, W: 1.84, cabW: 1.2, tumble: 0.34, belt: 0.86, bpillar: -0.35, door: [0.66, -0.66], front: 1.95, wx: [1.2, -1.15],
    body: [[-1.95, 0.36], [-1.92, 0.22], [-1.62, 0.22], ...A(-1.15, 0.36, 0.47), [-0.68, 0.22], [0.73, 0.22], ...A(1.2, 0.36, 0.47), [1.67, 0.22], [1.9, 0.24], [1.97, 0.34], [1.98, 0.62], [1.92, 0.72], [1.3, 0.8], [0.75, 0.86], [-1.5, 0.9], [-1.9, 0.92], [-1.96, 0.8], [-1.97, 0.5]],
    cab: [[0.78, 0.84], [0.22, 1.5], [-0.85, 1.56], [-1.1, 1.52], [-1.82, 0.96], [-1.82, 0.88], [0.78, 0.82]],
    lights: 'quad', wing: 'gt', wheels: { style: 'dish8', c: '#c99a3e' }, mirrors: 'fender', mudflaps: '#cf2a2c', exhaust: 'single', plate: '23-86', tire: 'HAYATE  ·  峠  ·  HAYATE  ·  峠', canards: true, oilCooler: true, wakaba: true,
    stats: { Tracción: 'FR', Potencia: '160 CV', Peso: '940 kg', Cambio: 'Manual 5' } },
  { id: 'kurogane', name: 'Kurogane GT', kana: 'クロガネ · 鉄', owner: 'Ren', color: '#34435e', roof: '#1d2026', lower: '#1d2026', lowerY: 0.36, sideStripes: [{ y: 0.4, h: 0.03, c: '#e0b23a' }], number: '7', numBg: '#e0b23a', banner: 'KUROGANE  WORKS', seed: 8,
    stickers: [{ t: '鉄', x: -1.45, y: 0.62, h: 0.18, font: "'Yuji Syuku'", fg: '#e0b23a' }, { t: 'SHIRAKAWA TURBO', x: 1.3, y: 0.58, h: 0.06, fg: '#e0b23a' }],
    r: 0.36, W: 1.9, cabW: 1.22, tumble: 0.3, belt: 0.8, bpillar: -0.45, door: [0.62, -0.72], front: 2.06, wx: [1.26, -1.22],
    body: [[-2.05, 0.38], [-2.0, 0.22], [-1.69, 0.22], ...A(-1.22, 0.36, 0.47), [-0.75, 0.22], [0.79, 0.22], ...A(1.26, 0.36, 0.47), [1.73, 0.22], [2.0, 0.22], [2.06, 0.3], [2.06, 0.44], [1.98, 0.54], [1.2, 0.72], [0.7, 0.8], [-1.55, 0.9], [-2.0, 0.93], [-2.06, 0.82], [-2.07, 0.5]],
    cab: [[0.74, 0.78], [0.1, 1.32], [-0.6, 1.36], [-0.9, 1.32], [-1.95, 0.95], [-1.95, 0.88], [0.74, 0.76]],
    lights: 'slim', wing: 'gt-big', louvers: true, wheels: { style: 'mesh', c: '#c7cbd2' }, mirrors: 'door', exhaust: 'dual', plate: '7-77', tire: 'KUROGANE  ·  TURBO', canards: true, hoodVents: true,
    stats: { Tracción: 'FR', Potencia: '280 CV', Peso: '1.240 kg', Cambio: 'Manual 5' } },
  { id: 'tsubame', name: 'Tsubame RS', kana: 'ツバメ · 燕', owner: 'Daichi', color: '#5f8a55', roof: '#f2efe6', lower: '#f2efe6', lowerY: 0.4, number: '4', banner: 'TSUBAME  RALLY', seed: 5, topStripes: [0],
    stickers: [{ t: '燕', x: -1.45, y: 0.64, h: 0.17, font: "'Yuji Syuku'", fg: '#f2efe6' }, { t: 'RALLY  TEAM', x: 1.35, y: 0.6, h: 0.06, bg: '#141414', w: 0.5 }],
    r: 0.37, W: 1.86, cabW: 1.22, tumble: 0.3, belt: 0.9, bpillar: -0.35, door: [0.62, -0.7], front: 2.06, wx: [1.24, -1.25],
    body: [[-2.05, 0.4], [-2.0, 0.24], [-1.73, 0.24], ...A(-1.25, 0.38, 0.48), [-0.77, 0.24], [0.76, 0.24], ...A(1.24, 0.38, 0.48), [1.72, 0.24], [1.98, 0.26], [2.05, 0.36], [2.06, 0.62], [2.0, 0.74], [1.1, 0.84], [0.7, 0.88], [-1.25, 0.92], [-1.3, 0.96], [-1.98, 0.98], [-2.06, 0.88], [-2.07, 0.55]],
    cab: [[0.74, 0.86], [0.15, 1.5], [-0.85, 1.53], [-1.35, 1.0], [-1.35, 0.92], [0.74, 0.84]],
    lights: 'round', fogPods: true, hoodScoop: true, wing: 'gt', roofVent: true, wheels: { style: 'spoke5', c: '#f2efe6' }, mirrors: 'door', mudflaps: '#2b62c9', exhaust: 'single', plate: '4-44', tire: 'TSUBAME  ·  RALLY  ·  燕',
    stats: { Tracción: '4WD', Potencia: '260 CV', Peso: '1.280 kg', Cambio: 'Manual 6' } },
  { id: 'sakura', name: 'Sakura R', kana: 'サクラ · 桜', owner: 'Mika', color: '#ef8fb6', roof: '#f7f2f4', lower: '#f7f2f4', lowerY: 0.36, sideStripes: [{ y: 0.395, h: 0.025, c: '#8a3d8f' }], pattern: 'sakura', number: '39', numBg: '#8a3d8f', numFg: '#f7f2f4', banner: 'SAKURA  ★  MIKA', seed: 9, driver: '#f4a3c4',
    stickers: [{ t: '桜', x: 1.5, y: 0.62, h: 0.17, font: "'Yuji Syuku'", fg: '#8a3d8f' }, { t: 'ミカ', x: -1.45, y: 0.62, h: 0.1, fg: '#f7f2f4', bg: '#8a3d8f', w: 0.24 }],
    r: 0.35, W: 1.82, cabW: 1.16, tumble: 0.34, belt: 0.84, bpillar: -0.3, door: [0.66, -0.64], front: 1.98, wx: [1.2, -1.15],
    body: [[-1.95, 0.38], [-1.9, 0.22], [-1.6, 0.22], ...A(-1.15, 0.35, 0.46), [-0.69, 0.22], [0.74, 0.22], ...A(1.2, 0.35, 0.46), [1.66, 0.22], [1.92, 0.26], [1.98, 0.4], [1.97, 0.58], [1.88, 0.66], [1.2, 0.76], [0.72, 0.82], [-1.25, 0.88], [-1.3, 0.92], [-1.88, 0.95], [-1.96, 0.84], [-1.97, 0.5]],
    cab: [[0.75, 0.8], [0.2, 1.42], [-0.8, 1.46], [-1.28, 0.96], [-1.28, 0.88], [0.75, 0.78]],
    lights: 'popup', wing: 'duck', wheels: { style: 'dish8', c: '#f7f2f4' }, mirrors: 'door', exhaust: 'dual', plate: '39-39', tire: 'SAKURA  ·  MIKA  ·  桜',
    stats: { Tracción: 'FR', Potencia: '210 CV', Peso: '1.050 kg', Cambio: 'Manual 5' } },
  { id: 'pico', name: 'Pico Kei', kana: 'ピコ · 軽', owner: 'Yuto', color: '#f2c230', lower: '#141414', lowerY: 0.3, pattern: 'bolt', banner: 'PICO  POWER', seed: 4,
    stickers: [{ t: '軽', x: -1.0, y: 0.72, h: 0.16, font: "'Yuji Syuku'", fg: '#141414' }],
    r: 0.34, W: 1.6, cabW: 1.24, tumble: 0.12, belt: 0.88, bpillar: -0.3, door: [0.62, -0.55], front: 1.62, wx: [0.95, -0.95],
    body: [[-1.6, 0.4], [-1.56, 0.22], [-1.38, 0.22], ...A(-0.95, 0.34, 0.44), [-0.51, 0.22], [0.51, 0.22], ...A(0.95, 0.34, 0.44), [1.39, 0.22], [1.56, 0.24], [1.62, 0.34], [1.62, 0.66], [1.55, 0.78], [1.15, 0.86], [0.85, 0.9], [-1.5, 0.94], [-1.6, 0.88], [-1.62, 0.55]],
    cab: [[0.88, 0.88], [0.45, 1.62], [-1.4, 1.66], [-1.55, 1.58], [-1.58, 0.96], [-1.58, 0.9], [0.88, 0.86]],
    lights: 'round', xTape: true, wing: 'none', roofRack: true, wheels: { style: 'steel', c: '#141414' }, mirrors: 'fender', exhaust: 'single', plate: '5-50', tire: 'PICO  ·  KEI  ·  軽',
    stats: { Tracción: 'FF', Potencia: '64 CV', Peso: '650 kg', Cambio: 'Manual 5' } },
  { id: 'onibi', name: 'Onibi', kana: 'オニビ · 鬼火', owner: 'Gen', color: '#e9dfc7', roof: '#7fb7c9', patina: { door: '#5fa7a3', hood: '#b9a48a' }, number: '0', numBg: '#141414', numFg: '#e9dfc7', numX: -1.35, banner: 'ONIBI  GARAGE', seed: 6,
    stickers: [{ t: '鬼火', x: 0.0, y: 0.66, h: 0.12, font: "'Yuji Syuku'", fg: '#141414' }, { t: 'NO BRAKES', x: 1.4, y: 0.62, h: 0.06, fg: '#141414' }],
    r: 0.37, W: 1.9, cabW: 1.16, tumble: 0.36, belt: 0.86, bpillar: -0.4, door: [0.62, -0.7], front: 2.06, wx: [1.24, -1.25],
    body: [[-2.05, 0.42], [-2.0, 0.24], [-1.73, 0.24], ...A(-1.25, 0.38, 0.48), [-0.77, 0.24], [0.76, 0.24], ...A(1.24, 0.38, 0.48), [1.72, 0.24], [2.0, 0.26], [2.06, 0.36], [2.06, 0.7], [1.98, 0.78], [0.8, 0.84], [0.7, 0.86], [-1.3, 0.88], [-1.32, 0.92], [-2.0, 0.94], [-2.06, 0.86], [-2.07, 0.55]],
    cab: [[0.72, 0.84], [0.3, 1.5], [-0.95, 1.52], [-1.3, 0.96], [-1.3, 0.88], [0.72, 0.82]],
    lights: 'round4', xTape: true, fogSingle: true, engineOut: true, louvers: true, wing: 'gt-big', wingC: '#4caf7a', wheels: { style: 'spoke5', c: '#c7cbd2' }, mirrors: 'door', exhaust: 'quad', plate: '0-666', tire: 'NO  BRAKES  ·  鬼火', bumperC: '#d6483f',
    stats: { Tracción: 'FR', Potencia: '420 CV', Peso: '1.150 kg', Cambio: 'Secuencial' } },
];

// ---------- construcción ----------
export function buildCar(S) {
  const M = {
    body: toon({ map: liveryCanvas(S, false) }), cabin: toon({ map: liveryCanvas(S, true) }), paint: toon({ color: S.color }), wingC: toon({ color: S.wingC || '#141414' }),
    bumper: toon({ color: S.bumperC || '#232428' }), black: toon({ color: '#121315' }), under: toon({ color: '#2b2c30' }),
    chrome: toon({ color: '#d9dce2' }), rim: toon({ color: S.wheels.c }), tire: toon({ map: tireTex(S.tire), side: THREE.DoubleSide }), tireS: toon({ color: '#1f1f22', side: THREE.DoubleSide }), red: toon({ color: '#cf2a2c' }), flap: toon({ color: S.mudflaps || '#cf2a2c' }),
    head: toon({ color: '#f6f3ea', emissive: '#fff4d6', emissiveIntensity: 0.55 }), tail: toon({ color: '#b51f1c', emissive: '#a01410', emissiveIntensity: 0.45 }),
    amber: toon({ color: '#f0a03a', emissive: '#c76a10', emissiveIntensity: 0.3 }), yellow: toon({ color: '#f2c230', emissive: '#c99a10', emissiveIntensity: 0.3 }),
    plate: toon({ map: plateTex(S.plate) }), wakaba: toon({ map: wakabaTex() }), engine: toon({ color: '#5a5d63' }),
  };
  const car = new THREE.Group(), inner = new THREE.Group(); inner.position.y = -0.03; car.add(inner);
  const add = (m, parent = inner) => { m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0, parent = inner) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.set(rx, ry, rz); return add(b, parent); };
  const cyl = (r, len, m, x, y, z, axis = 'x', seg = 10, parent = inner) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m); if (axis === 'x') c.rotation.z = Math.PI / 2; if (axis === 'z') c.rotation.x = Math.PI / 2; c.position.set(x, y, z); return add(c, parent); };
  const F = Math.max(...S.body.map((p) => p[0])), B = Math.min(...S.body.map((p) => p[0])), HW = S.W / 2;
  const hoodAt = (x) => { let best = 0; for (let i = 0; i < S.body.length - 1; i++) { const [x0, y0] = S.body[i], [x1, y1] = S.body[i + 1]; if (y0 > 0.5 && y1 > 0.5 && ((x0 - x) * (x1 - x) <= 0)) best = Math.max(best, y0 + (y1 - y0) * ((x - x0) / ((x1 - x0) || 1))); } return best; };

  const body = deform(extrude(S.body, S.W, 0.045), (x, y, z) => { const k = 1 - 0.1 * Math.min(1, Math.max(0, (Math.abs(x) - (F - 0.4)) / 0.4)); return [x, y, z * k]; });
  add(new THREE.Mesh(liveryUV(body), M.body));
  const cab = deform(extrude(S.cab, S.cabW + 0.18, 0.04), (x, y, z) => [x, y, z * (1 - Math.max(0, y - S.belt) * S.tumble)]);
  add(new THREE.Mesh(liveryUV(cab), M.cabin));
  // aletines
  for (const cx of S.wx) for (const s of [1, -1]) {
    const R0 = S.r + 0.11, R1 = R0 + 0.12, cy = S.r; const sh = new THREE.Shape();
    sh.moveTo(cx + R1, cy - 0.08); sh.lineTo(cx + R1, cy); sh.absarc(cx, cy, R1, 0, Math.PI, false); sh.lineTo(cx - R1, cy - 0.08); sh.lineTo(cx - R0, cy - 0.08); sh.lineTo(cx - R0, cy); sh.absarc(cx, cy, R0, Math.PI, 0, true); sh.lineTo(cx + R0, cy - 0.08); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 1, curveSegments: 5 });
    g.translate(0, 0, s > 0 ? HW - 0.04 : -HW - 0.06); add(new THREE.Mesh(liveryUV(g), M.body));
  }
  // paragolpes
  const bf = deform(extrude([[F - 0.14, 0.18], [F + 0.08, 0.2], [F + 0.13, 0.28], [F + 0.11, 0.44], [F + 0.01, 0.48], [F - 0.09, 0.4]], S.W + 0.08, 0.03), (x, y, z) => [x - Math.pow(Math.abs(z) / (HW + 0.04), 3) * 0.14, y, z]);
  add(new THREE.Mesh(bf, M.bumper));
  const br = deform(extrude([[B + 0.14, 0.42], [B - 0.02, 0.48], [B - 0.09, 0.42], [B - 0.09, 0.26], [B - 0.01, 0.19], [B + 0.14, 0.19]], S.W + 0.08, 0.03), (x, y, z) => [x + Math.pow(Math.abs(z) / (HW + 0.04), 3) * 0.12, y, z]);
  add(new THREE.Mesh(br, M.bumper));
  box(0.3, 0.025, S.W - 0.06, M.black, F + 0.04, 0.175, 0);
  if (S.canards) for (const s of [1, -1]) { box(0.16, 0.012, 0.12, M.black, F + 0.06, 0.34, s * (HW - 0.02), 0, s * 0.5, 0.25); box(0.14, 0.012, 0.1, M.black, F + 0.05, 0.27, s * (HW - 0.01), 0, s * 0.5, 0.2); }
  if (S.oilCooler) { box(0.04, 0.1, 0.5, M.black, F + 0.1, 0.3, 0); for (let i = 0; i < 4; i++) box(0.01, 0.008, 0.48, M.chrome, F + 0.122, 0.265 + i * 0.023, 0); }
  // frontal: parrilla y faros
  const ly = Math.min(hoodAt(F - 0.06) - 0.1, 0.62);
  box(0.05, 0.13, 0.56, M.black, F - 0.01, ly, 0); for (const dy of [-0.035, 0, 0.035]) box(0.03, 0.012, 0.54, M.chrome, F + 0.015, ly + dy, 0);
  for (const s of [1, -1]) {
    const z0 = s * (HW * 0.62);
    if (S.lights === 'quad') { box(0.06, 0.15, 0.42, M.black, F - 0.02, ly, z0); box(0.03, 0.11, 0.17, M.head, F + 0.01, ly, z0 - s * 0.1); box(0.03, 0.11, 0.17, M.head, F + 0.01, ly, z0 + s * 0.1); }
    if (S.lights === 'slim') { box(0.05, 0.07, 0.46, M.black, F - 0.02, ly + 0.02, z0); box(0.03, 0.045, 0.42, M.head, F + 0.005, ly + 0.02, z0); }
    if (S.lights === 'round' || S.lights === 'round4') {
      const zs = S.lights === 'round4' ? [z0 - s * 0.12, z0 + s * 0.12] : [z0];
      zs.forEach((zz, i) => { box(0.05, 0.2, 0.22, M.black, F - 0.03, ly, zz); const l = cyl(0.085, 0.04, i === 1 ? M.yellow : M.head, F + 0.0, ly, zz, 'x', 16); if (S.xTape) { box(0.01, 0.2, 0.025, M.black, F + 0.03, ly, zz, 0.785); box(0.01, 0.2, 0.025, M.black, F + 0.03, ly, zz, -0.785); } });
    }
    if (S.lights === 'popup') { const hy = hoodAt(F - 0.32); box(0.22, 0.13, 0.36, M.paint, F - 0.32, hy + 0.04, z0, 0, 0, -0.12); box(0.02, 0.1, 0.3, M.head, F - 0.205, hy + 0.05, z0, 0, 0, -0.12); box(0.04, 0.05, 0.4, M.black, F - 0.01, ly - 0.04, z0); }
    box(0.04, 0.05, 0.14, M.amber, F + 0.12, 0.38, s * (HW - 0.12));
    // pilotos
    box(0.05, 0.14, 0.46, M.black, B - 0.02, 0.74, s * (HW * 0.62)); box(0.03, 0.11, 0.3, M.tail, B - 0.045, 0.74, s * (HW * 0.68)); box(0.03, 0.11, 0.12, M.amber, B - 0.045, 0.74, s * (HW * 0.45));
    // espejos
    if (S.mirrors === 'fender') { box(0.012, 0.14, 0.012, M.black, F - 0.48, hoodAt(F - 0.48) + 0.05, s * (HW - 0.1), 0, 0, -0.35); box(0.06, 0.06, 0.09, M.paint, F - 0.51, hoodAt(F - 0.48) + 0.13, s * (HW - 0.1), 0, s * 0.35); }
    else { box(0.05, 0.035, 0.1, M.black, S.cab[0][0] - 0.08, S.belt + 0.03, s * (HW - 0.05)); box(0.13, 0.08, 0.1, M.paint, S.cab[0][0] - 0.1, S.belt + 0.07, s * (HW + 0.03), 0, s * 0.25); }
    box(Math.abs(S.wx[0] - S.wx[1]) - 0.8, 0.07, 0.04, M.black, (S.wx[0] + S.wx[1]) / 2, 0.27, s * (HW + 0.02));
    if (S.mudflaps) { box(0.02, 0.22, 0.26, M.flap, S.wx[1] - S.r - 0.15, 0.2, s * (HW - 0.12)); box(0.02, 0.22, 0.26, M.flap, S.wx[0] - S.r - 0.15, 0.2, s * (HW - 0.12)); }
  }
  if (S.fogPods) for (const s of [1, -1]) cyl(0.1, 0.09, M.yellow, F + 0.17, 0.33, s * 0.42, 'x', 16);
  if (S.fogSingle) box(0.05, 0.1, 0.22, M.yellow, F + 0.15, 0.27, 0.48);
  box(0.04, 0.12, 0.6, M.black, B - 0.025, 0.74, 0);
  box(0.012, 0.13, 0.27, M.plate, F + 0.135, 0.31, S.fogSingle ? -0.05 : 0); box(0.012, 0.13, 0.27, M.plate, B - 0.095, 0.46, 0);
  if (S.wakaba) box(0.01, 0.12, 0.095, M.wakaba, B - 0.09, 0.36, -(HW - 0.32));
  box(0.06, 0.12, 0.05, M.red, F + 0.15, 0.22, HW - 0.35, 0, 0, 0.3);
  // escape
  const ex = (z, r) => { cyl(r, 0.22, M.chrome, B - 0.12, 0.25, z, 'x', 12); cyl(r * 0.75, 0.23, M.black, B - 0.12, 0.25, z, 'x', 12); };
  if (S.exhaust === 'single') ex(HW - 0.4, 0.07); if (S.exhaust === 'dual') { ex(HW - 0.4, 0.055); ex(-(HW - 0.4), 0.055); }
  if (S.exhaust === 'quad') for (const z of [HW - 0.32, HW - 0.46, -(HW - 0.32), -(HW - 0.46)]) ex(z, 0.05);
  // alerones
  const n = S.cab.length, trunkX = (S.cab[n - 3][0] + B) / 2, trunkY = hoodAt(trunkX) || 0.92;
  if (S.wing === 'gt' || S.wing === 'gt-big') { const big = S.wing === 'gt-big', wy = trunkY + (big ? 0.55 : 0.32), wx = B + 0.22; const wm = S.wingC ? M.wingC : M.black;
    box(0.42, 0.04, S.W - 0.1, wm, wx, wy, 0, 0, 0, 0.08); for (const s of [1, -1]) { box(0.08, wy - trunkY, 0.04, M.black, wx + 0.02, (wy + trunkY) / 2, s * 0.5); box(0.48, big ? 0.36 : 0.2, 0.025, wm, wx - 0.02, wy - (big ? 0.08 : 0.04), s * (HW - 0.07)); } }
  if (S.wing === 'duck') { const g = extrude([[B + 0.05, trunkY - 0.02], [B + 0.42, trunkY], [B - 0.02, trunkY + 0.12], [B - 0.06, trunkY + 0.06]], S.W - 0.25, 0.02); add(new THREE.Mesh(g, M.paint)); }
  if (S.louvers) { const x0 = S.cab[n - 3][0], x1 = S.cab[n - 4][0], y0 = S.cab[n - 3][1], y1 = S.cab[n - 4][1]; for (let i = 1; i < 7; i++) { const t = i / 7, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; box(0.05, 0.012, S.cabW * 0.78, M.black, x, y + 0.035, 0, 0, 0, Math.atan2(y1 - y0, x1 - x0) * 0.4); } }
  if (S.hoodScoop) box(0.4, 0.08, 0.46, M.paint, S.cab[0][0] + 0.55, hoodAt(S.cab[0][0] + 0.55) + 0.03, 0, 0, 0, -0.08);
  if (S.roofVent) box(0.3, 0.05, 0.4, M.black, (S.cab[1][0] + S.cab[2][0]) / 2, S.cab[2][1] + 0.02, 0);
  if (S.roofRack) { const rx0 = S.cab[1][0], rx1 = S.cab[n - 4][0], ry = S.cab[2][1] + 0.08; for (const s of [1, -1]) box(rx0 - rx1, 0.03, 0.03, M.black, (rx0 + rx1) / 2, ry, s * 0.45); for (let i = 0; i < 4; i++) box(0.03, 0.03, 0.9, M.black, rx1 + (rx0 - rx1) * (i / 3), ry, 0); box(0.4, 0.25, 0.5, M.red, (rx0 + rx1) / 2, ry + 0.14, 0); }
  if (S.engineOut) { const ex0 = S.cab[0][0] + 0.55, ey = hoodAt(ex0); box(0.6, 0.26, 0.42, M.engine, ex0, ey + 0.1, 0); box(0.62, 0.06, 0.3, M.chrome, ex0, ey + 0.25, 0); for (let i = 0; i < 6; i++) cyl(0.03, 0.18, M.chrome, ex0 - 0.25 + i * 0.1, ey + 0.2, 0.28, 'z', 8);
    const tb = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.05, 8, 14), M.red); tb.position.set(ex0 + 0.32, ey + 0.2, -0.2); tb.rotation.y = Math.PI / 2; add(tb); cyl(0.05, 0.5, M.chrome, ex0 + 0.1, ey + 0.32, -0.2, 'x', 10); cyl(0.04, 0.3, M.red, ex0 + 0.32, ey + 0.08, -0.05, 'z', 8); }
  box(0.02, 0.016, S.cabW * 0.4, M.black, S.cab[0][0] + 0.02, S.belt + 0.0, S.cabW * 0.08, 0, 0.14); box(0.02, 0.016, S.cabW * 0.38, M.black, S.cab[0][0] + 0.02, S.belt + 0.0, -S.cabW * 0.32, 0, 0.14);
  // bajos: suelo, transmisión, ejes, escape, depósito, suspensión
  const wf = S.wx[0], wr = S.wx[1], tz = HW - 0.08;
  box(F - B - 0.6, 0.03, S.W - 0.5, M.under, (F + B) / 2, 0.19, 0);
  box(0.62, 0.16, 0.34, M.under, wf - 0.1, 0.27, 0); box(0.5, 0.14, 0.24, M.under, wf - 0.7, 0.27, 0);
  cyl(0.035, Math.abs(wf - wr) - 0.9, M.chrome, (wf + wr) / 2 - 0.2, 0.25, 0, 'x', 8);
  cyl(0.045, tz * 2 - 0.1, M.under, wr, S.r, 0, 'z', 8); const dif = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), M.under); dif.scale.set(1, 0.85, 1.1); dif.position.set(wr, S.r - 0.02, 0); add(dif);
  for (const s of [1, -1]) { cyl(0.03, tz - 0.22, M.under, wf, S.r - 0.02, s * (tz / 2 + 0.1), 'z', 8); box(0.08, 0.025, tz - 0.25, M.under, wf - 0.04, 0.24, s * (tz / 2 + 0.08)); box(0.025, 0.025, tz - 0.3, M.chrome, wf - 0.16, 0.29, s * (tz / 2 + 0.06)); }
  box(0.5, 0.14, 0.8, M.under, wr + 0.35, 0.26, 0);
  cyl(0.032, Math.abs(wf - B) - 0.4, M.chrome, (wf + B) / 2 - 0.2, 0.2, HW - 0.5, 'x', 8); cyl(0.1, 0.5, M.chrome, wr - 0.55, 0.24, HW - 0.42, 'x', 12);
  for (const s of [1, -1]) for (const x of [wf, wr]) cyl(0.05, 0.36, M.red, x, S.r + 0.16, s * (tz - 0.2), 'y', 10);
  // ruedas: plato hondo / malla / 5 radios / chapa; caída negativa
  const r = S.r, tw = 0.27, ri = r * 0.72;
  const tireP = [[ri, -tw / 2], [r * 0.93, -tw / 2 - 0.005], [r * 0.985, -tw * 0.38], [r, 0], [r * 0.985, tw * 0.38], [r * 0.93, tw / 2 + 0.005], [ri, tw / 2]].map(([a, b]) => new THREE.Vector2(a, b));
  const lipP = [[ri * 0.78, 0.03], [ri * 0.84, 0.09], [ri, 0.1], [ri * 1.03, tw / 2 - 0.01], [ri, tw / 2 + 0.005]].map(([a, b]) => new THREE.Vector2(a, b));
  car.userData.front = []; car.userData.wheels = [];
  for (const [x, f] of [[wf, true], [wr, false]]) for (const s of [1, -1]) {
    const piv = new THREE.Group(); piv.position.set(x, r, s * (HW - 0.06)); piv.rotation.x = -s * 0.07; car.add(piv);
    const w = new THREE.Group(); if (s < 0) w.rotation.y = Math.PI; piv.add(w);
    const lat = (prof, m, seg) => { const l = new THREE.Mesh(new THREE.LatheGeometry(prof, seg), m); l.rotation.x = Math.PI / 2; l.castShadow = true; w.add(l); return l; };
    lat(tireP, M.tire, 22);
    const side = new THREE.Mesh(new THREE.RingGeometry(ri, r * 0.93, 24), M.tireS); side.position.z = tw / 2 + 0.006; w.add(side);
    const side2 = side.clone(); side2.position.z = -tw / 2 - 0.006; w.add(side2);
    const ws = S.wheels.style;
    const face = new THREE.Mesh(new THREE.CylinderGeometry(ri * 0.8, ri * 0.8, 0.02, 20), ws === 'steel' ? M.rim : M.black); face.rotation.x = Math.PI / 2; face.position.z = ws === 'dish8' ? 0.035 : 0.09; w.add(face);
    if (ws === 'dish8') { lat(lipP, M.chrome, 26); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const sp = new THREE.Mesh(new THREE.BoxGeometry(0.034, ri * 0.62, 0.03), M.rim); sp.position.set(Math.cos(a) * ri * 0.42, Math.sin(a) * ri * 0.42, 0.055); sp.rotation.z = a - Math.PI / 2; w.add(sp); } }
    if (ws === 'mesh') { const lip = new THREE.Mesh(new THREE.TorusGeometry(ri * 0.98, 0.016, 4, 22), M.chrome); lip.position.z = 0.11; w.add(lip); for (let i = 0; i < 10; i++) for (const dir of [1, -1]) { const a = (i / 10) * Math.PI * 2; const sp = new THREE.Mesh(new THREE.BoxGeometry(0.016, ri * 0.85, 0.02), M.rim); sp.position.set(Math.cos(a) * ri * 0.45, Math.sin(a) * ri * 0.45, 0.1); sp.rotation.z = a - Math.PI / 2 + dir * 0.45; w.add(sp); } }
    if (ws === 'spoke5') { const lip = new THREE.Mesh(new THREE.TorusGeometry(ri * 0.98, 0.016, 4, 22), M.rim); lip.position.z = 0.11; w.add(lip); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const sp = new THREE.Mesh(new THREE.BoxGeometry(0.07, ri * 0.85, 0.035), M.rim); sp.position.set(Math.cos(a) * ri * 0.45, Math.sin(a) * ri * 0.45, 0.1); sp.rotation.z = a - Math.PI / 2; w.add(sp); } }
    if (ws === 'steel') { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const h = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 8), M.black); h.rotation.x = Math.PI / 2; h.position.set(Math.cos(a) * ri * 0.55, Math.sin(a) * ri * 0.55, 0.105); w.add(h); } }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.05, 8), ws === 'steel' ? M.chrome : M.rim); cap.rotation.x = Math.PI / 2; cap.position.z = ws === 'dish8' ? 0.065 : 0.115; w.add(cap);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.02, 16), M.chrome); disc.rotation.x = Math.PI / 2; disc.position.z = -0.04; w.add(disc);
    const cal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.05), M.red); cal.position.set(r * 0.38, r * 0.25, -0.02); w.add(cal);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 8), M.under); hub.rotation.x = Math.PI / 2; hub.position.z = -0.12; w.add(hub);
    if (f) car.userData.front.push(piv); car.userData.wheels.push(w);
  }
  car.userData.M = M; car.userData.S = S; car.userData.inner = inner;
  return car;
}
export function refreshLivery(car) {
  const M = car.userData.M, MS = car.userData.MS, S = car.userData.S;
  const maps = { body: liveryCanvas(S, false), cabin: liveryCanvas(S, true), plate: plateTex(S.plate), tire: tireTex(S.tire) };
  for (const k of Object.keys(maps)) { M[k].map = maps[k]; M[k].needsUpdate = true; if (MS) { MS[k].map = maps[k]; MS[k].needsUpdate = true; } }
}
// Acabado: 'toon' (con trama) o 'liso' (sin trama, materiales estándar con reflejos).
export function setCarStyle(car, style) {
  const M = car.userData.M;
  if (!car.userData.MS) {
    const metal = new Set(['chrome', 'rim']); car.userData.MS = {}; car.userData.byMat = new Map();
    for (const [k, m] of Object.entries(M)) {
      car.userData.byMat.set(m, k);
      car.userData.MS[k] = new THREE.MeshStandardMaterial({ color: m.color, map: m.map, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, side: m.side, roughness: metal.has(k) ? 0.28 : k.startsWith('tire') || k === 'under' ? 0.9 : 0.4, metalness: metal.has(k) ? 0.85 : 0.05, envMapIntensity: 0.6 });
      car.userData.byMat.set(car.userData.MS[k], k);
    }
  }
  car.traverse((o) => { if (!o.isMesh) return; const k = car.userData.byMat.get(o.material); if (k) o.material = style === 'toon' ? M[k] : car.userData.MS[k]; });
}
