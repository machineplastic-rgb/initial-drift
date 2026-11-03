// Física arcade de derrape con colisiones reales: cajas orientadas entre coches (impulso y giro),
// esquinas contra las vallas, IA que conduce con la misma física y grabación del coche fantasma.
import * as THREE from 'three';
import { EDGE } from './world.js';
import { clamp, angDiff } from './util.js';

export class Vehicle {
  constructor(mesh, phys, T, { lat = 0, startI = null } = {}) {
    this.mesh = mesh; this.P = { ...phys }; this.T = T; const d = mesh.userData.dims; this.L = d.L; this.W = d.W;
    this.m = phys.mass || 1100; this.I = (this.m * (this.L * this.L + this.W * this.W)) / 12;
    const i0 = startI ?? T.iStart - 6, s = T.S[i0];
    this.x = s.p.x + s.l.x * lat; this.z = s.p.z + s.l.z * lat; this.y = s.p.y; this.h = Math.atan2(-s.t.z, s.t.x);
    this.vx = 0; this.vz = 0; this.w = 0; this.hint = i0; this.lat = lat; this.slip = 0; this.speed = 0; this.vF = 0; this.nitro = 0.35; this.nitroOn = false;
    this.steerVis = 0; this.accelVis = 0; this.latAcc = 0; this.hit = 0; this.stuck = 0; this.grip = 1;
    this.place(0);
  }
  progress() { return this.T.progress(this.hint); }
  update(dt, I, surfGrip = 1) {
    const P = this.P, ch = Math.cos(this.h), sh = Math.sin(this.h), fx = ch, fz = -sh, rx = sh, rz = ch;
    let vF = this.vx * fx + this.vz * fz, vL = this.vx * rx + this.vz * rz; const vF0 = vF;
    this.nitroOn = !!I.nitro && this.nitro > 0.02 && vF > 3;
    const vmax = P.vmax * (this.nitroOn ? 1.22 : 1);
    if (I.throttle) vF += P.accel * (this.nitroOn ? 1.6 * P.nitro : 1) * Math.max(0, 1 - Math.max(0, vF) / vmax) * dt;
    if (I.brake) vF -= (vF > 1 ? 22 : 8) * dt;
    if (!I.throttle && !I.brake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 1.8 * dt);
    vF -= vF * 0.02 * dt; vF = clamp(vF, -10, vmax * 1.05);
    if (this.nitroOn) this.nitro = Math.max(0, this.nitro - dt * 0.26);
    const sp = Math.abs(vF);
    this.slip = Math.atan2(vL, sp + 0.6);
    const steerK = clamp(sp / 8, 0, 1) * (1 - 0.42 * clamp(sp / vmax, 0, 1));
    const yawTarget = I.steer * 2.4 * steerK * (vF >= -0.5 ? 1 : -1);
    let g = P.grip * surfGrip; const sliding = Math.abs(this.slip) > 0.2;
    if (I.handbrake) g *= 0.2; else if (sliding && I.throttle) g *= 0.42 / P.drift; else if (sliding) g *= 0.8;
    this.w += (yawTarget - this.w) * Math.min(1, (sliding ? 3.0 : 7.5) * dt);
    if (I.handbrake && sp > 6) this.w += I.steer * 3.4 * P.drift * dt;
    this.w -= this.slip * (I.throttle ? 0.7 : 2.2) * clamp(sp / 15, 0, 1) * 3 * dt;
    if (Math.abs(this.slip) > 1.25) { this.w *= 0.9; vF *= 0.985; }
    this.h += this.w * dt;
    vL -= vL * Math.min(1, g * dt);
    if (I.handbrake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 3.5 * dt);
    this.vx = fx * vF + rx * vL; this.vz = fz * vF + rz * vL;
    this.x += this.vx * dt; this.z += this.vz * dt;
    this.speed = Math.hypot(this.vx, this.vz); this.vF = vF;
    this.accelVis += ((vF - vF0) / Math.max(dt, 1e-4) - this.accelVis) * Math.min(1, dt * 8); this.latAcc += (this.w * sp - this.latAcc) * Math.min(1, dt * 6);
    this.steerVis += (I.steer - this.steerVis) * Math.min(1, dt * 10);
    this.walls();
    this.stuck = this.speed < 1.5 && I.throttle ? this.stuck + dt : 0;
  }
  // esquinas contra el borde de la carretera: empuje + impulso con giro
  walls() {
    const n = this.T.nearest(this.x, this.z, this.hint); this.hint = n.i; this.lat = n.lat; this.y = n.y;
    const ch = Math.cos(this.h), sh = Math.sin(this.h), fx = ch, fz = -sh, rx = sh, rz = ch, hl = this.L / 2, hw = this.W / 2; let hitMax = 0;
    for (const [a, b] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw]]) {
      const cx = this.x + fx * a + rx * b, cz = this.z + fz * a + rz * b, s = n.s, lat = (cx - s.p.x) * s.l.x + (cz - s.p.z) * s.l.z;
      if (Math.abs(lat) <= EDGE) continue;
      const sg = Math.sign(lat), pen = Math.abs(lat) - EDGE, nx = -s.l.x * sg, nz = -s.l.z * sg;
      this.x += nx * pen; this.z += nz * pen;
      const ox = cx - this.x, oz = cz - this.z, vcx = this.vx + this.w * oz, vcz = this.vz - this.w * ox, vn = vcx * nx + vcz * nz;
      if (vn < 0) {
        const rn = oz * nx - ox * nz, j = (-(1 + 0.25) * vn) / (1 / this.m + (rn * rn) / this.I);
        this.vx += (j * nx) / this.m; this.vz += (j * nz) / this.m; this.w += (rn * j) / this.I * 0.6;
        const tx = -nz, tz = nx, vt = this.vx * tx + this.vz * tz; this.vx -= tx * vt * 0.08; this.vz -= tz * vt * 0.08;
        hitMax = Math.max(hitMax, -vn);
      }
    }
    this.hit = hitMax;
  }
  place(dt) {
    const c = this.mesh, s = this.T.S[this.hint], fx = Math.cos(this.h), fz = -Math.sin(this.h), slope = s.slope * (s.t.x * fx + s.t.z * fz);
    c.position.set(this.x, this.y, this.z); c.rotation.set(0, this.h, Math.atan(clamp(slope, -0.35, 0.35)));
    c.updateMatrixWorld(true);
  }
  respawn() {
    const s = this.T.S[this.hint]; this.x = s.p.x + s.l.x * clamp(this.lat, -2, 2) * 0.4; this.z = s.p.z + s.l.z * clamp(this.lat, -2, 2) * 0.4; this.vx = this.vz = this.w = 0; this.h = Math.atan2(-s.t.z, s.t.x); this.stuck = 0; this.place(0);
  }
}

