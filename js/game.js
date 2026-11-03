// Sesión de carrera: tramo, coches, IA, fantasma, cámaras, cuenta atrás, derrapes, nitro, notas y meta.
import * as THREE from 'three';
import { SCENES, genTrack, buildScenery } from './world.js';
import { Vehicle, AIDriver, collide, GhostRecorder, ghostPose } from './vehicle.js';
import { animateCar } from './cars.js';
import { addFlames } from './fx.js';
import * as AU from './audio.js';
import { clamp, angDiff } from './util.js';

const _v = new THREE.Vector3(), _w = new THREE.Vector3();
const DRIFT_WORDS = ['ギャアア', 'SKRRT!', 'キュイイ', 'ズサァッ', 'SLIDE!', 'ドリフト'];

export class Race {
  constructor(ctx, cfg) {
    this.c = ctx; this.cfg = cfg; this.t = 0; this.state = 'intro'; this.introT = 3.2; this.count = 3.6; this.lastC = 4; this.slow = 1; this.endT = 0;
    this.D = { live: 0, combo: 1, t: 0, calm: 0, total: 0, best: 0 }; this.camMode = 0; this.shake = 0; this.noteIdx = 0; this.hitCd = 0; this.result = null; this.pos = 1; this.prevPos = 1;
    const SC = (this.SC = SCENES[cfg.scene]);
    const T = (this.T = genTrack(cfg.scene, cfg.stage, !!cfg.reverse)); buildScenery(T); ctx.scene.add(T.group);
    ctx.sky.set(SC); ctx.R.setGrade(SC.grade); ctx.R.U.dof.value = 0;
    // jugador
    const pc = (this.pc = cfg.playerMesh); pc.traverse((o) => o.layers.enable(2)); pc.userData.contact.layers.disable(2); ctx.scene.add(pc); if (!pc.userData.flames) addFlames(pc);
    this.P = new Vehicle(pc, cfg.phys, T, { lat: cfg.rival ? -1.9 : 0 });
    // rival
    if (cfg.rival) { const rc = (this.rc = cfg.rival.mesh); rc.traverse((o) => o.layers.disable(2)); ctx.scene.add(rc); if (!rc.userData.flames) addFlames(rc); this.R = new Vehicle(rc, cfg.rival.phys, T, { lat: 1.9 }); this.AI = new AIDriver(this.R, cfg.rival.skill); }
    // fantasma
    if (cfg.ghost && cfg.ghostMesh) { this.gm = cfg.ghostMesh; this.gm.traverse((o) => { if (o.isMesh) { o.material = ctx.ghostMat; o.castShadow = false; } o.layers.disable(2); }); ctx.scene.add(this.gm); }
    this.rec = new GhostRecorder();
    this.camPos = new THREE.Vector3(); this.camYaw = this.P.h; this.fov = 64; this.look = new THREE.Vector3();
    ctx.fx.clear(); AU.engineStart(); AU.playMusic('race'); AU.setIntensity(0.05);
  }
  dispose() {
    const s = this.c.scene; s.remove(this.T.group); s.remove(this.pc); if (this.rc) s.remove(this.rc); if (this.gm) s.remove(this.gm);
    this.T.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const m = Array.isArray(o.material) ? o.material : [o.material]; m.forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); }); } });
    this.c.fx.clear(); AU.engineStop();
  }
  carFx(V, key, col, dt, isP) {
    const car = V.mesh, S = car.userData.S, sl = Math.abs(V.slip), on = sl > 0.2 && V.speed > 6, dusty = this.SC.road !== 'asphalt';
    for (const s of [1, -1]) {
      _v.set(S.wb / -2 + S.wOff, 0.08, s * (S.W / 2 - 0.15)); car.localToWorld(_v);
      if (on) { this.c.fx.skidAt(key + s, _v); if (Math.random() < dt * (dusty ? 14 : 9) * (0.4 + sl)) this.c.fx.puff(_v.clone().setY(_v.y + 0.35), col, (dusty ? 1.1 : 0.75) + Math.min(sl, 1) * 0.9, _w.set((Math.random() - 0.5) * 2, 0.4 + Math.random() * 0.9, (Math.random() - 0.5) * 2)); }
      else { this.c.fx.breakSkid(key + s); if (dusty && V.speed > 14 && Math.random() < dt * 6) this.c.fx.puff(_v.clone().setY(_v.y + 0.25), col, 0.6, null, 0.8); }
    }
    const fl = car.userData.flames; if (fl) { fl.visible = V.nitroOn && Math.random() > 0.15; fl.scale.set(0.7 + Math.random() * 0.6, 1, 1); }
    if (V.nitroOn && Math.random() < dt * 10) { _v.set(-S.L / 2 - 0.3, S.clr + 0.06, -(S.W / 2 - 0.42)); car.localToWorld(_v); this.c.fx.spark(_v, _w.set(-Math.cos(V.h), 0, Math.sin(V.h)), 2, '#7fd0ff', '#ffffff'); }
  }
  // ------------------------------------------------------------ bucle
  update(rdt, I) {
    const ctx = this.c, P = this.P, T = this.T, cfg = this.cfg, hud = ctx.hud; let dt = rdt * this.slow;
    this.hitCd -= dt;
    if (this.state === 'intro') {
      this.introT -= rdt; ctx.R.U.letterbox.value = 0.22 * clamp(this.introT, 0, 1);
      if (this.introT <= 0) { this.state = 'count'; hud.show(); }
      P.place(0); if (this.R) this.R.place(0); this.introCam(rdt); this.anim(dt, { steer: 0 }, 0); AU.engineUpdate(5, 50, false, 0, false); return;
    }
    if (this.state === 'count') {
      this.count -= dt; const c = Math.ceil(this.count - 0.6);
      if (c !== this.lastC && c >= 0 && c <= 3) { this.lastC = c; if (c > 0) { AU.sfx('beep'); hud.count(String(c)); } else { AU.sfx('go'); hud.count('GO!'); ctx.flash(0.25); ctx.aberr(30); this.state = 'race'; } }
      AU.engineUpdate(I.throttle ? 32 + Math.random() * 6 : 6, 55, I.throttle, 0, false); P.place(0); if (this.R) this.R.place(0); this.chaseCam(dt); this.anim(dt, I, 0); hud.update(this); return;
    }
    if (this.state === 'race') this.t += dt;
    let pI = I; if (this.state === 'done') pI = { throttle: false, brake: P.speed > 6, handbrake: false, nitro: false, steer: 0 };
    // física a pasos fijos
    const steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps;
    for (let k = 0; k < steps; k++) {
      P.update(h, pI, this.SC.grip);
      if (this.R) { const aiI = this.state === 'race' || this.state === 'done' ? this.AI.input(h, [P], cfg.mode === 'champ' ? null : P.progress()) : { throttle: false, brake: true, steer: 0 }; this.R.update(h, aiI, this.SC.grip); const imp = collide(P, this.R); if (imp > 1.5 && this.hitCd <= 0) { this.hitCd = 0.5; AU.sfx('bump'); this.shake = Math.min(0.5, imp * 0.05); ctx.aberr(16); hud.pop(pickWord(['ガッ!', 'BUMP!', 'ゴツッ!']), 0.5, 0.4); _v.set((P.x + this.R.x) / 2, P.y + 0.5, (P.z + this.R.z) / 2); ctx.fx.spark(_v, _w.set(0, 0, 0), 16, '#ffe27a', '#ff8a3d'); this.loseDrift(); } }
    }
    P.place(dt); if (this.R) this.R.place(dt);
    if (P.hit > 4 && this.hitCd <= 0) { this.hitCd = 0.45; AU.sfx('crash'); this.shake = clamp(P.hit / 18, 0.15, 0.7); ctx.aberr(18 + P.hit); hud.pop(pickWord(['ガシャン!', 'CRASH!', 'ドガッ!', 'バキッ!']), 0.5, 0.42, '#ff3d5a'); _v.set(P.x, P.y + 0.4, P.z); ctx.fx.spark(_v, _w.set(0, 0, 0), 22, '#ffe27a', '#ff7a1a'); this.loseDrift(); }
    if (P.stuck > 2.5) { P.respawn(); hud.toast('RECOLOCADO'); }
    if (this.R && this.R.stuck > 2.5) this.R.respawn();
    // derrape
    const sl = Math.abs(P.slip), drifting = sl > 0.24 && P.speed > 9 && this.state === 'race', D = this.D;
    if (drifting) {
      D.t += dt; D.calm = 0; const cmb = Math.min(5, 1 + Math.floor(D.t / 1.5)); if (cmb > D.combo) { D.combo = cmb; AU.sfx('combo'); }
      D.live += dt * P.speed * Math.min(sl, 1.2) * 40 * D.combo; P.nitro = Math.min(1, P.nitro + dt * 0.12 * Math.min(sl, 1.1));
      if (Math.random() < dt * 0.9) hud.pop(pickWord(DRIFT_WORDS), 0.42 + Math.random() * 0.16, 0.3 + Math.random() * 0.1);
    } else if (D.t > 0) { D.calm += dt; if (D.calm > 0.45 || this.state !== 'race') this.bankDrift(); }
    if (P.nitroOn && !this.nitroWas) { AU.sfx('nitro'); ctx.aberr(26); hud.pop(pickWord(['NITRO!', 'ゴオオッ!', 'BOOST!']), 0.3, 0.5, '#7fd0ff'); } this.nitroWas = P.nitroOn;
    // notas del copiloto
    const notes = T.notes; while (this.noteIdx < notes.length && notes[this.noteIdx].i < P.hint + 25) this.noteIdx++;
    if (this.noteIdx < notes.length) { const n = notes[this.noteIdx]; if (n.i - P.hint < 75 && !n.shown) { n.shown = true; hud.note(n.dir, n.sev); } }
    // fantasma
    this.rec.sample(dt, P);
    if (this.gm) { const g = ghostPose(cfg.ghost, this.t); if (g) { this.gm.visible = true; this.gm.position.set(g.x, g.y, g.z); this.gm.rotation.set(0, g.h, 0); } }
    // posición y meta
    const pp = P.progress();
    if (this.R) { this.pos = pp >= this.R.progress() ? 1 : 2; if (this.R.progress() >= 1 && this.rivalT == null) this.rivalT = this.t; if (this.pos !== this.prevPos && this.t > 2 && this.state === 'race') { if (this.pos === 1) { hud.toast('¡ADELANTAMIENTO! · 抜いた'); AU.sfx('combo'); } else hud.toast('TE PASAN · 抜かれた'); } this.prevPos = this.pos; }
    AU.setIntensity(this.state === 'race' ? 0.08 + pp * 0.92 + (P.nitroOn ? 0.08 : 0) : 0.3);
    if (this.state === 'race' && (pp >= 1 || (cfg.mode === 'drift' && this.t >= cfg.timeLimit))) this.finish();
    if (this.state === 'race' && this.R && this.rivalT != null && this.t - this.rivalT > 25) this.finish(true);
    if (this.state === 'done') { this.endT -= rdt; this.slow = this.endT > 1.6 ? 0.35 : Math.min(1, this.slow + rdt); if (this.endT <= 0 && !this.result) this.makeResult(); }
    // efectos, sonido, cámara
    this.carFx(P, 'p', this.SC.smoke, dt, true); if (this.R) this.carFx(this.R, 'r', this.SC.smoke, dt, false);
    AU.engineUpdate(P.speed, P.P.vmax, pI.throttle, drifting ? Math.min(1, sl) : 0, P.nitroOn);
    ctx.speedFx(clamp((P.speed / P.P.vmax - 0.6) / 0.4, 0, 1) * 0.6 + (P.nitroOn ? 0.5 : 0));
    this.anim(dt, pI, 1); this.state === 'done' ? this.finishCam(dt) : this.chaseCam(dt); hud.update(this);
  }
  anim(dt, I, live) {
    const P = this.P, night = false; animateCar(this.pc, dt, live ? P.vF : 0, P.steerVis - clamp(P.slip, -0.5, 0.5) * 0.6, P.accelVis, P.latAcc, night);
    if (this.R) { const R = this.R; animateCar(this.rc, dt, live ? R.vF : 0, R.steerVis - clamp(R.slip, -0.5, 0.5) * 0.6, R.accelVis, R.latAcc, night); }
  }
  bankDrift() {
    const D = this.D; if (D.live > 80) { const pts = Math.round(D.live); D.total += pts; D.best = Math.max(D.best, pts); this.c.hud.bank(pts, D.combo); AU.sfx(pts > 3000 ? 'win' : 'coin'); if (pts > 3000) this.c.aberr(20); }
    D.live = 0; D.t = 0; D.calm = 0; D.combo = 1;
  }
  loseDrift() { const D = this.D; if (D.live > 0) { this.c.hud.lost(Math.round(D.live)); D.live = 0; D.t = 0; D.combo = 1; } }
  finish(timeout = false) {
    this.state = 'done'; this.endT = 2.8; this.playerT = timeout ? Infinity : this.t; this.bankDrift(); this.win = this.R ? this.rivalT == null && !timeout : true;
    AU.sfx(this.win ? 'win' : 'lose'); this.c.flash(0.3); this.c.aberr(30); this.c.hud.finish(this);
    // cámara fija junto a la meta
    const s = this.T.S[Math.min(this.T.N, this.P.hint + 14)]; this.finCam = s.p.clone().addScaledVector(s.l, 6.5).add(new THREE.Vector3(0, 1.2, 0));
  }
  makeResult() { this.result = { time: this.playerT, rivalT: this.rivalT, win: this.win, drift: this.D.total, bestDrift: this.D.best, ghost: this.rec.data, ref: this.T.refTime }; this.cfg.onFinish?.(this.result, this); }
  // ------------------------------------------------------------ cámaras
  chaseCam(dt) {
    const P = this.P, cam = this.c.camera, vAng = P.speed > 3 ? Math.atan2(-P.vz, P.vx) : P.h, tgt = P.h + angDiff(vAng, P.h) * 0.6;
    this.camYaw += angDiff(tgt, this.camYaw) * Math.min(1, dt * 4.5);
    const k = clamp(P.speed / 50, 0, 1), modes = [[5.4, 1.75, 3.2], [8.6, 3.1, 4.0], [3.6, 1.15, 6]], [dist, hgt, ahead] = modes[this.camMode];
    const fx = Math.cos(this.camYaw), fz = -Math.sin(this.camYaw), x = P.x - fx * (dist + k), z = P.z - fz * (dist + k);
    let y = P.y + hgt + k * 0.2; if (this.T.groundY) y = Math.max(y, this.T.groundY(x, z) + 0.8);
    cam.position.set(x, cam.position.y + (y - cam.position.y) * Math.min(1, dt * 10), z);
    if (this.shake > 0) { cam.position.x += (Math.random() - 0.5) * this.shake; cam.position.y += (Math.random() - 0.5) * this.shake; this.shake = Math.max(0, this.shake - dt * 2.5); }
    cam.lookAt(P.x + fx * ahead, P.y + 0.9, P.z + fz * ahead);
    this.fov += (66 + k * 12 + (P.nitroOn ? 10 : 0) - this.fov) * Math.min(1, dt * 3); cam.fov = this.fov; cam.updateProjectionMatrix();
    this.c.sky.update(P.mesh.position);
  }
  introCam(dt) {
    const P = this.P, cam = this.c.camera, k = 1 - clamp(this.introT / 3.2, 0, 1), a = P.h + 2.2 - k * 1.9, r = 7.5 - k * 2.5;
    cam.position.set(P.x + Math.cos(a) * r, P.y + 0.7 + k * 0.9, P.z - Math.sin(a) * r); cam.lookAt(P.x, P.y + 0.7, P.z); cam.fov = 48 + k * 14; cam.rotateZ(0.12 * (1 - k)); cam.updateProjectionMatrix();
    this.camYaw = P.h; this.c.sky.update(P.mesh.position);
  }
  finishCam(dt) { const P = this.P, cam = this.c.camera; cam.position.lerp(this.finCam, Math.min(1, dt * 2)); cam.lookAt(P.x, P.y + 0.7, P.z); cam.fov += (40 - cam.fov) * Math.min(1, dt * 2); cam.updateProjectionMatrix(); this.c.sky.update(P.mesh.position); }
}
function pickWord(a) { return a[(Math.random() * a.length) | 0]; }
