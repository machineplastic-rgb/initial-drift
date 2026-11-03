// Utilidades: matemáticas, aleatorio con semilla, ruido y animaciones (tweens).
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
export function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function hash2(x, y) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
export function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export const fbm = (x, y) => vnoise(x, y) * 0.55 + vnoise(x * 2.07 + 5.3, y * 2.07) * 0.28 + vnoise(x * 4.3, y * 4.3 + 9.1) * 0.17;

// Curva suave que pasa por puntos [[x, y], ...] ordenados por x (Catmull-Rom).
export function curve(pts) {
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1];
    const n = pts.length; if (x >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0; while (i < n - 2 && x > pts[i + 1][0]) i++;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const t = (x - p1[0]) / (p2[0] - p1[0] || 1), t2 = t * t, t3 = t2 * t;
    const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0] || 1)) * (p2[0] - p1[0]) * 0.5, m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0] || 1)) * (p2[0] - p1[0]) * 0.5;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
  };
}
// Lineal a trozos (para perfiles con aristas marcadas).
export function linear(pts) { return (x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; if (x <= x1) return y0 + (y1 - y0) * ((x - x0) / (x1 - x0 || 1)); } return pts[pts.length - 1][1]; }; }

// ---------- animaciones ----------
export const EASE = {
  linear: (t) => t, inQuad: (t) => t * t, outQuad: (t) => t * (2 - t), inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  outCubic: (t) => 1 - Math.pow(1 - t, 3), inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};
const tweens = [];
export function tween(obj, to, dur = 0.5, ease = 'outCubic', delay = 0) {
  return new Promise((res) => {
    for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj && Object.keys(to).some((k) => k in tweens[i].to)) tweens.splice(i, 1);
    tweens.push({ obj, to, from: null, dur: Math.max(0.0001, dur), t: -delay, ease: EASE[ease] || EASE.outCubic, res });
  });
}
export function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i]; w.t += dt; if (w.t < 0) continue;
    if (!w.from) { w.from = {}; for (const k in w.to) w.from[k] = w.obj[k]; }
    const k = Math.min(1, w.t / w.dur), e = w.ease(k);
    for (const p in w.to) w.obj[p] = w.from[p] + (w.to[p] - w.from[p]) * e;
    if (k >= 1) { tweens.splice(i, 1); w.res(); }
  }
}
export const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