// Choque entre dos coches: SAT con cajas orientadas, separación y impulso con momento.
export function collide(A, B, e = 0.3) {
  const ax = [Math.cos(A.h), -Math.sin(A.h)], ar = [Math.sin(A.h), Math.cos(A.h)], bx = [Math.cos(B.h), -Math.sin(B.h)], br = [Math.sin(B.h), Math.cos(B.h)];
  const dx = B.x - A.x, dz = B.z - A.z; if (dx * dx + dz * dz > 36) return 0;
  const ext = (f, r, L, W, a) => (L / 2) * Math.abs(f[0] * a[0] + f[1] * a[1]) + (W / 2) * Math.abs(r[0] * a[0] + r[1] * a[1]);
  let best = 1e9, n = null, fromA = true;
  for (const [axis, isA] of [[ax, true], [ar, true], [bx, false], [br, false]]) {
    const o = ext(ax, ar, A.L, A.W, axis) + ext(bx, br, B.L, B.W, axis) - Math.abs(dx * axis[0] + dz * axis[1]);
    if (o <= 0) return 0;
    if (o < best) { best = o; n = axis; fromA = isA; }
  }
  if (dx * n[0] + dz * n[1] < 0) n = [-n[0], -n[1]];
  // punto de contacto: esquina más metida del otro coche
  const corners = (C, f, r) => [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => [C.x + f[0] * a * C.L / 2 + r[0] * b * C.W / 2, C.z + f[1] * a * C.L / 2 + r[1] * b * C.W / 2]);
  let p;
  if (fromA) { p = corners(B, bx, br).reduce((m, c) => (c[0] * n[0] + c[1] * n[1] < m[0] * n[0] + m[1] * n[1] ? c : m)); }
  else { p = corners(A, ax, ar).reduce((m, c) => (c[0] * n[0] + c[1] * n[1] > m[0] * n[0] + m[1] * n[1] ? c : m)); }
  const mA = A.m, mB = B.m, tot = mA + mB;
  A.x -= n[0] * best * (mB / tot); A.z -= n[1] * best * (mB / tot); B.x += n[0] * best * (mA / tot); B.z += n[1] * best * (mA / tot);
  const rA = [p[0] - A.x, p[1] - A.z], rB = [p[0] - B.x, p[1] - B.z];
  const vA = [A.vx + A.w * rA[1], A.vz - A.w * rA[0]], vB = [B.vx + B.w * rB[1], B.vz - B.w * rB[0]];
  const vn = (vB[0] - vA[0]) * n[0] + (vB[1] - vA[1]) * n[1];
  if (vn >= 0) return best;
  const cA = rA[1] * n[0] - rA[0] * n[1], cB = rB[1] * n[0] - rB[0] * n[1];
  const j = (-(1 + e) * vn) / (1 / mA + 1 / mB + (cA * cA) / A.I + (cB * cB) / B.I);
  A.vx -= (j * n[0]) / mA; A.vz -= (j * n[1]) / mA; A.w -= ((cA * j) / A.I) * 0.7;
  B.vx += (j * n[0]) / mB; B.vz += (j * n[1]) / mB; B.w += ((cB * j) / B.I) * 0.7;
  // rozamiento tangencial
  const t = [-n[1], n[0]], vt = (vB[0] - vA[0]) * t[0] + (vB[1] - vA[1]) * t[1], jt = clamp(-vt / (1 / mA + 1 / mB), -Math.abs(j) * 0.3, Math.abs(j) * 0.3);
  A.vx -= (jt * t[0]) / mA; A.vz -= (jt * t[1]) / mA; B.vx += (jt * t[0]) / mB; B.vz += (jt * t[1]) / mB;
  return -vn;
}

