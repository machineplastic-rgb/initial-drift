// Coches low poly estilo #DRIVE hechos por código: paneles planos con aristas marcadas, línea de hombro,
// cristales planos con marcos negros e interior visible, ruedas grandes con dibujo y letras, aletines,
// alerones, faros escamoteables y tres decoraciones (calle, carreras y grafiti).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, rng } from './util.js';
import { mergeChildren } from './merge.js';

// keys: secciones de detrás a delante [x, y inferior, y superior (capó/maletero), semiancho, y del hombro]
export const CARS = [
  { id: 'hayate', name: 'Hayate', year: "'86", tag: 'GT-S', kana: 'ハヤテ', color: '#f2f0ea', color2: '#16161a', stripe: '#d8432b', number: '86', numStyle: 'circle', livery: 0,
    L: 4.2, W: 1.64, r: 0.32, tw: 0.24, wb: 2.4, wOff: 0.02, clr: 0.17,
    keys: [[-2.1, 0.3, 0.84, 0.77, 0.78], [-2.04, 0.2, 0.9, 0.81, 0.84], [-1.6, 0.19, 0.91, 0.82, 0.85], [0.7, 0.18, 0.9, 0.82, 0.84], [1.7, 0.2, 0.8, 0.81, 0.75], [2.04, 0.22, 0.74, 0.79, 0.69], [2.1, 0.3, 0.66, 0.74, 0.62]],
    cab: { x0: 0.7, roofF: -0.08, roofB: -0.72, x1: -1.95, roofY: 1.31, beltF: 0.9, beltR: 0.91, w: 0.78, wt: 0.66, hatch: true, bX: -0.42 },
    lights: 'popup', fog: 'none', wing: 'duck', flares: 'none', rims: { style: 'spoke8', color: '#5b5e66' }, extras: { antenna: true },
    sponsors: ['TOUGE CLUB', 'SHIRAKAWA'], kanji: '峠', plate: '86-23',
    stats: { drive: 'FR', hp: 165, kg: 940, gear: 'Manual 5' }, phys: { accel: 8.6, vmax: 56, grip: 7.0, drift: 1.25, nitro: 1.0, mass: 940 } },
  { id: 'kurogane', name: 'Kurogane', year: "'93", tag: 'RS', kana: 'クロガネ', color: '#2c3a55', color2: '#1d2026', stripe: '#e0b23a', number: '7', numStyle: 'square', livery: 1,
    L: 4.45, W: 1.7, r: 0.34, tw: 0.27, wb: 2.47, wOff: 0.04, clr: 0.15,
    keys: [[-2.22, 0.32, 0.84, 0.8, 0.78], [-2.16, 0.2, 0.89, 0.84, 0.83], [-1.5, 0.19, 0.9, 0.85, 0.84], [0.7, 0.18, 0.84, 0.85, 0.78], [1.8, 0.2, 0.7, 0.83, 0.65], [2.16, 0.22, 0.63, 0.8, 0.58], [2.22, 0.3, 0.55, 0.75, 0.5]],
    cab: { x0: 0.72, roofF: -0.12, roofB: -0.85, x1: -1.72, roofY: 1.26, beltF: 0.84, beltR: 0.89, w: 0.8, wt: 0.66, hatch: true, bX: -0.46 },
    lights: 'slim', fog: 'none', wing: 'gt', flares: 'none', rims: { style: 'mesh', color: '#cfd3da' }, extras: { hoodVents: true, antenna: true },
    sponsors: ['KUROGANE WORKS', 'TURBO'], kanji: '鉄', plate: '7-77',
    stats: { drive: 'FR', hp: 310, kg: 1240, gear: 'Manual 6' }, phys: { accel: 9.8, vmax: 68, grip: 7.2, drift: 1.0, nitro: 1.25, mass: 1240 } },
  { id: 'tsubame', name: 'Tsubame', year: "'96", tag: 'WRX', kana: 'ツバメ', color: '#1f4fb8', color2: '#16161a', stripe: '#f2c230', number: '4', numStyle: 'square', livery: 1,
    L: 4.35, W: 1.72, r: 0.35, tw: 0.27, wb: 2.52, wOff: 0.0, clr: 0.22,
    keys: [[-2.17, 0.34, 0.94, 0.8, 0.88], [-2.1, 0.24, 0.98, 0.84, 0.92], [-1.3, 0.23, 0.98, 0.86, 0.92], [0.8, 0.22, 0.94, 0.86, 0.88], [1.8, 0.24, 0.86, 0.84, 0.8], [2.1, 0.26, 0.8, 0.81, 0.74], [2.17, 0.32, 0.7, 0.77, 0.64]],
    cab: { x0: 0.8, roofF: 0.0, roofB: -0.95, x1: -1.36, roofY: 1.42, beltF: 0.94, beltR: 0.98, w: 0.8, wt: 0.68, bX: -0.45 },
    lights: 'square', fog: 'yellow', wing: 'gt-tall', flares: 'round', rims: { style: 'dish', color: '#f2c230' }, extras: { scoop: true, roofVent: true, mudflaps: '#d02a2a', antenna: true },
    sponsors: ['TSUBAME RALLY', 'KAMINARI OIL'], kanji: '燕', plate: '4-44',
    stats: { drive: '4WD', hp: 280, kg: 1280, gear: 'Manual 6' }, phys: { accel: 9.4, vmax: 64, grip: 8.6, drift: 0.85, nitro: 1.1, mass: 1280 } },
  { id: 'sakura', name: 'Sakura', year: "'91", tag: 'R', kana: 'サクラ', color: '#ef8fb6', color2: '#f7f2f4', stripe: '#7a3d8f', number: '39', numStyle: 'heart', livery: 2,
    L: 4.3, W: 1.72, r: 0.34, tw: 0.26, wb: 2.43, wOff: 0.03, clr: 0.15,
    keys: [[-2.15, 0.3, 0.8, 0.8, 0.74], [-2.08, 0.18, 0.86, 0.84, 0.8], [-1.4, 0.17, 0.86, 0.86, 0.8], [0.6, 0.16, 0.78, 0.86, 0.72], [1.7, 0.18, 0.66, 0.84, 0.6], [2.1, 0.2, 0.58, 0.8, 0.52], [2.15, 0.28, 0.5, 0.75, 0.46]],
    cab: { x0: 0.62, roofF: -0.14, roofB: -0.82, x1: -1.78, roofY: 1.24, beltF: 0.78, beltR: 0.86, w: 0.78, wt: 0.62, hatch: true, bX: -0.47 },
    lights: 'popup', fog: 'none', wing: 'duck', flares: 'none', rims: { style: 'spoke5', color: '#f4f1ec' }, extras: { antenna: true },
    sponsors: ['SAKURA ★ MIKA', 'NEON TUNE'], kanji: '桜', plate: '39-39',
    stats: { drive: 'FR', hp: 245, kg: 1050, gear: 'Manual 5' }, phys: { accel: 9.0, vmax: 62, grip: 7.2, drift: 1.15, nitro: 1.15, mass: 1050 } },
  { id: 'pico', name: 'Pico', year: "'89", tag: 'WORKS', kana: 'ピコ', color: '#f2c230', color2: '#16161a', stripe: '#16161a', number: '5', numStyle: 'circle', livery: 1,
    L: 3.4, W: 1.44, r: 0.3, tw: 0.21, wb: 2.2, wOff: 0.05, clr: 0.18,
    keys: [[-1.7, 0.3, 0.9, 0.68, 0.84], [-1.66, 0.2, 0.93, 0.71, 0.87], [0.8, 0.19, 0.93, 0.72, 0.87], [1.35, 0.2, 0.86, 0.71, 0.8], [1.65, 0.22, 0.8, 0.69, 0.74], [1.7, 0.3, 0.72, 0.66, 0.66]],
    cab: { x0: 0.95, roofF: 0.42, roofB: -1.44, x1: -1.66, roofY: 1.48, beltF: 0.93, beltR: 0.93, w: 0.69, wt: 0.62, hatch: true, bX: -0.3 },
    lights: 'round', fog: 'x', wing: 'none', flares: 'none', rims: { style: 'steel', color: '#18181b' }, extras: { roofRack: true, antenna: true },
    sponsors: ['PICO POWER', 'KEI'], kanji: '軽', plate: '5-50',
    stats: { drive: 'FF', hp: 92, kg: 650, gear: 'Manual 5' }, phys: { accel: 7.4, vmax: 50, grip: 7.8, drift: 1.3, nitro: 1.3, mass: 650 } },
  { id: 'onibi', name: 'Onibi', year: "'84", tag: 'B', kana: 'オニビ', color: '#d6402f', color2: '#16161a', stripe: '#f4f1ec', number: '75', numStyle: 'circle', livery: 1,
    L: 4.25, W: 1.8, r: 0.36, tw: 0.29, wb: 2.45, wOff: 0.0, clr: 0.2,
    keys: [[-2.12, 0.34, 0.94, 0.84, 0.88], [-2.06, 0.24, 0.97, 0.88, 0.91], [-1.2, 0.23, 0.97, 0.9, 0.91], [0.8, 0.22, 0.93, 0.9, 0.87], [1.8, 0.24, 0.87, 0.89, 0.81], [2.06, 0.26, 0.84, 0.86, 0.78], [2.12, 0.32, 0.72, 0.82, 0.66]],
    cab: { x0: 0.82, roofF: 0.08, roofB: -0.95, x1: -1.32, roofY: 1.4, beltF: 0.93, beltR: 0.97, w: 0.82, wt: 0.72, bX: -0.42 },
    lights: 'quad', fog: 'x', wing: 'big', flares: 'box', rims: { style: 'turbofan', color: '#f2f0ea' }, extras: { engineOut: true, louvers: true, mudflaps: '#16161a', antenna: true },
    sponsors: ['ONIBI GARAGE', 'NO BRAKES'], kanji: '鬼火', plate: '0-666',
    stats: { drive: 'FR', hp: 520, kg: 1150, gear: 'Secuencial 6' }, phys: { accel: 11.2, vmax: 74, grip: 6.4, drift: 1.2, nitro: 1.4, mass: 1150 } },
];
export const PAINTS = ['#f2f0ea', '#d6402f', '#1f4fb8', '#2c3a55', '#ef8fb6', '#f2c230', '#5f8a55', '#16161a', '#7a4bd8', '#2bb3c9', '#f07a1a', '#c9ccd2'];
export const RIMS = ['spoke8', 'dish', 'mesh', 'rally', 'spoke5', 'turbofan', 'steel'];
export const RIM_COLORS = ['#cfd3da', '#d9a43b', '#f2f0ea', '#18181b', '#5b5e66', '#d6402f', '#2bb3c9', '#f2c230'];
export const WINGS = ['none', 'duck', 'gt', 'gt-tall', 'big'];
export const LIVERIES = ['CALLE', 'CARRERAS', 'GRAFITI'];

