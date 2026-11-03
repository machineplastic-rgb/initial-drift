// Conducción arcade con derrape (jugador) y piloto rival por trazada (IA).
import * as THREE from 'three';
import { EDGE } from './pista.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Player {
  constructor(car, track, phys, { reverse = false, lat = -1.8 } = {}) {
    this.car = car; this.T = track; this.P = phys; this.dir = reverse ? -1 : 1;
    const i0 = reverse ? track.N - 34 : 34, s = track.S[i0];
    this.pos = s.p.clone().addScaledVector(s.l, lat); this.vx = 0; this.vz = 0; this.w = 0;
    const f = s.t.clone().multiplyScalar(this.dir); this.h = Math.atan2(-f.z, f.x);
    this.hint = i0; this.slip = 0; this.speed = 0; this.nitro = 0.35; this.nitroOn = false; this.crash = 0; this.lat = lat; this.grip = 1; this.offTime = 0;
    this.iStart = reverse ? track.N - 25 : 25; this.iGoal = reverse ? 25 : track.N - 25; this.steerVis = 0;
    this.place();
  }
  progress() { const i = this.hint + (this.dir > 0 ? 0 : 0); return clamp((i - this.iStart) / (this.iGoal - this.iStart), 0, 1.05); }
  update(dt, I, weatherGrip = 1) {
    const P = this.P, ch = Math.cos(this.h), sh = Math.sin(this.h);
    const fx = ch, fz = -sh, rx = sh, rz = ch;
    let vF = this.vx * fx + this.vz * fz, vL = this.vx * rx + this.vz * rz;
    this.nitroOn = I.nitro && this.nitro > 0.02 && vF > 3;
    const vmax = P.vmax * (this.nitroOn ? 1.22 : 1);
    if (I.throttle) vF += P.accel * (this.nitroOn ? 1.6 * P.nitro : 1) * Math.max(0, 1 - Math.max(0, vF) / vmax) * dt;
    if (I.brake) vF -= (vF > 1 ? 24 : 7) * dt;
    if (!I.throttle && !I.brake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 1.6 * dt);
    vF -= vF * 0.025 * dt; vF = clamp(vF, -9, vmax * 1.05);
    if (this.nitroOn) this.nitro = Math.max(0, this.nitro - dt * 0.28);
    const sp = Math.abs(vF);
    this.slip = Math.atan2(vL, Math.abs(vF) + 0.6);
    const steerK = clamp(sp / 9, 0, 1) * (1 - 0.4 * clamp(sp / vmax, 0, 1));
    const yawTarget = I.steer * 2.35 * steerK * (vF >= -0.5 ? 1 : -1);
    let g = P.grip * weatherGrip;
    const sliding = Math.abs(this.slip) > 0.2;
    if (I.handbrake) g *= 0.2; else if (sliding && I.throttle) g *= 0.42 / P.drift; else if (sliding) g *= 0.8;
    this.w += (yawTarget - this.w) * Math.min(1, (sliding ? 3.0 : 7.5) * dt);
    if (I.handbrake && sp > 6) this.w += I.steer * 3.4 * P.drift * dt;
    this.w -= this.slip * (I.throttle ? 0.7 : 2.2) * clamp(sp / 15, 0, 1) * 3 * dt;
    if (Math.abs(this.slip) > 1.25) { this.w *= 0.9; vF *= 0.985; }
    this.h += this.w * dt;
    vL -= vL * Math.min(1, g * dt);
    if (I.handbrake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 3.5 * dt);
    this.vx = fx * vF + rx * vL; this.vz = fz * vF + rz * vL;
    this.pos.x += this.vx * dt; this.pos.z += this.vz * dt;
    this.speed = Math.hypot(this.vx, this.vz);
    // carretera: altura y límites
    const n = this.T.nearest(this.pos.x, this.pos.z, this.hint); this.hint = n.i; this.lat = n.lat;
    this.crash = Math.max(0, this.crash - dt);
    let hit = 0;
    if (Math.abs(n.lat) > EDGE) {
      const sgn = Math.sign(n.lat), l = n.s.l, over = Math.abs(n.lat) - EDGE;
      this.pos.x -= l.x * sgn * over; this.pos.z -= l.z * sgn * over;
      const vn = (this.vx * l.x + this.vz * l.z) * sgn;
      if (vn > 0) { this.vx -= l.x * sgn * vn * 1.5; this.vz -= l.z * sgn * vn * 1.5; this.vx *= 0.86; this.vz *= 0.86; hit = vn; this.w *= 0.5; }
    }
    this.pos.y = n.y;
    this.steerVis += (I.steer - this.steerVis) * Math.min(1, 10 * dt);
    this.place();
    return hit;
  }
  place() {
    const c = this.car; c.position.copy(this.pos); c.rotation.set(0, this.h, 0);
    const s = this.T.S[this.hint], fx = Math.cos(this.h), fz = -Math.sin(this.h), slope = s.slope * (s.t.x * fx + s.t.z * fz);
    c.rotation.z = Math.asin(clamp(slope, -0.3, 0.3)); c.userData.inner.rotation.x = clamp(this.w * 0.03, -0.06, 0.06);
    for (const f of c.userData.front) f.rotation.y = this.steerVis * 0.45 - clamp(this.slip, -0.5, 0.5) * 0.6;
    const spin = (this.speed / c.userData.S.r) * 0.016; for (const wh of c.userData.wheels) wh.rotation.z -= spin * (wh.rotation.y ? -1 : 1);
    c.updateMatrixWorld(true);
  }
}