// Piloto de la IA: trazada por dentro, perfil de velocidad, adelantamientos y derrapes en horquillas.
export class AIDriver {
  constructor(veh, skill = 1) { this.v = veh; this.skill = skill; this.offset = 0; this.offT = 0; }
  input(dt, others = [], playerProgress = null) {
    const v = this.v, T = v.T, S = T.S, sp = v.speed;
    const look = Math.min(T.N, v.hint + Math.round(6 + sp * 0.55)), s = S[look];
    let latT = -clamp(s.curvS * 85, -2.6, 2.6);
    this.offT -= dt;
    for (const o of others) { const dx = o.x - v.x, dz = o.z - v.z, fx = Math.cos(v.h), fz = -Math.sin(v.h), ahead = dx * fx + dz * fz, side = dx * Math.sin(v.h) + dz * Math.cos(v.h); if (ahead > 0 && ahead < 14 && Math.abs(side) < 2.4 && this.offT <= 0) { this.offset = side > 0 ? 2.4 : -2.4; this.offT = 2.5; } }
    if (this.offT <= 0) this.offset *= Math.pow(0.3, dt);
    latT = clamp(latT + this.offset, -3.2, 3.2);
    const tx = s.p.x + s.l.x * latT - v.x, tz = s.p.z + s.l.z * latT - v.z, fx = Math.cos(v.h), fz = -Math.sin(v.h), lx = -Math.sin(v.h), lz = -Math.cos(v.h);
    const steer = clamp(Math.atan2(tx * lx + tz * lz, tx * fx + tz * fz) * 2.2, -1, 1);
    let band = 1; if (playerProgress != null) { const gap = (v.progress() - playerProgress) * (T.iGoal - T.iStart); band = gap > 60 ? 0.9 : gap < -40 ? 1.1 : 1; }
    let vt = 1e9; for (let k = 0; k <= 50; k += 5) vt = Math.min(vt, T.vprof[Math.min(T.N, v.hint + k)] + Math.sqrt(2 * 12 * k)); vt *= this.skill * band * (v.P.vmax / 60) ** 0.35;
    const hair = Math.abs(S[Math.min(T.N, v.hint + 10)].curvS) > 1 / 17;
    return { throttle: sp < vt * 0.97, brake: sp > vt * 1.1 + 1, handbrake: hair && sp > 13 && this.skill > 0.95 && Math.abs(v.slip) < 0.4, nitro: v.nitro > 0.5 && vt > 45 && sp > 20, steer };
  }
}

// Coche fantasma: muestras cada 0,05 s (x, y, z, rumbo) y reproducción interpolada.
export class GhostRecorder {
  constructor() { this.data = []; this.acc = 0; }
  sample(dt, v) { this.acc += dt; if (this.data.length === 0 || this.acc >= 0.05) { this.acc = 0; this.data.push(v.x, v.y, v.z, v.h); } }
}
export function ghostPose(data, t) {
  const n = data.length / 4; if (n < 2) return null; const f = clamp(t / 0.05, 0, n - 1.001), i = Math.floor(f), k = f - i, a = i * 4, b = (i + 1) * 4;
  return { x: data[a] + (data[b] - data[a]) * k, y: data[a + 1] + (data[b + 1] - data[a + 1]) * k, z: data[a + 2] + (data[b + 2] - data[a + 2]) * k, h: data[a + 3] + angDiff(data[b + 3], data[a + 3]) * k };
}
export const ghostEncode = (arr) => { const f = new Float32Array(arr), b = new Uint8Array(f.buffer); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
export const ghostDecode = (str) => { try { const s = atob(str), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return Array.from(new Float32Array(b.buffer)); } catch (e) { return null; } };