// ---------------------------------------------------------------- texturas
const FONT_G = "'Permanent Marker'", FONT_H = "'Kanit'", FONT_J = "'Dela Gothic One'";
function canvasTex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function liverySide(S) {
  const W = 2048, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const xmin = -S.L / 2, L = S.L, HH = 1.7, lv = S.livery;
  for (const half of [0, 1]) {
    const X = (x) => (half === 0 ? (x - xmin) / L : (S.L / 2 - x) / L) * W, Y = (y) => half * 512 + (1 - y / HH) * 512;
    g.save(); g.beginPath(); g.rect(0, half * 512, W, 512); g.clip();
    g.fillStyle = S.paint; g.fillRect(0, half * 512, W, 512);
    const dF = S.cab.x0 - 0.04, dB = S.cab.bX ?? -0.4;
    if (lv === 0) { // calle: dos tonos y moldura
      g.fillStyle = S.color2; g.fillRect(0, Y(0.52), W, Y(0) - Y(0.52));
      g.fillStyle = '#9a9ca2'; g.fillRect(0, Y(0.555), W, Y(0.535) - Y(0.555));
      g.font = `italic 800 30px ${FONT_H}`; g.fillStyle = S.paint === '#16161a' ? '#f2f0ea' : '#16161a'; g.textAlign = 'left'; g.fillText(S.tag + '  TWIN CAM 16', X(-S.L / 2 + 0.25) - (half ? 260 : 0), Y(0.6));
    }
    if (lv === 1) { // carreras
      g.fillStyle = S.color2; g.fillRect(0, Y(0.36), W, Y(0) - Y(0.36));
      g.fillStyle = S.stripe; g.fillRect(0, Y(0.47), W, Y(0.42) - Y(0.47));
      g.fillStyle = S.color2; g.fillRect(0, Y(0.52), W, Y(0.5) - Y(0.52));
      const nx = X((dF + dB) / 2), ny = Y(0.64), nr = 92;
      g.fillStyle = '#f4f1ec'; g.strokeStyle = '#16161a'; g.lineWidth = 8;
      if (S.numStyle === 'square') { g.fillRect(nx - nr, ny - nr * 0.85, nr * 2, nr * 1.7); g.strokeRect(nx - nr, ny - nr * 0.85, nr * 2, nr * 1.7); }
      else if (S.numStyle === 'heart') { g.beginPath(); for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; g.lineTo(nx + nr * 0.07 * 16 * Math.pow(Math.sin(t), 3), ny - nr * 0.07 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))); } g.fill(); g.stroke(); }
      else { g.beginPath(); g.arc(nx, ny, nr, 0, 6.3); g.fill(); g.stroke(); }
      g.fillStyle = '#16161a'; g.font = `italic 900 ${nr * 1.35}px ${FONT_H}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(S.number, nx, ny + 6);
      g.font = `italic 800 44px ${FONT_H}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = S.stripe; g.fillText(S.sponsors[0], X((dB - S.L / 2) / 2 + 0.15), Y(0.39) - 6);
      g.save(); g.translate(X((dB - S.L / 2) / 2 + 0.1), Y(0.7)); g.fillStyle = '#16161a'; g.fillRect(-120, -26, 240, 52); g.fillStyle = S.stripe === '#16161a' ? '#f2c230' : S.stripe; g.font = `italic 800 34px ${FONT_H}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(S.sponsors[1], 0, 2); g.restore();
      g.font = `110px ${FONT_J}`; g.fillStyle = 'rgba(22,22,26,.85)'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(S.kanji, X(S.L / 2 - 0.62), Y(0.62));
      const r = rng(S.id.length * 31 + half);
      for (let i = 0; i < 5; i++) { const x = X(-S.L / 2 + 0.5 + r() * (S.L - 1.2)), y = Y(0.44 + r() * 0.06); g.fillStyle = ['#16161a', '#f4f1ec', S.stripe][i % 3]; g.fillRect(x, y, 34 + r() * 50, 14); }
    }
    if (lv === 2) { // grafiti: tag gigante con goteos, estrellas y salpicaduras
      g.fillStyle = S.color2; g.fillRect(0, Y(0.3), W, Y(0) - Y(0.3));
      const r = rng(77 + half), cols = [S.stripe, '#16161a', '#2bb3c9', '#f2c230'];
      for (let i = 0; i < 70; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.arc(r() * W, Y(0.35 + r() * 0.5), 3 + r() * 9, 0, 6.3); g.fill(); }
      g.save(); g.translate(X(0.2), Y(0.58)); g.rotate(-0.06); g.font = `200px ${FONT_G}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.lineWidth = 26; g.strokeStyle = '#16161a'; g.strokeText(S.name.toUpperCase(), 0, 0); g.fillStyle = S.stripe; g.fillText(S.name.toUpperCase(), 0, 0);
      g.lineWidth = 6; g.strokeStyle = '#f4f1ec'; g.strokeText(S.name.toUpperCase(), -4, -4);
      for (let k = 0; k < 10; k++) { const x = (r() - 0.5) * 900; g.fillStyle = S.stripe; g.fillRect(x, 60, 9, 40 + r() * 70); g.beginPath(); g.arc(x + 4.5, 100 + r() * 70, 7, 0, 6.3); g.fill(); }
      g.restore();
      for (let i = 0; i < 4; i++) { const x = X(-S.L / 2 + 0.3 + i * 0.9), y = Y(0.8 - (i % 2) * 0.08); g.strokeStyle = cols[i % 4]; g.lineWidth = 6; g.beginPath(); for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? 14 : 34; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); }
      g.font = `90px ${FONT_J}`; g.fillStyle = '#16161a'; g.textAlign = 'center'; g.fillText(S.kanji, X(S.L / 2 - 0.55), Y(0.5));
    }
    // líneas de puertas y tirador
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
    for (const x of [dF, dB]) { g.beginPath(); g.moveTo(X(x), Y(0.86)); g.lineTo(X(x), Y(0.3)); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(Math.min(X(dB + 0.1), X(dB + 0.24)), Y(0.76), Math.abs(X(dB + 0.24) - X(dB + 0.1)), 7);
    g.restore();
  }
  return canvasTex(c);
}
function liveryTop(S) {
  const W = 2048, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = S.paint; g.fillRect(0, 0, W, H);
  const X = (x) => ((x + S.L / 2) / S.L) * W, Z = (z) => (1 - (z + S.W / 2) / S.W) * H;
  if (S.livery === 1) {
    g.fillStyle = S.stripe; for (const z of [-0.2, 0.2]) g.fillRect(0, Z(z + 0.08), W, Z(z - 0.08) - Z(z + 0.08));
    const cx = X((S.cab.roofF + S.cab.roofB) / 2); g.save(); g.translate(cx, H / 2); g.rotate(Math.PI / 2); g.fillStyle = '#f4f1ec'; g.beginPath(); g.arc(0, 0, 70, 0, 6.3); g.fill(); g.fillStyle = '#16161a'; g.font = `italic 900 90px ${FONT_H}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(S.number, 0, 4); g.restore();
  }
  if (S.livery === 2) { const r = rng(9), cols = [S.stripe, '#16161a', '#2bb3c9']; for (let i = 0; i < 60; i++) { g.fillStyle = cols[i % 3]; g.beginPath(); g.arc(r() * W, r() * H, 3 + r() * 10, 0, 6.3); g.fill(); } }
  if (S.livery !== 0) { g.save(); g.translate(X(S.L / 2 - 0.55), H / 2); g.rotate(Math.PI / 2); g.font = `70px ${FONT_J}`; g.fillStyle = 'rgba(22,22,26,.8)'; g.textAlign = 'center'; g.fillText(S.kanji, 0, 20); g.restore(); }
  return canvasTex(c);
}
function tireTex(text) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#1d1d21'; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = '#121214'; for (let i = 0; i < 64; i++) { const x = i * 16; g.fillRect(x, 96, 9, 64); g.fillRect(x + 6, 112, 12, 6); g.fillRect(x + 2, 138, 12, 6); }
  g.fillStyle = '#2a2a2f'; g.fillRect(0, 124, 1024, 8);
  g.fillStyle = '#e9e6dd'; g.font = `italic 900 22px ${FONT_H}`; g.textBaseline = 'middle';
  for (const y of [16, 240]) for (let k = 0; k < 2; k++) { g.save(); g.translate(k * 512 + 60, y); if (y > 128) g.scale(1, -1); g.fillText(text, 0, 0); g.restore(); }
  const t = canvasTex(c); t.wrapS = THREE.RepeatWrapping; return t;
}
function plateTex(txt) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#f2f0e6'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#2f6b3a'; g.lineWidth = 8; g.strokeRect(6, 6, 244, 116);
  g.fillStyle = '#2f6b3a'; g.font = `40px ${FONT_J}`; g.textAlign = 'center'; g.fillText('霧雨 50', 128, 46); g.font = `italic 900 56px ${FONT_H}`; g.fillText(txt, 128, 106);
  return canvasTex(c);
}
function xTex(col) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = col; g.beginPath(); g.arc(64, 64, 64, 0, 6.3); g.fill(); g.strokeStyle = '#16161a'; g.lineWidth = 16; g.lineCap = 'round';
  g.beginPath(); g.moveTo(34, 34); g.lineTo(94, 94); g.moveTo(94, 34); g.lineTo(34, 94); g.stroke(); return canvasTex(c);
}

// ---------------------------------------------------------------- geometría low poly
// Une anillos de puntos (z, y) colocados en estaciones x; classify(xCentro, banda) → grupo de material.
function ringMesh(xs, ringFn, classify, caps = true) {
  const P = [], groups = [[], [], []]; let nr = 0;
  for (const x of xs) { const pts = ringFn(x); nr = pts.length; for (const [z, y] of pts) P.push(x, y, z); }
  const n = xs.length;
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < nr; k++) {
    const a = i * nr + k, b = i * nr + ((k + 1) % nr), c = (i + 1) * nr + k, d = (i + 1) * nr + ((k + 1) % nr);
    const gi = classify ? classify((xs[i] + xs[i + 1]) / 2, k, nr) : 0;
    groups[gi].push(a, c, b, b, c, d);
  }
  if (caps) {
    const avg = (i) => { let y = 0; for (let k = 0; k < nr; k++) y += P[(i * nr + k) * 3 + 1]; return y / nr; };
    const c0 = P.length / 3; P.push(xs[0] - 0.01, avg(0), 0); const c1 = c0 + 1; P.push(xs[n - 1] + 0.01, avg(n - 1), 0);
    for (let k = 0; k < nr; k++) { groups[0].push(k, (k + 1) % nr, c0); groups[0].push((n - 1) * nr + k, c1, (n - 1) * nr + ((k + 1) % nr)); }
  }
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  const idx = []; let start = 0;
  for (let gi = 0; gi < 3; gi++) if (groups[gi].length) { g.addGroup(start, groups[gi].length, gi); idx.push(...groups[gi]); start += groups[gi].length; }
  g.setIndex(idx);
  g = toCreasedNormals(g, 0.5);
  return g;
}

// Pintura: decoración proyectada desde los lados y desde arriba (sin UV).
function paintMaterial(S, side, top) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.0, envMapIntensity: 0.4 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.sideMap = { value: side }; sh.uniforms.topMap = { value: top };
    sh.uniforms.uXmin = { value: -S.L / 2 }; sh.uniforms.uL = { value: S.L }; sh.uniforms.uW = { value: S.W }; sh.uniforms.uH = { value: 1.7 };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON; uniform sampler2D sideMap; uniform sampler2D topMap; uniform float uXmin; uniform float uL; uniform float uW; uniform float uH;')
      .replace('#include <map_fragment>', `vec3 nn = normalize(vON); float uS = clamp((vOP.x - uXmin) / uL, 0.001, 0.999); float vy = clamp(vOP.y / uH, 0.0, 1.0);
        vec2 uvS = vOP.z >= 0.0 ? vec2(uS, 0.5 + 0.5 * vy) : vec2(1.0 - uS, 0.5 * vy);
        vec2 uvT = vec2(uS, clamp((vOP.z + uW * 0.5) / uW, 0.0, 1.0));
        float wT = smoothstep(0.55, 0.8, nn.y);
        diffuseColor *= mix(texture2D(sideMap, uvS), texture2D(topMap, uvT), wT);`);
  };
  m.customProgramCacheKey = () => 'paint';
  return m;
}
const RB = (w, h, d, r = 0.03, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));

export function buildCar(spec, opts = {}) {
  const S = { ...spec, ...opts, cab: { ...spec.cab }, rims: { ...spec.rims, ...(opts.rims || {}) }, extras: { ...spec.extras } };
  S.paint = opts.paint || spec.color; S.livery = opts.livery ?? spec.livery ?? 1; if (opts.wing) S.wing = opts.wing;
  const xmin = -S.L / 2, xmax = S.L / 2, wf = S.wb / 2 + S.wOff, wr = -S.wb / 2 + S.wOff, R = S.r + 0.04, C = S.cab, K = S.keys;
  const side = liverySide(S), topT = liveryTop(S);
  const M = {
    paint: paintMaterial(S, side, topT),
    trim: new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.6 }),
    trimC: new THREE.MeshStandardMaterial({ color: S.livery === 0 ? S.color2 : '#1d1e22', roughness: 0.55 }),
    glass: new THREE.MeshStandardMaterial({ color: '#1b2531', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.72, envMapIntensity: 1.3 }),
    cabIn: new THREE.MeshStandardMaterial({ color: '#1f2025', roughness: 0.9, side: THREE.BackSide }),
    chrome: new THREE.MeshStandardMaterial({ color: '#d6d9df', roughness: 0.22, metalness: 0.9 }),
    rim: new THREE.MeshStandardMaterial({ color: S.rims.color, roughness: 0.32, metalness: S.rims.style === 'steel' ? 0.2 : 0.6 }),
    tire: new THREE.MeshStandardMaterial({ map: tireTex(S.sponsors[0].split(' ')[0] + '  R-SPEC'), roughness: 0.92, side: THREE.DoubleSide }),
    disc: new THREE.MeshStandardMaterial({ color: '#8a8d93', roughness: 0.4, metalness: 0.7 }),
    red: new THREE.MeshStandardMaterial({ color: '#d02a2a', roughness: 0.45 }),
    head: new THREE.MeshStandardMaterial({ color: '#f6f3ea', emissive: '#fff2cf', emissiveIntensity: 0.5, roughness: 0.15 }),
    tail: new THREE.MeshStandardMaterial({ color: '#c41f1c', emissive: '#c41f1c', emissiveIntensity: 0.7, roughness: 0.2 }),
    amber: new THREE.MeshStandardMaterial({ color: '#f39a2c', emissive: '#c76a10', emissiveIntensity: 0.35, roughness: 0.25 }),
    inner: new THREE.MeshStandardMaterial({ color: '#2a2b30', roughness: 0.85 }),
    suit: new THREE.MeshStandardMaterial({ color: S.stripe === '#16161a' ? '#e9e6dd' : S.stripe, roughness: 0.7 }),
    helmet: new THREE.MeshStandardMaterial({ color: '#f4f1ec', roughness: 0.3 }),
    plate: new THREE.MeshStandardMaterial({ map: plateTex(S.plate), roughness: 0.5 }),
    fogY: new THREE.MeshStandardMaterial({ map: xTex('#f2c230'), emissive: '#f2c230', emissiveIntensity: 0.12, roughness: 0.35 }),
  };
  const car = new THREE.Group(), body = new THREE.Group(); car.add(body);
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; };
  const both = (fn) => { fn(1); fn(-1); };
  const at = (x) => { let i = 0; while (i < K.length - 2 && x > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], t = clamp((x - a[0]) / (b[0] - a[0]), 0, 1); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t, a[4] + (b[4] - a[4]) * t]; };
  const top = (x) => at(x)[1], hwAt = (x) => at(x)[2], hwB = K[Math.floor(K.length / 2)][3];

  // ---- carrocería: secciones con lateral plano, canto del hombro y pasos de rueda
  const xs = new Set(K.map((k) => k[0]));
  for (const wx of [wf, wr]) for (let i = 0; i <= 16; i++) xs.add(+(wx - R - 0.004 + ((2 * R + 0.008) * i) / 16).toFixed(4));
  for (const x of [C.x0, C.x1, C.roofF, C.roofB]) if (x > xmin + 0.05 && x < xmax - 0.05) xs.add(x);
  const bodyRing = (x) => {
    let [yb, yt, hw, sh] = at(x); let p1y = yb, p2y = yb + 0.05, p3y = yb + 0.13, p1z = hw - 0.12;
    for (const wx of [wf, wr]) { const d = x - wx; if (Math.abs(d) < R) { const a = S.r - 0.035 + Math.sqrt(R * R - d * d); p3y = Math.max(p3y, a); p2y = Math.max(p2y, a - 0.015); p1y = Math.max(p1y, a - 0.04); p1z = Math.min(p1z, hw - S.tw - 0.12); } }
    sh = Math.max(sh, p3y + 0.07); yt = Math.max(yt, sh + 0.035);
    const half = [[p1z, p1y], [hw - 0.025, p2y], [hw, p3y], [hw, sh], [hw - 0.035, sh + 0.03], [hw - 0.085, yt]];
    const pts = [[0, yb]]; for (const p of half) pts.push(p); pts.push([0, yt + 0.004]); for (let i = half.length - 1; i >= 0; i--) pts.push([-half[i][0], half[i][1]]);
    return pts;
  };
  add(ringMesh([...xs].sort((a, b) => a - b), bodyRing), M.paint);
  for (const wx of [wf, wr]) add(RB(R * 2 - 0.1, S.r + R - S.clr - 0.1, hwB * 2 - 2 * S.tw - 0.2, 0.03), M.inner, wx, (S.r + R + S.clr) / 2 - 0.06, 0);

  // ---- habitáculo: cristales planos con marcos negros
  const belt = (x) => C.beltR + (C.beltF - C.beltR) * clamp((x - C.x1) / (C.x0 - C.x1), 0, 1);
  const hgt = (x) => (x >= C.roofF ? clamp((C.x0 - x) / (C.x0 - C.roofF), 0, 1) : x <= C.roofB ? Math.pow(clamp((x - C.x1) / (C.roofB - C.x1), 0, 1), C.hatch ? 0.9 : 1) : 1);
  const cabTop = (x) => belt(x) + hgt(x) * (C.roofY - belt(x));
  const cabRing = (x) => {
    const h = hgt(x), yB = belt(x), y1 = yB + h * (C.roofY - 0.045 - yB), z1 = C.w - h * (C.w - C.wt);
    const q0 = [C.w, yB - 0.03], q1 = [z1, y1], L2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const half = [q0, L2(q0, q1, 0.14), L2(q0, q1, 0.88), q1, [z1 - 0.07 * h - 0.003, y1 + 0.04 * h]];
    const pts = [[0, yB - 0.03]]; for (const p of half) pts.push(p); pts.push([0, yB + h * (C.roofY + 0.012 - yB)]); for (let i = half.length - 1; i >= 0; i--) pts.push([-half[i][0], half[i][1]]);
    return pts;
  };
  const cabXs = new Set([C.x1, C.x1 + 0.05, C.roofB - 0.05, C.roofB, C.bX - 0.045, C.bX + 0.045, C.roofF, C.roofF + 0.05, C.x0 - 0.06, C.x0]);
  if (C.hatch) cabXs.add(C.x1 + 0.45);
  for (let i = 1; i < 6; i++) { cabXs.add(C.x1 + 0.05 + ((C.roofB - 0.05 - C.x1 - 0.05) * i) / 6); }
  const PAINT = 0, TRIM = 1, GLASS = 2;
  const classify = (x, k, nr) => {
    const b = k < nr / 2 ? k : nr - 1 - k; // banda simétrica: 0 suelo, 1 marco bajo, 2 cristal lateral, 3 marco alto, 4 canto, 5 techo
    if (b === 0) return PAINT;
    const sideBand = b <= 3, glassSide = b === 2;
    if (x > C.x0 - 0.06) return sideBand ? (glassSide ? TRIM : TRIM) : TRIM; // borde del parabrisas abajo
    if (x > C.roofF + 0.05) return b === 5 ? GLASS : b === 4 ? TRIM : glassSide ? GLASS : TRIM; // parabrisas
    if (x > C.roofF) return sideBand ? TRIM : TRIM;
    if (x >= C.roofB) { if (b >= 4) return PAINT; if (Math.abs(x - C.bX) < 0.045) return TRIM; return glassSide ? GLASS : TRIM; } // techo y ventanillas
    if (x > C.roofB - 0.05) return b === 5 ? TRIM : b === 4 ? PAINT : sideBand ? (C.hatch ? TRIM : PAINT) : PAINT;
    if (x > C.x1 + 0.05) { if (b === 5) return GLASS; if (b === 4) return PAINT; if (C.hatch && x > C.x1 + 0.45) return glassSide ? GLASS : TRIM; return PAINT; } // luneta y montante C
    return b === 5 ? TRIM : PAINT;
  };
  const cabGeo = ringMesh([...cabXs].sort((a, b) => a - b), cabRing, classify, false);
  const cab = add(cabGeo, [M.paint, M.trim, M.glass]); cab.renderOrder = 2;
  const inner = add(cabGeo, M.cabIn); inner.scale.set(0.985, 0.97, 0.95); inner.position.y = 0.015;

  // ---- interior: salpicadero, asientos, piloto (volante a la derecha) y jaula
  const seatX = (C.roofF + C.roofB) / 2 - 0.1, dz = -0.32, bs = belt(seatX), hY = bs + Math.min(0.3, C.roofY - bs - 0.2);
  add(RB(0.3, 0.14, C.w * 1.7, 0.04), M.inner, C.roofF + 0.12, belt(C.roofF) + 0.02, 0);
  both((s) => { add(RB(0.42, 0.12, 0.44, 0.04), M.inner, seatX, bs - 0.04, s * 0.32); add(RB(0.1, 0.5, 0.42, 0.04), M.inner, seatX - 0.24, bs + 0.18, s * 0.32, 0, 0, -0.18); });
  add(new THREE.SphereGeometry(0.13, 16, 12), M.helmet, seatX - 0.04, hY, dz);
  add(new THREE.SphereGeometry(0.133, 14, 10, -0.8, 1.6, 1.15, 0.55), M.trim, seatX - 0.04, hY, dz, 0, Math.PI / 2, 0);
  add(new THREE.CapsuleGeometry(0.14, 0.16, 4, 10), M.suit, seatX - 0.06, bs + 0.08, dz);
  add(new THREE.TorusGeometry(0.13, 0.022, 8, 20), M.inner, C.roofF - 0.04, belt(C.roofF) + 0.13, dz).rotation.set(0, Math.PI / 2, 0.45);
  both((s) => { const arm = add(new THREE.CylinderGeometry(0.035, 0.035, 0.38, 6), M.suit, seatX + 0.14, bs + 0.14, dz + s * 0.12, 0, 0, -1.25); arm.rotation.y = s * 0.15; });
  if (S.extras.mudflaps || S.wing === 'big') { const t = new THREE.MeshStandardMaterial({ color: '#c9ccd2', roughness: 0.4, metalness: 0.6 }); both((s) => add(new THREE.CylinderGeometry(0.018, 0.018, C.roofY - bs, 6), t, seatX - 0.32, (C.roofY + bs) / 2 - 0.04, s * (C.wt * 0.85))); }

  // ---- paragolpes, faldones, parrilla
  const bumpY = S.clr + 0.14, noseY = top(xmax - 0.12);
  add(RB(0.28, 0.25, hwAt(xmax) * 2 + 0.06, 0.04), M.trimC, xmax - 0.08, bumpY, 0);
  add(RB(0.12, 0.05, hwAt(xmax) * 2 - 0.1, 0.02), M.trim, xmax - 0.02, S.clr + 0.02, 0);
  add(RB(0.26, 0.24, hwAt(xmin) * 2 + 0.06, 0.04), M.trimC, xmin + 0.07, bumpY, 0);
  both((s) => add(RB(Math.abs(wf - wr) - 2 * R + 0.06, 0.08, 0.06, 0.02), M.trim, (wf + wr) / 2, S.clr + 0.06, s * (hwB - 0.01)));
  add(RB(0.05, 0.1, hwAt(xmax) * 0.9, 0.015), M.trim, xmax + 0.005, noseY - 0.15, 0);

  // ---- faros
  const hx = xmax + 0.002, hy = noseY - 0.13, hz = hwAt(xmax) - 0.26;
  car.userData.popups = [];
  if (S.lights === 'square') both((s) => { add(RB(0.06, 0.15, 0.3, 0.02), M.trim, hx - 0.02, hy, s * hz); add(RB(0.04, 0.12, 0.27, 0.015), M.head, hx, hy, s * hz); add(RB(0.05, 0.05, 0.12, 0.012), M.amber, xmax + 0.02, bumpY + 0.04, s * (hwAt(xmax) - 0.12)); });
  if (S.lights === 'slim') both((s) => { add(RB(0.05, 0.08, 0.42, 0.02), M.trim, hx - 0.02, hy + 0.05, s * (hz - 0.04)); add(RB(0.035, 0.05, 0.38, 0.015), M.head, hx, hy + 0.05, s * (hz - 0.04)); add(RB(0.05, 0.04, 0.16, 0.012), M.amber, xmax + 0.02, bumpY + 0.05, s * (hwAt(xmax) - 0.14)); });
  if (S.lights === 'round') both((s) => { add(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 18), M.trim, hx - 0.01, hy, s * (hz - 0.02), 0, 0, Math.PI / 2); add(new THREE.SphereGeometry(0.085, 16, 8, 0, Math.PI * 2, 0, 0.7), M.head, hx, hy, s * (hz - 0.02), 0, 0, -Math.PI / 2); });
  if (S.lights === 'quad') both((s) => { for (const k of [0, 1]) { add(RB(0.05, 0.13, 0.17, 0.015), M.trim, hx - 0.02, hy, s * (hz + 0.08 - k * 0.2)); add(RB(0.035, 0.1, 0.14, 0.012), M.head, hx, hy, s * (hz + 0.08 - k * 0.2)); } });
  if (S.lights === 'popup') both((s) => {
    const px = xmax - 0.18, piv = new THREE.Group(); piv.position.set(px - 0.17, top(px - 0.17) - 0.005, s * hz); body.add(piv);
    const lid = new THREE.Mesh(RB(0.34, 0.05, 0.36, 0.015), M.paint); lid.position.set(0.17, 0.0, 0); piv.add(lid);
    const lamp = new THREE.Mesh(RB(0.05, 0.13, 0.32, 0.015), M.head); lamp.position.set(0.33, -0.08, 0); piv.add(lamp);
    piv.rotation.z = Math.atan2(top(px) - top(px - 0.34), 0.34);
    piv.userData.closed = piv.rotation.z; car.userData.popups.push(piv);
    add(RB(0.04, 0.05, 0.3, 0.012), M.amber, xmax + 0.02, bumpY + 0.06, s * (hz + 0.02)); add(RB(0.03, 0.03, 0.5, 0.01), M.trim, xmax + 0.005, noseY - 0.06, s * 0.3);
  });
  // pilotos traseros
  const ty = top(xmin + 0.06) - 0.12;
  both((s) => { add(RB(0.05, 0.13, 0.46, 0.02), M.trim, xmin - 0.005, ty, s * (hwAt(xmin) - 0.28)); add(RB(0.03, 0.1, 0.42, 0.015), M.tail, xmin - 0.02, ty, s * (hwAt(xmin) - 0.28)); });
  add(RB(0.03, 0.1, 0.4, 0.01), M.trim, xmin - 0.01, ty, 0);
  // matrículas
  add(new THREE.PlaneGeometry(0.34, 0.17), M.plate, xmax + 0.065, bumpY, 0, 0, Math.PI / 2, 0);
  add(new THREE.PlaneGeometry(0.34, 0.17), M.plate, xmin - 0.06, bumpY + 0.02, 0, 0, -Math.PI / 2, 0);
  // antiniebla
  if (S.fog !== 'none') both((s) => { add(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 18), M.trim, xmax + 0.04, bumpY + 0.02, s * 0.36, 0, 0, Math.PI / 2); add(new THREE.CircleGeometry(0.1, 20), M.fogY, xmax + 0.08, bumpY + 0.02, s * 0.36, 0, Math.PI / 2, 0); });
  // espejos, limpiaparabrisas, escape, ganchos
  both((s) => { add(RB(0.12, 0.09, 0.16, 0.025), M.paint, C.x0 - 0.12, C.beltF + 0.1, s * (C.w + 0.11)); add(RB(0.04, 0.03, 0.1, 0.01), M.trim, C.x0 - 0.07, C.beltF + 0.05, s * (C.w + 0.04)); });
  both((s) => add(RB(0.02, 0.02, 0.46, 0.008), M.trim, C.x0 - 0.05, C.beltF + 0.035, s * 0.22, 0, s * 0.25, 0));
  add(new THREE.CylinderGeometry(0.045, 0.05, 0.25, 12), M.chrome, xmin + 0.0, S.clr + 0.06, -(hwB - 0.42), 0, 0, Math.PI / 2);
  add(RB(0.08, 0.05, 0.08, 0.02), M.red, xmax + 0.07, S.clr + 0.06, -0.45); add(RB(0.08, 0.05, 0.08, 0.02), M.red, xmin - 0.07, S.clr + 0.08, 0.45);

  // ---- aletines
  if (S.flares === 'box') for (const wx of [wf, wr]) both((s) => { add(RB(R * 2 + 0.14, 0.3, 0.16, 0.04), M.paint, wx, S.r + R * 0.6, s * (hwB + 0.03)); add(RB(R * 2 + 0.16, 0.05, 0.18, 0.015), M.trim, wx, S.r + R * 0.6 - 0.16, s * (hwB + 0.03)); });
  if (S.flares === 'round') for (const wx of [wf, wr]) both((s) => {
    const sh = new THREE.Shape(), R0 = R - 0.005, R1 = R + 0.07; sh.absarc(0, 0, R1, 0.14, Math.PI - 0.14, false); sh.absarc(0, 0, R0, Math.PI - 0.14, 0.14, true);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 1, curveSegments: 12 }); g.translate(0, 0, -0.025);
    add(toCreasedNormals(g, 0.6), M.paint, wx, S.r - 0.035, s * (hwB - 0.02));
  });

  // ---- alerones
  const deckX = xmin + 0.3, deckY = top(deckX);
  if (S.wing === 'duck') add(RB(0.24, 0.05, hwAt(xmin) * 1.9, 0.02), M.paint, xmin + 0.12, (C.hatch ? cabTop(C.x1 + 0.08) : top(xmin + 0.12)) + 0.03, 0, 0, 0, 0.3);
  if (S.wing === 'gt' || S.wing === 'gt-tall' || S.wing === 'big') {
    const h = S.wing === 'gt' ? 0.18 : S.wing === 'gt-tall' ? 0.3 : 0.36, wX = C.hatch ? C.x1 + 0.02 : deckX, wY = (C.hatch ? cabTop(C.x1 + 0.12) : deckY) + h;
    const bw = S.wing === 'big' ? S.W + 0.08 : S.W * 0.94, bd = S.wing === 'big' ? 0.44 : 0.3;
    add(RB(bd, 0.045, bw, 0.015), S.wing === 'big' ? M.trimC : M.paint, wX, wY, 0, 0, 0, 0.08);
    both((s) => { add(RB(0.06, h, 0.05, 0.012), M.trim, wX + 0.02, wY - h / 2, s * 0.42); add(RB(bd + 0.06, 0.14, 0.03, 0.01), M.trim, wX, wY + 0.02, s * (bw / 2)); });
    if (S.wing === 'big') add(RB(0.03, 0.06, bw - 0.04, 0.01), M.red, wX - bd / 2, wY + 0.04, 0);
  }

  // ---- extras
  const X = S.extras;
  if (X.scoop) add(RB(0.4, 0.07, 0.42, 0.025), M.paint, xmax - 1.0, top(xmax - 1.0) + 0.02, 0, 0, 0, -0.04);
  if (X.hoodVents) both((s) => { for (let i = 0; i < 4; i++) add(RB(0.22, 0.02, 0.03, 0.008), M.trim, xmax - 0.85, top(xmax - 0.85) + 0.005, s * (0.2 + i * 0.05), 0, 0, -0.06); });
  if (X.roofVent) add(RB(0.2, 0.05, 0.22, 0.02), M.trim, C.roofF - 0.15, C.roofY + 0.03, 0);
  if (X.roofRack) { both((s) => add(RB(1.2, 0.03, 0.03, 0.01), M.trim, (C.roofF + C.roofB) / 2, C.roofY + 0.08, s * 0.42)); for (const x of [-0.9, -0.3, 0.2]) add(RB(0.03, 0.03, 0.9, 0.01), M.trim, x * 0.9, C.roofY + 0.08, 0); add(RB(0.5, 0.18, 0.4, 0.05), M.red, -0.35, C.roofY + 0.19, 0); }
  if (X.mudflaps) { const mf = new THREE.MeshStandardMaterial({ color: X.mudflaps, roughness: 0.8 }); for (const wx of [wf, wr]) both((s) => add(RB(0.02, 0.24, 0.24, 0.01), mf, wx - R - 0.02, S.clr + 0.08, s * (hwB - 0.14))); }
  if (X.louvers) for (let i = 0; i < 5; i++) add(RB(0.04, 0.02, C.wt * 1.7, 0.008), M.trim, C.roofB - 0.1 - i * 0.08, cabTop(C.roofB - 0.1 - i * 0.08) + 0.025, 0);
  if (X.engineOut) { const eng = new THREE.MeshStandardMaterial({ color: '#6a6d73', roughness: 0.5, metalness: 0.5 }); add(RB(0.5, 0.16, 0.5, 0.04), eng, xmax - 0.95, top(xmax - 0.95) + 0.06, 0); for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.035, 0.045, 0.14, 10), M.chrome, xmax - 1.12 + (i % 3) * 0.12, top(xmax - 0.95) + 0.18, (i < 3 ? 1 : -1) * 0.1); add(new THREE.SphereGeometry(0.09, 14, 10), M.red, xmax - 0.7, top(xmax - 0.7) + 0.1, 0.18); }
  if (X.antenna) { const piv = new THREE.Group(); piv.position.set(xmin + 0.4, top(xmin + 0.4) - 0.02, -(hwAt(xmin + 0.4) - 0.16)); body.add(piv); const a = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.75, 6), M.trim); a.position.y = 0.375; piv.add(a); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M.red); ball.position.y = 0.76; piv.add(ball); car.userData.antenna = piv; }

  // ---- ruedas
  const r = S.r, tw = S.tw, ri = r * 0.68;
  const tireProf = [[ri, -tw / 2], [r * 0.9, -tw / 2 - 0.004], [r * 0.975, -tw * 0.42], [r, -tw * 0.25], [r, tw * 0.25], [r * 0.975, tw * 0.42], [r * 0.9, tw / 2 + 0.004], [ri, tw / 2]].map(([a, b]) => new THREE.Vector2(a, b));
  const tireGeo = new THREE.LatheGeometry(tireProf, 36); tireGeo.rotateX(Math.PI / 2);
  { const uv = tireGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); }
  car.userData.wheels = []; car.userData.front = [];
  for (const [wx, front] of [[wf, true], [wr, false]]) both((s) => {
    const piv = new THREE.Group(); piv.position.set(wx, r, s * (hwB - tw / 2 + 0.02 + (S.flares === 'box' ? 0.04 : 0))); piv.rotation.x = -s * 0.04; car.add(piv);
    const w = new THREE.Group(); if (s < 0) w.rotation.y = Math.PI; piv.add(w);
    const m = (geo, mat, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); w.add(o); return o; };
    m(tireGeo, M.tire);
    buildRim(S.rims.style, ri, tw, M, m);
    const disc = m(new THREE.CylinderGeometry(r * 0.52, r * 0.52, 0.025, 24), M.disc, 0, 0, -0.04); disc.rotation.x = Math.PI / 2;
    const cal = m(RB(0.12, 0.15, 0.06, 0.02), M.red, r * 0.36, r * 0.18, -0.03); cal.rotation.z = 0.5;
    if (front) car.userData.front.push(piv); car.userData.wheels.push(w);
  });

  car.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  mergeChildren(body); for (const w of car.userData.wheels) mergeChildren(w);
  { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(S.L * 1.15, S.W * 1.35), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; sh.renderOrder = 1; car.add(sh); car.userData.contact = sh; }
  car.userData.S = S; car.userData.M = M; car.userData.body = body; car.userData.dims = { L: S.L + 0.1, W: S.W + (S.flares === 'box' ? 0.14 : 0.06), wf, wr };
  return car;
}

function buildRim(style, ri, tw, M, m) {
  const lipZ = tw / 2 - 0.02;
  const ring = (rad, tube, z, mat = M.rim) => m(new THREE.TorusGeometry(rad, tube, 6, 32), mat, 0, 0, z);
  const disc = (rad, d, z, mat = M.rim, seg = 28) => { const c = m(new THREE.CylinderGeometry(rad, rad, d, seg), mat, 0, 0, z); c.rotation.x = Math.PI / 2; return c; };
  const spoke = (len, wdt, dep, ang, dist, z, mat = M.rim) => { const b = m(RB(wdt, len, dep, Math.min(wdt, dep) * 0.45, 1), mat, Math.cos(ang) * dist, Math.sin(ang) * dist, z); b.rotation.z = ang - Math.PI / 2; return b; };
  disc(ri * 0.98, 0.02, -0.02, M.inner);
  if (style === 'dish') { ring(ri * 0.94, 0.03, lipZ, M.chrome); disc(ri * 0.9, 0.03, lipZ - 0.06); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.78; disc(0.028, 0.06, lipZ - 0.03, M.inner, 10).position.set(Math.cos(a) * ri * 0.42, Math.sin(a) * ri * 0.42, lipZ - 0.02); } disc(0.07, 0.07, lipZ - 0.02, M.chrome, 16); }
  if (style === 'spoke8') { ring(ri * 0.95, 0.022, lipZ - 0.01, M.chrome); disc(ri * 0.93, 0.012, lipZ - 0.12, M.inner); for (let i = 0; i < 8; i++) spoke(ri * 0.85, 0.06, 0.035, (i / 8) * Math.PI * 2, ri * 0.46, lipZ - 0.055); disc(0.08, 0.06, lipZ - 0.04, M.rim, 16); }
  if (style === 'mesh') { ring(ri * 0.95, 0.022, lipZ, M.chrome); disc(ri * 0.94, 0.012, lipZ - 0.1, M.inner); for (let i = 0; i < 12; i++) for (const d of [1, -1]) { const a = (i / 12) * Math.PI * 2; const sp = spoke(ri * 0.95, 0.018, 0.02, a, ri * 0.45, lipZ - 0.06 + d * 0.006); sp.rotation.z += d * 0.32; } disc(0.08, 0.06, lipZ - 0.04, M.chrome, 16); }
  if (style === 'rally') { ring(ri * 0.95, 0.025, lipZ - 0.02); disc(ri * 0.93, 0.012, lipZ - 0.12, M.inner); for (let i = 0; i < 10; i++) spoke(ri * 0.82, 0.04, 0.03, (i / 10) * Math.PI * 2, ri * 0.48, lipZ - 0.06); disc(0.09, 0.06, lipZ - 0.04, M.rim, 16); }
  if (style === 'spoke5') { ring(ri * 0.95, 0.025, lipZ - 0.02); disc(ri * 0.93, 0.012, lipZ - 0.12, M.inner); for (let i = 0; i < 5; i++) spoke(ri * 0.85, 0.08, 0.04, (i / 5) * Math.PI * 2, ri * 0.45, lipZ - 0.05); disc(0.1, 0.07, lipZ - 0.03, M.rim, 16); }
  if (style === 'turbofan') { ring(ri * 0.95, 0.025, lipZ - 0.02); disc(ri * 0.92, 0.03, lipZ - 0.05); for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const f = spoke(ri * 0.55, 0.02, 0.05, a, ri * 0.6, lipZ - 0.02, M.inner); f.rotation.y = 0.5; } disc(0.12, 0.06, lipZ - 0.02, M.chrome, 16); }
  if (style === 'steel') { disc(ri * 0.95, 0.04, lipZ - 0.04); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; disc(0.03, 0.06, lipZ - 0.02, M.inner, 10).position.set(Math.cos(a) * ri * 0.62, Math.sin(a) * ri * 0.62, lipZ - 0.02); } disc(0.11, 0.08, lipZ - 0.02, M.chrome, 16); }
}

// Por fotograma: ruedas, dirección, balanceo, antena que se bambolea y faros escamoteables.
export function animateCar(car, dt, speed, steer, accel = 0, lateral = 0, lightsOn = false) {
  const U = car.userData, S = U.S;
  const spin = (speed / S.r) * dt; for (const w of U.wheels) w.rotation.z -= spin * (w.rotation.y ? -1 : 1);
  for (const f of U.front) f.rotation.y = steer * 0.5;
  const b = U.body; b.rotation.x += (clamp(lateral * 0.012, -0.06, 0.06) - b.rotation.x) * Math.min(1, dt * 6); b.rotation.z += (clamp(-accel * 0.006, -0.04, 0.04) - b.rotation.z) * Math.min(1, dt * 5);
  if (U.antenna) { U.av = (U.av || 0) + (-(U.aa || 0) * 60 - (U.av || 0) * 4 + accel * 0.6 + lateral * 0.4) * dt; U.aa = (U.aa || 0) + U.av * dt; U.antenna.rotation.z = clamp(U.aa, -0.6, 0.6); U.antenna.rotation.x = clamp(-lateral * 0.01 + U.aa * 0.3, -0.5, 0.5); }
  for (const p of U.popups) { const t = lightsOn ? p.userData.closed + 0.95 : p.userData.closed; p.rotation.z += (t - p.rotation.z) * Math.min(1, dt * 6); }
}