export class Rival {
  constructor(car, track, { reverse = false, skill = 1, vmax = 60, lat = 1.8 } = {}) {
    this.car = car; this.T = track; this.dir = reverse ? -1 : 1; this.skill = skill; this.vmax = vmax;
    this.iStart = reverse ? track.N - 25 : 25; this.iGoal = reverse ? 25 : track.N - 25;
    this.u = (reverse ? track.N - 34 : 34) / track.N; this.speed = 0; this.lat = lat; this.yawOff = 0; this.slip = 0; this.pos = new THREE.Vector3(); this.h = 0; this.done = false;
    this.place();
  }
  progress() { const i = this.u * this.T.N; return clamp((i - this.iStart) / (this.iGoal - this.iStart), 0, 1.05); }
  update(dt, playerProgress, go) {
    const T = this.T, L = T.len;
    if (go && !this.done) {
      let vT = this.vmax * this.skill;
      for (let k = 0; k <= 40; k += 5) { const c = Math.abs(T.at(this.u + (this.dir * k) / L).curv); if (c > 1e-4) vT = Math.min(vT, Math.sqrt((8.5 * this.skill * (1 + k / 60)) / c)); }
      const gap = (this.progress() - playerProgress) * L;
      if (gap > 70) vT *= 0.9; else if (gap < -50) vT *= 1.1;
      this.speed += clamp(vT - this.speed, -14 * dt, 8.5 * this.skill * dt);
      this.u += (this.dir * this.speed * dt) / L;
    } else if (this.done) { this.speed *= Math.pow(0.4, dt); this.u += (this.dir * this.speed * dt) / L; }
    this.u = clamp(this.u, 0.0005, 0.9995);
    if (this.progress() >= 1) this.done = true;
    const a = T.at(this.u); const latT = clamp(-a.curv * 70, -2.6, 2.6); this.lat += (latT - this.lat) * Math.min(1, dt * 0.8);
    const yT = clamp(-a.curv * this.dir * this.speed * 0.9, -0.7, 0.7); this.yawOff += (yT - this.yawOff) * Math.min(1, dt * 3); this.slip = this.yawOff;
    this.place();
  }
  place() {
    const a = this.T.at(this.u, this.lat), f = a.t.clone().multiplyScalar(this.dir); this.pos.copy(a.pos); this.h = Math.atan2(-f.z, f.x) + this.yawOff;
    const c = this.car; c.position.copy(this.pos); c.rotation.set(0, this.h, Math.asin(clamp(a.slope * this.dir, -0.3, 0.3)) * 0.8);
    for (const fw of c.userData.front) fw.rotation.y = -this.yawOff * 0.7;
    const spin = (this.speed / c.userData.S.r) * 0.016; for (const wh of c.userData.wheels) wh.rotation.z -= spin * (wh.rotation.y ? -1 : 1);
    c.updateMatrixWorld(true);
  }
}
